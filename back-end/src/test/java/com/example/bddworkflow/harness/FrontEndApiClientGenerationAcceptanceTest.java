package com.example.bddworkflow.harness;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * REQ-007 FE API client 생성 표준화 — 생성 script, generated 경계, SHA 메타파일,
 * stale 검사, validate script 배선을 실행 가능한 검증으로 고정한다.
 */
@AcceptanceTest
@Requirement("REQ-007")
class FrontEndApiClientGenerationAcceptanceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    @DisplayName("AC1 한 명령으로 현재 OpenAPI 계약 기준의 API client를 생성한다")
    @Covers("프런트엔드 개발자는 한 명령으로 현재 OpenAPI 계약 기준의 API client를 생성할 수 있다")
    void apiClientGeneratedBySingleCommand() throws IOException, InterruptedException {
        runFrontEnd("npm", "run", "api:generate");

        Path generated = generatedDir();
        Path schema = generated.resolve("schema.ts");
        Path client = generated.resolve("client.ts");
        Path index = generated.resolve("index.ts");

        assertThat(schema).exists();
        assertThat(client).exists();
        assertThat(index).exists();
        assertThat(Files.readString(schema)).contains("export interface paths");
        assertThat(Files.readString(client)).contains("createClient<paths>");
        assertThat(Files.readString(index)).contains("apiClient");
    }

    @Test
    @DisplayName("AC2 생성된 API client 파일은 generated 경계 아래에만 존재한다")
    @Covers("생성된 API client는 `front-end/src/api/generated` 아래에만 기록된다")
    void generatedClientStaysInsideGeneratedBoundary() throws IOException, InterruptedException {
        runFrontEnd("npm", "run", "api:generate");

        Set<String> files;
        try (Stream<Path> stream = Files.walk(generatedDir())) {
            files = stream
                    .filter(Files::isRegularFile)
                    .map(path -> generatedDir().relativize(path).toString())
                    .collect(Collectors.toSet());
        }

        assertThat(files).containsExactlyInAnyOrder(
                ".openapi-source.sha256",
                "client.ts",
                "index.ts",
                "schema.ts"
        );
    }

    @Test
    @DisplayName("AC3 API client 생성 시 OpenAPI sha256 메타파일이 함께 갱신된다")
    @Covers("API client를 생성하면 현재 OpenAPI 계약을 가리키는 메타파일이 함께 갱신된다")
    void generationUpdatesOpenApiShaMetadata() throws IOException, InterruptedException {
        runFrontEnd("npm", "run", "api:generate");

        String currentContractSha = MAPPER.readTree(openApiIndex().toFile()).path("sha256").asText();
        String generatedSha = Files.readString(generatedDir().resolve(".openapi-source.sha256")).trim();

        assertThat(generatedSha).isEqualTo(currentContractSha);
        assertThat(generatedSha).matches("^[0-9a-f]{64}$");
    }

    @Test
    @DisplayName("AC4 OpenAPI 계약이 바뀌었는데 API client가 오래되면 finding이 보고된다")
    @Covers("OpenAPI 계약이 바뀐 뒤 API client를 다시 생성하지 않으면 검사 결과에 오래된 client로 보고된다")
    void staleGeneratedClientReported(@TempDir Path tmp) throws IOException, InterruptedException {
        Path feIndex = tmp.resolve("front-end.source-index.json");
        Files.writeString(feIndex, MAPPER.writeValueAsString(emptyFrontEndSourceIndex()));

        Path staleMeta = tmp.resolve("openapi-source.sha256");
        Files.writeString(staleMeta, "0".repeat(64) + "\n");
        Path outFindings = tmp.resolve("front-end-standards.findings.json");

        runWorkspace(
                "node",
                workspaceRoot().resolve(Paths.get("tools", "harness", "validate-front-end-standards.mjs")).toString(),
                "--fe-source-index=" + feIndex,
                "--openapi-index=" + openApiIndex(),
                "--generated-meta=" + staleMeta,
                "--out=" + outFindings
        );

        JsonNode findings = MAPPER.readTree(outFindings.toFile()).path("findings");
        boolean hasStaleFinding = StreamSupport.stream(findings.spliterator(), false)
                .anyMatch(finding -> "FE-API-CLIENT-STALE".equals(finding.path("ruleId").asText()));
        assertThat(hasStaleFinding).isTrue();
    }

    @Test
    @DisplayName("AC5 프런트엔드 전체 검증 명령이 API client check를 포함한다")
    @Covers("프런트엔드 전체 검증 명령은 API client 생성 결과와 계약 검사를 함께 확인한다")
    void frontEndValidationIncludesApiClientCheck() throws IOException, InterruptedException {
        runFrontEnd("npm", "run", "api:check");

        JsonNode packageJson = MAPPER.readTree(frontEndRoot().resolve("package.json").toFile());
        JsonNode scripts = packageJson.path("scripts");

        assertThat(scripts.path("validate").asText()).contains("npm run api:check");
        assertThat(scripts.path("validate:full").asText()).contains("npm run validate");
    }

    private static Path generatedDir() {
        return frontEndRoot().resolve(Paths.get("src", "api", "generated"));
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

    private static Path openApiIndex() {
        return workspaceRoot().resolve(Paths.get("build", "harness", "indexes", "openapi.index.json"));
    }

    private static Path frontEndRoot() {
        return workspaceRoot().resolve("front-end");
    }

    private static Path workspaceRoot() {
        Path cwd = Paths.get("").toAbsolutePath();
        Path parent = cwd.getParent();
        return parent != null ? parent : cwd;
    }

    private static void runFrontEnd(String... command) throws IOException, InterruptedException {
        run(command, frontEndRoot());
    }

    private static void runWorkspace(String... command) throws IOException, InterruptedException {
        run(command, workspaceRoot());
    }

    private static void run(String[] command, Path cwd) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(cwd.toFile());
        pb.redirectErrorStream(true);

        Process proc = pb.start();
        String output = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        boolean finished = proc.waitFor(60, TimeUnit.SECONDS);
        if (!finished) {
            proc.destroyForcibly();
            throw new IllegalStateException("command timed out: " + List.of(command) + "\n" + output);
        }

        assertThat(proc.exitValue())
                .as("command exit code for %s%n%s", List.of(command), output)
                .isEqualTo(0);
    }
}
