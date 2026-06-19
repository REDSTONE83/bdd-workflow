import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
    harnessTest,
    readJson,
    readText,
    tempDir,
    withFileBackups,
    workspaceRoot,
    writeJson,
    writeText
} from '../support/harness-test.ts';

const sourceIndexer = path.join(workspaceRoot, 'harness', 'ui', 'tools', 'source-index.mjs');
const evaluator = path.join(workspaceRoot, 'harness', 'tools', 'evaluate-trace-state.mjs');
const indexTestResults = path.join(workspaceRoot, 'harness', 'tools', 'index-test-results.mjs');
const frontEndStandards = path.join(workspaceRoot, 'harness', 'tools', 'validate-front-end-standards.mjs');
const harnessUiRoot = path.join(workspaceRoot, 'harness', 'ui');

function runNode(file: string, args: string[], options: { cwd?: string; env?: Record<string, string>; allowNonZero?: boolean } = {}) {
    const result = spawnSync(process.execPath, [file, ...args], {
        cwd: options.cwd ?? workspaceRoot,
        encoding: 'utf8',
        env: { ...process.env, ...(options.env ?? {}) },
        maxBuffer: 20 * 1024 * 1024
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    if (!options.allowNonZero) {
        assert.equal(result.status, 0, output);
    }
    return { status: result.status ?? 1, output };
}

function cardEntry(id: string, acText: string, target = 'UI') {
    return {
        kind: 'card',
        requirements: [id],
        location: { file: `harness/docs/requirements/${id}-fixture.md`, line: 1, identity: id },
        idRaw: id,
        id,
        title: `${id} fixture`,
        priority: '중간',
        status: '설계 검토중',
        requirementType: '하네스',
        specRole: '원자 요건',
        targetSystem: 'harness',
        productArea: 'harness',
        qualityAttributes: ['none'],
        verificationLevel: target === 'UI' ? 'acceptance' : 'static',
        parentRequirementIds: [],
        relatedRequirementIds: [],
        replacedByRequirementIds: [],
        approved: false,
        acceptanceCriteria: [{ text: acText, target, line: 42 }],
        openQuestions: [],
        terms: [],
        acceptanceTestReviewIncomplete: true,
        acceptanceTestReviewApproved: false,
        bddReviewIncomplete: true,
        bddReviewApproved: false,
        referencedRequirementIds: [],
        sectionPresent: {}
    };
}

function writeTraceInputs(outputRoot: string, options: { withFrontEndTest: boolean; withResult: boolean }) {
    const acText = 'fixture UI AC';
    writeJson(path.join(outputRoot, 'indexes', 'requirements.index.json'), {
        generatedAt: '2026-06-17T00:00:00.000Z',
        schemaVersion: '1',
        source: 'requirements.index',
        entries: [cardEntry('REQ-900', acText)],
        issues: []
    });
    writeJson(path.join(outputRoot, 'indexes', 'scenarios.index.json'), {
        generatedAt: '2026-06-17T00:00:00.000Z',
        schemaVersion: '1',
        source: 'scenarios.index',
        features: [],
        scenarios: []
    });
    writeJson(path.join(outputRoot, 'indexes', 'front-end.source-index.json'), {
        generatedAt: '2026-06-17T00:00:00.000Z',
        schemaVersion: '1',
        source: 'front-end.source-index',
        pages: [],
        routes: [],
        stories: [],
        tests: options.withFrontEndTest ? [{
            kind: 'test',
            source: 'front-end',
            runtime: 'storybook-vitest',
            requirements: ['REQ-900'],
            covers: [acText],
            file: 'harness/ui/src/Foo.stories.tsx',
            line: 10,
            identity: 'harness/ui/src/Foo.stories.tsx:10 > Harness/Foo / Default',
            resultKeys: ['Harness/Foo / Default']
        }] : [],
        apiUsages: [],
        apiCalls: [],
        issues: []
    });
    writeJson(path.join(outputRoot, 'indexes', 'test-results.index.json'), {
        generatedAt: '2026-06-17T00:00:00.000Z',
        schemaVersion: '1',
        source: 'test-results.index',
        entries: options.withResult ? [{
            kind: 'test-result',
            runtime: 'storybook-vitest',
            scope: 'harness',
            status: 'PASS',
            identity: 'Harness/Foo / Default',
            alternateIdentities: []
        }] : [],
        issues: []
    });
}

function evaluateFixture(options: { withFrontEndTest: boolean; withResult: boolean }) {
    const outputRoot = tempDir('harness-ui-coverage-');
    writeTraceInputs(outputRoot, options);
    runNode(evaluator, ['--quiet'], {
        env: {
            HARNESS_SCOPE: 'harness',
            HARNESS_OUTPUT_ROOT: outputRoot
        }
    });
    return readJson(path.join(outputRoot, 'state', 'trace.state.json'));
}

harnessTest({
    requirement: 'REQ-029',
    name: 'harness/ui Storybook Vitest 메타데이터는 하네스 front-end 테스트 인덱스로 수집된다',
    covers: ['harness/ui Storybook Vitest story 테스트의 요건·수용 기준 메타데이터가 하네스 scope 테스트 인덱스로 수집된다']
}, () => {
    const repo = tempDir('harness-ui-source-index-');
    const frontEndRoot = path.join(repo, 'harness', 'ui');
    writeText(path.join(frontEndRoot, 'src', 'Foo.stories.tsx'), `
const meta = {
  title: "Harness/Foo",
  tags: ["test"],
  harness: { requirements: ["REQ-900"] }
};
export default meta;

export const Default = {
  harness: { covers: ["fixture UI AC"] },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeDefined();
  }
};
`);

    const out = path.join(repo, 'build', 'harness', 'indexes', 'front-end.source-index.json');
    runNode(sourceIndexer, [
        `--front-end-root=${frontEndRoot}`,
        `--repo-root=${repo}`,
        `--out=${out}`
    ]);

    const payload = readJson(out);
    assert.equal(payload.tests.length, 1);
    assert.deepEqual(payload.tests[0].requirements, ['REQ-900']);
    assert.deepEqual(payload.tests[0].covers, ['fixture UI AC']);
    assert.equal(payload.tests[0].runtime, 'storybook-vitest');
    assert.equal(payload.tests[0].source, 'front-end');
});

harnessTest({
    requirement: 'REQ-029',
    name: 'harness/ui Storybook Vitest JUnit 결과는 하네스 테스트 결과 인덱스로 병합된다',
    covers: ['harness/ui Storybook Vitest 실행 결과가 하네스 scope 테스트 결과 인덱스에 병합되어 수용 기준 판정에 사용된다']
}, () => {
    const outputRoot = tempDir('harness-ui-results-');
    const junit = path.join(harnessUiRoot, 'test-results', 'storybook-junit.xml');
    const targets = [junit];
    const indexPath = path.join(outputRoot, 'indexes', 'test-results.index.json');

    withFileBackups(targets, () => {
        writeText(junit, `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="storybook">
    <testcase classname="Harness/Foo" name="Default" file="src/Foo.stories.tsx" line="10" />
  </testsuite>
</testsuites>
`);
        runNode(indexTestResults, [], {
            env: {
                HARNESS_SCOPE: 'harness',
                HARNESS_OUTPUT_ROOT: outputRoot
            }
        });
    });

    const payload = readJson(indexPath);
    const entry = payload.entries.find((item: any) => item.runtime === 'storybook-vitest');
    assert.equal(entry.scope, 'harness');
    assert.equal(entry.status, 'PASS');
    assert.equal(entry.location.file, 'harness/ui/src/Foo.stories.tsx');
    assert.equal(entry.identity, 'Harness/Foo > Default');
});

harnessTest({
    requirement: 'REQ-029',
    name: '하네스 UI AC는 Storybook Vitest front-end 테스트와 실행 결과로 PASS 판정된다',
    covers: ['하네스 scope에서 (UI) 마커 수용 기준은 front-end 테스트의 커버와 결과로 PASS/FAIL이 판정된다']
}, () => {
    const state = evaluateFixture({ withFrontEndTest: true, withResult: true });
    const requirement = state.requirements.find((item: any) => item.id === 'REQ-900');
    assert.equal(requirement.coverage[0].status, 'PASS');
    assert.equal(requirement.coverage[0].requiredChecks[0].target, 'ui');
    assert.equal(requirement.coverage[0].tests[0].runtime, 'storybook-vitest');
    assert.equal(requirement.state, 'GREEN');
});

harnessTest({
    requirement: 'REQ-029',
    name: 'harness:validate는 harness/ui Storybook Vitest 테스트를 최신 결과로 실행한다',
    covers: ['`npm run harness:validate`는 harness/ui Storybook Vitest 테스트를 실행해 최신 결과로 판정한다']
}, () => {
    const runner = readText(path.join(workspaceRoot, 'harness', 'tools', 'run.mjs'));
    const validateBody = runner.slice(runner.indexOf('function harnessValidate'), runner.indexOf('function harnessTest'));
    assert.ok(validateBody.includes('harnessUiStorybookTest();'));
    assert.ok(runner.includes("harnessUiNpm('harness:ui:test-storybook', 'test:storybook')"));
    assert.ok(validateBody.indexOf('harnessUiStorybookTest();') < validateBody.indexOf("indexTestResults('harness')"));
});

harnessTest({
    requirement: 'REQ-029',
    name: 'harness/ui 테스트나 실행 결과가 없으면 UI AC는 RED로 남는다',
    covers: ['harness/ui 테스트나 결과가 없는 (UI) 마커 수용 기준은 RED로 보고된다']
}, () => {
    const missingTest = evaluateFixture({ withFrontEndTest: false, withResult: false });
    const missingTestRequirement = missingTest.requirements.find((item: any) => item.id === 'REQ-900');
    assert.equal(missingTestRequirement.coverage[0].status, 'MISSING');
    assert.equal(missingTestRequirement.state, 'RED');

    const missingResult = evaluateFixture({ withFrontEndTest: true, withResult: false });
    const missingResultRequirement = missingResult.requirements.find((item: any) => item.id === 'REQ-900');
    assert.equal(missingResultRequirement.coverage[0].status, 'NOT_RUN');
    assert.equal(missingResultRequirement.state, 'RED');
});

harnessTest({
    requirement: 'REQ-029',
    name: '하네스 UI 설계 검토 표면은 harness/ui story 인덱스와 대조된다',
    covers: ['UI 설계 검토 표면이 있는 하네스 scope 요건은 harness/ui에서 수집한 story 인덱스와 대조되어, 선언한 표면이나 상태가 없으면 위반으로 보고된다']
}, () => {
    const dir = tempDir('harness-ui-storybook-contract-');
    const feSourceIndex = path.join(dir, 'front-end.source-index.json');
    const requirementsIndex = path.join(dir, 'requirements.index.json');
    const out = path.join(dir, 'front-end-standards.findings.json');

    writeJson(feSourceIndex, {
        stories: [
            {
                title: 'Harness/Foo',
                story: 'Default',
                requirements: [],
                file: 'harness/ui/src/Foo.stories.tsx',
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
            id: 'REQ-900',
            status: '설계 승인',
            location: { file: 'harness/docs/requirements/REQ-900-fixture.md', line: 1, identity: 'REQ-900' },
            uiReviewSurfaces: [{ title: 'Harness/Foo', states: ['Default', 'Empty'], raw: 'Harness/Foo: Default, Empty' }]
        }]
    });

    runNode(frontEndStandards, [
        `--front-end-root=${dir}`,
        `--fe-source-index=${feSourceIndex}`,
        `--requirements-index=${requirementsIndex}`,
        `--out=${out}`
    ], {
        env: { HARNESS_SCOPE: 'harness' }
    });

    const ruleIds = readJson(out).findings.map((finding: any) => finding.ruleId).sort();
    assert.deepEqual(ruleIds, ['FE-STORY-MISSING-STATE', 'FE-STORY-REQ-MISMATCH']);
});

harnessTest({
    requirement: 'REQ-029',
    name: '하네스 scope에서 covers가 있는 story는 play 성공 조건이 없으면 위반으로 보고된다',
    covers: ['하네스 scope에서 (UI) 수용 기준을 covers하는 Storybook story는 play 성공 조건(expect assertion)이 없으면 위반으로 보고된다']
}, () => {
    const dir = tempDir('harness-ui-cover-no-play-');
    const feSourceIndex = path.join(dir, 'front-end.source-index.json');
    const requirementsIndex = path.join(dir, 'requirements.index.json');
    const out = path.join(dir, 'front-end-standards.findings.json');

    writeJson(feSourceIndex, {
        stories: [],
        tests: [
            {
                kind: 'test',
                source: 'front-end',
                runtime: 'storybook-vitest',
                requirements: ['REQ-900'],
                covers: ['렌더 전용 스토리가 covers하는 수용 기준'],
                file: 'harness/ui/src/Foo.stories.tsx',
                line: 10,
                displayName: 'Harness/Foo / RenderOnly',
                hasPlay: false,
                hasAssertion: false
            },
            {
                kind: 'test',
                source: 'front-end',
                runtime: 'storybook-vitest',
                requirements: ['REQ-900'],
                covers: ['play 성공 조건이 있는 수용 기준'],
                file: 'harness/ui/src/Foo.stories.tsx',
                line: 30,
                displayName: 'Harness/Foo / WithPlay',
                hasPlay: true,
                hasAssertion: true
            }
        ],
        apiUsages: [],
        apiCalls: [],
        issues: []
    });
    writeJson(requirementsIndex, {
        entries: [{
            id: 'REQ-900',
            status: '설계 승인',
            location: { file: 'harness/docs/requirements/REQ-900-fixture.md', line: 1, identity: 'REQ-900' }
        }]
    });

    runNode(frontEndStandards, [
        `--front-end-root=${dir}`,
        `--fe-source-index=${feSourceIndex}`,
        `--requirements-index=${requirementsIndex}`,
        `--out=${out}`
    ], {
        env: { HARNESS_SCOPE: 'harness' }
    });

    const coverNoPlay = readJson(out).findings.filter((finding: any) => finding.ruleId === 'FE-STORY-COVER-NO-PLAY');
    assert.equal(coverNoPlay.length, 1);
    assert.equal(coverNoPlay[0].severity, 'error');
    assert.equal(coverNoPlay[0].location.identity, 'Harness/Foo / RenderOnly');
});

harnessTest({
    requirement: 'REQ-029',
    name: 'harness:validate는 harness/ui Storybook build를 실행한다',
    covers: ['`npm run harness:validate`는 harness/ui Storybook build를 실행해 UI 설계 검토 표면이 빌드 가능한지 확인한다']
}, () => {
    const runner = readText(path.join(workspaceRoot, 'harness', 'tools', 'run.mjs'));
    const validateBody = runner.slice(runner.indexOf('function harnessValidate'), runner.indexOf('function harnessTest'));
    assert.ok(validateBody.includes('harnessUiBuildStorybook();'));
    assert.ok(runner.includes("harnessUiNpm('harness:ui:build-storybook', 'build-storybook')"));
});
