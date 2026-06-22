import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { manifestEntryForTest, sha256 } from '../../tools/test-result-fingerprint.mjs';
import {
    harnessTest,
    readJson,
    runNodeTool,
    tempDir,
    writeJson,
    writeText
} from '../support/harness-test.ts';

interface FixtureTest {
    source: string;
    runtime: string;
    requirements: string[];
    resultKeys: string[];
    covers: string[];
    identity: string;
    line: number;
}

function feTest(runtime: string, resultKey: string, covers: string[], line: number): FixtureTest {
    return {
        source: 'front-end',
        runtime,
        requirements: ['REQ-012'],
        resultKeys: [resultKey],
        covers,
        identity: `fixture:${line} > ${resultKey}`,
        line
    };
}

// JUnit 한 testcase 의 파싱 결과 alternateIdentities 는 bare `name` 을 포함하므로,
// source resultKeys 를 name 과 같게 두면 결과↔source 조인이 성립한다.
function storybookJunit(names: string[]): string {
    const cases = names
        .map((name) => `<testcase classname="Fixture.stories.tsx" name="${name}"></testcase>`)
        .join('');
    return `<testsuites><testsuite name="storybook">${cases}</testsuite></testsuites>`;
}

// collectPlaywrightReport 는 identityNoLine = `${file} > ${titlePath.join(' > ')}` 를 alternateIdentity 로 둔다.
function playwrightJson(specs: Array<{ file: string; line: number; title: string }>): string {
    return JSON.stringify({
        suites: specs.map((spec) => ({
            title: spec.file,
            suites: [
                {
                    title: 'flow',
                    specs: [
                        {
                            file: spec.file,
                            line: spec.line,
                            title: spec.title,
                            tests: [{ outcome: 'expected', results: [{ status: 'passed' }] }]
                        }
                    ]
                }
            ]
        }))
    });
}

function playwrightResultKey(file: string, title: string): string {
    return `${file} > flow > ${title}`;
}

function buildManifest(runtime: string, resultFileName: string, resultContent: string, sourceTests: FixtureTest[]) {
    return {
        schemaVersion: '1',
        source: 'fe-test-result-manifest',
        runtime,
        resultFile: `app/front-end/test-results/${resultFileName}`,
        resultFileSha256: sha256(resultContent),
        startedAt: '2026-06-06T00:00:00.000Z',
        completedAt: '2026-06-06T00:00:01.000Z',
        exitStatus: 0,
        entries: sourceTests.filter((test) => test.runtime === runtime).map(manifestEntryForTest)
    };
}

interface ScenarioInput {
    sourceTests: FixtureTest[];
    storybookXml?: string;
    storybookManifest?: unknown;
    playwrightJson?: string;
    playwrightManifest?: unknown;
    partialJson?: string;
}

function indexFixture(input: ScenarioInput) {
    const root = tempDir('fe-freshness-');
    const indexesDir = path.join(root, 'indexes');
    const testResultsDir = path.join(root, 'test-results');
    fs.mkdirSync(indexesDir, { recursive: true });
    fs.mkdirSync(testResultsDir, { recursive: true });
    writeJson(path.join(indexesDir, 'front-end.source-index.json'), { tests: input.sourceTests });
    if (input.storybookXml !== undefined) writeText(path.join(testResultsDir, 'storybook-junit.xml'), input.storybookXml);
    if (input.storybookManifest !== undefined) writeJson(path.join(testResultsDir, 'storybook-junit.manifest.json'), input.storybookManifest);
    if (input.playwrightJson !== undefined) writeText(path.join(testResultsDir, 'e2e-live-results.json'), input.playwrightJson);
    if (input.playwrightManifest !== undefined) writeJson(path.join(testResultsDir, 'e2e-live-results.manifest.json'), input.playwrightManifest);
    if (input.partialJson !== undefined) writeText(path.join(testResultsDir, 'e2e-results.partial.json'), input.partialJson);
    runNodeTool('index-test-results.mjs', [], { env: { HARNESS_SCOPE: 'application', HARNESS_OUTPUT_ROOT: root } });
    const index = readJson(path.join(indexesDir, 'test-results.index.json'));
    fs.rmSync(root, { recursive: true, force: true });
    return index;
}

function keptIdentities(index: any): string[] {
    return (index.entries ?? []).map((entry: any) => entry.identity);
}

function staleIssues(index: any, runtime: string) {
    return (index.issues ?? []).filter((issue: any) => issue.kind === 'FE_TEST_RESULT_STALE' && issue.runtime === runtime);
}

harnessTest({
    requirement: 'REQ-012',
    name: 'AC6 Storybook Vitest 실행 결과는 fingerprint가 일치할 때만 UI AC 커버로 남고 stale은 빠진다',
    covers: ['통합 게이트는 target이 `UI`인 AC에 Storybook Vitest 테스트 커버가 없으면 차단한다']
}, () => {
    const current = feTest('storybook-vitest', 'Fresh', ['AC 현재 covers'], 10);
    const xml = storybookJunit(['Fresh']);

    // manifest 일치 → 결과 유지
    const fresh = indexFixture({
        sourceTests: [current],
        storybookXml: xml,
        storybookManifest: buildManifest('storybook-vitest', 'storybook-junit.xml', xml, [current])
    });
    assert.ok(keptIdentities(fresh).includes('Fixture.stories.tsx > Fresh'), 'fresh storybook result is kept');
    assert.equal(staleIssues(fresh, 'storybook-vitest').length, 0);

    // manifest 불일치(Covers 변경 후 미재실행) → stale 로 빠짐
    const mismatch = indexFixture({
        sourceTests: [current],
        storybookXml: xml,
        storybookManifest: buildManifest('storybook-vitest', 'storybook-junit.xml', xml, [
            { ...current, covers: ['AC 옛 covers'] }
        ])
    });
    assert.equal(keptIdentities(mismatch).length, 0, 'covers-changed storybook result is dropped');
    assert.equal(staleIssues(mismatch, 'storybook-vitest')[0]?.reason, 'fingerprint-mismatch');

    // manifest 누락 → stale 로 빠짐
    const missing = indexFixture({ sourceTests: [current], storybookXml: xml });
    assert.equal(keptIdentities(missing).length, 0, 'storybook result without manifest is dropped');
    assert.equal(staleIssues(missing, 'storybook-vitest')[0]?.reason, 'manifest-missing');

    // 결과 파일만 갱신되고 manifest는 옛 resultFileSha256 → hash 불일치로 stale
    // (프런트엔드 패키지 직접 실행 `test:storybook`이 canonical 결과만 덮어쓴 경우)
    const hashMismatch = indexFixture({
        sourceTests: [current],
        storybookXml: xml,
        storybookManifest: {
            ...buildManifest('storybook-vitest', 'storybook-junit.xml', xml, [current]),
            resultFileSha256: '0'.repeat(64)
        }
    });
    assert.equal(keptIdentities(hashMismatch).length, 0, 'storybook result with mismatched file hash is dropped');
    assert.equal(staleIssues(hashMismatch, 'storybook-vitest')[0]?.reason, 'result-file-hash-mismatch');

    // stable key 같고 source line 만 이동 → 유지(line 독립)
    const moved = indexFixture({
        sourceTests: [{ ...current, line: 99, identity: 'fixture:99 > Fresh' }],
        storybookXml: xml,
        storybookManifest: buildManifest('storybook-vitest', 'storybook-junit.xml', xml, [current])
    });
    assert.ok(keptIdentities(moved).includes('Fixture.stories.tsx > Fresh'), 'line-moved storybook result stays fresh');
    assert.equal(staleIssues(moved, 'storybook-vitest').length, 0);

    // partial 결과 파일은 canonical 입력이 아니다 → 인덱스에 포함되지 않음
    const partialName = 'Partial';
    const partial = indexFixture({
        sourceTests: [current],
        storybookXml: xml,
        storybookManifest: buildManifest('storybook-vitest', 'storybook-junit.xml', xml, [current]),
        partialJson: playwrightJson([{ file: 'app/front-end/tests/e2e/partial.live.spec.ts', line: 1, title: partialName }])
    });
    assert.equal(
        keptIdentities(partial).some((id) => id.includes(partialName)),
        false,
        'e2e-results.partial.json is never collected'
    );
});

harnessTest({
    requirement: 'REQ-012',
    name: 'AC7 live Playwright 실행 결과는 fingerprint가 일치할 때만 E2E AC 커버로 남고 stale은 빠진다',
    covers: ['통합 게이트는 target이 `E2E`인 AC에 프런트엔드 사용자 여정 테스트 커버가 없으면 차단한다']
}, () => {
    const file = 'app/front-end/tests/e2e/x.live.spec.ts';
    const key = playwrightResultKey(file, 'does the journey');
    const current = feTest('playwright', key, ['AC 현재 covers'], 5);
    const json = playwrightJson([{ file, line: 5, title: 'does the journey' }]);
    const identity = `${file}:5 > flow > does the journey`;

    // manifest 일치 → 결과 유지
    const fresh = indexFixture({
        sourceTests: [current],
        playwrightJson: json,
        playwrightManifest: buildManifest('playwright', 'e2e-live-results.json', json, [current])
    });
    assert.ok(keptIdentities(fresh).includes(identity), 'fresh playwright result is kept');
    assert.equal(staleIssues(fresh, 'playwright').length, 0);

    // manifest 불일치 → stale
    const mismatch = indexFixture({
        sourceTests: [current],
        playwrightJson: json,
        playwrightManifest: buildManifest('playwright', 'e2e-live-results.json', json, [
            { ...current, covers: ['AC 옛 covers'] }
        ])
    });
    assert.equal(keptIdentities(mismatch).length, 0, 'covers-changed playwright result is dropped');
    assert.equal(staleIssues(mismatch, 'playwright')[0]?.reason, 'fingerprint-mismatch');

    // manifest 누락 → stale
    const missing = indexFixture({ sourceTests: [current], playwrightJson: json });
    assert.equal(keptIdentities(missing).length, 0, 'playwright result without manifest is dropped');
    assert.equal(staleIssues(missing, 'playwright')[0]?.reason, 'manifest-missing');

    // line 이동 → 유지
    const moved = indexFixture({
        sourceTests: [{ ...current, line: 88, identity: `${file}:88 > flow > does the journey` }],
        playwrightJson: json,
        playwrightManifest: buildManifest('playwright', 'e2e-live-results.json', json, [current])
    });
    assert.ok(keptIdentities(moved).includes(identity), 'line-moved playwright result stays fresh');
    assert.equal(staleIssues(moved, 'playwright').length, 0);
});

harnessTest({
    requirement: 'REQ-010',
    name: 'stale FE 실행 결과는 FE-TEST-RESULT-STALE error finding으로 정규화되어 FE 카테고리 게이트를 차단한다',
    covers: ['`gate.mjs --check`는 RED 카드, 카드 구조 위반(CARD-*), REF-* unknown reference, FE-* error, SCN-* error, TRC-* error finding이 있으면 각 카테고리 실패로 차단한다']
}, () => {
    const current = feTest('storybook-vitest', 'Fresh', ['AC 현재 covers'], 10);
    const xml = storybookJunit(['Fresh']);
    const root = tempDir('fe-freshness-finding-');
    const indexesDir = path.join(root, 'indexes');
    const testResultsDir = path.join(root, 'test-results');
    fs.mkdirSync(indexesDir, { recursive: true });
    fs.mkdirSync(testResultsDir, { recursive: true });
    const feSourceIndex = path.join(indexesDir, 'front-end.source-index.json');
    writeJson(feSourceIndex, { tests: [current], stories: [], issues: [] });
    writeText(path.join(testResultsDir, 'storybook-junit.xml'), xml);
    // 옛 covers 로 만든 manifest → fingerprint-mismatch stale 유발
    writeJson(
        path.join(testResultsDir, 'storybook-junit.manifest.json'),
        buildManifest('storybook-vitest', 'storybook-junit.xml', xml, [{ ...current, covers: ['AC 옛 covers'] }])
    );
    runNodeTool('index-test-results.mjs', [], { env: { HARNESS_SCOPE: 'application', HARNESS_OUTPUT_ROOT: root } });

    const testResultsIndex = path.join(indexesDir, 'test-results.index.json');
    const findingsOut = path.join(root, 'front-end-standards.findings.json');
    runNodeTool(
        'validate-front-end-standards.mjs',
        [
            `--fe-source-index=${feSourceIndex}`,
            `--test-results-index=${testResultsIndex}`,
            `--openapi-index=${path.join(root, 'missing-openapi.json')}`,
            `--out=${findingsOut}`
        ],
        { env: { HARNESS_SCOPE: 'application' } }
    );

    const findings = readJson(findingsOut).findings ?? [];
    const stale = findings.filter((finding: any) => finding.ruleId === 'FE-TEST-RESULT-STALE');
    assert.equal(stale.length, 1, 'one FE-TEST-RESULT-STALE finding is emitted');
    assert.equal(stale[0].severity, 'error', 'FE-TEST-RESULT-STALE is an FE category error');
    assert.equal(stale[0].evidence.runtime, 'storybook-vitest');
    assert.equal(stale[0].evidence.rerunCommand, 'npm run app:e2e');
    fs.rmSync(root, { recursive: true, force: true });
});
