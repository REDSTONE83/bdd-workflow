package com.example.bddworkflow.harness;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * REQ-006 OpenAPI 계약 산출물과 FE API 검사 룰 — 5 AC를 실행 가능한 검증으로 옮긴 테스트.
 *
 * - AC1/AC2는 generateOpenApiIndex 산출물(build/harness/indexes/openapi.index.json)을 직접 읽어 확인한다.
 * - AC3/AC4/AC5는 validate-front-end-standards.mjs에 fixture를 CLI로 주입해 finding을 확인한다.
 *
 * Spring 컨텍스트는 띄우지 않는다. 산출물 생성은 generateOpenApiIndex 전용 태스크 책임이고, 본 테스트는
 * 그 결과물의 구조와 검사기 동작을 검증한다. Gradle ordering(test dependsOn generateOpenApiIndex)이
 * openapi.index.json 가용성을 보장한다.
 */
@AcceptanceTest
@Requirement("REQ-006")
class OpenApiContractAcceptanceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> EXPECTED_OPERATIONS = List.of(
            "POST /users/signup",
            "POST /categories",
            "GET /categories",
            "PATCH /categories/{categoryId}",
            "DELETE /categories/{categoryId}",
            "POST /todos",
            "GET /todos",
            "PATCH /todos/{todoId}",
            "DELETE /todos/{todoId}"
    );

    @Test
    @DisplayName("AC1 백엔드 빌드가 build/harness/indexes/openapi.index.json을 생성한다")
    @Covers("백엔드 빌드 한 번에 OpenAPI 계약 JSON이 `build/harness/indexes/openapi.index.json`에 생성된다")
    void contractIndexFilePresent() throws IOException {
        Path indexFile = workspaceRoot().resolve(Paths.get("build", "harness", "indexes", "openapi.index.json"));
        assertThat(Files.exists(indexFile))
                .as("openapi.index.json must be produced by generateOpenApiIndex before this test runs")
                .isTrue();

        JsonNode root = MAPPER.readTree(indexFile.toFile());
        assertThat(root.path("schemaVersion").asText()).isEqualTo("1");
        assertThat(root.path("source").asText()).isEqualTo("openapi.index");
        assertThat(root.path("sha256").asText()).matches("^[0-9a-f]{64}$");
        assertThat(root.path("entries").isArray()).isTrue();
        assertThat(root.path("entries").size()).isGreaterThan(0);
        assertThat(root.path("rawOpenApi").isObject()).isTrue();
    }

    @Test
    @DisplayName("AC2 OpenAPI 계약이 백엔드의 모든 HTTP 엔드포인트를 포함한다")
    @Covers("OpenAPI 계약에는 현재 백엔드가 노출하는 모든 HTTP 엔드포인트의 method와 path가 포함된다")
    void contractIncludesAllControllerEndpoints() throws IOException {
        Path indexFile = workspaceRoot().resolve(Paths.get("build", "harness", "indexes", "openapi.index.json"));
        JsonNode root = MAPPER.readTree(indexFile.toFile());

        List<String> indexedOperations = StreamSupport.stream(root.path("entries").spliterator(), false)
                .filter(node -> "api-operation".equals(node.path("kind").asText()))
                .map(node -> node.path("method").asText() + " " + node.path("path").asText())
                .collect(Collectors.toList());

        assertThat(indexedOperations).containsAll(EXPECTED_OPERATIONS);
    }

    @Test
    @DisplayName("AC3 FE 호출이 OpenAPI 계약에 없으면 FE-API-UNKNOWN-OPERATION 이 보고된다")
    @Covers("프런트엔드 API 모듈이 호출하는 method와 path가 OpenAPI 계약에 없으면 해당 호출이 검사 결과에 보고된다")
    void unknownOperationReported(@TempDir Path tmp) throws IOException, InterruptedException {
        // 1) FE source index fixture — apiCalls에 계약에 없는 호출 1건만 둔다.
        ObjectNode fakeFeIndex = MAPPER.createObjectNode();
        fakeFeIndex.put("generatedAt", "2026-05-23T00:00:00.000Z");
        fakeFeIndex.put("schemaVersion", "1");
        fakeFeIndex.put("source", "front-end.source-index");
        fakeFeIndex.set("pages", MAPPER.createArrayNode());
        fakeFeIndex.set("routes", MAPPER.createArrayNode());
        fakeFeIndex.set("stories", MAPPER.createArrayNode());
        fakeFeIndex.set("tests", MAPPER.createArrayNode());
        fakeFeIndex.set("textChannels", MAPPER.createArrayNode());
        fakeFeIndex.set("issues", MAPPER.createArrayNode());

        ObjectNode call = MAPPER.createObjectNode();
        call.put("method", "GET");
        call.put("path", "/totally-bogus-endpoint");
        call.put("file", "front-end/src/api/bogus.ts");
        call.put("line", 1);
        ArrayNode apiCalls = MAPPER.createArrayNode();
        apiCalls.add(call);
        fakeFeIndex.set("apiCalls", apiCalls);

        Path feFixture = tmp.resolve("front-end.source-index.json");
        Files.writeString(feFixture, MAPPER.writeValueAsString(fakeFeIndex));

        // 2) 실제 OpenAPI index 를 그대로 사용 (해당 path 가 없으므로 finding 발생 기대).
        Path openApi = workspaceRoot().resolve(Paths.get("build", "harness", "indexes", "openapi.index.json"));
        Path outFindings = tmp.resolve("findings.json");

        runValidator(
                "--fe-source-index=" + feFixture,
                "--openapi-index=" + openApi,
                "--out=" + outFindings
        );

        JsonNode findings = MAPPER.readTree(outFindings.toFile()).path("findings");
        boolean hasUnknown = StreamSupport.stream(findings.spliterator(), false)
                .anyMatch(f -> "FE-API-UNKNOWN-OPERATION".equals(f.path("ruleId").asText())
                        && "/totally-bogus-endpoint".equals(f.path("evidence").path("path").asText()));
        assertThat(hasUnknown).as("FE-API-UNKNOWN-OPERATION finding for /totally-bogus-endpoint").isTrue();
    }

    @Test
    @DisplayName("AC4 FE generated 클라이언트의 SHA-256이 계약과 다르면 FE-API-CLIENT-STALE이 보고된다")
    @Covers("프런트엔드 생성 클라이언트가 현재 OpenAPI 계약보다 오래되면 해당 클라이언트가 검사 결과에 보고된다")
    void staleGeneratedClientReported(@TempDir Path tmp) throws IOException, InterruptedException {
        Path openApi = workspaceRoot().resolve(Paths.get("build", "harness", "indexes", "openapi.index.json"));
        Path feIndex = workspaceRoot().resolve(Paths.get("build", "harness", "indexes", "front-end.source-index.json"));

        // 메타파일을 의도적으로 64자짜리 0 hash 로 둔다.
        Path staleMeta = tmp.resolve("openapi-source.sha256");
        Files.writeString(staleMeta, "0".repeat(64) + "\n");
        Path outFindings = tmp.resolve("findings.json");

        runValidator(
                "--fe-source-index=" + feIndex,
                "--openapi-index=" + openApi,
                "--generated-meta=" + staleMeta,
                "--out=" + outFindings
        );

        JsonNode findings = MAPPER.readTree(outFindings.toFile()).path("findings");
        boolean hasStale = StreamSupport.stream(findings.spliterator(), false)
                .anyMatch(f -> "FE-API-CLIENT-STALE".equals(f.path("ruleId").asText()));
        assertThat(hasStale).as("FE-API-CLIENT-STALE finding when metafile sha256 differs").isTrue();
    }

    @Test
    @DisplayName("AC5 OpenAPI 계약 산출물이 없으면 FE-API-CONTRACT-MISSING이 보고된다")
    @Covers("OpenAPI 계약 산출물이 빌드 결과에 없으면 검사 결과에 별도로 보고된다")
    void contractMissingReported(@TempDir Path tmp) throws IOException, InterruptedException {
        Path feIndex = workspaceRoot().resolve(Paths.get("build", "harness", "indexes", "front-end.source-index.json"));
        Path missingOpenApi = tmp.resolve("not-here.json");
        Path outFindings = tmp.resolve("findings.json");

        runValidator(
                "--fe-source-index=" + feIndex,
                "--openapi-index=" + missingOpenApi,
                "--out=" + outFindings
        );

        JsonNode findings = MAPPER.readTree(outFindings.toFile()).path("findings");
        boolean hasMissing = StreamSupport.stream(findings.spliterator(), false)
                .anyMatch(f -> "FE-API-CONTRACT-MISSING".equals(f.path("ruleId").asText()));
        assertThat(hasMissing).as("FE-API-CONTRACT-MISSING finding when openapi.index.json absent").isTrue();
    }

    private static Path workspaceRoot() {
        Path cwd = Paths.get("").toAbsolutePath();
        Path parent = cwd.getParent();
        return parent != null ? parent : cwd;
    }

    private static void runValidator(String... extraArgs) throws IOException, InterruptedException {
        Path workspace = workspaceRoot();
        Path script = workspace.resolve(Paths.get("tools", "harness", "validate-front-end-standards.mjs"));
        assertThat(Files.exists(script)).as("validator script must exist").isTrue();

        ProcessBuilder pb = new ProcessBuilder("node", script.toString());
        for (String arg : extraArgs) {
            pb.command().add(arg);
        }
        pb.directory(workspace.toFile());
        pb.redirectErrorStream(true);

        Process proc = pb.start();
        String output = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        boolean finished = proc.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            proc.destroyForcibly();
            throw new IllegalStateException("validator timed out after 30s. Output so far:\n" + output);
        }
        int exit = proc.exitValue();
        assertThat(exit).as("validator exit code (output: %s)", output).isEqualTo(0);
    }
}
