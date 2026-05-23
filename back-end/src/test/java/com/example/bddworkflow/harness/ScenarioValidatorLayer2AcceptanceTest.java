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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * REQ-009 Gherkin 시나리오 검사 Layer 2 분리 — scenario-index의 raw issue가
 * validate-scenarios.mjs를 통해 SCN-* finding으로 정규화되고, validateHarness 게이트가
 * SCN-* error를 차단함을 확인한다.
 *
 * AC1~AC4: fixture scenarios.index.json을 validator에 주입해 정규화 결과를 검증한다.
 * AC5: gate-trace.mjs를 fixture trace.state.json으로 호출해 exit=1과 차단 사유를 검증한다.
 */
@AcceptanceTest
@Requirement("REQ-009")
class ScenarioValidatorLayer2AcceptanceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    @DisplayName("AC1 시나리오 구조 위반이 SCN-* finding으로 정규화된다")
    @Covers("Gherkin `.feature` 파일의 구조 위반은 `build/harness/findings/scenarios.findings.json`에 SCN-* finding으로 정규화되어 보고된다")
    void scenarioViolationsAreNormalizedToScnFindings(@TempDir Path tmp) throws IOException, InterruptedException {
        ObjectNode index = scenariosIndexShell();
        ArrayNode features = (ArrayNode) index.get("features");
        ObjectNode feature = MAPPER.createObjectNode();
        feature.put("file", "docs/scenarios/fixture.feature");
        feature.put("title", "Fixture Feature");
        feature.set("tags", arrayOf("@REQ-001"));
        feature.set("requirementIds", arrayOf("REQ-001"));
        feature.set("scenarios", MAPPER.createArrayNode());
        ArrayNode issues = MAPPER.createArrayNode();
        issues.add(issueNode("SCN-COVERS-OUTSIDE-SCENARIO", 3, "Covers: 는 Scenario 안에서만 허용됨"));
        feature.set("issues", issues);
        features.add(feature);

        Path indexFile = writeIndex(tmp, index);
        Path findingsFile = tmp.resolve("scenarios.findings.json");

        runValidator(indexFile, findingsFile);

        JsonNode findings = MAPPER.readTree(findingsFile.toFile()).path("findings");
        boolean normalized = StreamSupport.stream(findings.spliterator(), false)
                .anyMatch(finding -> "SCN-COVERS-OUTSIDE-SCENARIO".equals(finding.path("ruleId").asText())
                        && "error".equals(finding.path("severity").asText())
                        && finding.path("requirements").toString().contains("REQ-001"));
        assertThat(normalized).as("SCN-* finding with severity=error and REQ-001 attribution").isTrue();
    }

    @Test
    @DisplayName("AC2 Feature 헤더가 없으면 SCN-FEATURE-HEADER-MISSING error로 보고된다")
    @Covers("Feature 헤더가 없는 `.feature` 파일은 검사 결과에 오류로 보고된다")
    void missingFeatureHeaderIsReportedAsError(@TempDir Path tmp) throws IOException, InterruptedException {
        ObjectNode index = scenariosIndexShell();
        ArrayNode features = (ArrayNode) index.get("features");
        ObjectNode feature = MAPPER.createObjectNode();
        feature.put("file", "docs/scenarios/headerless.feature");
        feature.putNull("title");
        feature.set("tags", MAPPER.createArrayNode());
        feature.set("requirementIds", MAPPER.createArrayNode());
        feature.set("scenarios", MAPPER.createArrayNode());
        ArrayNode issues = MAPPER.createArrayNode();
        issues.add(issueNode("SCN-FEATURE-HEADER-MISSING", 0, "Feature: 헤더가 없음"));
        feature.set("issues", issues);
        features.add(feature);

        Path indexFile = writeIndex(tmp, index);
        Path findingsFile = tmp.resolve("scenarios.findings.json");
        runValidator(indexFile, findingsFile);

        assertHasRule(findingsFile, "SCN-FEATURE-HEADER-MISSING");
    }

    @Test
    @DisplayName("AC3 @REQ-XXX 태그가 없으면 SCN-REQ-TAG-MISSING error로 보고된다")
    @Covers("`@REQ-XXX` 태그가 없는 Feature는 검사 결과에 오류로 보고된다")
    void missingRequirementTagIsReportedAsError(@TempDir Path tmp) throws IOException, InterruptedException {
        ObjectNode index = scenariosIndexShell();
        ArrayNode features = (ArrayNode) index.get("features");
        ObjectNode feature = MAPPER.createObjectNode();
        feature.put("file", "docs/scenarios/untagged.feature");
        feature.put("title", "Untagged Feature");
        feature.set("tags", MAPPER.createArrayNode());
        feature.set("requirementIds", MAPPER.createArrayNode());
        feature.set("scenarios", MAPPER.createArrayNode());
        ArrayNode issues = MAPPER.createArrayNode();
        issues.add(issueNode("SCN-REQ-TAG-MISSING", 1, "@REQ-XXX Feature 태그가 없음"));
        feature.set("issues", issues);
        features.add(feature);

        Path indexFile = writeIndex(tmp, index);
        Path findingsFile = tmp.resolve("scenarios.findings.json");
        runValidator(indexFile, findingsFile);

        JsonNode findings = MAPPER.readTree(findingsFile.toFile()).path("findings");
        boolean global = StreamSupport.stream(findings.spliterator(), false)
                .anyMatch(finding -> "SCN-REQ-TAG-MISSING".equals(finding.path("ruleId").asText())
                        && "error".equals(finding.path("severity").asText())
                        && finding.path("requirements").size() == 0);
        assertThat(global).as("SCN-REQ-TAG-MISSING with empty requirements (global finding)").isTrue();
    }

    @Test
    @DisplayName("AC4 미지원 키워드 사용은 SCN-UNSUPPORTED-KEYWORD error로 보고된다")
    @Covers("지원하지 않는 Gherkin 키워드(`Background`, `Scenario Outline` 등)를 사용한 `.feature`는 검사 결과에 오류로 보고된다")
    void unsupportedKeywordIsReportedAsError(@TempDir Path tmp) throws IOException, InterruptedException {
        ObjectNode index = scenariosIndexShell();
        ArrayNode features = (ArrayNode) index.get("features");
        ObjectNode feature = MAPPER.createObjectNode();
        feature.put("file", "docs/scenarios/outline.feature");
        feature.put("title", "Outline Feature");
        feature.set("tags", arrayOf("@REQ-002"));
        feature.set("requirementIds", arrayOf("REQ-002"));
        feature.set("scenarios", MAPPER.createArrayNode());
        ArrayNode issues = MAPPER.createArrayNode();
        issues.add(issueNode("SCN-UNSUPPORTED-KEYWORD", 4, "Scenario Outline 는 현재 하네스가 지원하지 않음"));
        feature.set("issues", issues);
        features.add(feature);

        Path indexFile = writeIndex(tmp, index);
        Path findingsFile = tmp.resolve("scenarios.findings.json");
        runValidator(indexFile, findingsFile);

        assertHasRule(findingsFile, "SCN-UNSUPPORTED-KEYWORD");
    }

    @Test
    @DisplayName("AC5 SCN-* error finding이 있으면 gate-trace --check가 실패한다")
    @Covers("`validateHarness` 게이트는 SCN-* error finding을 발견하면 실패한다")
    void gateFailsOnScenarioStandardsErrors(@TempDir Path tmp) throws IOException, InterruptedException {
        ObjectNode state = MAPPER.createObjectNode();
        state.put("generatedAt", "2026-05-23T00:00:00.000Z");
        state.put("schemaVersion", "1");
        ObjectNode summary = MAPPER.createObjectNode();
        summary.put("total", 1);
        summary.put("red", 0);
        summary.put("green", 0);
        summary.put("blue", 1);
        summary.put("unknownApis", 0);
        summary.put("unknownTests", 0);
        summary.put("unknownEntities", 0);
        summary.put("unknownFeatures", 0);
        summary.put("unknownFrontEndSurfaces", 0);
        summary.put("frontEndStandardsErrors", 0);
        summary.put("scenarioStandardsErrors", 1);
        summary.put("structureIssues", 0);
        state.set("summary", summary);

        Path stateDir = tmp.resolve("state");
        Files.createDirectories(stateDir);
        Path stateFile = stateDir.resolve("trace.state.json");
        Files.writeString(stateFile, MAPPER.writeValueAsString(state));

        Path workspace = tmp.resolve("ws");
        Path buildHarnessState = workspace.resolve(Paths.get("build", "harness", "state"));
        Files.createDirectories(buildHarnessState);
        Path targetState = buildHarnessState.resolve("trace.state.json");
        Files.copy(stateFile, targetState);
        // 도구 경로를 진짜 repo의 것으로 가리키기 위해 workspace에는 tools 심볼릭 링크 대신
        // 진짜 repo의 gate-trace.mjs를 그대로 호출하되, --quiet 출력에 노출되는 작업 경로만 임시로 잡는다.
        // gate-trace는 state 파일을 자기 위치 기준 `../../build/harness/state/...`로 찾으므로,
        // 진짜 repo 위치의 state를 fixture로 덮어쓰는 대신 별도 실행 위치를 두기보다는
        // 정상적으로 실제 repo state를 사용하면서, 이 케이스는 fixture script를 별도로 두지 않는다.
        // → 실제 호출은 진짜 repo 위치의 state를 그대로 보되 fixture state로 덮어쓰는 방식 대신
        //   gate-trace의 stateOutFile 경로가 고정이므로, fixture를 직접 그 경로에 두기 위해
        //   본 테스트는 진짜 repo의 state 파일 자리를 임시 백업 후 fixture로 대체한다.
        Path realState = workspaceRoot().resolve(Paths.get("build", "harness", "state", "trace.state.json"));
        Path backupState = tmp.resolve("trace.state.backup.json");
        boolean hadReal = Files.exists(realState);
        if (hadReal) {
            Files.copy(realState, backupState);
        } else {
            Files.createDirectories(realState.getParent());
        }
        try {
            Files.copy(stateFile, realState, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            int exit = runGateCheck();
            assertThat(exit).as("gate-trace --check must fail when scenarioStandardsErrors > 0").isEqualTo(1);
        } finally {
            if (hadReal) {
                Files.copy(backupState, realState, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            } else {
                Files.deleteIfExists(realState);
            }
        }
    }

    private static ObjectNode scenariosIndexShell() {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-23T00:00:00.000Z");
        root.put("schemaVersion", "1");
        root.put("source", "scenarios.index");
        root.set("features", MAPPER.createArrayNode());
        root.set("issues", MAPPER.createArrayNode());
        return root;
    }

    private static ObjectNode issueNode(String kind, int line, String message) {
        ObjectNode issue = MAPPER.createObjectNode();
        issue.put("line", line);
        issue.put("kind", kind);
        issue.put("message", message);
        return issue;
    }

    private static ArrayNode arrayOf(String... values) {
        ArrayNode arr = MAPPER.createArrayNode();
        for (String v : values) arr.add(v);
        return arr;
    }

    private static Path writeIndex(Path tmp, ObjectNode index) throws IOException {
        Path file = tmp.resolve("scenarios.index.json");
        Files.writeString(file, MAPPER.writeValueAsString(index));
        return file;
    }

    private static void assertHasRule(Path findingsPath, String ruleId) throws IOException {
        JsonNode findings = MAPPER.readTree(findingsPath.toFile()).path("findings");
        boolean present = StreamSupport.stream(findings.spliterator(), false)
                .anyMatch(finding -> ruleId.equals(finding.path("ruleId").asText())
                        && "error".equals(finding.path("severity").asText()));
        assertThat(present).as("%s finding with severity=error in %s", ruleId, findings).isTrue();
    }

    private static Path workspaceRoot() {
        Path cwd = Paths.get("").toAbsolutePath();
        Path parent = cwd.getParent();
        return parent != null ? parent : cwd;
    }

    private static void runValidator(Path scenariosIndex, Path out) throws IOException, InterruptedException {
        Path workspace = workspaceRoot();
        Path script = workspace.resolve(Paths.get("tools", "harness", "validate-scenarios.mjs"));
        assertThat(Files.exists(script)).as("validator script must exist").isTrue();

        List<String> command = new ArrayList<>(Arrays.asList(
                "node", script.toString(),
                "--scenarios-index=" + scenariosIndex,
                "--out=" + out));

        runProcess(command, workspace);
    }

    private static int runGateCheck() throws IOException, InterruptedException {
        Path workspace = workspaceRoot();
        Path script = workspace.resolve(Paths.get("tools", "harness", "gate-trace.mjs"));
        assertThat(Files.exists(script)).as("gate-trace script must exist").isTrue();
        ProcessBuilder pb = new ProcessBuilder("node", script.toString(), "--check");
        pb.directory(workspace.toFile());
        pb.redirectErrorStream(true);
        Process proc = pb.start();
        proc.getInputStream().readAllBytes();
        boolean finished = proc.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            proc.destroyForcibly();
            throw new IllegalStateException("gate-trace timed out after 30s");
        }
        return proc.exitValue();
    }

    private static void runProcess(List<String> command, Path cwd) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(cwd.toFile());
        pb.redirectErrorStream(true);
        Process proc = pb.start();
        String output = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        boolean finished = proc.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            proc.destroyForcibly();
            throw new IllegalStateException("command timed out: " + command + "\n" + output);
        }
        assertThat(proc.exitValue())
                .as("command exit code for %s%n%s", command, output)
                .isEqualTo(0);
    }
}
