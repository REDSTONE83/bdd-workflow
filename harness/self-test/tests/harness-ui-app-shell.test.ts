import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { harnessTest, tempDir, workspaceRoot } from '../support/harness-test.ts';

async function loadHarnessUiServer() {
    return import(pathToFileURL(path.join(workspaceRoot, 'harness', 'ui', 'server', 'index.ts')).href);
}

async function listen(server: any, host: string) {
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, host, () => {
            server.off('error', reject);
            resolve();
        });
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    return address;
}

async function close(server: any) {
    await new Promise<void>((resolve, reject) => {
        server.close((error: Error | undefined) => error ? reject(error) : resolve());
    });
}

harnessTest({
    requirement: 'REQ-030',
    name: '하네스 UI 서버는 loopback 주소에만 바인딩한다',
    covers: ['하네스 UI 서버는 localhost 요청만 수신하고 다른 호스트 주소로는 접근을 받지 않는다']
}, async () => {
    const { createHarnessUiServer, harnessUiHost, harnessUiPort } = await loadHarnessUiServer();
    assert.equal(harnessUiHost, '127.0.0.1');
    assert.equal(harnessUiPort, 5180);

    const rootPackageJson = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'));
    assert.equal(rootPackageJson.scripts['harness:ui'], 'node harness/tools/run.mjs harness:ui');
    assert.equal(rootPackageJson.scripts['harness:ui:serve'], 'node harness/tools/run.mjs harness:ui:serve');

    const runner = fs.readFileSync(path.join(workspaceRoot, 'harness', 'tools', 'run.mjs'), 'utf8');
    assert.match(runner, /harnessUiNpm\('harness:ui', 'dev'\)/);
    assert.match(runner, /harnessUiNpm\('harness:ui:serve', 'serve'\)/);
    assert.match(runner, /case 'harness:ui:serve'/);

    const packageJson = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'harness', 'ui', 'package.json'), 'utf8'));
    assert.match(packageJson.scripts.dev, /--host 127\.0\.0\.1/);
    assert.equal(packageJson.scripts.server, 'tsx server/index.ts');
    assert.equal(packageJson.scripts.serve, 'npm run build && npm run server');
    assert.doesNotMatch(packageJson.scripts.dev, /--host 0\.0\.0\.0/);
    assert.match(packageJson.scripts.storybook, /--host 127\.0\.0\.1/);
    assert.ok(packageJson.dependencies.express, 'Express 런타임 의존성이 필요하다');
    assert.ok(
        packageJson.dependencies['@types/express'] || packageJson.devDependencies['@types/express'],
        'Express 타입 의존성이 필요하다'
    );

    const viteConfig = fs.readFileSync(path.join(workspaceRoot, 'harness', 'ui', 'vite.config.ts'), 'utf8');
    assert.match(viteConfig, /host:\s*"127\.0\.0\.1"/);
    assert.doesNotMatch(viteConfig, /host:\s*"0\.0\.0\.0"/);
    assert.match(viteConfig, /createHarnessExpressApp/);

    const serverSource = fs.readFileSync(path.join(workspaceRoot, 'harness', 'ui', 'server', 'index.ts'), 'utf8');
    assert.match(serverSource, /from "express"/);
    assert.match(serverSource, /express\.static/);
    assert.match(serverSource, /createHarnessExpressApp/);

    const server = createHarnessUiServer();
    const address = await listen(server, harnessUiHost);
    try {
        assert.equal(address.address, '127.0.0.1');
        const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            status: 'ok',
            host: '127.0.0.1',
            port: 5180
        });
    } finally {
        await close(server);
    }
});

harnessTest({
    requirement: 'REQ-030',
    name: '하네스 UI 서버는 빌드된 SPA와 API를 단일 Express 서버에서 제공한다',
    covers: ['하네스 UI 서버는 빌드된 SPA 정적 자산과 JSON API를 같은 localhost 서버에서 제공하고 클라이언트 route 요청은 index.html로 폴백한다']
}, async () => {
    const { createHarnessUiServer, harnessUiHost } = await loadHarnessUiServer();

    const root = tempDir('harness-ui-spa-');
    const distDir = path.join(root, 'harness', 'ui', 'dist');
    const assetDir = path.join(distDir, 'assets');
    fs.mkdirSync(assetDir, { recursive: true });
    fs.writeFileSync(
        path.join(distDir, 'index.html'),
        '<!doctype html><html><head><title>Harness UI</title></head><body><div id="root"></div></body></html>'
    );
    fs.writeFileSync(path.join(assetDir, 'app.js'), 'globalThis.__harnessUiFixture = true;\n');

    const server = createHarnessUiServer({ workspaceRoot: root });
    const address = await listen(server, harnessUiHost);
    const baseUrl = `http://127.0.0.1:${address.port}`;
    try {
        const shell = await fetch(`${baseUrl}/`);
        assert.equal(shell.status, 200);
        assert.match(await shell.text(), /<div id="root"><\/div>/);

        const clientRoute = await fetch(`${baseUrl}/requirements/REQ-030`);
        assert.equal(clientRoute.status, 200);
        assert.match(await clientRoute.text(), /<title>Harness UI<\/title>/);

        const asset = await fetch(`${baseUrl}/assets/app.js`);
        assert.equal(asset.status, 200);
        assert.match(await asset.text(), /__harnessUiFixture/);

        const api = await fetch(`${baseUrl}/api/health`);
        assert.equal(api.status, 200);
        assert.deepEqual(await api.json(), {
            status: 'ok',
            host: '127.0.0.1',
            port: 5180
        });
    } finally {
        await close(server);
    }
});

async function countArtifactEvents(url: string, triggerChange: () => void) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    let count = 0;
    let triggered = false;
    try {
        const response = await fetch(url, { signal: controller.signal });
        const reader = (response.body as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const matches = buffer.match(/event: artifacts-changed/g);
            const nextCount = matches ? matches.length : 0;
            if (nextCount > count) {
                count = nextCount;
                if (!triggered) {
                    triggered = true;
                    setTimeout(triggerChange, 50);
                }
            }
            if (count >= 2) {
                controller.abort();
                break;
            }
        }
    } catch {
        // abort 시 fetch/read가 throw → 무시한다.
    } finally {
        clearTimeout(timeout);
    }
    return count;
}

harnessTest({
    requirement: 'REQ-030',
    name: '하네스 UI 서버는 산출물 요약과 변경 이벤트를 제공한다',
    covers: ['하네스 UI 서버는 선택한 scope의 산출물 요약(생성 시각·산출물 없음·오래된 원본)을 제공하고 산출물 파일이 바뀌면 갱신 이벤트로 통지한다']
}, async () => {
    const { buildArtifactSummary, createHarnessUiServer, harnessUiHost } = await loadHarnessUiServer();

    const root = tempDir('harness-ui-summary-');
    const stateDir = path.join(root, 'build', 'harness', 'state');
    const requirementsDir = path.join(root, 'harness', 'docs', 'requirements');
    fs.mkdirSync(stateDir, { recursive: true });
    fs.mkdirSync(requirementsDir, { recursive: true });
    const traceFile = path.join(stateDir, 'trace.state.json');
    const docFile = path.join(requirementsDir, 'REQ-900-fixture.md');
    fs.writeFileSync(traceFile, JSON.stringify({ generatedAt: '2026-06-17T00:00:00.000Z' }));
    fs.writeFileSync(docFile, '# fixture\n');
    // 산출물과 원본 문서의 신선도 비교를 벽시계와 무관하게 결정적으로 고정한다.
    const artifactTime = new Date('2026-06-17T00:00:00.000Z');
    fs.utimesSync(traceFile, artifactTime, artifactTime);

    const past = new Date('2026-06-16T00:00:00.000Z');
    fs.utimesSync(docFile, past, past);

    const fresh = buildArtifactSummary('harness', root);
    assert.equal(fresh.generatedAt, '2026-06-17T00:00:00.000Z');
    assert.equal(fresh.missing, false);
    assert.equal(fresh.stale, false);
    assert.deepEqual(fresh.staleSources, []);

    const future = new Date('2026-06-18T00:00:00.000Z');
    fs.utimesSync(docFile, future, future);
    const stale = buildArtifactSummary('harness', root);
    assert.equal(stale.stale, true);
    assert.deepEqual(stale.staleSources, ['harness/docs/requirements/REQ-900-fixture.md']);

    const missing = buildArtifactSummary('application', root);
    assert.equal(missing.missing, true);
    assert.equal(missing.generatedAt, null);

    const server = createHarnessUiServer({ workspaceRoot: root });
    const address = await listen(server, harnessUiHost);
    try {
        const summaryResponse = await fetch(`http://127.0.0.1:${address.port}/api/artifact-summary?scope=harness`);
        assert.equal(summaryResponse.status, 200);
        const summaryBody = await summaryResponse.json();
        assert.equal(summaryBody.generatedAt, '2026-06-17T00:00:00.000Z');
        assert.equal(summaryBody.stale, true);

        const events = await countArtifactEvents(
            `http://127.0.0.1:${address.port}/api/events?scope=harness`,
            () => fs.writeFileSync(path.join(requirementsDir, 'REQ-901-fixture.md'), '# changed\n')
        );
        assert.ok(events >= 2, `산출물 변경 이벤트가 통지되어야 한다 (받은 이벤트 수: ${events})`);
    } finally {
        await close(server);
    }
});
