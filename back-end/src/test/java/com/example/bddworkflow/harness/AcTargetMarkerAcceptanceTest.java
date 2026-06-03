package com.example.bddworkflow.harness;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * REQ-012 AC 단위 검증 채널 마커와 하네스 게이트 — 카드 파서가
 * (API)/(UI)/(E2E)/(STATIC) 마커를 인식하고, 통합 게이트가 AC target에 따라
 * 실행 검증 채널을 분기해 차단하며, 추적 리포트와 표준 문서가 마커 규칙을
 * 노출함을 검증한다.
 */
@AcceptanceTest
@Requirement("REQ-012")
class AcTargetMarkerAcceptanceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    @DisplayName("AC1 카드 파서는 (API)/(UI)/(E2E)/(STATIC) 마커를 인식해 AC에 target을 부여한다")
    @Covers("카드 파서는 수용 기준 bullet 시작에 위치한 `(API)`, `(UI)`, `(E2E)`, `(STATIC)` 마커를 인식해 해당 AC의 target으로 부여한다")
    void parserAssignsTargetFromMarker() throws IOException {
        // 빌드된 requirements.index.json은 indexRequirements 태스크 산출물.
        JsonNode index = readJson(workspaceRoot().resolve("build/harness/indexes/requirements.index.json"));
        Map<String, Boolean> seen = new LinkedHashMap<>();
        for (String target : List.of("API", "UI", "E2E", "STATIC")) {
            seen.put(target, false);
        }
        for (JsonNode card : index.path("entries")) {
            for (JsonNode ac : card.path("acceptanceCriteria")) {
                String target = ac.path("target").asText(null);
                String text = ac.path("text").asText();
                if (seen.containsKey(target)) {
                    seen.put(target, true);
                    assertThat(text).doesNotStartWith("(" + target + ")");
                }
            }
        }
        assertThat(seen).containsEntry("API", true)
                .containsEntry("UI", true)
                .containsEntry("E2E", true)
                .containsEntry("STATIC", true);
    }

    @Test
    @DisplayName("AC2 마커가 없는 AC는 카드 구조 오류로 차단된다")
    @Covers("마커가 없는 AC는 카드 구조 오류로 차단한다")
    void missingMarkerEmitsCardAcMarkerMissing() throws IOException, InterruptedException {
        Path ws = workspaceRoot();
        Path indexFile = ws.resolve("build/harness/indexes/requirements.index.json");
        Path findingsFile = ws.resolve("build/harness/findings/requirement-cards.findings.json");
        Path indexBak = backupAndReplace(indexFile, requirementsFixture("REQ-FIXTURE", "harness",
                List.of(acFixture("plain AC fixture", null))));
        Path findingsBak = Files.exists(findingsFile) ? backup(findingsFile) : null;
        try {
            spawn(ws, List.of("node", ws.resolve("tools/harness/validate-requirement-cards.mjs").toString()));
            JsonNode out = readJson(findingsFile);
            boolean found = false;
            for (JsonNode f : out.path("findings")) {
                if ("CARD-AC-MARKER-MISSING".equals(f.path("ruleId").asText())) {
                    found = true;
                    assertThat(f.path("severity").asText()).isEqualTo("error");
                    assertThat(f.path("strictSeverity").asText()).isEqualTo("error");
                    assertThat(f.path("evidence").path("criterion").asText()).isEqualTo("plain AC fixture");
                    break;
                }
            }
            assertThat(found).as("CARD-AC-MARKER-MISSING emitted").isTrue();
        } finally {
            restore(indexBak, indexFile);
            if (findingsBak != null) restore(findingsBak, findingsFile); else Files.deleteIfExists(findingsFile);
        }
    }

    @Test
    @DisplayName("AC3 허용 외 마커는 CARD-AC-MARKER-INVALID로 차단된다")
    @Covers("AC 마커가 `API`, `UI`, `E2E`, `STATIC` 외 값을 가지면 카드 정적 검증이 오류로 차단한다")
    void invalidMarkerEmitsCardAcMarkerInvalid() throws IOException, InterruptedException {
        // requirements.index.json fixture를 임시로 덮어쓰고 validate-requirement-cards.mjs spawn.
        Path ws = workspaceRoot();
        Path indexFile = ws.resolve("build/harness/indexes/requirements.index.json");
        Path findingsFile = ws.resolve("build/harness/findings/requirement-cards.findings.json");
        Path indexBak = backupAndReplace(indexFile, fixtureIndexWithInvalidMarker());
        Path findingsBak = Files.exists(findingsFile) ? backup(findingsFile) : null;
        try {
            spawn(ws, List.of("node", ws.resolve("tools/harness/validate-requirement-cards.mjs").toString()));
            JsonNode out = readJson(findingsFile);
            boolean found = false;
            for (JsonNode f : out.path("findings")) {
                if ("CARD-AC-MARKER-INVALID".equals(f.path("ruleId").asText())) {
                    found = true;
                    assertThat(f.path("severity").asText()).isEqualTo("error");
                    assertThat(f.path("strictSeverity").asText()).isEqualTo("error");
                    assertThat(f.path("evidence").path("invalidMarker").asText()).isEqualTo("BE");
                    break;
                }
            }
            assertThat(found).as("CARD-AC-MARKER-INVALID emitted").isTrue();
        } finally {
            restore(indexBak, indexFile);
            if (findingsBak != null) restore(findingsBak, findingsFile); else Files.deleteIfExists(findingsFile);
        }
    }

    @Test
    @DisplayName("AC4 마커는 @Covers와 FE BDD Covers 값에 포함되지 않는다")
    @Covers("AC 마커는 백엔드 `@Covers`와 FE BDD `Covers` 값에 포함되지 않는다")
    void markersAreExcludedFromCoversValues() throws IOException {
        Path ws = workspaceRoot();
        // 백엔드 source-index의 tests[].covers[] 값에 (API)/(UI)/(E2E)/(STATIC)가 포함되어 있지 않다.
        JsonNode be = readJson(ws.resolve("build/harness/indexes/backend.source-index.json"));
        for (JsonNode t : be.path("tests")) {
            for (JsonNode c : t.path("covers")) {
                String text = c.isTextual() ? c.asText() : c.path("text").asText();
                assertThat(text).as("backend @Covers must not start with marker token")
                        .doesNotMatch("^\\((API|UI|E2E|STATIC)\\)\\s.*");
            }
        }
        // FE source-index가 존재하면 같은 검증.
        Path feIdx = ws.resolve("build/harness/indexes/front-end.source-index.json");
        if (Files.exists(feIdx)) {
            JsonNode fe = readJson(feIdx);
            for (JsonNode t : fe.path("tests")) {
                for (JsonNode c : t.path("covers")) {
                    String text = c.isTextual() ? c.asText() : c.path("text").asText();
                    assertThat(text).as("FE Covers must not start with marker token")
                            .doesNotMatch("^\\((API|UI|E2E|STATIC)\\)\\s.*");
                }
            }
        }
    }

    @Test
    @DisplayName("AC5 target=API AC는 백엔드 Acceptance Test 커버가 없으면 evaluator가 MISSING + RED를 산출한다")
    @Covers("통합 게이트는 target이 `API`인 AC에 백엔드 Acceptance Test 커버가 없으면 차단한다")
    void apiTargetEvaluatorBranchesOnAcMarker() throws IOException, InterruptedException {
        // 차단 케이스: (API) AC + API 테스트 없음 → row=MISSING, requiredChecks=[api], state=RED.
        ObjectNode reqIdx = requirementsFixture("REQ-FIXTURE", "application",
                List.of(acFixture("API AC fixture", "API")));
        EvaluateRun missing = runEvaluateWithFixtures(reqIdx, backendIndexFixture(List.of()),
                frontEndIndexFixture(List.of()), testResultsFixture(List.of()));
        JsonNode missingReq = findReq(missing.state(), "REQ-FIXTURE");
        JsonNode missingRow = missingReq.path("coverage").get(0);
        assertThat(missingRow.path("target").asText()).isEqualTo("API");
        assertThat(missingRow.path("status").asText()).isEqualTo("MISSING");
        assertThat(checkTargets(missingRow)).containsExactly("api");
        assertThat(missingReq.path("state").asText()).isEqualTo("RED");
        assertThat(redReasonRules(missingReq)).contains("TRACE-AC-MISSING");

        // 통과 케이스: 같은 (API) AC + 백엔드 테스트 PASS → row=PASS.
        ObjectNode passApiIdx = backendIndexFixture(List.of(
                backendTestFixture("FixtureApiTest.acApi", "API AC fixture", "REQ-FIXTURE")));
        ObjectNode passResults = testResultsFixture(List.of(
                testResultEntry("FixtureApiTest.acApi", "PASS", "junit")));
        EvaluateRun pass = runEvaluateWithFixtures(reqIdx, passApiIdx,
                frontEndIndexFixture(List.of()), passResults);
        JsonNode passRow = findReq(pass.state(), "REQ-FIXTURE").path("coverage").get(0);
        assertThat(passRow.path("status").asText()).isEqualTo("PASS");
        assertThat(checkTargets(passRow)).containsExactly("api");
    }

    @Test
    @DisplayName("AC6 target=UI AC는 FE BDD 테스트 커버가 없으면 evaluator가 MISSING + RED를 산출한다")
    @Covers("통합 게이트는 target이 `UI`인 AC에 FE BDD 테스트 커버가 없으면 차단한다")
    void uiTargetEvaluatorBranchesOnAcMarker() throws IOException, InterruptedException {
        // (UI) AC + FE 테스트 없음 → row=MISSING, requiredChecks=[ui], state=RED.
        ObjectNode reqIdx = requirementsFixture("REQ-FIXTURE", "application",
                List.of(acFixture("UI AC fixture", "UI")));
        EvaluateRun missing = runEvaluateWithFixtures(reqIdx, backendIndexFixture(List.of()),
                frontEndIndexFixture(List.of()), testResultsFixture(List.of()));
        JsonNode missingReq = findReq(missing.state(), "REQ-FIXTURE");
        JsonNode missingRow = missingReq.path("coverage").get(0);
        assertThat(missingRow.path("target").asText()).isEqualTo("UI");
        assertThat(missingRow.path("status").asText()).isEqualTo("MISSING");
        assertThat(checkTargets(missingRow)).containsExactly("ui");
        assertThat(missingReq.path("state").asText()).isEqualTo("RED");
        assertThat(redReasonRules(missingReq)).contains("TRACE-AC-MISSING");

        // (UI) AC + FE 테스트 PASS → row=PASS.
        ObjectNode passUiIdx = frontEndIndexFixture(List.of(
                frontEndTestFixture("FixtureUiTest > acUi", "UI AC fixture", "REQ-FIXTURE")));
        ObjectNode passResults = testResultsFixture(List.of(
                testResultEntry("FixtureUiTest > acUi", "PASS", "playwright")));
        EvaluateRun pass = runEvaluateWithFixtures(reqIdx, backendIndexFixture(List.of()),
                passUiIdx, passResults);
        JsonNode passRow = findReq(pass.state(), "REQ-FIXTURE").path("coverage").get(0);
        assertThat(passRow.path("status").asText()).isEqualTo("PASS");
        assertThat(checkTargets(passRow)).containsExactly("ui");
    }

    @Test
    @DisplayName("AC7 target=E2E AC는 Playwright 사용자 여정 테스트 커버가 없으면 evaluator가 MISSING + RED를 산출한다")
    @Covers("통합 게이트는 target이 `E2E`인 AC에 Playwright 사용자 여정 테스트 커버가 없으면 차단한다")
    void e2eTargetEvaluatorBranchesOnAcMarker() throws IOException, InterruptedException {
        // (E2E) AC + FE 테스트 없음 → row=MISSING, requiredChecks=[e2e], state=RED.
        ObjectNode reqIdx = requirementsFixture("REQ-FIXTURE", "application",
                List.of(acFixture("E2E AC fixture", "E2E")));
        EvaluateRun run = runEvaluateWithFixtures(reqIdx, backendIndexFixture(List.of()),
                frontEndIndexFixture(List.of()), testResultsFixture(List.of()));
        JsonNode req = findReq(run.state(), "REQ-FIXTURE");
        JsonNode row = req.path("coverage").get(0);
        assertThat(row.path("target").asText()).isEqualTo("E2E");
        assertThat(row.path("status").asText()).isEqualTo("MISSING");
        assertThat(checkTargets(row)).containsExactly("e2e");
        assertThat(req.path("state").asText()).isEqualTo("RED");

        // (E2E) AC + Playwright 테스트 PASS → row=PASS.
        ObjectNode feIdx = frontEndIndexFixture(List.of(
                frontEndTestFixture("FixtureE2eTest > acE2e", "E2E AC fixture", "REQ-FIXTURE")));
        ObjectNode resultsBoth = testResultsFixture(List.of(
                testResultEntry("FixtureE2eTest > acE2e", "PASS", "playwright")));
        EvaluateRun pass = runEvaluateWithFixtures(reqIdx, backendIndexFixture(List.of()), feIdx, resultsBoth);
        JsonNode passRow = findReq(pass.state(), "REQ-FIXTURE").path("coverage").get(0);
        assertThat(passRow.path("status").asText()).isEqualTo("PASS");
        assertThat(checkTargets(passRow)).containsExactly("e2e");
    }

    @Test
    @DisplayName("AC8 추적 리포트는 AC별 (target) 마커와 검증 상태를 함께 표시한다")
    @Covers("추적 리포트는 각 AC의 target 마커와 검증 상태를 함께 표시한다")
    void traceReportShowsTargetAndPerSideStatus() throws IOException, InterruptedException {
        // fixture state: REQ-X에 API/UI/E2E/STATIC 네 종류 AC를 두고 render-trace-report.mjs 실행.
        Path ws = workspaceRoot();
        ObjectNode state = baseStateWithCard("REQ-X", "RED");
        ObjectNode req = (ObjectNode) state.get("requirements").get(0);
        req.put("title", "fixture for AC8");
        req.put("file", "(fixture)");
        req.put("status", "초안");
        req.put("targetSystem", "application");
        req.set("apis", MAPPER.createArrayNode());
        req.set("tests", MAPPER.createArrayNode());
        req.set("scenarios", MAPPER.createArrayNode());
        req.set("entities", MAPPER.createArrayNode());
        ObjectNode frontEnd = MAPPER.createObjectNode();
        frontEnd.set("pages", MAPPER.createArrayNode());
        frontEnd.set("routes", MAPPER.createArrayNode());
        frontEnd.set("stories", MAPPER.createArrayNode());
        req.set("frontEnd", frontEnd);
        req.set("terminology", MAPPER.createObjectNode().set("findings", MAPPER.createArrayNode()));
        ((ObjectNode) req.get("terminology")).set("counts", emptyCounts());
        ArrayNode coverage = MAPPER.createArrayNode();
        coverage.add(coverageRow("API AC fixture", "API", "PASS", List.of(Map.entry("api", "PASS"))));
        coverage.add(coverageRow("UI AC fixture", "UI", "PASS", List.of(Map.entry("ui", "PASS"))));
        coverage.add(coverageRow("E2E AC fixture", "E2E", "MISSING", List.of(Map.entry("e2e", "MISSING"))));
        coverage.add(coverageRow("STATIC AC fixture", "STATIC", "PASS", List.of(Map.entry("static", "PASS"))));
        req.set("coverage", coverage);
        req.set("redReasons", MAPPER.createArrayNode());

        Path stateProd = ws.resolve("build/harness/state/trace.state.json");
        Path stateBak = backup(stateProd);
        try {
            Files.writeString(stateProd, MAPPER.writeValueAsString(state), StandardCharsets.UTF_8);
            spawn(ws, List.of("node", ws.resolve("tools/harness/render-trace-report.mjs").toString(), "--quiet"));
            String md = Files.readString(ws.resolve("build/harness/reports/trace-report.md"), StandardCharsets.UTF_8);
            assertThat(md).as("(API) marker rendered").contains("PASS: (API) API AC fixture");
            assertThat(md).as("(UI) marker rendered").contains("PASS: (UI) UI AC fixture");
            assertThat(md).as("(E2E) marker rendered").contains("MISSING: (E2E) E2E AC fixture");
            assertThat(md).as("(STATIC) marker rendered").contains("PASS: (STATIC) STATIC AC fixture");
        } finally {
            restore(stateBak, stateProd);
            // 리포트 재생성: production state로 다시 렌더링해 다른 테스트에 영향 없게 한다.
            spawn(ws, List.of("node", ws.resolve("tools/harness/render-trace-report.mjs").toString(), "--quiet"));
        }
    }

    @Test
    @DisplayName("AC9 표준 문서에 마커 작성 규칙, 유효값, 오류 규칙이 명시된다")
    @Covers("표준 문서에는 마커 작성 규칙, 유효값, 오류 규칙이 명시된다")
    void standardDocSpecifiesMarkerRulesAndErrors() throws IOException {
        Path doc = workspaceRoot().resolve("docs/standards/requirement-card.md");
        String content = Files.readString(doc, StandardCharsets.UTF_8);
        assertThat(content).as("API marker token mentioned").contains("`API`");
        assertThat(content).as("UI marker token mentioned").contains("`UI`");
        assertThat(content).as("E2E marker token mentioned").contains("`E2E`");
        assertThat(content).as("STATIC marker token mentioned").contains("`STATIC`");
        assertThat(content).as("missing marker block referenced").contains("CARD-AC-MARKER-MISSING");
        assertThat(content).as("invalid marker block referenced").contains("CARD-AC-MARKER-INVALID");
    }

    // ---------- helpers ----------

    private static Path workspaceRoot() {
        Path cwd = Paths.get("").toAbsolutePath();
        Path parent = cwd.getParent();
        return parent != null ? parent : cwd;
    }

    private static JsonNode readJson(Path path) throws IOException {
        return MAPPER.readTree(Files.readAllBytes(path));
    }

    private static JsonNode findCard(JsonNode index, String id) {
        for (JsonNode entry : index.path("entries")) {
            if (id.equals(entry.path("id").asText())) return entry;
        }
        return null;
    }

    private static ObjectNode fixtureIndexWithInvalidMarker() {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-26T00:00:00.000Z");
        root.put("schemaVersion", "1");
        root.put("source", "requirements.index");
        ArrayNode entries = MAPPER.createArrayNode();
        ObjectNode card = MAPPER.createObjectNode();
        card.put("kind", "card");
        ArrayNode reqs = MAPPER.createArrayNode();
        reqs.add("REQ-FIXTURE");
        card.set("requirements", reqs);
        ObjectNode location = MAPPER.createObjectNode();
        location.put("file", "docs/requirements/REQ-FIXTURE-invalid.md");
        location.put("line", 0);
        location.put("identity", "REQ-FIXTURE");
        card.set("location", location);
        card.put("idRaw", "REQ-FIXTURE");
        card.put("id", "REQ-FIXTURE");
        card.put("title", "fixture invalid marker");
        card.put("priority", "중간");
        card.put("status", "초안");
        card.put("requirementType", "하네스");
        card.put("specRole", "원자 요건");
        card.put("targetSystem", "harness");
        card.put("productArea", "harness");
        card.set("qualityAttributes", textArray("none"));
        card.put("verificationLevel", "static");
        card.set("relatedRequirementIds", MAPPER.createArrayNode());
        card.set("replacedByRequirementIds", MAPPER.createArrayNode());
        card.put("approved", false);
        ArrayNode ac = MAPPER.createArrayNode();
        ObjectNode bad = MAPPER.createObjectNode();
        bad.put("text", "(BE) 허용 외 토큰");
        bad.putNull("target");
        bad.put("invalidMarker", "BE");
        ac.add(bad);
        card.set("acceptanceCriteria", ac);
        card.set("openQuestions", MAPPER.createArrayNode());
        card.set("terms", MAPPER.createArrayNode());
        ObjectNode sec = MAPPER.createObjectNode();
        for (String s : new String[]{"사용자/목적","범위","표준 용어","제외 범위","수용 기준","의사결정 로그","BDD 테스트 리뷰","열린 질문"}) {
            sec.put(s, true);
        }
        card.set("sectionPresent", sec);
        card.put("bddReviewIncomplete", true);
        card.put("bddReviewApproved", false);
        card.set("referencedRequirementIds", MAPPER.createArrayNode());
        entries.add(card);
        root.set("entries", entries);
        root.set("issues", MAPPER.createArrayNode());
        return root;
    }

    private static ObjectNode baseStateWithCard(String cardId, String stateLabel) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-26T00:00:00.000Z");
        root.put("schemaVersion", "1");
        root.put("source", "trace.state");
        root.set("flags", MAPPER.createObjectNode());
        root.set("filter", null);
        ObjectNode summary = MAPPER.createObjectNode();
        summary.put("total", 1);
        summary.put("red", "RED".equals(stateLabel) ? 1 : 0);
        summary.put("green", "GREEN".equals(stateLabel) ? 1 : 0);
        summary.put("blue", "BLUE".equals(stateLabel) ? 1 : 0);
        for (String k : new String[]{"unknownApis","unknownTests","unknownEntities","unknownFeatures",
                "unknownFrontEndSurfaces","frontEndStandardsErrors","frontEndStandardsWarnings",
                "scenarioStandardsErrors","scenarioStandardsWarnings","scenarioWarnings","structureIssues"}) {
            summary.put(k, 0);
        }
        summary.set("frontEndStandardsByRuleId", MAPPER.createObjectNode());
        summary.set("scenarioStandardsByRuleId", MAPPER.createObjectNode());
        summary.set("scenarioWarningsByKind", MAPPER.createObjectNode());
        root.set("summary", summary);
        ArrayNode requirements = MAPPER.createArrayNode();
        ObjectNode req = MAPPER.createObjectNode();
        req.put("id", cardId);
        req.put("state", stateLabel);
        requirements.add(req);
        root.set("requirements", requirements);
        // model fields that render-trace-report.mjs walks unconditionally.
        ObjectNode terminology = MAPPER.createObjectNode();
        terminology.put("present", false);
        terminology.set("unattributed", MAPPER.createArrayNode());
        root.set("terminology", terminology);
        for (String k : new String[]{"structureReports","unknownApis","unknownTests","unknownEntities",
                "unknownFeatures","unknownFrontEndSurfaces","scenarioWarnings"}) {
            root.set(k, MAPPER.createArrayNode());
        }
        ObjectNode feStandards = MAPPER.createObjectNode();
        feStandards.set("findings", MAPPER.createArrayNode());
        root.set("frontEndStandards", feStandards);
        ObjectNode scnStandards = MAPPER.createObjectNode();
        scnStandards.set("findings", MAPPER.createArrayNode());
        root.set("scenarioStandards", scnStandards);
        return root;
    }

    private static ObjectNode coverageRow(String criterion, String target, String status,
                                          List<Map.Entry<String, String>> checks) {
        ObjectNode row = MAPPER.createObjectNode();
        row.put("criterion", criterion);
        row.put("target", target);
        row.put("status", status);
        ArrayNode arr = MAPPER.createArrayNode();
        for (Map.Entry<String, String> c : checks) {
            arr.add(MAPPER.createObjectNode().put("target", c.getKey()).put("status", c.getValue()));
        }
        row.set("requiredChecks", arr);
        row.set("tests", MAPPER.createArrayNode());
        row.set("scenarios", MAPPER.createArrayNode());
        return row;
    }

    private static ObjectNode emptyCounts() {
        ObjectNode counts = MAPPER.createObjectNode();
        counts.put("error", 0);
        counts.put("warning", 0);
        counts.put("strictError", 0);
        counts.set("byKind", MAPPER.createObjectNode());
        return counts;
    }

    private record GateRun(int exit, String stdout) {}

    private record EvaluateRun(int exit, String stdout, JsonNode state) {}

    // AC5/6/7: fixture indexes로 evaluate-trace-state.mjs를 직접 실행해 RED 산출 자체를 검증한다.
    // production indexes/findings를 일시 백업·교체·복원해 다른 카드의 테스트 결과가 섞이지 않게 한다.
    private static EvaluateRun runEvaluateWithFixtures(
            ObjectNode requirementsIdx, ObjectNode backendIdx,
            ObjectNode frontEndIdx, ObjectNode testResultsIdx)
            throws IOException, InterruptedException {
        Path ws = workspaceRoot();
        Path indexesDir = ws.resolve("build/harness/indexes");
        Path findingsDir = ws.resolve("build/harness/findings");
        Path stateProd = ws.resolve("build/harness/state/trace.state.json");
        Files.createDirectories(indexesDir);
        Files.createDirectories(findingsDir);
        Files.createDirectories(stateProd.getParent());

        String[] indexNames = {
                "requirements.index.json", "backend.source-index.json",
                "front-end.source-index.json", "test-results.index.json",
                "scenarios.index.json", "terminology.index.json", "openapi.index.json"
        };
        String[] findingNames = {
                "requirement-cards.findings.json", "cross-artifact.findings.json",
                "back-end-standards.findings.json", "front-end-standards.findings.json",
                "scenarios.findings.json", "terminology.findings.json"
        };

        Map<String, Path> idxBak = new LinkedHashMap<>();
        Map<String, Path> findBak = new LinkedHashMap<>();
        Path stateBak = Files.exists(stateProd) ? backup(stateProd) : null;
        for (String name : indexNames) {
            Path p = indexesDir.resolve(name);
            idxBak.put(name, Files.exists(p) ? backup(p) : null);
        }
        for (String name : findingNames) {
            Path p = findingsDir.resolve(name);
            findBak.put(name, Files.exists(p) ? backup(p) : null);
        }

        try {
            Files.writeString(indexesDir.resolve("requirements.index.json"),
                    MAPPER.writeValueAsString(requirementsIdx), StandardCharsets.UTF_8);
            Files.writeString(indexesDir.resolve("backend.source-index.json"),
                    MAPPER.writeValueAsString(backendIdx), StandardCharsets.UTF_8);
            if (frontEndIdx != null) {
                Files.writeString(indexesDir.resolve("front-end.source-index.json"),
                        MAPPER.writeValueAsString(frontEndIdx), StandardCharsets.UTF_8);
            } else {
                Files.deleteIfExists(indexesDir.resolve("front-end.source-index.json"));
            }
            if (testResultsIdx != null) {
                Files.writeString(indexesDir.resolve("test-results.index.json"),
                        MAPPER.writeValueAsString(testResultsIdx), StandardCharsets.UTF_8);
            } else {
                Files.deleteIfExists(indexesDir.resolve("test-results.index.json"));
            }
            for (String name : List.of("scenarios.index.json", "terminology.index.json", "openapi.index.json")) {
                Files.deleteIfExists(indexesDir.resolve(name));
            }
            for (String name : findingNames) {
                Files.deleteIfExists(findingsDir.resolve(name));
            }
            Files.deleteIfExists(stateProd);

            GateRun run = spawnCapturingStdout(ws, List.of("node",
                    ws.resolve("tools/harness/evaluate-trace-state.mjs").toString(), "--quiet"));
            assertThat(run.exit())
                    .as("evaluate-trace-state.mjs exit; stdout=%s", run.stdout()).isEqualTo(0);
            JsonNode state = Files.exists(stateProd) ? readJson(stateProd) : null;
            assertThat(state).as("trace.state.json written").isNotNull();
            return new EvaluateRun(run.exit(), run.stdout(), state);
        } finally {
            if (stateBak != null) restore(stateBak, stateProd); else Files.deleteIfExists(stateProd);
            for (Map.Entry<String, Path> e : idxBak.entrySet()) {
                Path target = indexesDir.resolve(e.getKey());
                if (e.getValue() != null) restore(e.getValue(), target);
                else Files.deleteIfExists(target);
            }
            for (Map.Entry<String, Path> e : findBak.entrySet()) {
                Path target = findingsDir.resolve(e.getKey());
                if (e.getValue() != null) restore(e.getValue(), target);
                else Files.deleteIfExists(target);
            }
        }
    }

    private static ObjectNode requirementsFixture(String cardId, String targetSystem, List<ObjectNode> acs) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-26T00:00:00.000Z");
        root.put("schemaVersion", "1");
        root.put("source", "requirements.index");
        ArrayNode entries = MAPPER.createArrayNode();
        ObjectNode card = MAPPER.createObjectNode();
        card.put("kind", "card");
        ArrayNode reqs = MAPPER.createArrayNode();
        reqs.add(cardId);
        card.set("requirements", reqs);
        ObjectNode loc = MAPPER.createObjectNode();
        loc.put("file", "docs/requirements/" + cardId + "-fixture.md");
        loc.put("line", 0);
        loc.put("identity", cardId);
        card.set("location", loc);
        card.put("idRaw", cardId);
        card.put("id", cardId);
        card.put("title", cardId + " fixture");
        card.put("priority", "중간");
        card.put("status", "초안");
        card.put("requirementType", "harness".equals(targetSystem) ? "하네스" : "기능");
        card.put("specRole", "원자 요건");
        card.put("targetSystem", targetSystem);
        card.put("productArea", "harness".equals(targetSystem) ? "harness" : "platform");
        card.set("qualityAttributes", textArray("none"));
        card.put("verificationLevel", "harness".equals(targetSystem) ? "static" : "acceptance");
        card.set("relatedRequirementIds", MAPPER.createArrayNode());
        card.set("replacedByRequirementIds", MAPPER.createArrayNode());
        card.put("approved", false);
        ArrayNode acArr = MAPPER.createArrayNode();
        for (ObjectNode ac : acs) acArr.add(ac);
        card.set("acceptanceCriteria", acArr);
        card.set("openQuestions", MAPPER.createArrayNode());
        card.set("terms", MAPPER.createArrayNode());
        ObjectNode sec = MAPPER.createObjectNode();
        for (String s : new String[]{"사용자/목적","범위","표준 용어","제외 범위","수용 기준","의사결정 로그","BDD 테스트 리뷰","열린 질문"}) {
            sec.put(s, true);
        }
        card.set("sectionPresent", sec);
        card.put("bddReviewIncomplete", true);
        card.put("bddReviewApproved", false);
        card.set("referencedRequirementIds", MAPPER.createArrayNode());
        entries.add(card);
        root.set("entries", entries);
        root.set("issues", MAPPER.createArrayNode());
        return root;
    }

    private static ArrayNode textArray(String... values) {
        ArrayNode arr = MAPPER.createArrayNode();
        for (String value : values) arr.add(value);
        return arr;
    }

    private static ObjectNode acFixture(String text, String target) {
        ObjectNode ac = MAPPER.createObjectNode();
        ac.put("text", text);
        if (target == null) ac.putNull("target"); else ac.put("target", target);
        return ac;
    }

    private static ObjectNode backendIndexFixture(List<ObjectNode> tests) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-26T00:00:00.000Z");
        root.set("apis", MAPPER.createArrayNode());
        ArrayNode arr = MAPPER.createArrayNode();
        for (ObjectNode t : tests) arr.add(t);
        root.set("tests", arr);
        root.set("entities", MAPPER.createArrayNode());
        return root;
    }

    private static ObjectNode backendTestFixture(String identity, String coversText, String cardId) {
        ObjectNode t = MAPPER.createObjectNode();
        ArrayNode reqs = MAPPER.createArrayNode();
        reqs.add(cardId);
        t.set("requirements", reqs);
        t.put("identity", identity);
        t.put("displayName", identity);
        ArrayNode covers = MAPPER.createArrayNode();
        covers.add(coversText);
        t.set("covers", covers);
        t.set("resultKeys", MAPPER.createArrayNode());
        return t;
    }

    private static ObjectNode frontEndIndexFixture(List<ObjectNode> tests) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-26T00:00:00.000Z");
        root.set("pages", MAPPER.createArrayNode());
        root.set("routes", MAPPER.createArrayNode());
        root.set("stories", MAPPER.createArrayNode());
        ArrayNode arr = MAPPER.createArrayNode();
        for (ObjectNode t : tests) arr.add(t);
        root.set("tests", arr);
        root.set("issues", MAPPER.createArrayNode());
        root.set("textChannels", MAPPER.createArrayNode());
        // REQ-FIXTURE는 front-end/full-stack 카드일 수 있어 TRACE-NO-FE-SURFACE를 피할 수 있도록
        // page 한 개를 같은 카드 ID로 묶어 둔다 — coverage row 산출에는 영향 없음.
        // (참고: AC5/6는 카드 implementationTarget이 back-end/front-end이므로 영향 미미)
        return root;
    }

    private static ObjectNode frontEndTestFixture(String identity, String coversText, String cardId) {
        ObjectNode t = MAPPER.createObjectNode();
        ArrayNode reqs = MAPPER.createArrayNode();
        reqs.add(cardId);
        t.set("requirements", reqs);
        t.put("identity", identity);
        t.put("displayName", identity);
        ArrayNode covers = MAPPER.createArrayNode();
        covers.add(coversText);
        t.set("covers", covers);
        t.set("resultKeys", MAPPER.createArrayNode());
        // evaluate-trace-state.mjs는 FE 테스트에 source: 'front-end'를 주입한다.
        return t;
    }

    private static ObjectNode testResultsFixture(List<ObjectNode> entries) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-26T00:00:00.000Z");
        ArrayNode arr = MAPPER.createArrayNode();
        for (ObjectNode e : entries) arr.add(e);
        root.set("entries", arr);
        return root;
    }

    private static ObjectNode testResultEntry(String identity, String status, String runtime) {
        ObjectNode e = MAPPER.createObjectNode();
        e.put("identity", identity);
        e.set("alternateIdentities", MAPPER.createArrayNode());
        e.put("status", status);
        e.put("runtime", runtime);
        return e;
    }

    private static JsonNode findReq(JsonNode state, String cardId) {
        for (JsonNode r : state.path("requirements")) {
            if (cardId.equals(r.path("id").asText())) return r;
        }
        throw new IllegalStateException("card not found in trace.state: " + cardId);
    }

    private static List<String> checkTargets(JsonNode coverageRow) {
        List<String> out = new ArrayList<>();
        for (JsonNode c : coverageRow.path("requiredChecks")) out.add(c.path("target").asText());
        return out;
    }

    private static Map<String, String> sideStatuses(JsonNode coverageRow) {
        Map<String, String> out = new LinkedHashMap<>();
        for (JsonNode c : coverageRow.path("requiredChecks")) {
            out.put(c.path("target").asText(), c.path("status").asText());
        }
        return out;
    }

    private static List<String> redReasonRules(JsonNode req) {
        List<String> out = new ArrayList<>();
        for (JsonNode r : req.path("redReasons")) out.add(r.path("ruleId").asText());
        return out;
    }

    private static Path backup(Path file) throws IOException {
        Path bak = Files.createTempFile("ac-target-bak-", ".json");
        Files.copy(file, bak, StandardCopyOption.REPLACE_EXISTING);
        return bak;
    }

    private static Path backupAndReplace(Path file, ObjectNode replacement) throws IOException {
        Files.createDirectories(file.getParent());
        Path bak = Files.exists(file) ? backup(file) : null;
        Files.writeString(file, MAPPER.writeValueAsString(replacement), StandardCharsets.UTF_8);
        return bak;
    }

    private static void restore(Path bak, Path file) throws IOException {
        if (bak == null) { Files.deleteIfExists(file); return; }
        Files.copy(bak, file, StandardCopyOption.REPLACE_EXISTING);
        Files.deleteIfExists(bak);
    }

    private static void spawn(Path cwd, List<String> cmd) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(cmd).directory(cwd.toFile()).redirectErrorStream(true);
        Process p = pb.start();
        String out = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (!p.waitFor(30, TimeUnit.SECONDS)) {
            p.destroyForcibly();
            throw new IllegalStateException("spawn timeout: " + cmd + "\n" + out);
        }
        if (p.exitValue() != 0) {
            throw new IllegalStateException("spawn failed exit=" + p.exitValue() + " cmd=" + cmd + "\n" + out);
        }
    }

    private static GateRun spawnCapturingStdout(Path cwd, List<String> cmd) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(cmd).directory(cwd.toFile()).redirectErrorStream(true);
        Process p = pb.start();
        String out = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (!p.waitFor(30, TimeUnit.SECONDS)) {
            p.destroyForcibly();
            throw new IllegalStateException("spawn timeout: " + cmd + "\n" + out);
        }
        return new GateRun(p.exitValue(), out);
    }
}
