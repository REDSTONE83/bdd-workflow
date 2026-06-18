import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { harnessTest, workspaceRoot } from '../support/harness-test.ts';

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
    requirement: 'REQ-035',
    name: '하네스 UI 서버는 허용 목록 밖 명령 실행 요청을 거절한다',
    covers: ['하네스 UI 서버는 허용 목록에 없는 명령 실행 요청을 거절한다']
}, async () => {
    const { allowedCommands, createHarnessUiServer, validateCommandRunRequest } = await loadHarnessUiServer();

    assert.deepEqual(allowedCommands, [
        'harness:trace',
        'harness:validate',
        'harness:self-test',
        'app:trace',
        'app:validate',
        'repo:validate'
    ]);
    assert.deepEqual(validateCommandRunRequest({ commandId: 'npm:arbitrary' }), {
        ok: false,
        status: 403,
        error: '허용 목록 밖 명령이다.'
    });
    assert.equal(validateCommandRunRequest({ commandId: 'harness:trace', requirementId: 'DROP TABLE' }).status, 400);
    assert.equal(validateCommandRunRequest({ commandId: 'harness:validate', requirementId: 'REQ-031' }).status, 400);

    const server = createHarnessUiServer();
    const baseUrl = await listen(server);
    try {
        const rejected = await fetch(`${baseUrl}/api/commands/run`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ commandId: 'npm:arbitrary' })
        });
        assert.equal(rejected.status, 403);
        assert.deepEqual(await rejected.json(), {
            error: '허용 목록 밖 명령이다.',
            allowedCommands
        });

        const accepted = await fetch(`${baseUrl}/api/commands/run`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ commandId: 'harness:trace', requirementId: 'REQ-031' })
        });
        assert.equal(accepted.status, 202);
        const acceptedBody = await accepted.json();
        assert.equal(acceptedBody.commandId, 'harness:trace');
        assert.equal(acceptedBody.requirementId, 'REQ-031');

        const malformedRequirement = await fetch(`${baseUrl}/api/commands/run`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ commandId: 'harness:trace', requirementId: 'DROP TABLE' })
        });
        assert.equal(malformedRequirement.status, 400);

        const unsupportedRequirement = await fetch(`${baseUrl}/api/commands/run`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ commandId: 'harness:validate', requirementId: 'REQ-031' })
        });
        assert.equal(unsupportedRequirement.status, 400);
    } finally {
        await close(server);
    }
});
