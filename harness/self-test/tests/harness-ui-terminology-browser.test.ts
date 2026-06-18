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
    requirement: 'REQ-036',
    name: '하네스 UI 서버는 terminology index 값을 표준 용어 DTO로 보존한다',
    covers: ['하네스 UI 서버가 제공하는 표준 용어 데이터는 `terminology.index.json`의 term key, status, sourceFile, meaning, allow, ban, names 값을 보존한다']
}, async () => {
    const { buildTerminologyBrowserModel, createHarnessUiServer } = await loadHarnessUiServer();
    const terminologyIndex = {
        generatedAt: '2026-06-17T00:00:00.000Z',
        terms: {
            'harness.standardTerm': {
                status: 'approved',
                sourceFile: 'harness/docs/terminology/domains/harness.json',
                ko: '표준 용어',
                en: 'standard term',
                meaning: '하네스 용어 사전에 등록된 term key와 정의.',
                allow: ['용어', 'term key'],
                ban: ['비표준 용어'],
                names: {
                    json: ['terms', 'terminology'],
                    field: ['standardTerm']
                },
                note: '조회 전용 DTO fixture',
                reason: 'UI 서버가 산출물 값을 보존하는지 검증한다.'
            }
        }
    };

    assert.deepEqual(buildTerminologyBrowserModel(terminologyIndex, 'harness'), {
        scope: 'harness',
        generatedAt: '2026-06-17T00:00:00.000Z',
        terms: [
            {
                key: 'harness.standardTerm',
                domain: 'harness',
                status: 'approved',
                sourceFile: 'harness/docs/terminology/domains/harness.json',
                ko: '표준 용어',
                en: 'standard term',
                meaning: '하네스 용어 사전에 등록된 term key와 정의.',
                allow: ['용어', 'term key'],
                ban: ['비표준 용어'],
                names: {
                    json: ['terms', 'terminology'],
                    field: ['standardTerm']
                },
                note: '조회 전용 DTO fixture',
                reason: 'UI 서버가 산출물 값을 보존하는지 검증한다.'
            }
        ]
    });

    const root = tempDir('harness-ui-terminology-');
    writeJson(path.join(root, 'build', 'harness', 'indexes', 'terminology.index.json'), terminologyIndex);
    const server = createHarnessUiServer({ workspaceRoot: root });
    const baseUrl = await listen(server);
    try {
        const response = await fetch(`${baseUrl}/api/terminology?scope=harness`);
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.equal(body.scope, 'harness');
        assert.equal(body.generatedAt, terminologyIndex.generatedAt);
        assert.equal(body.terms[0].key, 'harness.standardTerm');
        assert.equal(body.terms[0].status, terminologyIndex.terms['harness.standardTerm'].status);
        assert.equal(body.terms[0].sourceFile, terminologyIndex.terms['harness.standardTerm'].sourceFile);
        assert.equal(body.terms[0].meaning, terminologyIndex.terms['harness.standardTerm'].meaning);
        assert.deepEqual(body.terms[0].allow, terminologyIndex.terms['harness.standardTerm'].allow);
        assert.deepEqual(body.terms[0].ban, terminologyIndex.terms['harness.standardTerm'].ban);
        assert.deepEqual(body.terms[0].names, terminologyIndex.terms['harness.standardTerm'].names);
    } finally {
        await close(server);
    }
});
