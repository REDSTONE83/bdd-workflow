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
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * REQ-008 FE API 계약 오류 검사 — drift와 API 경계 위반을 error finding으로 고정한다.
 */
@AcceptanceTest
@Requirement("REQ-008")
class FrontEndApiContractHardeningAcceptanceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    @DisplayName("AC1 OpenAPI 계약 산출물이 없으면 error finding으로 보고된다")
    @Covers("OpenAPI 계약 산출물이 없으면 FE API 계약 검사 결과가 오류로 보고된다")
    void contractMissingIsError(@TempDir Path tmp) throws IOException, InterruptedException {
        Path feIndex = writeFrontEndIndex(tmp, emptyFrontEndSourceIndex());
        Path outFindings = tmp.resolve("front-end-standards.findings.json");

        runValidator(
                "--fe-source-index=" + feIndex,
                "--openapi-index=" + tmp.resolve("missing-openapi.index.json"),
                "--out=" + outFindings
        );

        assertRuleSeverity(outFindings, "FE-API-CONTRACT-MISSING", "error");
    }

    @Test
    @DisplayName("AC2 계약에 없는 FE API 호출은 error finding으로 보고된다")
    @Covers("프런트엔드 API 모듈이 OpenAPI 계약에 없는 method와 path를 호출하면 검사 결과가 오류로 보고된다")
    void unknownOperationIsError(@TempDir Path tmp) throws IOException, InterruptedException {
        ObjectNode feIndexPayload = emptyFrontEndSourceIndex();
        ObjectNode call = MAPPER.createObjectNode();
        call.put("source", "front-end");
        call.put("method", "GET");
        call.put("path", "/totally-bogus-endpoint");
        call.put("file", "front-end/src/api/bogus.ts");
        call.put("line", 1);
        ArrayNode calls = MAPPER.createArrayNode().add(call);
        feIndexPayload.set("apiCalls", calls);

        Path feIndex = writeFrontEndIndex(tmp, feIndexPayload);
        Path outFindings = tmp.resolve("front-end-standards.findings.json");

        runValidator(
                "--fe-source-index=" + feIndex,
                "--openapi-index=" + openApiIndex(),
                "--out=" + outFindings
        );

        assertRuleSeverity(outFindings, "FE-API-UNKNOWN-OPERATION", "error");
    }

    @Test
    @DisplayName("AC3 generated client 메타파일이 없으면 error finding으로 보고된다")
    @Covers("생성된 API client의 OpenAPI 메타파일이 없으면 검사 결과가 오류로 보고된다")
    void missingGeneratedClientMetadataIsError(@TempDir Path tmp) throws IOException, InterruptedException {
        Path feIndex = writeFrontEndIndex(tmp, emptyFrontEndSourceIndex());
        Path outFindings = tmp.resolve("front-end-standards.findings.json");

        runValidator(
                "--fe-source-index=" + feIndex,
                "--openapi-index=" + openApiIndex(),
                "--generated-meta=" + tmp.resolve("missing.openapi-source.sha256"),
                "--out=" + outFindings
        );

        assertRuleSeverity(outFindings, "FE-API-CLIENT-NO-METADATA", "error");
    }

    @Test
    @DisplayName("AC4 오래된 generated client는 error finding으로 보고된다")
    @Covers("생성된 API client가 현재 OpenAPI 계약보다 오래되면 검사 결과가 오류로 보고된다")
    void staleGeneratedClientIsError(@TempDir Path tmp) throws IOException, InterruptedException {
        Path feIndex = writeFrontEndIndex(tmp, emptyFrontEndSourceIndex());
        Path staleMeta = tmp.resolve("openapi-source.sha256");
        Files.writeString(staleMeta, "0".repeat(64) + "\n");
        Path outFindings = tmp.resolve("front-end-standards.findings.json");

        runValidator(
                "--fe-source-index=" + feIndex,
                "--openapi-index=" + openApiIndex(),
                "--generated-meta=" + staleMeta,
                "--out=" + outFindings
        );

        assertRuleSeverity(outFindings, "FE-API-CLIENT-STALE", "error");
    }

    @Test
    @DisplayName("AC5 src/api 밖 직접 fetch는 error finding으로 보고된다")
    @Covers("애플리케이션 소스가 `front-end/src/api` 밖에서 직접 `fetch`를 호출하면 검사 결과가 오류로 보고된다")
    void directFetchOutsideApiBoundaryIsError(@TempDir Path tmp) throws IOException, InterruptedException {
        Path tempFrontEnd = tmp.resolve("front-end");
        Path badPage = tempFrontEnd.resolve(Paths.get("src", "pages", "BadPage.tsx"));
        Path apiModule = tempFrontEnd.resolve(Paths.get("src", "api", "todo.ts"));
        Files.createDirectories(badPage.getParent());
        Files.createDirectories(apiModule.getParent());
        Files.writeString(badPage, "export async function load() { return fetch('/bad') }\n");
        Files.writeString(apiModule, "export async function listTodos() { return fetch('/todos') }\n");

        Path feIndex = tmp.resolve("front-end.source-index.json");
        runSourceIndex(tempFrontEnd, tmp, feIndex);

        JsonNode issues = MAPPER.readTree(feIndex.toFile()).path("issues");
        long directFetchIssueCount = StreamSupport.stream(issues.spliterator(), false)
                .filter(issue -> "DIRECT_FETCH_OUTSIDE_API".equals(issue.path("kind").asText()))
                .count();
        assertThat(directFetchIssueCount).isEqualTo(1);

        Path outFindings = tmp.resolve("front-end-standards.findings.json");

        runValidator(
                "--fe-source-index=" + feIndex,
                "--openapi-index=" + openApiIndex(),
                "--out=" + outFindings
        );

        assertRuleSeverity(outFindings, "FE-API-DIRECT-FETCH", "error");
    }

    private static ObjectNode emptyFrontEndSourceIndex() {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-23T00:00:00.000Z");
        root.put("schemaVersion", "1");
        root.put("source", "front-end.source-index");
        root.set("pages", MAPPER.createArrayNode());
        root.set("routes", MAPPER.createArrayNode());
        root.set("stories", MAPPER.createArrayNode());
        root.set("tests", MAPPER.createArrayNode());
        root.set("apiCalls", MAPPER.createArrayNode());
        root.set("textChannels", MAPPER.createArrayNode());
        root.set("issues", MAPPER.createArrayNode());
        return root;
    }

    private static Path writeFrontEndIndex(Path tmp, ObjectNode payload) throws IOException {
        Path feIndex = tmp.resolve("front-end.source-index.json");
        Files.writeString(feIndex, MAPPER.writeValueAsString(payload));
        return feIndex;
    }

    private static void assertRuleSeverity(Path findingsPath, String ruleId, String severity) throws IOException {
        JsonNode findings = MAPPER.readTree(findingsPath.toFile()).path("findings");
        boolean present = StreamSupport.stream(findings.spliterator(), false)
                .anyMatch(finding -> ruleId.equals(finding.path("ruleId").asText())
                        && severity.equals(finding.path("severity").asText()));
        assertThat(present)
                .as("%s finding with severity=%s in %s", ruleId, severity, findings)
                .isTrue();
    }

    private static Path openApiIndex() {
        return workspaceRoot().resolve(Paths.get("build", "harness", "indexes", "openapi.index.json"));
    }

    private static Path workspaceRoot() {
        Path cwd = Paths.get("").toAbsolutePath();
        Path parent = cwd.getParent();
        return parent != null ? parent : cwd;
    }

    private static void runValidator(String... args) throws IOException, InterruptedException {
        Path workspace = workspaceRoot();
        Path script = workspace.resolve(Paths.get("tools", "harness", "validate-front-end-standards.mjs"));
        assertThat(Files.exists(script)).as("validator script must exist").isTrue();

        List<String> command = new java.util.ArrayList<>();
        command.add("node");
        command.add(script.toString());
        command.addAll(Arrays.asList(args));

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workspace.toFile());
        pb.redirectErrorStream(true);

        Process proc = pb.start();
        String output = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        boolean finished = proc.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            proc.destroyForcibly();
            throw new IllegalStateException("validator timed out after 30s. Output so far:\n" + output);
        }

        assertThat(proc.exitValue())
                .as("validator exit code for %s%n%s", command, output)
                .isEqualTo(0);
    }

    private static void runSourceIndex(Path frontEndRoot, Path repoRoot, Path out) throws IOException, InterruptedException {
        Path script = workspaceRoot().resolve(Paths.get("front-end", "tools", "source-index.mjs"));
        assertThat(Files.exists(script)).as("source index script must exist").isTrue();

        List<String> command = new java.util.ArrayList<>();
        command.add("node");
        command.add(script.toString());
        command.add("--front-end-root=" + frontEndRoot);
        command.add("--repo-root=" + repoRoot);
        command.add("--out=" + out);

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workspaceRoot().toFile());
        pb.redirectErrorStream(true);

        Process proc = pb.start();
        String output = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        boolean finished = proc.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            proc.destroyForcibly();
            throw new IllegalStateException("source index timed out after 30s. Output so far:\n" + output);
        }

        assertThat(proc.exitValue())
                .as("source index exit code for %s%n%s", command, output)
                .isEqualTo(0);
    }
}
