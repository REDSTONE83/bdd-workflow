#!/usr/bin/env node
// Layer 3: 인덱스 + findings로부터 카드 상태(RED/GREEN/BLUE)를 계산해
// build/{app|harness}/state/trace.state.json 으로 출력한다.
//
// 입력:
//   indexes/*.{json}
//   findings/{requirement-cards,cross-artifact}.findings.json
//   (선택) build/{app|harness}/findings/terminology.findings.json
//
// CLI:
//   --requirement=REQ-XXX        단일 카드로 슬라이스 (반복 가능)
//   --requirement-file=path      카드 .md 파일 경로
//   --check                      strict 게이트 동작에 영향(현재는 글로벌 finding 합산 여부만)
//   --require-blue               동일
//   --quiet                      stdout 진단 출력 생략
//
// 출력: build/{app|harness}/state/trace.state.json
//   schemaVersion: '1', source: 'trace.state'
//   model.* (summary, requirements, structureReports, unknown*, scenarioWarnings, terminology, ...)

import fs from 'node:fs';
import path from 'node:path';
import { currentScope, outputRootFor, requirementsDirFor, workspaceRoot } from './workspace-config.mjs';

const scope = currentScope();
const docsRoot = requirementsDirFor();
const outputDir = outputRootFor();
const indexesDir = path.join(outputDir, 'indexes');
const findingsDir = path.join(outputDir, 'findings');
const stateDir = path.join(outputDir, 'state');
const sourceIndexPath = path.join(indexesDir, 'backend.source-index.json');
const harnessSelfTestIndexPath = path.join(indexesDir, 'harness.self-test.index.json');
const frontEndSourceIndexPath = path.join(indexesDir, 'front-end.source-index.json');
const scenarioIndexPath = path.join(indexesDir, 'scenarios.index.json');
const requirementsIndexPath = path.join(indexesDir, 'requirements.index.json');
const testResultsIndexPath = path.join(indexesDir, 'test-results.index.json');
const requirementCardFindingsPath = path.join(findingsDir, 'requirement-cards.findings.json');
const crossArtifactFindingsPath = path.join(findingsDir, 'cross-artifact.findings.json');
const frontEndStandardsFindingsPath = path.join(findingsDir, 'front-end-standards.findings.json');
const scenariosFindingsPath = path.join(findingsDir, 'scenarios.findings.json');
const terminologyReportPath = path.join(findingsDir, 'terminology.findings.json');
const terminologyIndexPath = path.join(indexesDir, 'terminology.index.json');
// canonical trace.state.json 은 항상 전체 trace 로 쓴다. 슬라이스(--requirement)는 추가로
// HARNESS_TRACE_STATE_FILE 격리 파일에 슬라이스 결과를 써서 canonical 을 덮지 않는다.
const canonicalStateFile = path.join(stateDir, 'trace.state.json');
const sliceStateFile = process.env.HARNESS_TRACE_STATE_FILE || null;

const REQUIREMENT_ID_PATTERN = /^REQ-\d{3,}$/;

function parseCliArgs(argv) {
    const requirementIds = new Set();
    const requirementFiles = new Set();
    let checkMode = false;
    let requireBlue = false;
    let quiet = false;
    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        if (arg === '--check') { checkMode = true; i += 1; continue; }
        if (arg === '--require-blue') { requireBlue = true; i += 1; continue; }
        if (arg === '--quiet') { quiet = true; i += 1; continue; }
        if (arg === '--requirement') {
            const value = argv[i + 1];
            if (!value) throw new Error('--requirement requires a value');
            requirementIds.add(value.trim());
            i += 2; continue;
        }
        if (arg.startsWith('--requirement=')) {
            requirementIds.add(arg.slice('--requirement='.length).trim());
            i += 1; continue;
        }
        if (arg === '--requirement-file') {
            const value = argv[i + 1];
            if (!value) throw new Error('--requirement-file requires a value');
            requirementFiles.add(path.resolve(process.cwd(), value));
            i += 2; continue;
        }
        if (arg.startsWith('--requirement-file=')) {
            requirementFiles.add(path.resolve(process.cwd(), arg.slice('--requirement-file='.length)));
            i += 1; continue;
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
    return { requirementIds, requirementFiles, checkMode, requireBlue, quiet };
}

const cli = parseCliArgs(process.argv.slice(2));

function readAllRequirementCards() {
    if (!fs.existsSync(requirementsIndexPath)) {
        throw new Error(
            `Missing requirements index: ${requirementsIndexPath}\n` +
            'Run node harness/tools/index-requirements.mjs first (e.g. via ./gradlew indexRequirements).'
        );
    }
    const payload = JSON.parse(fs.readFileSync(requirementsIndexPath, 'utf8'));
    return (payload.entries ?? []).map((entry) => {
        return {
            id: entry.id ?? '',
            idRaw: entry.idRaw ?? '',
            title: entry.title ?? '',
            priority: entry.priority ?? '',
            status: entry.status ?? '',
            requirementType: entry.requirementType ?? '',
            specRole: entry.specRole ?? '',
            targetSystem: entry.targetSystem ?? '',
            productArea: entry.productArea ?? '',
            qualityAttributes: entry.qualityAttributes ?? [],
            verificationLevel: entry.verificationLevel ?? '',
            parentRequirementIds: entry.parentRequirementIds ?? [],
            relatedRequirementIds: entry.relatedRequirementIds ?? [],
            replacedByRequirementIds: entry.replacedByRequirementIds ?? [],
            approved: Boolean(entry.approved),
            file: entry.location?.file ?? '',
            referencedRequirementIds: entry.referencedRequirementIds ?? [],
            acceptanceCriteria: entry.acceptanceCriteria ?? [],
            openQuestions: entry.openQuestions ?? [],
            terms: entry.terms ?? [],
            verificationTargets: entry.verificationTargets ?? {},
            apiDesign: entry.apiDesign ?? entry.apiSkeleton ?? [],
            dbDesign: entry.dbDesign ?? entry.dbSkeleton ?? [],
            uiDesign: entry.uiDesign ?? entry.uiSkeleton ?? [],
            uiReviewSurfaces: entry.uiReviewSurfaces ?? entry.storybookContract ?? [],
            acceptanceTestReviewIncomplete: Boolean(entry.acceptanceTestReviewIncomplete ?? entry.bddReviewIncomplete),
            acceptanceTestReviewApproved: Boolean(entry.acceptanceTestReviewApproved ?? entry.bddReviewApproved),
            bddReviewIncomplete: Boolean(entry.bddReviewIncomplete),
            bddReviewApproved: Boolean(entry.bddReviewApproved),
            sectionPresent: entry.sectionPresent ?? {}
        };
    });
}

function readRequirementCardFindings() {
    if (!fs.existsSync(requirementCardFindingsPath)) {
        return { present: false, byCard: new Map(), globals: [] };
    }
    let payload;
    try { payload = JSON.parse(fs.readFileSync(requirementCardFindingsPath, 'utf8')); }
    catch (err) {
        return {
            present: false, byCard: new Map(),
            globals: [{ file: requirementCardFindingsPath, message: `requirement-cards.findings.json 파싱 실패: ${err.message}` }]
        };
    }
    const byCard = new Map();
    const globals = [];
    for (const finding of payload.findings ?? []) {
        const cardId = (finding.requirements ?? [])[0];
        if (cardId) {
            if (!byCard.has(cardId)) byCard.set(cardId, []);
            byCard.get(cardId).push(finding);
        } else {
            globals.push(finding);
        }
    }
    return { present: true, byCard, globals };
}

function readCrossArtifactFindings() {
    if (!fs.existsSync(crossArtifactFindingsPath)) return { present: false, byRule: new Map() };
    let payload;
    try { payload = JSON.parse(fs.readFileSync(crossArtifactFindingsPath, 'utf8')); }
    catch { return { present: false, byRule: new Map() }; }
    const byRule = new Map();
    for (const finding of payload.findings ?? []) {
        if (!byRule.has(finding.ruleId)) byRule.set(finding.ruleId, []);
        byRule.get(finding.ruleId).push(finding);
    }
    return { present: true, byRule };
}

function readFrontEndStandardsFindings() {
    if (!fs.existsSync(frontEndStandardsFindingsPath)) return { present: false, findings: [] };
    try {
        const payload = JSON.parse(fs.readFileSync(frontEndStandardsFindingsPath, 'utf8'));
        return { present: true, findings: payload.findings ?? [] };
    } catch {
        return { present: false, findings: [] };
    }
}

function readScenariosFindings() {
    if (!fs.existsSync(scenariosFindingsPath)) return { present: false, findings: [] };
    try {
        const payload = JSON.parse(fs.readFileSync(scenariosFindingsPath, 'utf8'));
        return { present: true, findings: payload.findings ?? [] };
    } catch {
        return { present: false, findings: [] };
    }
}

function readSourceIndex() {
    if (!fs.existsSync(sourceIndexPath)) {
        if (scope === 'harness') {
            return { apis: [], tests: [], entities: [] };
        }
        throw new Error(
            `Missing JavaParser source index: ${sourceIndexPath}\n` +
            'Run npm run app:source-index or npm run app:trace first.'
        );
    }
    const sourceIndex = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));
    return {
        apis: sourceIndex.apis ?? [],
        tests: (sourceIndex.tests ?? []).map((test) => ({ source: 'back-end', ...test })),
        entities: sourceIndex.entities ?? []
    };
}

function readHarnessSelfTestIndex() {
    if (!fs.existsSync(harnessSelfTestIndexPath)) {
        return { present: false, tests: [] };
    }
    const harnessSelfTestIndex = JSON.parse(fs.readFileSync(harnessSelfTestIndexPath, 'utf8'));
    return {
        present: true,
        generatedAt: harnessSelfTestIndex.generatedAt ?? null,
        tests: (harnessSelfTestIndex.tests ?? []).map((test) => ({ source: 'harness', ...test }))
    };
}

function readFrontEndSourceIndex() {
    if (!fs.existsSync(frontEndSourceIndexPath)) {
        return { present: false, pages: [], routes: [], stories: [], tests: [], apiUsages: [], apiCalls: [], issues: [], textChannels: [] };
    }
    const frontEndSourceIndex = JSON.parse(fs.readFileSync(frontEndSourceIndexPath, 'utf8'));
    return {
        present: true,
        generatedAt: frontEndSourceIndex.generatedAt ?? null,
        pages: frontEndSourceIndex.pages ?? [],
        routes: frontEndSourceIndex.routes ?? [],
        stories: frontEndSourceIndex.stories ?? [],
        tests: (frontEndSourceIndex.tests ?? []).map((test) => ({ source: 'front-end', ...test })),
        apiUsages: frontEndSourceIndex.apiUsages ?? [],
        apiCalls: frontEndSourceIndex.apiCalls ?? [],
        issues: frontEndSourceIndex.issues ?? [],
        textChannels: frontEndSourceIndex.textChannels ?? []
    };
}

function readScenarioIndex() {
    if (!fs.existsSync(scenarioIndexPath)) return { present: false, features: [], issues: [] };
    try {
        const data = JSON.parse(fs.readFileSync(scenarioIndexPath, 'utf8'));
        return { present: true, features: data.features ?? [], issues: data.issues ?? [], generatedAt: data.generatedAt ?? null };
    } catch (err) {
        return { present: false, features: [], issues: [{ line: 0, message: `scenarios.index.json 파싱 실패: ${err.message}` }] };
    }
}

function readTerminologyReport() {
    if (!fs.existsSync(terminologyReportPath)) return null;
    try { return JSON.parse(fs.readFileSync(terminologyReportPath, 'utf8')); }
    catch { return null; }
}

function readTerminologyIndex() {
    if (!fs.existsSync(terminologyIndexPath)) return null;
    try {
        const parsed = JSON.parse(fs.readFileSync(terminologyIndexPath, 'utf8'));
        return { terms: parsed.terms ?? {} };
    } catch { return null; }
}

function emptyTerminologyCounts() { return { error: 0, warning: 0, strictError: 0, byKind: {} }; }

function tallyFindings(findings) {
    const counts = emptyTerminologyCounts();
    for (const finding of findings) {
        if (finding.severity === 'error') counts.error++;
        else if (finding.severity === 'warning') counts.warning++;
        if (finding.strictSeverity === 'error') counts.strictError++;
        counts.byKind[finding.kind] = (counts.byKind[finding.kind] || 0) + 1;
    }
    return counts;
}

function bucketTerminologyFindings(report, knownIds) {
    if (!report) {
        return { present: false, perRequirement: new Map(), unattributed: [], totals: emptyTerminologyCounts(), mode: null, generatedAt: null };
    }
    const perRequirement = new Map();
    const unattributed = [];
    for (const finding of report.findings || []) {
        const attributed = (finding.requirements || []).filter((req) => knownIds.has(req));
        if (attributed.length === 0) {
            unattributed.push(finding);
            continue;
        }
        for (const reqId of attributed) {
            if (!perRequirement.has(reqId)) perRequirement.set(reqId, []);
            perRequirement.get(reqId).push(finding);
        }
    }
    return {
        present: true, perRequirement, unattributed,
        totals: tallyFindings(report.findings || []),
        mode: report.mode || null, generatedAt: report.generatedAt || null
    };
}

function readTestResults() {
    if (!fs.existsSync(testResultsIndexPath)) return new Map();
    const payload = JSON.parse(fs.readFileSync(testResultsIndexPath, 'utf8'));
    const results = new Map();
    for (const entry of payload.entries ?? []) {
        const status = entry.status ?? 'NOT_RUN';
        if (entry.identity) results.set(entry.identity, status);
        for (const alt of entry.alternateIdentities ?? []) results.set(alt, status);
    }
    return results;
}

function scenarioCovers(scenario) {
    return (scenario.covers ?? []).map((c) => (typeof c === 'string' ? c : c.text));
}

function combineStatuses(statuses) {
    if (statuses.length === 0) return 'MISSING';
    if (statuses.some((s) => s === 'FAIL')) return 'FAIL';
    if (statuses.some((s) => s === 'SKIP')) return 'SKIP';
    if (statuses.some((s) => s === 'NOT_RUN')) return 'NOT_RUN';
    if (statuses.some((s) => s === 'MISSING')) return 'MISSING';
    return 'PASS';
}

function resultForTest(test, results) {
    const keys = [
        test.identity,
        ...(test.resultKeys ?? []),
        `${test.className}.${test.displayName}`
    ].filter(Boolean);
    for (const key of keys) {
        if (results.has(key)) return results.get(key);
    }
    return 'NOT_RUN';
}

function statusForCriterion(criterion, tests, scenarios, results) {
    const matchingTests = tests.filter((test) => test.covers.includes(criterion));
    const matchingScenarios = scenarios.filter((scenario) => scenarioCovers(scenario).includes(criterion));
    const testStatuses = matchingTests.map((test) => ({ ...test, result: resultForTest(test, results) }));
    const simplifiedScenarios = matchingScenarios.map((scenario) => ({
        title: scenario.title, file: scenario.file, line: scenario.line,
        stepCount: (scenario.steps ?? []).length, covers: scenarioCovers(scenario)
    }));
    const status = combineStatuses(testStatuses.map((t) => t.result));
    return { status, tests: testStatuses, scenarios: simplifiedScenarios };
}

function attachTerminology(requirement, bucket) {
    const findings = bucket.perRequirement.get(requirement.id) || [];
    return { ...requirement, terminology: { findings, counts: tallyFindings(findings) } };
}

function frontEndSurfacesForRequirement(card, frontEndIndex) {
    return {
        pages: (frontEndIndex.pages ?? []).filter((page) => (page.requirements ?? []).includes(card.id)),
        routes: (frontEndIndex.routes ?? []).filter((route) => (route.requirements ?? []).includes(card.id)),
        stories: (frontEndIndex.stories ?? []).filter((story) => (story.requirements ?? []).includes(card.id)),
        apiUsages: (frontEndIndex.apiUsages ?? []).filter((usage) => (usage.requirements ?? []).includes(card.id)),
        apiCalls: (frontEndIndex.apiCalls ?? []).filter((call) => (call.requirements ?? []).includes(card.id))
    };
}

function designSurfacesForRequirement(requirementApis, requirementEntities, frontEndSurfaces) {
    return {
        api: requirementApis.map((api) => ({
            kind: 'api',
            name: api.operationId ?? api.controller ?? api.http ?? '',
            file: api.file ?? '',
            line: api.line ?? 0,
            evidence: api.http ?? null
        })),
        db: requirementEntities.map((entity) => ({
            kind: 'db',
            name: entity.table ?? entity.className ?? '',
            file: entity.file ?? '',
            line: entity.line ?? 0,
            evidence: entity.className ?? null
        })),
        ui: [
            ...(frontEndSurfaces.pages ?? []).map((page) => ({
                kind: 'ui-page',
                name: page.name ?? page.route ?? '',
                file: page.file ?? '',
                line: page.line ?? 0,
                evidence: page.route ?? null
            })),
            ...(frontEndSurfaces.routes ?? []).map((route) => ({
                kind: 'ui-route',
                name: route.component ?? route.path ?? '',
                file: route.file ?? '',
                line: route.line ?? 0,
                evidence: route.path ?? null
            })),
            ...(frontEndSurfaces.stories ?? []).map((story) => ({
                kind: 'ui-story',
                name: [story.title, story.story].filter(Boolean).join(' / '),
                file: story.file ?? '',
                line: story.line ?? 0,
                evidence: story.component ?? null
            }))
        ]
    };
}

const STATUSES_REQUIRING_GENERATED_DESIGN = new Set([
    '설계 승인',
    '테스트 작성중',
    '테스트 승인',
    '구현중',
    '검증중',
    '승인'
]);

function explicitTargetRequired(card, key) {
    return card.verificationTargets?.[key]?.required === true;
}

function acceptanceTargets(card) {
    return new Set((card.acceptanceCriteria ?? [])
        .filter((criterion) => typeof criterion !== 'string')
        .map((criterion) => criterion.target)
        .filter(Boolean));
}

function hasMeaningfulDesignItems(card, key) {
    const values = Array.isArray(card?.[key]) ? card[key] : [];
    return values.some((item) => {
        const text = typeof item === 'string' ? item : item?.raw ?? item?.name ?? '';
        return text && !/^(해당 없음|없음|not required|no)$/i.test(text.trim());
    });
}

function requiredDesignKinds(card) {
    const targets = acceptanceTargets(card);
    const kinds = new Set();
    const targetSystem = card.targetSystem || scope;

    if (targetSystem === 'application' && (explicitTargetRequired(card, 'API') || hasMeaningfulDesignItems(card, 'apiDesign'))) {
        kinds.add('api');
    }
    if (targetSystem === 'application' && (explicitTargetRequired(card, 'DB') || hasMeaningfulDesignItems(card, 'dbDesign'))) {
        kinds.add('db');
    }
    if (targets.has('UI')
        || explicitTargetRequired(card, 'UI')
        || explicitTargetRequired(card, 'Storybook')
        || hasMeaningfulDesignItems(card, 'uiDesign')
        || hasMeaningfulDesignItems(card, 'uiReviewSurfaces')) {
        kinds.add('ui');
    }
    return kinds;
}

function designSurfaceMissingReasons(card, designSurfaces) {
    if (!STATUSES_REQUIRING_GENERATED_DESIGN.has(card.status)) return [];
    const reasons = [];
    const required = requiredDesignKinds(card);
    const labels = {
        api: 'API 설계',
        db: 'DB 설계',
        ui: 'UI 설계'
    };
    for (const kind of required) {
        if ((designSurfaces[kind] ?? []).length > 0) continue;
        if (kind === 'api' && (designSurfaces.db ?? []).length > 0) continue;
        reasons.push(traceReason(
            `TRACE-DESIGN-${kind.toUpperCase()}-MISSING`,
            `${card.status} 상태이지만 생성된 ${labels[kind]} 표면이 없음`,
            { requirementId: card.id, status: card.status, designKind: kind }
        ));
    }
    return reasons;
}

function effectiveCoveragePolicy(acTarget) {
    switch (acTarget) {
        case 'API': return 'API';
        case 'UI': return 'UI';
        case 'E2E': return 'E2E';
        case 'STATIC': return 'STATIC';
        default: return 'UNKNOWN';
    }
}

function targetCoverageForCriterion(criterion, requirementTests, requirementScenarios, results, acTarget) {
    const backEndTests = requirementTests.filter((t) => t.source !== 'front-end');
    const frontEndTests = requirementTests.filter((t) => t.source === 'front-end');
    const storybookVitestTests = frontEndTests.filter((t) => t.runtime === 'storybook-vitest');
    const policy = effectiveCoveragePolicy(acTarget);
    if (policy === 'API') {
        const cov = statusForCriterion(criterion, backEndTests, requirementScenarios, results);
        return { ...cov, requiredChecks: [{ target: 'api', status: cov.status }] };
    }
    if (policy === 'UI') {
        const cov = statusForCriterion(criterion, storybookVitestTests, requirementScenarios, results);
        return { ...cov, requiredChecks: [{ target: 'ui', status: cov.status }] };
    }
    if (policy === 'E2E') {
        const cov = statusForCriterion(criterion, frontEndTests, requirementScenarios, results);
        return { ...cov, requiredChecks: [{ target: 'e2e', status: cov.status }] };
    }
    if (policy === 'STATIC') {
        const cov = statusForCriterion(criterion, requirementTests, requirementScenarios, results);
        return { ...cov, requiredChecks: [{ target: 'static', status: cov.status }] };
    }
    const cov = statusForCriterion(criterion, [], requirementScenarios, results);
    return { ...cov, requiredChecks: [{ target: 'unknown', status: cov.status }] };
}

function traceReason(ruleId, message, evidence = {}) {
    return { ruleId, message, evidence };
}

function blueBlockersFor(card) {
    const blueBlockedBy = [];
    if (!card.approved) blueBlockedBy.push(`요건 카드 상태가 승인 아님: ${card.status || '미기재'}`);
    if (card.openQuestions.length > 0) blueBlockedBy.push('열린 질문 남음');
    return blueBlockedBy;
}

function evaluateRequirement(card, apis, tests, scenarios, entities, results, frontEndIndex) {
    const requirementApis = apis.filter((api) => api.requirements.includes(card.id));
    const requirementTests = tests.filter((test) => test.requirements.includes(card.id));
    const requirementScenarios = scenarios.filter((scenario) => (scenario.requirementIds ?? []).includes(card.id));
    const requirementEntities = entities
        .map((entity) => ({ ...entity, columns: entity.columns.filter((column) => column.requirements.includes(card.id)) }))
        .filter((entity) => entity.requirements.includes(card.id) || entity.columns.length > 0);
    const frontEndSurfaces = frontEndSurfacesForRequirement(card, frontEndIndex);
    const designSurfaces = designSurfacesForRequirement(requirementApis, requirementEntities, frontEndSurfaces);
    const coverage = card.acceptanceCriteria.map((criterion) => {
        const text = typeof criterion === 'string' ? criterion : criterion.text;
        const target = typeof criterion === 'string' ? null : (criterion.target ?? null);
        return {
            criterion: text,
            target,
            line: typeof criterion === 'string' ? 0 : (criterion.line ?? 0),
            ...targetCoverageForCriterion(text, requirementTests, requirementScenarios, results, target)
        };
    });

    if (['대체됨', '폐기'].includes(card.status)) {
        return { ...card, state: 'INACTIVE', redReasons: [], blueBlockedBy: [],
            apis: requirementApis, tests: requirementTests, scenarios: requirementScenarios,
            entities: requirementEntities, frontEnd: frontEndSurfaces, designSurfaces, coverage };
    }

    const redReasons = [];
    redReasons.push(...designSurfaceMissingReasons(card, designSurfaces));
    if (card.acceptanceCriteria.length === 0) {
        redReasons.push(traceReason('TRACE-AC-EMPTY', '수용 기준 없음', { requirementId: card.id }));
    }
    for (const row of coverage) {
        if (row.status === 'PASS') continue;
        const ruleId = row.status === 'MISSING' ? 'TRACE-AC-MISSING' : 'TRACE-AC-FAIL';
        redReasons.push(traceReason(ruleId, `${row.criterion}: ${row.status}`,
            { criterion: row.criterion, status: row.status, requiredChecks: row.requiredChecks ?? [] }));
    }

    const blueBlockedBy = blueBlockersFor(card);
    if (redReasons.length > 0) {
        return { ...card, state: 'RED', redReasons, apis: requirementApis, tests: requirementTests,
            scenarios: requirementScenarios, entities: requirementEntities, frontEnd: frontEndSurfaces, designSurfaces, coverage, blueBlockedBy };
    }
    return {
        ...card, state: blueBlockedBy.length === 0 ? 'BLUE' : 'GREEN',
        redReasons, blueBlockedBy,
        apis: requirementApis, tests: requirementTests, scenarios: requirementScenarios,
        entities: requirementEntities, frontEnd: frontEndSurfaces, designSurfaces, coverage
    };
}

function flattenScenarios(scenarioIndex) {
    return (scenarioIndex.features ?? []).flatMap((feature) =>
        (feature.scenarios ?? []).map((scenario) => ({
            ...scenario, file: feature.file, featureTitle: feature.title,
            featureTags: feature.tags ?? [], requirementIds: feature.requirementIds ?? []
        }))
    );
}

function attachRequirementHierarchy(cards) {
    const childrenByParent = new Map();
    for (const card of cards) {
        for (const parentId of card.parentRequirementIds ?? []) {
            if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
            childrenByParent.get(parentId).push(card.id);
        }
    }
    for (const childIds of childrenByParent.values()) {
        childIds.sort((a, b) => a.localeCompare(b));
    }
    return cards.map((card) => ({
        ...card,
        parentRequirementIds: card.parentRequirementIds ?? [],
        childRequirementIds: childrenByParent.get(card.id) ?? []
    }));
}

function buildModel(allCards, cards, apis, tests, entities, results, terminologyReport, scenarioIndex, frontEndIndex, selectedIds, flags) {
    const cardsWithHierarchy = attachRequirementHierarchy(cards);
    const knownRequirementIds = new Set(cardsWithHierarchy.map((card) => card.id));
    const terminologyBucket = bucketTerminologyFindings(terminologyReport, knownRequirementIds);
    const scenarios = flattenScenarios(scenarioIndex);
    const isSelected = (id) => !selectedIds || selectedIds.has(id);
    const allRequirements = cardsWithHierarchy
        .map((card) => evaluateRequirement(card, apis, tests, scenarios, entities, results, frontEndIndex))
        .map((req) => attachTerminology(req, terminologyBucket));
    const requirements = allRequirements.filter((req) => isSelected(req.id));
    const intersectsSelection = (refs) => !selectedIds || refs.some((ref) => selectedIds.has(ref));

    const crossArtifact = readCrossArtifactFindings();
    const filterByRule = (ruleId) => (crossArtifact.byRule.get(ruleId) ?? [])
        .filter((finding) => intersectsSelection(finding.requirements ?? []));
    const unknownApis = filterByRule('REF-API');
    const unknownTests = filterByRule('REF-TEST');
    const unknownEntities = filterByRule('REF-ENTITY');
    const unknownFeatures = filterByRule('REF-FEATURE');
    const unknownFrontEndSurfaces = filterByRule('REF-FE-SURFACE');

    // FE 정적 검사 결과는 validate-front-end-standards가 만든 finding을 단일 소스로 본다.
    // frontEndIndex.issues[]는 collector 진단 raw 데이터이며 trace는 더 이상 직접 소비하지 않는다.
    const frontEndStandards = readFrontEndStandardsFindings();
    const frontEndStandardsFindings = (frontEndStandards.findings ?? []).filter((finding) => {
        const refs = finding.requirements ?? [];
        if (refs.length === 0) return !selectedIds;
        return intersectsSelection(refs);
    });
    const frontEndStandardsSummary = frontEndStandardsFindings.reduce((acc, finding) => {
        const sev = finding.severity ?? 'warning';
        acc[sev] = (acc[sev] ?? 0) + 1;
        acc.byRuleId[finding.ruleId] = (acc.byRuleId[finding.ruleId] ?? 0) + 1;
        return acc;
    }, { error: 0, warning: 0, info: 0, byRuleId: {} });

    // SCN-* findings 정합: FE-* 패턴과 동일하게 requirements[] 유무로 단일 카드 필터.
    const scenarioStandards = readScenariosFindings();
    const scenarioStandardsFindings = (scenarioStandards.findings ?? []).filter((finding) => {
        const refs = finding.requirements ?? [];
        if (refs.length === 0) return !selectedIds;
        return intersectsSelection(refs);
    });
    const scenarioStandardsSummary = scenarioStandardsFindings.reduce((acc, finding) => {
        const sev = finding.severity ?? 'warning';
        acc[sev] = (acc[sev] ?? 0) + 1;
        acc.byRuleId[finding.ruleId] = (acc.byRuleId[finding.ruleId] ?? 0) + 1;
        return acc;
    }, { error: 0, warning: 0, info: 0, byRuleId: {} });
    // REQ-009: scenario index의 raw issues[]는 더 이상 trace에서 직접 소비하지 않는다.
    // Layer 2 validator(validate-scenarios.mjs)가 SCN-* finding으로 정규화한 결과만 본다.

    const candidateCards = selectedIds ? allCards.filter((card) => selectedIds.has(card.id)) : allCards;
    const cardFindings = readRequirementCardFindings();
    const refCardFindings = (crossArtifact.byRule.get('REF-CARD') ?? []);
    const refCardByCardId = new Map();
    for (const finding of refCardFindings) {
        const cardId = (finding.requirements ?? [])[0];
        if (!cardId) continue;
        if (!refCardByCardId.has(cardId)) refCardByCardId.set(cardId, []);
        refCardByCardId.get(cardId).push(finding);
    }
    const structureReports = candidateCards.map((card) => {
        const cardFindingMessages = (cardFindings.byCard.get(card.id) ?? []).map((f) => f.message);
        const refCardMessages = (refCardByCardId.get(card.id) ?? []).map((f) => f.message);
        return {
            file: card.file,
            id: card.id || card.idRaw || '(no id)',
            title: card.title,
            issues: [...cardFindingMessages, ...refCardMessages]
        };
    });
    if (!selectedIds && (flags.checkMode || flags.requireBlue)) {
        for (const finding of cardFindings.globals) {
            structureReports.unshift({
                file: finding.location?.file ?? requirementCardFindingsPath,
                id: finding.location?.identity ?? '(global)',
                title: finding.ruleId,
                issues: [finding.message]
            });
        }
    }
    const structureIssueCount = structureReports.reduce((sum, report) => sum + report.issues.length, 0);

    const scenarioWarningRules = ['TRC-COV-01', 'TRC-COV-02'];
    const scenarioWarnings = scenarioWarningRules
        .flatMap((ruleId) => crossArtifact.byRule.get(ruleId) ?? [])
        .filter((finding) => intersectsSelection(finding.requirements ?? []));
    const scenarioWarningsByKind = scenarioWarnings.reduce((acc, warning) => {
        const kind = warning.evidence?.legacyKind ?? warning.ruleId;
        acc[kind] = (acc[kind] ?? 0) + 1;
        return acc;
    }, {});

    const summary = {
        total: requirements.length,
        red: requirements.filter((r) => r.state === 'RED').length,
        green: requirements.filter((r) => r.state === 'GREEN').length,
        blue: requirements.filter((r) => r.state === 'BLUE').length,
        inactive: requirements.filter((r) => r.state === 'INACTIVE').length,
        unknownApis: unknownApis.length,
        unknownTests: unknownTests.length,
        unknownEntities: unknownEntities.length,
        unknownFeatures: unknownFeatures.length,
        unknownFrontEndSurfaces: unknownFrontEndSurfaces.length,
        frontEndStandardsErrors: frontEndStandardsSummary.error,
        frontEndStandardsWarnings: frontEndStandardsSummary.warning,
        frontEndStandardsByRuleId: frontEndStandardsSummary.byRuleId,
        scenarioStandardsErrors: scenarioStandardsSummary.error,
        scenarioStandardsWarnings: scenarioStandardsSummary.warning,
        scenarioStandardsByRuleId: scenarioStandardsSummary.byRuleId,
        scenarioWarnings: scenarioWarnings.length,
        scenarioWarningsByKind,
        structureIssues: structureIssueCount
    };

    return {
        filter: selectedIds ? [...selectedIds].sort() : null,
        summary,
        knownRequirementIds: [...knownRequirementIds],
        requirements,
        structureReports,
        unknownApis, unknownTests, unknownEntities, unknownFeatures, unknownFrontEndSurfaces,
        frontEndStandards: {
            present: frontEndStandards.present,
            findings: frontEndStandardsFindings,
            summary: frontEndStandardsSummary
        },
        scenarioStandards: {
            present: scenarioStandards.present,
            findings: scenarioStandardsFindings,
            summary: scenarioStandardsSummary
        },
        frontEndIndex: {
            present: frontEndIndex.present !== false,
            generatedAt: frontEndIndex.generatedAt ?? null
        },
        scenarioIndex: {
            present: scenarioIndex.present !== false,
            generatedAt: scenarioIndex.generatedAt ?? null
        },
        scenarioWarnings,
        terminology: {
            present: terminologyBucket.present,
            mode: terminologyBucket.mode,
            generatedAt: terminologyBucket.generatedAt,
            totals: terminologyBucket.totals,
            unattributed: terminologyBucket.unattributed
        }
    };
}

function resolveSelectedIds(cli, allCards) {
    if (cli.requirementIds.size === 0 && cli.requirementFiles.size === 0) return null;
    const selected = new Set();
    const errors = [];
    for (const reqId of cli.requirementIds) {
        if (!REQUIREMENT_ID_PATTERN.test(reqId)) { errors.push(`--requirement 값이 REQ-NNN 형식 아님: "${reqId}"`); continue; }
        const match = allCards.find((card) => card.id === reqId);
        if (!match) { errors.push(`--requirement ${reqId}: ${path.relative(workspaceRoot, docsRoot)}에서 카드를 찾을 수 없음`); continue; }
        selected.add(reqId);
    }
    for (const reqFile of cli.requirementFiles) {
        if (!fs.existsSync(reqFile)) { errors.push(`--requirement-file 경로가 존재하지 않음: ${reqFile}`); continue; }
        const resolvedFile = fs.realpathSync(reqFile);
        const match = allCards.find((card) => {
            const cardFile = path.isAbsolute(card.file) ? card.file : path.join(workspaceRoot, card.file);
            return fs.existsSync(cardFile) && fs.realpathSync(cardFile) === resolvedFile;
        });
        if (!match) { errors.push(`--requirement-file: ${path.relative(workspaceRoot, reqFile)}에 일치하는 카드 없음`); continue; }
        if (!match.id) { errors.push(`--requirement-file: ${path.relative(workspaceRoot, reqFile)} 카드에 유효한 요건 ID 없음`); continue; }
        selected.add(match.id);
    }
    if (errors.length > 0) {
        for (const err of errors) console.error(`error: ${err}`);
        process.exit(2);
    }
    return selected;
}

function main() {
    const allCardsRaw = readAllRequirementCards();
    const cards = allCardsRaw.filter((card) => card.id);
    const sourceIndex = readSourceIndex();
    const frontEndIndex = readFrontEndSourceIndex();
    const harnessSelfTestIndex = readHarnessSelfTestIndex();
    const apis = sourceIndex.apis;
    const tests = [...sourceIndex.tests, ...harnessSelfTestIndex.tests, ...frontEndIndex.tests];
    const entities = sourceIndex.entities;
    const results = readTestResults();
    const terminologyReport = readTerminologyReport();
    // terminology index 자체는 trace state 계산에 직접 쓰이지 않는다(검사는 Layer 2가 끝났음).
    readTerminologyIndex();
    const scenarioIndex = readScenarioIndex();
    const selectedIds = resolveSelectedIds(cli, allCardsRaw);
    const flags = { checkMode: cli.checkMode, requireBlue: cli.requireBlue };
    const evaluate = (selection) => buildModel(allCardsRaw, cards, apis, tests, entities, results, terminologyReport, scenarioIndex, frontEndIndex, selection, flags);
    const writePayload = (file, model) => {
        const payload = { generatedAt: new Date().toISOString(), schemaVersion: '1', source: 'trace.state', flags, ...model };
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
    };

    // canonical 은 항상 전체 trace. 슬라이스가 UI 보드/게이트 같은 전체 소비자를 좁히지 않게 한다.
    const fullModel = evaluate(null);
    writePayload(canonicalStateFile, fullModel);

    // 슬라이스면 격리 파일에 슬라이스 결과를 추가로 쓴다. render/gate 가 이 파일을 읽는다.
    let consoleModel = fullModel;
    if (selectedIds && sliceStateFile && path.resolve(sliceStateFile) !== path.resolve(canonicalStateFile)) {
        const sliceModel = evaluate(selectedIds);
        writePayload(sliceStateFile, sliceModel);
        consoleModel = sliceModel;
    }

    const s = consoleModel.summary;
    const filterStr = consoleModel.filter ? ` filter=${consoleModel.filter.join(',')}` : '';
    if (!cli.quiet) {
        console.log(`trace.state.json: total=${s.total} red=${s.red} green=${s.green} blue=${s.blue} structureIssues=${s.structureIssues}${filterStr}`);
    }
}

main();
