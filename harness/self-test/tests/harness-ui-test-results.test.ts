import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { harnessTest, tempDir, workspaceRoot, writeJson } from '../support/harness-test.ts';

async function loadHarnessUiServer() {
    return import(pathToFileURL(path.join(workspaceRoot, 'harness', 'ui', 'server', 'index.ts')).href);
}

async function listen(server: any) {
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject);
            resolve();
        });
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    return `http://127.0.0.1:${address.port}`;
}

async function close(server: any) {
    await new Promise<void>((resolve, reject) => {
        server.close((error: Error | undefined) => error ? reject(error) : resolve());
    });
}

harnessTest({
    requirement: 'REQ-039',
    name: '하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다',
    covers: ['하네스 UI 서버가 제공하는 테스트 결과 DTO는 test source index와 test-results index의 식별자, 테스트 구분, 런타임, 상태, 요건 ID와 제목, 구현 위치 값을 보존한다']
}, async () => {
    const { createHarnessUiServer } = await loadHarnessUiServer();
    const root = tempDir('harness-ui-tests-');

    writeJson(path.join(root, 'build', 'harness', 'state', 'trace.state.json'), {
        generatedAt: '2026-06-25T00:00:00.000Z',
        requirements: [
            {
                id: 'REQ-039',
                title: '하네스 UI 테스트 결과 조회',
                state: 'BLUE',
                status: '승인',
                productArea: 'harness',
                priority: '중간',
                specRole: '원자 요건'
            },
            {
                id: 'REQ-038',
                title: '하네스 UI 표면 조회',
                state: 'BLUE',
                status: '승인',
                productArea: 'harness',
                priority: '중간',
                specRole: '원자 요건'
            }
        ]
    });
    writeJson(path.join(root, 'build', 'app', 'state', 'trace.state.json'), {
        generatedAt: '2026-06-25T00:00:00.000Z',
        requirements: [
            {
                id: 'REQ-011',
                title: '로그인과 인증 세션',
                state: 'BLUE',
                status: '승인',
                productArea: 'auth',
                priority: '높음',
                specRole: '원자 요건'
            }
        ]
    });
    writeJson(path.join(root, 'build', 'app', 'indexes', 'backend.source-index.json'), {
        generatedAt: '2026-06-25T00:00:00.000Z',
        tests: [
            {
                requirements: ['REQ-011'],
                className: 'AuthLoginAcceptanceTest',
                method: 'successfulLoginIssuesAccessTokenCookie',
                identity: 'AuthLoginAcceptanceTest.successfulLoginIssuesAccessTokenCookie',
                displayName: '정상 자격 증명 로그인은 204 + ACCESS_TOKEN Cookie 를 응답한다',
                covers: ['등록된 이메일과 비밀번호로 로그인하면 인증 세션이 시작된다'],
                scope: 'application',
                file: 'app/back-end/src/test/java/com/example/bddworkflow/auth/AuthLoginAcceptanceTest.java',
                line: 55
            }
        ]
    });
    writeJson(path.join(root, 'build', 'app', 'indexes', 'front-end.source-index.json'), {
        generatedAt: '2026-06-25T00:00:00.000Z',
        tests: []
    });
    writeJson(path.join(root, 'build', 'app', 'indexes', 'test-results.index.json'), {
        generatedAt: '2026-06-25T00:02:00.000Z',
        entries: [
            {
                kind: 'test-result',
                runtime: 'junit',
                scope: 'application',
                status: 'PASS',
                identity: 'AuthLoginAcceptanceTest.정상 자격 증명 로그인은 204 + ACCESS_TOKEN Cookie 를 응답한다',
                alternateIdentities: [],
                requirements: [],
                location: {
                    file: 'build/app/runs/run-id/test-results/test/TEST-com.example.bddworkflow.auth.AuthLoginAcceptanceTest.xml',
                    line: 0,
                    identity: 'AuthLoginAcceptanceTest.정상 자격 증명 로그인은 204 + ACCESS_TOKEN Cookie 를 응답한다'
                }
            }
        ],
        issues: []
    });
    writeJson(path.join(root, 'build', 'harness', 'indexes', 'front-end.source-index.json'), {
        generatedAt: '2026-06-25T00:00:00.000Z',
        tests: [
            {
                source: 'front-end',
                runtime: 'storybook-vitest',
                requirements: ['REQ-039'],
                covers: ['테스트 결과 화면은 선택한 scope의 테스트 총수와 PASS, FAIL, SKIP, NOT_RUN 수를 요약하고 테스트 목록을 표시한다'],
                displayName: 'Harness/Tests/TestResults / SummaryAndList',
                identity: 'harness/ui/src/features/tests/TestResults.stories.tsx:42 > Harness/Tests/TestResults / SummaryAndList',
                resultKeys: ['Harness/Tests/TestResults > SummaryAndList'],
                file: 'harness/ui/src/features/tests/TestResults.stories.tsx',
                line: 42,
                location: {
                    file: 'harness/ui/src/features/tests/TestResults.stories.tsx',
                    line: 42,
                    identity: 'harness/ui/src/features/tests/TestResults.stories.tsx:42 > Harness/Tests/TestResults / SummaryAndList'
                }
            },
            {
                source: 'front-end',
                runtime: 'storybook-vitest',
                requirements: ['REQ-038'],
                covers: [],
                displayName: 'Harness/Surfaces/SurfaceInventory / EmptyScope',
                identity: 'harness/ui/src/features/surfaces/SurfaceInventory.stories.tsx:140 > Harness/Surfaces/SurfaceInventory / EmptyScope',
                resultKeys: ['Harness/Surfaces/SurfaceInventory > EmptyScope'],
                file: 'harness/ui/src/features/surfaces/SurfaceInventory.stories.tsx',
                line: 140,
                location: {
                    file: 'harness/ui/src/features/surfaces/SurfaceInventory.stories.tsx',
                    line: 140,
                    identity: 'harness/ui/src/features/surfaces/SurfaceInventory.stories.tsx:140 > Harness/Surfaces/SurfaceInventory / EmptyScope'
                }
            }
        ]
    });
    writeJson(path.join(root, 'build', 'harness', 'indexes', 'harness.self-test.index.json'), {
        generatedAt: '2026-06-25T00:01:00.000Z',
        tests: [
            {
                scope: 'harness',
                source: 'harness',
                runtime: 'node',
                requirements: ['REQ-039'],
                covers: ['하네스 UI 서버가 제공하는 테스트 결과 DTO는 test source index와 test-results index의 식별자, 테스트 구분, 런타임, 상태, 요건 ID와 제목, 구현 위치 값을 보존한다'],
                displayName: '하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다',
                identity: 'harness/self-test/tests/harness-ui-test-results.test.ts > 하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다',
                resultKeys: ['하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다'],
                file: 'harness/self-test/tests/harness-ui-test-results.test.ts',
                line: 27,
                location: {
                    file: 'harness/self-test/tests/harness-ui-test-results.test.ts',
                    line: 27,
                    identity: 'harness/self-test/tests/harness-ui-test-results.test.ts > 하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다'
                }
            }
        ]
    });
    writeJson(path.join(root, 'build', 'harness', 'indexes', 'test-results.index.json'), {
        generatedAt: '2026-06-25T00:02:00.000Z',
        entries: [
            {
                kind: 'test-result',
                runtime: 'storybook-vitest',
                scope: 'harness',
                status: 'PASS',
                identity: 'Harness/Tests/TestResults > SummaryAndList',
                alternateIdentities: ['Harness/Tests/TestResults / SummaryAndList'],
                requirements: [],
                location: {
                    file: 'harness/ui/src/features/tests/TestResults.stories.tsx',
                    line: 42,
                    identity: 'Harness/Tests/TestResults > SummaryAndList'
                }
            },
            {
                kind: 'test-result',
                runtime: 'node',
                scope: 'harness',
                status: 'FAIL',
                identity: 'harness/self-test/tests/harness-ui-test-results.test.ts > 하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다',
                alternateIdentities: ['하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다'],
                requirements: [],
                location: {
                    file: 'harness/self-test/tests/harness-ui-test-results.test.ts',
                    line: 27,
                    identity: 'harness/self-test/tests/harness-ui-test-results.test.ts > 하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다'
                }
            },
            {
                kind: 'test-result',
                runtime: 'playwright',
                scope: 'harness',
                status: 'SKIP',
                identity: 'harness/ui/tests/live-smoke.spec.ts > smoke',
                alternateIdentities: [],
                requirements: [],
                location: {
                    file: 'build/harness/test-results/e2e-live-results.json',
                    line: 1,
                    identity: 'harness/ui/tests/live-smoke.spec.ts > smoke'
                }
            }
        ],
        issues: [
            {
                kind: 'FE_TEST_RESULT_STALE',
                runtime: 'storybook-vitest',
                reason: 'fingerprint-mismatch',
                resultFile: 'build/harness/test-results/storybook-junit.xml',
                identity: 'Harness/Tests/TestResults > SummaryAndList',
                location: {
                    file: 'harness/ui/src/features/tests/TestResults.stories.tsx',
                    line: 42,
                    identity: 'Harness/Tests/TestResults > SummaryAndList'
                }
            }
        ]
    });

    const server = createHarnessUiServer({ workspaceRoot: root });
    const baseUrl = await listen(server);
    try {
        const response = await fetch(`${baseUrl}/api/tests?scope=harness`);
        assert.equal(response.status, 200);
        const body = await response.json();

        assert.equal(body.scope, 'harness');
        assert.equal(body.generatedAt, '2026-06-25T00:02:00.000Z');
        assert.equal(body.sourceGeneratedAt, '2026-06-25T00:00:00.000Z');
        assert.equal(body.resultGeneratedAt, '2026-06-25T00:02:00.000Z');
        assert.deepEqual(body.summary, [
            { status: 'PASS', count: 1 },
            { status: 'FAIL', count: 1 },
            { status: 'SKIP', count: 1 },
            { status: 'NOT_RUN', count: 1 }
        ]);
        assert.deepEqual(body.typeSummary, [
            { type: 'API', count: 0 },
            { type: 'UI', count: 2 },
            { type: 'UNIT', count: 1 },
            { type: 'E2E', count: 1 },
            { type: 'STATIC', count: 0 },
            { type: 'OTHER', count: 0 }
        ]);

        const story = body.tests.find((test: any) => test.displayName === 'Harness/Tests/TestResults / SummaryAndList');
        assert.equal(story.runtime, 'storybook-vitest');
        assert.equal(story.testType, 'UI');
        assert.equal(story.status, 'PASS');
        assert.deepEqual(story.requirements, [{ id: 'REQ-039', title: '하네스 UI 테스트 결과 조회', traceState: 'BLUE' }]);
        assert.deepEqual(story.covers, [
            {
                text: '테스트 결과 화면은 선택한 scope의 테스트 총수와 PASS, FAIL, SKIP, NOT_RUN 수를 요약하고 테스트 목록을 표시한다',
                requirements: [{ id: 'REQ-039', title: '하네스 UI 테스트 결과 조회', traceState: 'BLUE' }]
            }
        ]);
        assert.equal(story.file, 'harness/ui/src/features/tests/TestResults.stories.tsx');
        assert.equal(story.line, 42);
        assert.equal(story.resultIdentity, 'Harness/Tests/TestResults > SummaryAndList');

        const node = body.tests.find((test: any) => test.runtime === 'node');
        assert.equal(node.status, 'FAIL');
        assert.equal(node.testType, 'UNIT');
        assert.equal(node.source, 'harness');
        assert.deepEqual(node.requirements, [{ id: 'REQ-039', title: '하네스 UI 테스트 결과 조회', traceState: 'BLUE' }]);

        const notRun = body.tests.find((test: any) => test.displayName === 'Harness/Surfaces/SurfaceInventory / EmptyScope');
        assert.equal(notRun.status, 'NOT_RUN');
        assert.equal(notRun.testType, 'UI');
        assert.deepEqual(notRun.requirements, [{ id: 'REQ-038', title: '하네스 UI 표면 조회', traceState: 'BLUE' }]);
        assert.equal(notRun.resultIdentity, undefined);

        const resultOnly = body.tests.find((test: any) => test.runtime === 'playwright');
        assert.equal(resultOnly.source, 'test-results');
        assert.equal(resultOnly.testType, 'E2E');
        assert.equal(resultOnly.status, 'SKIP');
        assert.equal(resultOnly.resultFile, 'build/harness/test-results/e2e-live-results.json');

        assert.equal(body.issues[0].kind, 'FE_TEST_RESULT_STALE');
        assert.equal(body.issues[0].runtime, 'storybook-vitest');
        assert.equal(body.issues[0].reason, 'fingerprint-mismatch');
        assert.equal(body.issues[0].file, 'harness/ui/src/features/tests/TestResults.stories.tsx');

        const appResponse = await fetch(`${baseUrl}/api/tests?scope=application`);
        assert.equal(appResponse.status, 200);
        const appBody = await appResponse.json();
        const apiTest = appBody.tests.find((test: any) => test.runtime === 'junit');

        assert.equal(apiTest.testType, 'API');
        assert.equal(apiTest.source, 'back-end');
        assert.equal(apiTest.status, 'PASS');
        assert.equal(apiTest.displayName, '정상 자격 증명 로그인은 204 + ACCESS_TOKEN Cookie 를 응답한다');
        assert.deepEqual(apiTest.requirements, [{ id: 'REQ-011', title: '로그인과 인증 세션', traceState: 'BLUE' }]);
        assert.deepEqual(apiTest.covers, [
            {
                text: '등록된 이메일과 비밀번호로 로그인하면 인증 세션이 시작된다',
                requirements: [{ id: 'REQ-011', title: '로그인과 인증 세션', traceState: 'BLUE' }]
            }
        ]);
        assert.equal(apiTest.file, 'app/back-end/src/test/java/com/example/bddworkflow/auth/AuthLoginAcceptanceTest.java');
        assert.equal(apiTest.line, 55);
        assert.equal(apiTest.resultFile, 'build/app/runs/run-id/test-results/test/TEST-com.example.bddworkflow.auth.AuthLoginAcceptanceTest.xml');
    } finally {
        await close(server);
    }
});
