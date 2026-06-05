import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    addFinding,
    addTerminologyFinding,
    allCleanFindings,
    harnessTest,
    readText,
    runGateFixture,
    stateWithCards,
    workspaceRoot
} from '../support/harness-test.ts';

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
