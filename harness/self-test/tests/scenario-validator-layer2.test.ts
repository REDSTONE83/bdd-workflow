import assert from 'node:assert/strict';
import path from 'node:path';
import {
    addFinding,
    allCleanFindings,
    assertHasRule,
    harnessTest,
    readJson,
    runGateFixture,
    runNodeTool,
    stateWithCards,
    tempDir,
    writeJson
} from '../support/harness-test.ts';

function scenariosIndexShell() {
    return {
        generatedAt: '2026-05-23T00:00:00.000Z',
        schemaVersion: '1',
        source: 'scenarios.index',
        features: [],
        issues: []
    };
}

function issueNode(kind: string, line: number, message: string) {
    return { line, kind, message };
}

function writeIndex(tmp: string, index: any) {
    const file = path.join(tmp, 'scenarios.index.json');
    writeJson(file, index);
    return file;
}

function runValidator(scenariosIndex: string, out: string) {
    runNodeTool('validate-scenarios.mjs', [
        `--scenarios-index=${scenariosIndex}`,
        `--out=${out}`
    ]);
}

harnessTest({
    requirement: 'REQ-009',
    name: 'AC1 시나리오 구조 위반이 SCN-* finding으로 정규화된다',
    covers: ['Gherkin `.feature` 파일의 구조 위반은 `build/harness/findings/scenarios.findings.json`에 SCN-* finding으로 정규화되어 보고된다']
}, () => {
    const tmp = tempDir();
    const index = scenariosIndexShell();
    index.features.push({
        file: 'docs/scenarios/fixture.feature',
        title: 'Fixture Feature',
        tags: ['@REQ-001'],
        requirementIds: ['REQ-001'],
        scenarios: [],
        issues: [issueNode('SCN-COVERS-OUTSIDE-SCENARIO', 3, 'Covers: 는 Scenario 안에서만 허용됨')]
    });
    const findingsFile = path.join(tmp, 'scenarios.findings.json');

    runValidator(writeIndex(tmp, index), findingsFile);

    const findings = readJson(findingsFile).findings ?? [];
    assert.ok(findings.some((finding: any) =>
        finding.ruleId === 'SCN-COVERS-OUTSIDE-SCENARIO' &&
        finding.severity === 'error' &&
        finding.requirements.includes('REQ-001')
    ));
});

harnessTest({
    requirement: 'REQ-009',
    name: 'AC2 Feature 헤더가 없으면 SCN-FEATURE-HEADER-MISSING error로 보고된다',
    covers: ['Feature 헤더가 없는 `.feature` 파일은 검사 결과에 오류로 보고된다']
}, () => {
    const tmp = tempDir();
    const index = scenariosIndexShell();
    index.features.push({
        file: 'docs/scenarios/headerless.feature',
        title: null,
        tags: [],
        requirementIds: [],
        scenarios: [],
        issues: [issueNode('SCN-FEATURE-HEADER-MISSING', 0, 'Feature: 헤더가 없음')]
    });
    const findingsFile = path.join(tmp, 'scenarios.findings.json');

    runValidator(writeIndex(tmp, index), findingsFile);

    assertHasRule(findingsFile, 'SCN-FEATURE-HEADER-MISSING');
});

harnessTest({
    requirement: 'REQ-009',
    name: 'AC3 @REQ-XXX 태그가 없으면 SCN-REQ-TAG-MISSING error로 보고된다',
    covers: ['`@REQ-XXX` 태그가 없는 Feature는 검사 결과에 오류로 보고된다']
}, () => {
    const tmp = tempDir();
    const index = scenariosIndexShell();
    index.features.push({
        file: 'docs/scenarios/untagged.feature',
        title: 'Untagged Feature',
        tags: [],
        requirementIds: [],
        scenarios: [],
        issues: [issueNode('SCN-REQ-TAG-MISSING', 1, '@REQ-XXX Feature 태그가 없음')]
    });
    const findingsFile = path.join(tmp, 'scenarios.findings.json');

    runValidator(writeIndex(tmp, index), findingsFile);

    const findings = readJson(findingsFile).findings ?? [];
    assert.ok(findings.some((finding: any) =>
        finding.ruleId === 'SCN-REQ-TAG-MISSING' &&
        finding.severity === 'error' &&
        finding.requirements.length === 0
    ));
});

harnessTest({
    requirement: 'REQ-009',
    name: 'AC4 미지원 키워드 사용은 SCN-UNSUPPORTED-KEYWORD error로 보고된다',
    covers: ['지원하지 않는 Gherkin 키워드(`Background`, `Scenario Outline` 등)를 사용한 `.feature`는 검사 결과에 오류로 보고된다']
}, () => {
    const tmp = tempDir();
    const index = scenariosIndexShell();
    index.features.push({
        file: 'docs/scenarios/outline.feature',
        title: 'Outline Feature',
        tags: ['@REQ-021'],
        requirementIds: ['REQ-021'],
        scenarios: [],
        issues: [issueNode('SCN-UNSUPPORTED-KEYWORD', 4, 'Scenario Outline 는 현재 하네스가 지원하지 않음')]
    });
    const findingsFile = path.join(tmp, 'scenarios.findings.json');

    runValidator(writeIndex(tmp, index), findingsFile);

    assertHasRule(findingsFile, 'SCN-UNSUPPORTED-KEYWORD');
});

harnessTest({
    requirement: 'REQ-009',
    name: 'AC5 SCN-* error finding이 있으면 npm run harness:validate 게이트(gate.mjs)가 실패한다',
    covers: ['`npm run harness:validate` 게이트는 SCN-* error finding을 발견하면 실패한다']
}, () => {
    const state = stateWithCards([{ id: 'REQ-001', state: 'BLUE' }]);
    const findings = allCleanFindings();
    addFinding(findings, 'scenarios.findings.json', 'SCN-REQ-TAG-MISSING', 'error', []);

    const run = runGateFixture(state, findings, ['--check']);

    assert.equal(run.status, 1);
    assert.ok(run.output.includes('[SCN] errors=1'));
});
