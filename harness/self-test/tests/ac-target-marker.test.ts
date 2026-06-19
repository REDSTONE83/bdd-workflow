import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { acceptanceCriterionItems } from '../../tools/index-requirements.mjs';
import {
    backupFile,
    findingsDir,
    findingFiles,
    harnessTest,
    indexesDir,
    readJson,
    readText,
    reportsDir,
    restoreFile,
    runNodeTool,
    stateDir,
    withFileBackups,
    workspaceRoot,
    writeJson
} from '../support/harness-test.ts';

function textArray(...values: string[]) {
    return values;
}

function acFixture(text: string, target: string | null) {
    return target === null ? { text, target: null } : { text, target };
}

function requirementsFixture(cardId: string, targetSystem: string, acs: any[]) {
    const card = {
        kind: 'card',
        requirements: [cardId],
        location: {
            file: `docs/requirements/${cardId}-fixture.md`,
            line: 0,
            identity: cardId
        },
        idRaw: cardId,
        id: cardId,
        title: `${cardId} fixture`,
        priority: '중간',
        status: '초안',
        requirementType: targetSystem === 'harness' ? '하네스' : '기능',
        specRole: '원자 요건',
        targetSystem,
        productArea: targetSystem === 'harness' ? 'harness' : 'platform',
        qualityAttributes: textArray('none'),
        verificationLevel: targetSystem === 'harness' ? 'static' : 'acceptance',
        relatedRequirementIds: [],
        replacedByRequirementIds: [],
        approved: false,
        acceptanceCriteria: acs,
        openQuestions: [],
        terms: [],
        sectionPresent: {
            '사용자/목적': true,
            '범위': true,
            '표준 용어': true,
            '제외 범위': true,
            '수용 기준': true,
            '의사결정 로그': true,
            '수용 테스트 리뷰': true,
            '열린 질문': true
        },
        acceptanceTestReviewIncomplete: true,
        acceptanceTestReviewApproved: false,
        bddReviewIncomplete: true,
        bddReviewApproved: false,
        referencedRequirementIds: []
    };
    return {
        generatedAt: '2026-05-26T00:00:00.000Z',
        schemaVersion: '1',
        source: 'requirements.index',
        entries: [card],
        issues: []
    };
}

function fixtureIndexWithInvalidMarker() {
    const root = requirementsFixture('REQ-FIXTURE', 'harness', [{
        text: '(BE) 허용 외 토큰',
        target: null,
        invalidMarker: 'BE'
    }]);
    root.entries[0].location.file = 'docs/requirements/REQ-FIXTURE-invalid.md';
    root.entries[0].title = 'fixture invalid marker';
    return root;
}

function backendIndexFixture(tests: any[]) {
    return {
        generatedAt: '2026-05-26T00:00:00.000Z',
        apis: [],
        tests,
        entities: []
    };
}

function backendTestFixture(identity: string, coversText: string, cardId: string) {
    return {
        requirements: [cardId],
        identity,
        displayName: identity,
        covers: [coversText],
        resultKeys: []
    };
}

function frontEndIndexFixture(tests: any[]) {
    return {
        generatedAt: '2026-05-26T00:00:00.000Z',
        pages: [],
        routes: [],
        stories: [],
        tests,
        issues: [],
        textChannels: []
    };
}

function frontEndTestFixture(identity: string, coversText: string, cardId: string, runtime = 'playwright') {
    return {
        requirements: [cardId],
        identity,
        kind: runtime === 'playwright' ? 'playwright' : undefined,
        runtime,
        displayName: identity,
        covers: [coversText],
        resultKeys: []
    };
}

function testResultsFixture(entries: any[]) {
    return {
        generatedAt: '2026-05-26T00:00:00.000Z',
        entries
    };
}

function testResultEntry(identity: string, status: string, runtime: string) {
    return {
        identity,
        alternateIdentities: [],
        status,
        runtime
    };
}

function findReq(state: any, cardId: string) {
    const req = (state.requirements ?? []).find((entry: any) => entry.id === cardId);
    assert.ok(req, `${cardId} was not present in trace.state.json`);
    return req;
}

function checkTargets(coverageRow: any) {
    return (coverageRow.requiredChecks ?? []).map((check: any) => check.target);
}

function redReasonRules(req: any) {
    return (req.redReasons ?? []).map((reason: any) => reason.ruleId);
}

function emptyCounts() {
    return { error: 0, warning: 0, strictError: 0, byKind: {} };
}

function baseStateWithCard(cardId: string, stateLabel: string) {
    const summary: any = {
        total: 1,
        red: stateLabel === 'RED' ? 1 : 0,
        green: stateLabel === 'GREEN' ? 1 : 0,
        blue: stateLabel === 'BLUE' ? 1 : 0,
        unknownApis: 0,
        unknownTests: 0,
        unknownEntities: 0,
        unknownFeatures: 0,
        unknownFrontEndSurfaces: 0,
        frontEndStandardsErrors: 0,
        frontEndStandardsWarnings: 0,
        scenarioStandardsErrors: 0,
        scenarioStandardsWarnings: 0,
        scenarioWarnings: 0,
        structureIssues: 0,
        frontEndStandardsByRuleId: {},
        scenarioStandardsByRuleId: {},
        scenarioWarningsByKind: {}
    };
    return {
        generatedAt: '2026-05-26T00:00:00.000Z',
        schemaVersion: '1',
        source: 'trace.state',
        flags: {},
        filter: null,
        summary,
        requirements: [{ id: cardId, state: stateLabel }],
        terminology: { present: false, unattributed: [] },
        structureReports: [],
        unknownApis: [],
        unknownTests: [],
        unknownEntities: [],
        unknownFeatures: [],
        unknownFrontEndSurfaces: [],
        scenarioWarnings: [],
        frontEndStandards: { findings: [] },
        scenarioStandards: { findings: [] }
    };
}

function coverageRow(criterion: string, target: string, status: string, checks: Array<[string, string]>) {
    return {
        criterion,
        target,
        status,
        requiredChecks: checks.map(([checkTarget, checkStatus]) => ({ target: checkTarget, status: checkStatus })),
        tests: [],
        scenarios: []
    };
}

function runEvaluateWithFixtures(requirementsIdx: any, backendIdx: any, frontEndIdx: any, testResultsIdx: any) {
    const stateFile = path.join(stateDir, 'trace.state.json');
    const indexNames = [
        'requirements.index.json',
        'backend.source-index.json',
        'harness.self-test.index.json',
        'front-end.source-index.json',
        'test-results.index.json',
        'scenarios.index.json',
        'terminology.index.json',
        'openapi.index.json'
    ];
    const files = [
        stateFile,
        ...indexNames.map((name) => path.join(indexesDir, name)),
        ...findingFiles.map((name) => path.join(findingsDir, name))
    ];

    return withFileBackups(files, () => {
        writeJson(path.join(indexesDir, 'requirements.index.json'), requirementsIdx);
        writeJson(path.join(indexesDir, 'backend.source-index.json'), backendIdx);
        writeJson(path.join(indexesDir, 'front-end.source-index.json'), frontEndIdx);
        writeJson(path.join(indexesDir, 'test-results.index.json'), testResultsIdx);
        for (const name of ['harness.self-test.index.json', 'scenarios.index.json', 'terminology.index.json', 'openapi.index.json']) {
            fs.rmSync(path.join(indexesDir, name), { force: true });
        }
        for (const name of findingFiles) {
            fs.rmSync(path.join(findingsDir, name), { force: true });
        }
        fs.rmSync(stateFile, { force: true });

        const run = runNodeTool('evaluate-trace-state.mjs', ['--quiet']);
        assert.equal(run.status, 0, run.output);
        assert.ok(fs.existsSync(stateFile), 'trace.state.json was not written');
        return readJson(stateFile);
    });
}

harnessTest({
    requirement: 'REQ-012',
    name: 'AC1 카드 파서는 (API)/(UI)/(E2E)/(STATIC) 마커를 인식해 AC에 target을 부여한다',
    covers: ['카드 파서는 수용 기준 bullet 시작에 위치한 `(API)`, `(UI)`, `(E2E)`, `(STATIC)` 마커를 인식해 해당 AC의 target으로 부여한다']
}, () => {
    const parsed = acceptanceCriterionItems([
        '- (API) API marker fixture',
        '- (UI) UI marker fixture',
        '- (E2E) E2E marker fixture',
        '- (STATIC) STATIC marker fixture'
    ].join('\n'));
    const seen = new Map([
        ['API', false],
        ['UI', false],
        ['E2E', false],
        ['STATIC', false]
    ]);
    for (const ac of parsed) {
        if (seen.has(ac.target)) {
            seen.set(ac.target, true);
            assert.equal(ac.text.startsWith(`(${ac.target})`), false);
        }
    }
    for (const [target, present] of seen) {
        assert.equal(present, true, `${target} marker was not seen in requirements.index.json`);
    }
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC2 마커가 없는 AC는 카드 구조 오류로 차단된다',
    covers: ['마커가 없는 AC는 카드 구조 오류로 차단한다']
}, () => {
    const indexFile = path.join(indexesDir, 'requirements.index.json');
    const findingsFile = path.join(findingsDir, 'requirement-cards.findings.json');
    withFileBackups([indexFile, findingsFile], () => {
        writeJson(indexFile, requirementsFixture('REQ-FIXTURE', 'harness', [acFixture('plain AC fixture', null)]));
        runNodeTool('validate-requirement-cards.mjs');
        const findings = readJson(findingsFile).findings ?? [];
        const finding = findings.find((entry: any) => entry.ruleId === 'CARD-AC-MARKER-MISSING');
        assert.ok(finding);
        assert.equal(finding.severity, 'error');
        assert.equal(finding.strictSeverity, 'error');
        assert.equal(finding.evidence.criterion, 'plain AC fixture');
    });
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC3 허용 외 마커는 CARD-AC-MARKER-INVALID로 차단된다',
    covers: ['AC 마커가 `API`, `UI`, `E2E`, `STATIC` 외 값을 가지면 카드 정적 검증이 오류로 차단한다']
}, () => {
    const indexFile = path.join(indexesDir, 'requirements.index.json');
    const findingsFile = path.join(findingsDir, 'requirement-cards.findings.json');
    withFileBackups([indexFile, findingsFile], () => {
        writeJson(indexFile, fixtureIndexWithInvalidMarker());
        runNodeTool('validate-requirement-cards.mjs');
        const findings = readJson(findingsFile).findings ?? [];
        const finding = findings.find((entry: any) => entry.ruleId === 'CARD-AC-MARKER-INVALID');
        assert.ok(finding);
        assert.equal(finding.severity, 'error');
        assert.equal(finding.strictSeverity, 'error');
        assert.equal(finding.evidence.invalidMarker, 'BE');
    });
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC4 마커는 @Covers와 Storybook/live Covers 값에 포함되지 않는다',
    covers: ['AC 마커는 백엔드 `@Covers`, Storybook Vitest `covers`, live Playwright `Covers` 값에 포함되지 않는다']
}, () => {
    for (const indexPath of [
        path.join(indexesDir, 'backend.source-index.json'),
        path.join(indexesDir, 'harness.self-test.index.json'),
        path.join(indexesDir, 'front-end.source-index.json')
    ]) {
        if (!fs.existsSync(indexPath)) continue;
        const index = readJson(indexPath);
        for (const testEntry of index.tests ?? []) {
            for (const cover of testEntry.covers ?? []) {
                const text = typeof cover === 'string' ? cover : cover.text;
                assert.equal(/^\((API|UI|E2E|STATIC)\)\s.*/.test(text), false, `${indexPath}: ${text}`);
            }
        }
    }
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC5 target=API AC는 백엔드 Acceptance Test 커버가 없으면 evaluator가 MISSING + RED를 산출한다',
    covers: ['통합 게이트는 target이 `API`인 AC에 백엔드 Acceptance Test 커버가 없으면 차단한다']
}, () => {
    const reqIdx = requirementsFixture('REQ-FIXTURE', 'application', [acFixture('API AC fixture', 'API')]);
    const missingState = runEvaluateWithFixtures(
        reqIdx,
        backendIndexFixture([]),
        frontEndIndexFixture([]),
        testResultsFixture([])
    );
    const missingReq = findReq(missingState, 'REQ-FIXTURE');
    const missingRow = missingReq.coverage[0];
    assert.equal(missingRow.target, 'API');
    assert.equal(missingRow.status, 'MISSING');
    assert.deepEqual(checkTargets(missingRow), ['api']);
    assert.equal(missingReq.state, 'RED');
    assert.ok(redReasonRules(missingReq).includes('TRACE-AC-MISSING'));

    const passState = runEvaluateWithFixtures(
        reqIdx,
        backendIndexFixture([backendTestFixture('FixtureApiTest.acApi', 'API AC fixture', 'REQ-FIXTURE')]),
        frontEndIndexFixture([]),
        testResultsFixture([testResultEntry('FixtureApiTest.acApi', 'PASS', 'junit')])
    );
    const passRow = findReq(passState, 'REQ-FIXTURE').coverage[0];
    assert.equal(passRow.status, 'PASS');
    assert.deepEqual(checkTargets(passRow), ['api']);
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC6 target=UI AC는 Storybook Vitest 테스트 커버가 없으면 evaluator가 MISSING + RED를 산출한다',
    covers: ['통합 게이트는 target이 `UI`인 AC에 Storybook Vitest 테스트 커버가 없으면 차단한다']
}, () => {
    const reqIdx = requirementsFixture('REQ-FIXTURE', 'application', [acFixture('UI AC fixture', 'UI')]);
    const missingState = runEvaluateWithFixtures(
        reqIdx,
        backendIndexFixture([]),
        frontEndIndexFixture([]),
        testResultsFixture([])
    );
    const missingReq = findReq(missingState, 'REQ-FIXTURE');
    const missingRow = missingReq.coverage[0];
    assert.equal(missingRow.target, 'UI');
    assert.equal(missingRow.status, 'MISSING');
    assert.deepEqual(checkTargets(missingRow), ['ui']);
    assert.equal(missingReq.state, 'RED');
    assert.ok(redReasonRules(missingReq).includes('TRACE-AC-MISSING'));

    const passState = runEvaluateWithFixtures(
        reqIdx,
        backendIndexFixture([]),
        frontEndIndexFixture([frontEndTestFixture('FixtureUiTest > acUi', 'UI AC fixture', 'REQ-FIXTURE', 'storybook-vitest')]),
        testResultsFixture([testResultEntry('FixtureUiTest > acUi', 'PASS', 'storybook-vitest')])
    );
    const passRow = findReq(passState, 'REQ-FIXTURE').coverage[0];
    assert.equal(passRow.status, 'PASS');
    assert.deepEqual(checkTargets(passRow), ['ui']);
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC7 target=E2E AC는 프런트엔드 사용자 여정 테스트 커버가 없으면 evaluator가 MISSING + RED를 산출한다',
    covers: ['통합 게이트는 target이 `E2E`인 AC에 프런트엔드 사용자 여정 테스트 커버가 없으면 차단한다']
}, () => {
    const reqIdx = requirementsFixture('REQ-FIXTURE', 'application', [acFixture('E2E AC fixture', 'E2E')]);
    const missingState = runEvaluateWithFixtures(
        reqIdx,
        backendIndexFixture([]),
        frontEndIndexFixture([]),
        testResultsFixture([])
    );
    const missingReq = findReq(missingState, 'REQ-FIXTURE');
    const missingRow = missingReq.coverage[0];
    assert.equal(missingRow.target, 'E2E');
    assert.equal(missingRow.status, 'MISSING');
    assert.deepEqual(checkTargets(missingRow), ['e2e']);
    assert.equal(missingReq.state, 'RED');

    const passState = runEvaluateWithFixtures(
        reqIdx,
        backendIndexFixture([]),
        frontEndIndexFixture([frontEndTestFixture('FixtureE2eTest > acE2e', 'E2E AC fixture', 'REQ-FIXTURE')]),
        testResultsFixture([testResultEntry('FixtureE2eTest > acE2e', 'PASS', 'playwright')])
    );
    const passRow = findReq(passState, 'REQ-FIXTURE').coverage[0];
    assert.equal(passRow.status, 'PASS');
    assert.deepEqual(checkTargets(passRow), ['e2e']);
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC8 추적 리포트는 AC별 (target) 마커와 검증 상태를 함께 표시한다',
    covers: ['추적 리포트는 각 AC의 target 마커와 검증 상태를 함께 표시한다']
}, () => {
    const state = baseStateWithCard('REQ-X', 'RED');
    const req = state.requirements[0] as any;
    Object.assign(req, {
        title: 'fixture for AC8',
        file: '(fixture)',
        status: '초안',
        targetSystem: 'application',
        apis: [],
        tests: [],
        scenarios: [],
        entities: [],
        frontEnd: { pages: [], routes: [], stories: [] },
        terminology: { findings: [], counts: emptyCounts() },
        coverage: [
            coverageRow('API AC fixture', 'API', 'PASS', [['api', 'PASS']]),
            coverageRow('UI AC fixture', 'UI', 'PASS', [['ui', 'PASS']]),
            coverageRow('E2E AC fixture', 'E2E', 'MISSING', [['e2e', 'MISSING']]),
            coverageRow('STATIC AC fixture', 'STATIC', 'PASS', [['static', 'PASS']])
        ],
        redReasons: []
    });

    const stateFile = path.join(stateDir, 'trace.state.json');
    const backup = backupFile(stateFile);
    try {
        writeJson(stateFile, state);
        runNodeTool('render-trace-report.mjs', ['--quiet']);
        const md = readText(path.join(reportsDir, 'trace-report.md'));
        assert.ok(md.includes('PASS: (API) API AC fixture'));
        assert.ok(md.includes('PASS: (UI) UI AC fixture'));
        assert.ok(md.includes('MISSING: (E2E) E2E AC fixture'));
        assert.ok(md.includes('PASS: (STATIC) STATIC AC fixture'));
    } finally {
        restoreFile(backup);
        if (backup.existed) {
            runNodeTool('render-trace-report.mjs', ['--quiet']);
        }
    }
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC9 표준 문서에 마커 작성 규칙, 유효값, 오류 규칙이 명시된다',
    covers: ['표준 문서에는 마커 작성 규칙, 유효값, 오류 규칙이 명시된다']
}, () => {
    const content = readText(path.join(workspaceRoot, 'harness', 'docs', 'standards', 'requirement-card.md'));
    for (const token of ['`API`', '`UI`', '`E2E`', '`STATIC`', 'CARD-AC-MARKER-MISSING', 'CARD-AC-MARKER-INVALID']) {
        assert.ok(content.includes(token), `${token} was not documented`);
    }
});
