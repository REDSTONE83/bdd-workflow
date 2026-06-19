import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
    allCleanFindings,
    emptyFindingPayload,
    findingFiles,
    findingsDir,
    harnessTest,
    readJson,
    reportsDir,
    runNodeTool,
    stateDir,
    tempDir,
    withFileBackups,
    workspaceRoot,
    writeJson
} from '../support/harness-test.ts';

function cardEntry(overrides: Record<string, any> = {}) {
    const id = overrides.id ?? 'REQ-901';
    return {
        kind: 'card',
        requirements: [id],
        location: {
            file: `harness/docs/requirements/${id}-fixture.md`,
            line: 1,
            identity: id
        },
        idRaw: id,
        id,
        title: `${id} fixture`,
        priority: '중간',
        status: '초안',
        requirementType: '하네스',
        specRole: '원자 요건',
        targetSystem: 'harness',
        productArea: 'harness',
        qualityAttributes: ['usability'],
        verificationLevel: 'static',
        parentRequirementIds: [],
        relatedRequirementIds: [],
        replacedByRequirementIds: [],
        approved: false,
        acceptanceCriteria: [{ text: `${id} AC`, target: 'STATIC', line: 42 }],
        openQuestions: [],
        terms: [],
        acceptanceTestReviewIncomplete: true,
        acceptanceTestReviewApproved: false,
        bddReviewIncomplete: true,
        bddReviewApproved: false,
        referencedRequirementIds: [],
        sectionPresent: {},
        ...overrides
    };
}

function runEvaluatorFixture(entries: any[]) {
    const outputRoot = tempDir('trace-state-contract-');
    writeJson(path.join(outputRoot, 'indexes', 'requirements.index.json'), {
        generatedAt: '2026-06-16T00:00:00.000Z',
        schemaVersion: '1',
        source: 'requirements.index',
        entries,
        issues: []
    });

    const result = spawnSync(process.execPath, [
        path.join(workspaceRoot, 'harness', 'tools', 'evaluate-trace-state.mjs'),
        '--quiet'
    ], {
        cwd: workspaceRoot,
        encoding: 'utf8',
        env: {
            ...process.env,
            HARNESS_SCOPE: 'harness',
            HARNESS_OUTPUT_ROOT: outputRoot
        }
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    assert.equal(result.status, 0, output);
    return readJson(path.join(outputRoot, 'state', 'trace.state.json'));
}

harnessTest({
    requirement: 'REQ-031',
    name: '요건 계층 데이터는 trace.state.json에서 parent/child와 AC line으로 전파된다',
    covers: ['하네스 UI 서버가 제공하는 요건 추적 데이터는 추적 산출물의 판정 값과 일치한다']
}, () => {
    const state = runEvaluatorFixture([
        cardEntry({
            id: 'REQ-900',
            specRole: '상위 요건',
            approved: true,
            acceptanceCriteria: [{ text: 'parent AC', target: 'STATIC', line: 35 }]
        }),
        cardEntry({
            id: 'REQ-901',
            parentRequirementIds: ['REQ-900'],
            openQuestions: ['남은 질문']
        })
    ]);

    const parent = state.requirements.find((requirement: any) => requirement.id === 'REQ-900');
    const child = state.requirements.find((requirement: any) => requirement.id === 'REQ-901');

    assert.deepEqual(child.parentRequirementIds, ['REQ-900']);
    assert.deepEqual(parent.childRequirementIds, ['REQ-901']);
    assert.equal(child.file, 'harness/docs/requirements/REQ-901-fixture.md');
    assert.equal(child.coverage[0].line, 42);
    assert.deepEqual(child.blueBlockedBy, [
        '요건 카드 상태가 승인 아님: 초안',
        '열린 질문 남음'
    ]);
});

harnessTest({
    requirement: 'REQ-033',
    name: '게이트 실행 결과는 UI용 gate-report.json으로 같은 카테고리 판정을 남긴다',
    covers: ['게이트 화면의 카테고리 차단 판정은 통합 하네스 게이트 도구의 판정과 일치한다']
}, () => {
    const stateFile = path.join(stateDir, 'trace.state.json');
    const reportFile = path.join(reportsDir, 'gate-report.json');
    const files = [stateFile, reportFile, ...findingFiles.map((file) => path.join(findingsDir, file))];

    const report = withFileBackups(files, () => {
        writeJson(stateFile, {
            generatedAt: '2026-06-16T00:00:00.000Z',
            schemaVersion: '1',
            source: 'trace.state',
            filter: null,
            requirements: [{ id: 'REQ-900', status: '승인', state: 'BLUE', redReasons: [], blueBlockedBy: [] }]
        });
        const findings = allCleanFindings();
        for (const file of findingFiles) {
            writeJson(path.join(findingsDir, file), findings[file] ?? emptyFindingPayload(file));
        }

        const run = runNodeTool('gate.mjs', ['--check', '--quiet']);
        assert.equal(run.status, 0);
        assert.ok(run.output.includes('gate: exit=0'));
        return readJson(reportFile);
    });

    assert.equal(report.source, 'gate');
    assert.equal(report.scope, 'harness');
    assert.deepEqual(report.summary, {
        passed: true,
        traceFailing: false,
        categoryFailing: false
    });
    assert.deepEqual(report.categories.map((category: any) => category.category), [
        'TRACE',
        'CARD',
        'REF',
        'TRC',
        'BE',
        'FE',
        'SCN',
        'TRM'
    ]);
    assert.ok(report.categories.every((category: any) => category.blocked === false && category.errors === 0));
});

harnessTest({
    requirement: 'REQ-033',
    name: '게이트 차단 결과는 UI용 gate-report.json에 blocked와 findingRefs로 전파된다',
    covers: ['게이트 화면의 카테고리 차단 판정은 통합 하네스 게이트 도구의 판정과 일치한다']
}, () => {
    const stateFile = path.join(stateDir, 'trace.state.json');
    const reportFile = path.join(reportsDir, 'gate-report.json');
    const files = [stateFile, reportFile, ...findingFiles.map((file) => path.join(findingsDir, file))];

    const report = withFileBackups(files, () => {
        writeJson(stateFile, {
            generatedAt: '2026-06-16T00:00:00.000Z',
            schemaVersion: '1',
            source: 'trace.state',
            filter: null,
            requirements: [
                {
                    id: 'REQ-900',
                    status: '승인',
                    state: 'RED',
                    redReasons: [{ ruleId: 'TRACE-AC-MISSING', message: 'fixture RED' }],
                    blueBlockedBy: []
                }
            ]
        });
        const findings = allCleanFindings();
        findings['requirement-cards.findings.json'].findings.push({
            ruleId: 'CARD-PARENT-MULTIPLE',
            severity: 'error',
            strictSeverity: 'error',
            requirements: ['REQ-900'],
            message: 'fixture CARD finding',
            location: {
                file: 'harness/docs/requirements/REQ-900-fixture.md',
                line: 13
            }
        });
        for (const file of findingFiles) {
            writeJson(path.join(findingsDir, file), findings[file] ?? emptyFindingPayload(file));
        }

        const run = runNodeTool('gate.mjs', ['--check', '--quiet'], { allowNonZero: true });
        assert.equal(run.status, 1);
        assert.ok(run.output.includes('gate: exit=1'));
        return readJson(reportFile);
    });

    const trace = report.categories.find((category: any) => category.category === 'TRACE');
    const card = report.categories.find((category: any) => category.category === 'CARD');

    assert.deepEqual(report.summary, {
        passed: false,
        traceFailing: true,
        categoryFailing: true
    });
    assert.deepEqual(trace, {
        category: 'TRACE',
        blocked: true,
        errors: 1,
        byRuleId: { 'TRACE-BLOCKED': 1 },
        findingRefs: []
    });
    assert.equal(card.blocked, true);
    assert.equal(card.errors, 1);
    assert.deepEqual(card.byRuleId, { 'CARD-PARENT-MULTIPLE': 1 });
    assert.deepEqual(card.findingRefs, [
        {
            ruleId: 'CARD-PARENT-MULTIPLE',
            file: 'harness/docs/requirements/REQ-900-fixture.md',
            line: 13,
            requirements: ['REQ-900']
        }
    ]);
});
