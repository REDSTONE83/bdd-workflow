import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { acceptanceTestReviewResultSummary } from '../../tools/index-requirements.mjs';
import {
    addFinding,
    addTerminologyFinding,
    allCleanFindings,
    harnessTest,
    readText,
    runCommand,
    runGateFixture,
    stateWithCards,
    tempDir,
    writeJson,
    workspaceRoot
} from '../support/harness-test.ts';

const REQUIRED_CARD_SECTIONS = [
    '사용자/목적',
    '범위',
    '표준 용어',
    '제외 범위',
    '수용 기준',
    '의사결정 로그',
    '수용 테스트 리뷰',
    '열린 질문'
];

function sectionPresence() {
    return Object.fromEntries(REQUIRED_CARD_SECTIONS.map((section) => [section, true]));
}

function requirementCardFixture(overrides: Record<string, any> = {}) {
    const id = overrides.id ?? 'REQ-900';
    return {
        id,
        idRaw: id,
        title: 'fixture requirement',
        priority: '중간',
        status: '초안',
        requirementType: '하네스',
        specRole: '원자 요건',
        targetSystem: 'harness',
        productArea: 'harness',
        qualityAttributes: ['usability'],
        verificationLevel: 'static',
        relatedRequirementIds: [],
        replacedByRequirementIds: [],
        acceptanceCriteria: [{ text: 'fixture AC', target: 'STATIC' }],
        terms: [],
        openQuestions: [],
        approved: false,
        acceptanceTestReviewIncomplete: false,
        acceptanceTestReviewApproved: false,
        bddReviewIncomplete: false,
        bddReviewApproved: false,
        sectionPresent: sectionPresence(),
        referencedRequirementIds: [id],
        location: {
            file: `harness/docs/requirements/${id}-fixture.md`,
            line: 1,
            identity: id
        },
        ...overrides
    };
}

function runRequirementCardValidatorFixture(cards: any[]) {
    const dir = tempDir('stage-aware-card-');
    const requirementsIndex = path.join(dir, 'requirements.index.json');
    const terminologyIndex = path.join(dir, 'terminology.index.json');
    const out = path.join(dir, 'requirement-cards.findings.json');

    writeJson(requirementsIndex, { entries: cards });
    writeJson(terminologyIndex, { terms: {} });

    runCommand(process.execPath, [
        path.join(workspaceRoot, 'harness', 'tools', 'validate-requirement-cards.mjs'),
        `--requirements-index=${requirementsIndex}`,
        `--terminology-index=${terminologyIndex}`,
        `--out=${out}`
    ], { cwd: workspaceRoot });

    return JSON.parse(fs.readFileSync(out, 'utf8'));
}

function redReason(ruleId: string, status: string) {
    return [{ ruleId, evidence: { status } }];
}

harnessTest({
    requirement: 'REQ-010',
    name: 'AC1 gate.mjs는 3종 입력을 모두 읽어 단일 결과를 만든다',
    covers: ['`harness/tools/gate.mjs`는 `build/harness/state/trace.state.json`, `build/harness/findings/*.findings.json`, `build/harness/findings/terminology.findings.json`을 읽어 단일 게이트 결과(exit code + 카테고리별 요약)를 만든다']
}, () => {
    const state = stateWithCards([{ id: 'REQ-001', state: 'BLUE' }]);
    const findings = allCleanFindings();

    const ok = runGateFixture(state, findings, ['--check']);
    assert.equal(ok.status, 0);
    assert.ok(ok.output.includes('gate: pass'));

    const missing = runGateFixture(state, findings, ['--check'], { omitFile: 'back-end-standards.findings.json' });
    assert.equal(missing.status, 2);
    assert.ok(missing.output.includes('back-end-standards.findings.json'));
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC2 실패 사유가 8개 카테고리 라벨로 분리된다',
    covers: ['`gate.mjs`는 실패 사유를 `TRACE`/`CARD`/`REF`/`TRC`/`BE`/`FE`/`SCN`/`TRM` 카테고리 라벨로 분리해서 보고한다']
}, () => {
    const state = stateWithCards([{ id: 'REQ-001', state: 'RED' }]);
    const findings = allCleanFindings();
    addFinding(findings, 'requirement-cards.findings.json', 'CARD-X', 'error', ['REQ-001']);
    addFinding(findings, 'cross-artifact.findings.json', 'REF-API', 'error', ['REQ-001']);
    addFinding(findings, 'cross-artifact.findings.json', 'TRC-X', 'error', ['REQ-001']);
    addFinding(findings, 'back-end-standards.findings.json', 'BE-X', 'error', ['REQ-001']);
    addFinding(findings, 'front-end-standards.findings.json', 'FE-X', 'error', ['REQ-001']);
    addFinding(findings, 'scenarios.findings.json', 'SCN-X', 'error', ['REQ-001']);
    addTerminologyFinding(findings, 'DRAFT_TERM', 'warning', 'error', ['REQ-001']);

    const run = runGateFixture(state, findings, ['--check']);

    assert.equal(run.status, 1);
    for (const label of ['[TRACE]', '[CARD]', '[REF]', '[TRC]', '[BE]', '[FE]', '[SCN]', '[TRM]']) {
        assert.ok(run.output.includes(label), `${label} was not present in gate output:\n${run.output}`);
    }
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC3 BE-* error finding이 BE 카테고리로 차단된다',
    covers: ['`gate.mjs --check`는 `back-end-standards.findings.json`에 `severity: error` finding이 있으면 BE 카테고리 실패로 차단한다']
}, () => {
    const state = stateWithCards([{ id: 'REQ-001', state: 'BLUE' }]);
    const findings = allCleanFindings();
    addFinding(findings, 'back-end-standards.findings.json', 'BE-PKG-LAYER', 'error', ['REQ-001']);

    const run = runGateFixture(state, findings, ['--check']);

    assert.equal(run.status, 1);
    assert.ok(run.output.includes('[BE] errors=1'));
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC4 TRM strictSeverity=error finding이 TRM 카테고리로 차단된다',
    covers: ['`gate.mjs --check`는 `terminology.findings.json`에 `strictSeverity: error` finding이 있으면 TRM 카테고리 실패로 차단한다']
}, () => {
    const state = stateWithCards([{ id: 'REQ-001', state: 'BLUE' }]);
    const findings = allCleanFindings();
    addTerminologyFinding(findings, 'DRAFT_TERM', 'warning', 'error', ['REQ-001']);

    const run = runGateFixture(state, findings, ['--check']);

    assert.equal(run.status, 1);
    assert.ok(run.output.includes('[TRM] errors=1'));
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC5 RED/CARD/REF/FE/SCN/TRC error finding이 각 카테고리로 차단된다',
    covers: ['`gate.mjs --check`는 RED 카드, 카드 구조 위반(CARD-*), REF-* unknown reference, FE-* error, SCN-* error, TRC-* error finding이 있으면 각 카테고리 실패로 차단한다']
}, () => {
    const stateRed = stateWithCards([{ id: 'REQ-001', state: 'RED' }]);
    const redRun = runGateFixture(stateRed, allCleanFindings(), ['--check']);
    assert.equal(redRun.status, 1);
    assert.ok(redRun.output.includes('[TRACE]'));
    assert.ok(redRun.output.includes('red=1'));

    const stateBlue = stateWithCards([{ id: 'REQ-001', state: 'BLUE' }]);
    for (const [file, ruleId, label] of [
        ['requirement-cards.findings.json', 'CARD-OPEN-QUESTION', '[CARD] errors=1'],
        ['cross-artifact.findings.json', 'REF-API', '[REF] errors=1'],
        ['cross-artifact.findings.json', 'TRC-X', '[TRC] errors=1'],
        ['front-end-standards.findings.json', 'FE-API-CONTRACT-MISSING', '[FE] errors=1'],
        ['scenarios.findings.json', 'SCN-REQ-TAG-MISSING', '[SCN] errors=1']
    ] as Array<[string, string, string]>) {
        const findings = allCleanFindings();
        addFinding(findings, file, ruleId, 'error', ['REQ-001']);
        const run = runGateFixture(stateBlue, findings, ['--check']);
        assert.equal(run.status, 1);
        assert.ok(run.output.includes(label), `${label} was not present in gate output:\n${run.output}`);
    }
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC6 --require-blue는 GREEN 카드도 TRACE 카테고리로 차단한다',
    covers: ['`gate.mjs --require-blue`는 `--check` 조건에 더해 GREEN 카드가 있으면 TRACE 카테고리 실패로 차단한다']
}, () => {
    const state = stateWithCards([{ id: 'REQ-001', state: 'GREEN' }]);
    const findings = allCleanFindings();

    const checkOnly = runGateFixture(state, findings, ['--check']);
    assert.equal(checkOnly.status, 0);

    const requireBlue = runGateFixture(state, findings, ['--check', '--require-blue']);
    assert.equal(requireBlue.status, 1);
    assert.ok(requireBlue.output.includes('[TRACE]'));
    assert.ok(requireBlue.output.includes('green=1'));
});

harnessTest({
    requirement: 'REQ-028',
    name: '요건 카드 상태 enum은 설계 중심 요건 검증 상태를 허용한다',
    covers: ['요건 카드 상태는 `초안`, `설계 검토중`, `설계 승인`, `테스트 작성중`, `테스트 승인`, `구현중`, `검증중`, `승인`, `대체됨`을 지원한다']
}, () => {
    const statuses = [
        '초안',
        '설계 검토중',
        '설계 승인',
        '테스트 작성중',
        '테스트 승인',
        '구현중',
        '검증중',
        '승인',
        '대체됨'
    ];
    const cards = statuses.map((status, index) => {
        const id = `REQ-${900 + index}`;
        return requirementCardFixture({
            id,
            status,
            replacedByRequirementIds: status === '대체됨' ? ['REQ-900'] : [],
            verificationTargets: { STATIC: { required: true, raw: '필요' } }
        });
    });

    const payload = runRequirementCardValidatorFixture(cards);

    assert.equal(payload.findings.length, 0, JSON.stringify(payload.findings, null, 2));
});

harnessTest({
    requirement: 'REQ-028',
    name: '설계 승인 이후 생성 설계 표면 누락을 TRACE 실패로 차단한다',
    covers: ['`설계 승인` 이후 단계의 요건은 필요한 API/DB/UI 설계 표면이 소스 기반 추출 결과에 있어야 한다']
}, () => {
    const reviewing = runGateFixture(stateWithCards([{
        id: 'REQ-028',
        state: 'RED',
        status: '설계 검토중',
        redReasons: [{ ruleId: 'TRACE-DESIGN-UI-MISSING', evidence: { designKind: 'ui' } }]
    }]), allCleanFindings(), ['--check']);
    assert.equal(reviewing.status, 0);
    assert.ok(reviewing.output.includes('gate: pass'));

    const missing = runGateFixture(stateWithCards([{
        id: 'REQ-028',
        state: 'RED',
        status: '설계 승인',
        redReasons: [{ ruleId: 'TRACE-DESIGN-UI-MISSING', evidence: { designKind: 'ui' } }]
    }]), allCleanFindings(), ['--check']);
    assert.equal(missing.status, 1);
    assert.ok(missing.output.includes('[TRACE]'));
    assert.ok(missing.output.includes('red=1'));

    const minimalCard = runRequirementCardValidatorFixture([
        requirementCardFixture({
            status: '설계 승인',
            sectionPresent: sectionPresence()
        })
    ]);
    assert.equal(minimalCard.findings.length, 0, JSON.stringify(minimalCard.findings, null, 2));
});

harnessTest({
    requirement: 'REQ-028',
    name: '승인 수용 테스트 리뷰 상태는 최신 결과 라인 기준으로 판정한다',
    covers: ['승인 카드의 수용 테스트 리뷰 검사는 자유 텍스트가 아니라 최신 `결과:` 라인을 기준으로 `승인` 또는 `미완료` 상태를 판정한다']
}, () => {
    const approvedSummary = acceptanceTestReviewResultSummary([
        '### 요건 설계 승인 이력',
        '- 승인일: 2026-06-08',
        '  확인: 할 일을 미완료로 되돌리는 도메인 문장은 리뷰 상태가 아니다.',
        '  Skeleton 결과: 미완료',
        '### 테스트 리뷰',
        '- 리뷰일: 2026-06-08',
        '  결과: 승인'
    ].join('\n'));
    const approved = runRequirementCardValidatorFixture([
        requirementCardFixture({
            status: '승인',
            approved: true,
            acceptanceTestReviewResult: approvedSummary.latest,
            acceptanceTestReviewIncomplete: approvedSummary.incomplete,
            acceptanceTestReviewApproved: approvedSummary.approved
        })
    ]);
    assert.equal(approved.findings.length, 0, JSON.stringify(approved.findings, null, 2));

    const incompleteSummary = acceptanceTestReviewResultSummary([
        '- 리뷰일: 2026-06-07',
        '  결과: 승인',
        '- 리뷰일: 2026-06-08',
        '  결과: 미완료'
    ].join('\n'));
    const incomplete = runRequirementCardValidatorFixture([
        requirementCardFixture({
            status: '승인',
            approved: true,
            acceptanceTestReviewResult: incompleteSummary.latest,
            acceptanceTestReviewIncomplete: incompleteSummary.incomplete,
            acceptanceTestReviewApproved: incompleteSummary.approved
        })
    ]);
    const ruleIds = incomplete.findings.map((finding: { ruleId: string }) => finding.ruleId);
    assert.ok(ruleIds.includes('CARD-APPROVAL-BDD-INCOMPLETE'), JSON.stringify(incomplete.findings, null, 2));
});

harnessTest({
    requirement: 'REQ-028',
    name: '테스트 승인 단계는 누락 테스트를 차단하고 실행된 실패는 허용한다',
    covers: ['테스트 승인 단계는 AC별 실행 테스트 연결을 요구하지만 구현 전 테스트 실패 자체는 통합 게이트 차단 사유로 보지 않는다']
}, () => {
    const missingState = stateWithCards([{
        id: 'REQ-028',
        state: 'RED',
        status: '테스트 승인',
        redReasons: redReason('TRACE-AC-MISSING', 'MISSING')
    }]);
    const missingRun = runGateFixture(missingState, allCleanFindings(), ['--check']);
    assert.equal(missingRun.status, 1);
    assert.ok(missingRun.output.includes('[TRACE]'));
    assert.ok(missingRun.output.includes('red=1'));

    const failingState = stateWithCards([{
        id: 'REQ-028',
        state: 'RED',
        status: '테스트 승인',
        redReasons: redReason('TRACE-AC-FAIL', 'FAIL')
    }]);
    const failingRun = runGateFixture(failingState, allCleanFindings(), ['--check']);
    assert.equal(failingRun.status, 0);
    assert.ok(failingRun.output.includes('gate: pass'));
});

harnessTest({
    requirement: 'REQ-028',
    name: '검증중 또는 승인 RED는 TRACE 실패로 차단한다',
    covers: ['`gate.mjs --check`는 `검증중` 또는 `승인` 카드의 RED를 TRACE 실패로 차단한다']
}, () => {
    const draftState = stateWithCards([{
        id: 'REQ-028',
        state: 'RED',
        status: '설계 검토중',
        redReasons: redReason('TRACE-AC-MISSING', 'MISSING')
    }]);
    const draftRun = runGateFixture(draftState, allCleanFindings(), ['--check']);
    assert.equal(draftRun.status, 0);
    assert.ok(draftRun.output.includes('gate: pass'));

    const verificationState = stateWithCards([{
        id: 'REQ-028',
        state: 'RED',
        status: '검증중',
        redReasons: redReason('TRACE-AC-FAIL', 'FAIL')
    }]);
    const verificationRun = runGateFixture(verificationState, allCleanFindings(), ['--check']);
    assert.equal(verificationRun.status, 1);
    assert.ok(verificationRun.output.includes('[TRACE]'));
    assert.ok(verificationRun.output.includes('red=1'));

    const approvedState = stateWithCards([{
        id: 'REQ-028',
        state: 'RED',
        status: '승인',
        redReasons: redReason('TRACE-AC-FAIL', 'FAIL')
    }]);
    const approvedRun = runGateFixture(approvedState, allCleanFindings(), ['--check']);
    assert.equal(approvedRun.status, 1);
    assert.ok(approvedRun.output.includes('[TRACE]'));
    assert.ok(approvedRun.output.includes('red=1'));
});

harnessTest({
    requirement: 'REQ-028',
    name: 'app validate는 Storybook build를 실행한다',
    covers: ['`npm run app:validate`는 Storybook build를 실행해 UI 설계 검토 표면이 빌드 가능한지 확인한다']
}, () => {
    const runner = readText(path.join(workspaceRoot, 'harness', 'tools', 'run.mjs'));
    assert.ok(runner.includes('function frontEndBuildStorybook()'));
    assert.ok(runner.includes("frontEndNpm('front-end:build-storybook', 'build-storybook')"));
    assert.ok(runner.includes('frontEndBuildStorybook();'));
});

harnessTest({
    requirement: 'REQ-028',
    name: 'UI 설계 검토 표면 누락은 FE finding으로 보고된다',
    covers: ['UI 설계 검토 표면이 있는 요건은 선언한 Storybook surface와 named export 상태가 실제 Storybook source index에 있고 해당 요건 metadata와 연결되어야 한다']
}, () => {
    const dir = tempDir('stage-aware-storybook-');
    const feSourceIndex = path.join(dir, 'front-end.source-index.json');
    const requirementsIndex = path.join(dir, 'requirements.index.json');
    const openApiIndex = path.join(dir, 'openapi.index.json');
    const generatedMeta = path.join(dir, '.openapi-source.sha256');
    const out = path.join(dir, 'front-end-standards.findings.json');

    writeJson(feSourceIndex, {
        stories: [
            {
                title: 'Todos/TodoFormDialog',
                story: 'Create',
                requirements: [],
                file: 'app/front-end/src/TodoFormDialog.stories.tsx',
                line: 10
            }
        ],
        tests: [],
        apiUsages: [],
        apiCalls: [],
        issues: []
    });
    writeJson(requirementsIndex, {
        entries: [{
            id: 'REQ-028',
            status: '설계 승인',
            location: { file: 'harness/docs/requirements/REQ-028-stage-aware-tdd-workflow.md', line: 1, identity: 'REQ-028' },
            uiReviewSurfaces: [
                { title: 'Todos/TodoFormDialog', states: ['Create', 'Submitting'] }
            ]
        }]
    });
    writeJson(openApiIndex, {
        sha256: 'fixture-hash',
        entries: [],
        rawOpenApi: { paths: {}, components: { schemas: {} } }
    });
    fs.writeFileSync(generatedMeta, 'fixture-hash');

    runCommand(process.execPath, [
        path.join(workspaceRoot, 'harness', 'tools', 'validate-front-end-standards.mjs'),
        `--front-end-root=${dir}`,
        `--fe-source-index=${feSourceIndex}`,
        `--requirements-index=${requirementsIndex}`,
        `--openapi-index=${openApiIndex}`,
        `--generated-meta=${generatedMeta}`,
        `--out=${out}`
    ], { cwd: workspaceRoot });

    const payload = JSON.parse(fs.readFileSync(out, 'utf8'));
    const ruleIds = payload.findings.map((finding: { ruleId: string }) => finding.ruleId).sort();
    assert.deepEqual(ruleIds, ['FE-STORY-MISSING-STATE', 'FE-STORY-REQ-MISMATCH']);
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC7 --requirement 단일 카드 필터는 교집합으로만 차단하고 전역 finding은 제외한다',
    covers: ['`gate.mjs --requirement REQ-XXX`는 `finding.requirements[]`와 선택 카드 ID의 교집합으로 finding을 거른다. `requirements: []` 전역 finding은 단일 카드 게이트에서 차단되지 않고 scope 전체 게이트에서만 차단된다']
}, () => {
    const state = stateWithCards([
        { id: 'REQ-A', state: 'BLUE' },
        { id: 'REQ-B', state: 'BLUE' }
    ]);
    const findings = allCleanFindings();
    addFinding(findings, 'back-end-standards.findings.json', 'BE-X', 'error', ['REQ-B']);
    addFinding(findings, 'back-end-standards.findings.json', 'BE-GLOBAL', 'error', []);

    const reqA = runGateFixture(state, findings, ['--check', '--requirement', 'REQ-A']);
    assert.equal(reqA.status, 0);
    assert.ok(reqA.output.includes('gate: pass'));
    assert.ok(reqA.output.includes('filter=REQ-A'));

    const reqB = runGateFixture(state, findings, ['--check', '--requirement', 'REQ-B']);
    assert.equal(reqB.status, 1);
    assert.ok(reqB.output.includes('[BE] errors=1'));

    const all = runGateFixture(state, findings, ['--check']);
    assert.equal(all.status, 1);
    assert.ok(all.output.includes('[BE] errors=2'));
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC8 루트 하네스 러너가 collector/validator 실행 후 trace-requirements.mjs를 호출한다',
    covers: ['`npm run app:validate`/`npm run app:trace`와 `npm run harness:validate`/`npm run harness:trace`는 `harness/tools/run.mjs`를 통해 scope별 collector와 validator를 실행하고 최종 단계에서 `harness/tools/trace-requirements.mjs`를 호출한다']
}, () => {
    const packageJson = readText(path.join(workspaceRoot, 'package.json'));
    assert.ok(packageJson.includes('"app:validate": "node harness/tools/run.mjs app:validate"'));
    assert.ok(packageJson.includes('"harness:validate": "node harness/tools/run.mjs harness:validate"'));
    assert.ok(packageJson.includes('"repo:validate": "node harness/tools/run.mjs repo:validate"'));
    assert.equal(packageJson.includes('"validate":'), false);
    assert.equal(packageJson.includes('"trace":'), false);

    const runner = readText(path.join(workspaceRoot, 'harness', 'tools', 'run.mjs'));
    assert.ok(runner.includes('collectAppStaticInputs()'));
    assert.ok(runner.includes('collectHarnessStaticInputs()'));
    assert.ok(runner.includes('emitFindingsAndReports('));
    assert.ok(runner.includes('trace-requirements.mjs'));
    assert.equal(runner.includes('validateStandardsStrict'), false);
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC9 gate-trace.mjs는 삭제되고 trace-requirements.mjs가 evaluate→render→gate.mjs를 호출한다',
    covers: ['`harness/tools/gate-trace.mjs`는 삭제되고 `harness/tools/trace-requirements.mjs`는 evaluate → render → `gate.mjs`를 직렬 spawn한다']
}, () => {
    assert.equal(fs.existsSync(path.join(workspaceRoot, 'harness', 'tools', 'gate-trace.mjs')), false);

    const body = readText(path.join(workspaceRoot, 'harness', 'tools', 'trace-requirements.mjs'));
    const idxEvaluate = body.indexOf('evaluate-trace-state.mjs');
    const idxRender = body.indexOf('render-trace-report.mjs');
    const idxGate = body.indexOf('gate.mjs');
    assert.ok(idxEvaluate > -1);
    assert.ok(idxRender > -1);
    assert.ok(idxGate > -1);
    assert.ok(idxEvaluate < idxRender);
    assert.ok(idxRender < idxGate);
    assert.equal(body.includes('gate-trace.mjs'), false);
});

harnessTest({
    requirement: 'REQ-010',
    name: 'AC10 정책과 출력 계약이 표준/하네스 문서에 반영되어 있다',
    covers: ['본 요건의 정책 변경(terminology strict 차단)과 출력 계약(8개 카테고리 라벨, owner/rule prefix 매핑)이 `harness/docs/standards/terminology.md`, `harness/docs/standards/requirement-card.md`, `AGENTS.md`, `harness/docs/data-contracts.md`에 반영된다']
}, () => {
    const terminology = readText(path.join(workspaceRoot, 'harness', 'docs', 'standards', 'terminology.md'));
    assert.ok(terminology.includes('gate.mjs'));
    assert.ok(terminology.includes('REQ-010'));

    const reqCard = readText(path.join(workspaceRoot, 'harness', 'docs', 'standards', 'requirement-card.md'));
    assert.ok(reqCard.includes('gate.mjs'));
    assert.ok(reqCard.includes('TRM'));

    const agents = readText(path.join(workspaceRoot, 'AGENTS.md'));
    assert.ok(agents.includes('REQ-010'));
    assert.ok(agents.includes('통합 게이트'));

    const contracts = readText(path.join(workspaceRoot, 'harness', 'docs', 'data-contracts.md'));
    for (const label of ['TRACE', 'CARD', 'REF', 'TRC', 'BE', 'FE', 'SCN', 'TRM']) {
        assert.ok(contracts.includes(label), `${label} was not documented`);
    }
    assert.ok(contracts.includes('gate.mjs'));
    assert.ok(contracts.includes('trace.state.json'));
    assert.ok(contracts.includes('terminology.findings.json'));
});
