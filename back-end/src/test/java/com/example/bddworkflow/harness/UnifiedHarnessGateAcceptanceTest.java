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
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * REQ-010 통합 하네스 게이트 — gate.mjs가 단일 Layer 4 판정기로 동작하고,
 * BE/FE/SCN/CARD/REF/TRC/TRACE/TRM 8개 카테고리를 한 번에 차단함을 검증한다.
 *
 * fixture 전략: production 경로(`build/harness/state/`, `build/harness/findings/`)의
 * 파일을 임시 백업한 뒤 fixture로 덮어쓰고 gate.mjs를 호출하고, 결과 검증 후 원본 복구.
 */
@AcceptanceTest
@Requirement("REQ-010")
class UnifiedHarnessGateAcceptanceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final List<String> ALL_FINDING_FILES = List.of(
            "requirement-cards.findings.json",
            "cross-artifact.findings.json",
            "back-end-standards.findings.json",
            "front-end-standards.findings.json",
            "scenarios.findings.json",
            "terminology.findings.json"
    );

    private static final Map<String, String> FILE_TO_OWNER = Map.of(
            "requirement-cards.findings.json", "requirement-cards",
            "cross-artifact.findings.json", "cross-artifact",
            "back-end-standards.findings.json", "back-end-standards",
            "front-end-standards.findings.json", "front-end-standards",
            "scenarios.findings.json", "scenarios",
            "terminology.findings.json", "terminology"
    );

    @Test
    @DisplayName("AC1 gate.mjs는 3종 입력을 모두 읽어 단일 결과를 만든다")
    @Covers("`tools/harness/gate.mjs`는 `build/harness/state/trace.state.json`, `build/harness/findings/*.findings.json`, `build/harness/findings/terminology.findings.json`을 읽어 단일 게이트 결과(exit code + 카테고리별 요약)를 만든다")
    void readsThreeInputsAndProducesSingleResult() throws Exception {
        ObjectNode state = stateWith(card("REQ-001", "BLUE"));
        Map<String, ObjectNode> findings = allClean();
        GateRun ok = runGate(state, findings, "--check");
        assertThat(ok.exit).as("clean fixture, all 3 inputs present").isEqualTo(0);
        assertThat(ok.stdout).contains("gate: pass");

        GateRun missing = runGateOmittingFile(state, findings, "back-end-standards.findings.json", "--check");
        assertThat(missing.exit).as("missing required input file must yield exit=2").isEqualTo(2);
        assertThat(missing.stdout).contains("back-end-standards.findings.json");
    }

    @Test
    @DisplayName("AC2 실패 사유가 8개 카테고리 라벨로 분리된다")
    @Covers("`gate.mjs`는 실패 사유를 `TRACE`/`CARD`/`REF`/`TRC`/`BE`/`FE`/`SCN`/`TRM` 카테고리 라벨로 분리해서 보고한다")
    void separatesFailuresByEightCategoryLabels() throws Exception {
        ObjectNode state = stateWith(card("REQ-001", "RED"));
        Map<String, ObjectNode> findings = allClean();
        addFinding(findings, "requirement-cards.findings.json", "CARD-X", "error", List.of("REQ-001"));
        addFinding(findings, "cross-artifact.findings.json", "REF-API", "error", List.of("REQ-001"));
        addFinding(findings, "cross-artifact.findings.json", "TRC-X", "error", List.of("REQ-001"));
        addFinding(findings, "back-end-standards.findings.json", "BE-X", "error", List.of("REQ-001"));
        addFinding(findings, "front-end-standards.findings.json", "FE-X", "error", List.of("REQ-001"));
        addFinding(findings, "scenarios.findings.json", "SCN-X", "error", List.of("REQ-001"));
        addTrmFinding(findings, "DRAFT_TERM", "warning", "error", List.of("REQ-001"));

        GateRun run = runGate(state, findings, "--check");
        assertThat(run.exit).isEqualTo(1);
        for (String label : List.of("[TRACE]", "[CARD]", "[REF]", "[TRC]", "[BE]", "[FE]", "[SCN]", "[TRM]")) {
            assertThat(run.stdout).as("category label %s on its own line", label).contains(label);
        }
    }

    @Test
    @DisplayName("AC3 BE-* error finding이 BE 카테고리로 차단된다")
    @Covers("`gate.mjs --check`는 `back-end-standards.findings.json`에 `severity: error` finding이 있으면 BE 카테고리 실패로 차단한다")
    void backEndErrorFindingIsBlockedAsBeCategory() throws Exception {
        ObjectNode state = stateWith(card("REQ-001", "BLUE"));
        Map<String, ObjectNode> findings = allClean();
        addFinding(findings, "back-end-standards.findings.json", "BE-PKG-LAYER", "error", List.of("REQ-001"));

        GateRun run = runGate(state, findings, "--check");
        assertThat(run.exit).isEqualTo(1);
        assertThat(run.stdout).contains("[BE] errors=1");
    }

    @Test
    @DisplayName("AC4 TRM strictSeverity=error finding이 TRM 카테고리로 차단된다")
    @Covers("`gate.mjs --check`는 `terminology.findings.json`에 `strictSeverity: error` finding이 있으면 TRM 카테고리 실패로 차단한다")
    void terminologyStrictErrorIsBlockedAsTrmCategory() throws Exception {
        ObjectNode state = stateWith(card("REQ-001", "BLUE"));
        Map<String, ObjectNode> findings = allClean();
        // severity=warning (safe), strictSeverity=error -> TRM 차단 대상
        addTrmFinding(findings, "DRAFT_TERM", "warning", "error", List.of("REQ-001"));

        GateRun run = runGate(state, findings, "--check");
        assertThat(run.exit).isEqualTo(1);
        assertThat(run.stdout).contains("[TRM] errors=1");
    }

    @Test
    @DisplayName("AC5 RED/CARD/REF/FE/SCN/TRC error finding이 각 카테고리로 차단된다")
    @Covers("`gate.mjs --check`는 RED 카드, 카드 구조 위반(CARD-*), REF-* unknown reference, FE-* error, SCN-* error, TRC-* error finding이 있으면 각 카테고리 실패로 차단한다")
    void redAndStandardFindingsAreBlockedByOwnCategory() throws Exception {
        // RED만 있는 경우 TRACE 차단 확인
        ObjectNode stateRed = stateWith(card("REQ-001", "RED"));
        GateRun redRun = runGate(stateRed, allClean(), "--check");
        assertThat(redRun.exit).isEqualTo(1);
        assertThat(redRun.stdout).contains("[TRACE]").contains("red=1");

        // CARD-* error 차단
        ObjectNode stateBlue = stateWith(card("REQ-001", "BLUE"));
        Map<String, ObjectNode> cardFindings = allClean();
        addFinding(cardFindings, "requirement-cards.findings.json", "CARD-OPEN-QUESTION", "error", List.of("REQ-001"));
        GateRun cardRun = runGate(stateBlue, cardFindings, "--check");
        assertThat(cardRun.exit).isEqualTo(1);
        assertThat(cardRun.stdout).contains("[CARD] errors=1");

        // REF-* error 차단
        Map<String, ObjectNode> refFindings = allClean();
        addFinding(refFindings, "cross-artifact.findings.json", "REF-API", "error", List.of("REQ-001"));
        GateRun refRun = runGate(stateBlue, refFindings, "--check");
        assertThat(refRun.exit).isEqualTo(1);
        assertThat(refRun.stdout).contains("[REF] errors=1");

        // TRC-* error 차단
        Map<String, ObjectNode> trcFindings = allClean();
        addFinding(trcFindings, "cross-artifact.findings.json", "TRC-X", "error", List.of("REQ-001"));
        GateRun trcRun = runGate(stateBlue, trcFindings, "--check");
        assertThat(trcRun.exit).isEqualTo(1);
        assertThat(trcRun.stdout).contains("[TRC] errors=1");

        // FE-* error 차단
        Map<String, ObjectNode> feFindings = allClean();
        addFinding(feFindings, "front-end-standards.findings.json", "FE-API-CONTRACT-MISSING", "error", List.of("REQ-001"));
        GateRun feRun = runGate(stateBlue, feFindings, "--check");
        assertThat(feRun.exit).isEqualTo(1);
        assertThat(feRun.stdout).contains("[FE] errors=1");

        // SCN-* error 차단
        Map<String, ObjectNode> scnFindings = allClean();
        addFinding(scnFindings, "scenarios.findings.json", "SCN-REQ-TAG-MISSING", "error", List.of("REQ-001"));
        GateRun scnRun = runGate(stateBlue, scnFindings, "--check");
        assertThat(scnRun.exit).isEqualTo(1);
        assertThat(scnRun.stdout).contains("[SCN] errors=1");
    }

    @Test
    @DisplayName("AC6 --require-blue는 GREEN 카드도 TRACE 카테고리로 차단한다")
    @Covers("`gate.mjs --require-blue`는 `--check` 조건에 더해 GREEN 카드가 있으면 TRACE 카테고리 실패로 차단한다")
    void requireBlueBlocksGreenAsTraceCategory() throws Exception {
        ObjectNode state = stateWith(card("REQ-001", "GREEN"));
        Map<String, ObjectNode> findings = allClean();

        GateRun checkOnly = runGate(state, findings, "--check");
        assertThat(checkOnly.exit).as("GREEN passes --check only").isEqualTo(0);

        GateRun requireBlue = runGate(state, findings, "--check", "--require-blue");
        assertThat(requireBlue.exit).as("GREEN blocked by --require-blue").isEqualTo(1);
        assertThat(requireBlue.stdout).contains("[TRACE]").contains("green=1");
    }

    @Test
    @DisplayName("AC7 --requirement 단일 카드 필터는 교집합으로만 차단하고 전역 finding은 제외한다")
    @Covers("`gate.mjs --requirement REQ-XXX`는 `finding.requirements[]`와 선택 카드 ID의 교집합으로 finding을 거른다. `requirements: []` 전역 finding은 단일 카드 게이트에서 차단되지 않고 `validateHarness` 전체 게이트에서만 차단된다")
    void singleCardFilterUsesIntersectionAndExcludesGlobal() throws Exception {
        // REQ-A BLUE, REQ-B BLUE. REQ-B 귀속 error + 전역 error 1건씩.
        ObjectNode state = stateWith(card("REQ-A", "BLUE"), card("REQ-B", "BLUE"));
        Map<String, ObjectNode> findings = allClean();
        addFinding(findings, "back-end-standards.findings.json", "BE-X", "error", List.of("REQ-B"));
        addFinding(findings, "back-end-standards.findings.json", "BE-GLOBAL", "error", List.of());

        // REQ-A 카드는 그 카드에 귀속된 finding 없음 → 통과 (전역 finding은 단일 카드 게이트 제외)
        GateRun ra = runGate(state, findings, "--check", "--requirement", "REQ-A");
        assertThat(ra.exit).as("REQ-A filter excludes both REQ-B finding and global finding").isEqualTo(0);
        assertThat(ra.stdout).contains("gate: pass").contains("filter=REQ-A");

        // REQ-B 카드는 REQ-B 귀속 finding으로 차단
        GateRun rb = runGate(state, findings, "--check", "--requirement", "REQ-B");
        assertThat(rb.exit).as("REQ-B filter blocks on its attributed BE error").isEqualTo(1);
        assertThat(rb.stdout).contains("[BE] errors=1");

        // 전체 게이트는 전역 + REQ-B 양쪽 합산 (errors=2)
        GateRun all = runGate(state, findings, "--check");
        assertThat(all.exit).as("global gate blocks on global + REQ-B").isEqualTo(1);
        assertThat(all.stdout).contains("[BE] errors=2");
    }

    @Test
    @DisplayName("AC8 Gradle 태스크가 trace-requirements.mjs를 호출하고 validateStandardsStrict 의존이 제거되었다")
    @Covers("`validateHarness`/`validateRequirementCard`/`validateRequirementCardBlue` Gradle 태스크는 `trace-requirements.mjs`를 호출하고 `trace-requirements.mjs`는 최종 단계로 `gate.mjs`를 호출한다. Gradle 태스크의 `validateStandardsStrict` 직접 의존은 `validateStandards`로 교체된다")
    void gradleTasksRouteThroughTraceRequirements() throws IOException {
        Path buildGradle = workspaceRoot().resolve(Paths.get("back-end", "build.gradle"));
        String gradle = Files.readString(buildGradle, StandardCharsets.UTF_8);

        for (String task : List.of("validateHarness", "validateRequirementCard", "validateRequirementCardBlue")) {
            String body = extractTaskBody(gradle, task);
            assertThat(body).as("%s commandLine uses trace-requirements.mjs", task).contains("trace-requirements.mjs");
            assertThat(body).as("%s dependsOn validateStandards", task).contains("validateStandards");
            assertThat(body).as("%s no longer dependsOn validateStandardsStrict", task)
                    .doesNotContain("validateStandardsStrict");
        }
    }

    @Test
    @DisplayName("AC9 gate-trace.mjs는 삭제되고 trace-requirements.mjs가 evaluate→render→gate.mjs를 호출한다")
    @Covers("`tools/harness/gate-trace.mjs`는 삭제되고 `tools/harness/trace-requirements.mjs`는 evaluate → render → `gate.mjs`를 직렬 spawn한다")
    void gateTraceRemovedAndTraceRequirementsSpawnsGate() throws IOException {
        Path workspace = workspaceRoot();
        Path gateTrace = workspace.resolve(Paths.get("tools", "harness", "gate-trace.mjs"));
        assertThat(Files.exists(gateTrace)).as("gate-trace.mjs must be removed").isFalse();

        Path traceReq = workspace.resolve(Paths.get("tools", "harness", "trace-requirements.mjs"));
        String body = Files.readString(traceReq, StandardCharsets.UTF_8);
        int idxEvaluate = body.indexOf("evaluate-trace-state.mjs");
        int idxRender = body.indexOf("render-trace-report.mjs");
        int idxGate = body.indexOf("gate.mjs");
        assertThat(idxEvaluate).as("trace-requirements.mjs spawns evaluate-trace-state.mjs").isGreaterThan(-1);
        assertThat(idxRender).as("trace-requirements.mjs spawns render-trace-report.mjs").isGreaterThan(-1);
        assertThat(idxGate).as("trace-requirements.mjs spawns gate.mjs").isGreaterThan(-1);
        assertThat(idxEvaluate).as("spawn order: evaluate < render").isLessThan(idxRender);
        assertThat(idxRender).as("spawn order: render < gate").isLessThan(idxGate);
        assertThat(body).as("no gate-trace.mjs spawn left").doesNotContain("gate-trace.mjs");
    }

    @Test
    @DisplayName("AC10 정책과 출력 계약이 표준/하네스 문서에 반영되어 있다")
    @Covers("본 요건의 정책 변경(terminology strict 차단)과 출력 계약(8개 카테고리 라벨, owner/rule prefix 매핑)이 `docs/standards/terminology.md`, `docs/standards/requirement-card.md`, `AGENTS.md`, `docs/harness/data-contracts.md`에 반영된다")
    void policyAndContractAreReflectedInDocs() throws IOException {
        Path ws = workspaceRoot();
        String terminology = Files.readString(ws.resolve("docs/standards/terminology.md"), StandardCharsets.UTF_8);
        assertThat(terminology).as("terminology.md references gate.mjs / REQ-010 strict 차단 정책")
                .contains("gate.mjs").contains("REQ-010");

        String reqCard = Files.readString(ws.resolve("docs/standards/requirement-card.md"), StandardCharsets.UTF_8);
        assertThat(reqCard).as("requirement-card.md mentions gate.mjs TRM 차단")
                .contains("gate.mjs").contains("TRM");

        String agents = Files.readString(ws.resolve("AGENTS.md"), StandardCharsets.UTF_8);
        assertThat(agents).as("AGENTS.md mentions unified gate / REQ-010")
                .contains("REQ-010").contains("통합 게이트");

        String contracts = Files.readString(ws.resolve("docs/harness/data-contracts.md"), StandardCharsets.UTF_8);
        for (String label : List.of("TRACE", "CARD", "REF", "TRC", "BE", "FE", "SCN", "TRM")) {
            assertThat(contracts).as("data-contracts.md gate section enumerates %s", label).contains(label);
        }
        assertThat(contracts).as("data-contracts.md gate section names gate.mjs and 3-input contract")
                .contains("gate.mjs").contains("trace.state.json").contains("terminology.findings.json");
    }

    // ---------- fixture helpers ----------

    private static Path workspaceRoot() {
        Path cwd = Paths.get("").toAbsolutePath();
        Path parent = cwd.getParent();
        return parent != null ? parent : cwd;
    }

    private record CardEntry(String id, String state) {}

    private static CardEntry card(String id, String state) {
        return new CardEntry(id, state);
    }

    private static ObjectNode stateWith(CardEntry... cards) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-23T00:00:00.000Z");
        root.put("schemaVersion", "1");
        root.put("source", "trace.state");
        root.set("flags", MAPPER.createObjectNode());
        root.set("filter", null);
        ObjectNode summary = MAPPER.createObjectNode();
        int red = 0, green = 0, blue = 0;
        for (CardEntry c : cards) {
            switch (c.state) {
                case "RED" -> red++;
                case "GREEN" -> green++;
                case "BLUE" -> blue++;
            }
        }
        summary.put("total", cards.length);
        summary.put("red", red);
        summary.put("green", green);
        summary.put("blue", blue);
        root.set("summary", summary);
        ArrayNode requirements = MAPPER.createArrayNode();
        for (CardEntry c : cards) {
            ObjectNode req = MAPPER.createObjectNode();
            req.put("id", c.id);
            req.put("state", c.state);
            requirements.add(req);
        }
        root.set("requirements", requirements);
        return root;
    }

    private static Map<String, ObjectNode> allClean() {
        Map<String, ObjectNode> map = new LinkedHashMap<>();
        for (String file : ALL_FINDING_FILES) {
            map.put(file, emptyFindings(file));
        }
        return map;
    }

    private static ObjectNode emptyFindings(String fileName) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("generatedAt", "2026-05-23T00:00:00.000Z");
        root.put("schemaVersion", "1");
        if ("terminology.findings.json".equals(fileName)) {
            root.put("mode", "safe");
            ObjectNode counts = MAPPER.createObjectNode();
            counts.put("error", 0);
            counts.put("warning", 0);
            counts.put("strictError", 0);
            root.set("counts", counts);
        } else {
            root.put("owner", FILE_TO_OWNER.get(fileName));
            ObjectNode summary = MAPPER.createObjectNode();
            summary.put("error", 0);
            summary.put("warning", 0);
            summary.put("info", 0);
            root.set("summary", summary);
        }
        root.set("findings", MAPPER.createArrayNode());
        return root;
    }

    private static void addFinding(Map<String, ObjectNode> findings, String file, String ruleId, String severity, List<String> requirements) {
        ObjectNode finding = MAPPER.createObjectNode();
        finding.put("ruleId", ruleId);
        finding.put("severity", severity);
        finding.put("strictSeverity", severity);
        ArrayNode reqs = MAPPER.createArrayNode();
        for (String r : requirements) reqs.add(r);
        finding.set("requirements", reqs);
        finding.put("message", "fixture finding " + ruleId);
        ((ArrayNode) findings.get(file).get("findings")).add(finding);
    }

    private static void addTrmFinding(Map<String, ObjectNode> findings, String ruleId, String severity, String strictSeverity, List<String> requirements) {
        ObjectNode finding = MAPPER.createObjectNode();
        finding.put("ruleId", ruleId);
        finding.put("severity", severity);
        finding.put("strictSeverity", strictSeverity);
        ArrayNode reqs = MAPPER.createArrayNode();
        for (String r : requirements) reqs.add(r);
        finding.set("requirements", reqs);
        finding.put("kind", ruleId);
        finding.put("message", "fixture TRM finding " + ruleId);
        ((ArrayNode) findings.get("terminology.findings.json").get("findings")).add(finding);
    }

    // ---------- gate.mjs invocation with fixture-on-prod-paths ----------

    private record GateRun(int exit, String stdout) {}

    private static GateRun runGate(ObjectNode state, Map<String, ObjectNode> findings, String... args) throws IOException, InterruptedException {
        return runGateInternal(state, findings, null, args);
    }

    private static GateRun runGateOmittingFile(ObjectNode state, Map<String, ObjectNode> findings, String fileToOmit, String... args) throws IOException, InterruptedException {
        return runGateInternal(state, findings, fileToOmit, args);
    }

    private static GateRun runGateInternal(ObjectNode state, Map<String, ObjectNode> findings, String fileToOmit, String... args) throws IOException, InterruptedException {
        Path ws = workspaceRoot();
        Path stateProd = ws.resolve(Paths.get("build", "harness", "state", "trace.state.json"));
        Path findingsDir = ws.resolve(Paths.get("build", "harness", "findings"));
        Files.createDirectories(stateProd.getParent());
        Files.createDirectories(findingsDir);

        // backup originals
        Path stateBak = Files.createTempFile("state-bak-", ".json");
        boolean hadState = Files.exists(stateProd);
        if (hadState) {
            Files.copy(stateProd, stateBak, StandardCopyOption.REPLACE_EXISTING);
        }
        Map<String, Path> findingsBak = new HashMap<>();
        Map<String, Boolean> findingsExisted = new HashMap<>();
        for (String name : ALL_FINDING_FILES) {
            Path p = findingsDir.resolve(name);
            boolean exists = Files.exists(p);
            findingsExisted.put(name, exists);
            if (exists) {
                Path bak = Files.createTempFile("findings-bak-", ".json");
                Files.copy(p, bak, StandardCopyOption.REPLACE_EXISTING);
                findingsBak.put(name, bak);
            }
        }

        try {
            Files.writeString(stateProd, MAPPER.writeValueAsString(state), StandardCharsets.UTF_8);
            for (String name : ALL_FINDING_FILES) {
                Path p = findingsDir.resolve(name);
                if (name.equals(fileToOmit)) {
                    Files.deleteIfExists(p);
                    continue;
                }
                ObjectNode payload = findings.getOrDefault(name, emptyFindings(name));
                Files.writeString(p, MAPPER.writeValueAsString(payload), StandardCharsets.UTF_8);
            }

            Path script = ws.resolve(Paths.get("tools", "harness", "gate.mjs"));
            assertThat(Files.exists(script)).as("gate.mjs script must exist").isTrue();
            ProcessBuilder pb = new ProcessBuilder();
            List<String> cmd = new java.util.ArrayList<>();
            cmd.add("node");
            cmd.add(script.toString());
            for (String a : args) cmd.add(a);
            pb.command(cmd);
            pb.directory(ws.toFile());
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            String stdout = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = proc.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                proc.destroyForcibly();
                throw new IllegalStateException("gate.mjs timed out after 30s\n" + stdout);
            }
            return new GateRun(proc.exitValue(), stdout);
        } finally {
            // restore
            if (hadState) {
                Files.copy(stateBak, stateProd, StandardCopyOption.REPLACE_EXISTING);
            } else {
                Files.deleteIfExists(stateProd);
            }
            Files.deleteIfExists(stateBak);
            for (String name : ALL_FINDING_FILES) {
                Path p = findingsDir.resolve(name);
                Path bak = findingsBak.get(name);
                if (bak != null) {
                    Files.copy(bak, p, StandardCopyOption.REPLACE_EXISTING);
                    Files.deleteIfExists(bak);
                } else if (!findingsExisted.get(name)) {
                    Files.deleteIfExists(p);
                }
            }
        }
    }

    private static String extractTaskBody(String gradle, String taskName) {
        String marker = "tasks.register('" + taskName + "'";
        int start = gradle.indexOf(marker);
        if (start < 0) {
            throw new IllegalStateException("task not found in build.gradle: " + taskName);
        }
        int depth = 0;
        boolean started = false;
        for (int i = start; i < gradle.length(); i++) {
            char c = gradle.charAt(i);
            if (c == '{') { depth++; started = true; }
            else if (c == '}') {
                depth--;
                if (started && depth == 0) {
                    return gradle.substring(start, i + 1);
                }
            }
        }
        throw new IllegalStateException("unbalanced braces for task: " + taskName);
    }
}
