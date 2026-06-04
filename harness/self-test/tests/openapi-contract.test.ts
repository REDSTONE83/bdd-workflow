import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    emptyFrontEndSourceIndex,
    harnessTest,
    readJson,
    runNodeTool,
    tempDir,
    writeJson,
    writeText
} from '../support/harness-test.ts';

const expectedOperations = [
    'GET /fixtures',
    'POST /fixtures'
];

function fixtureOpenApiIndex(tmp: string) {
    const openApiIndex = path.join(tmp, 'openapi.index.json');
    writeJson(openApiIndex, {
        generatedAt: '2026-05-23T00:00:00.000Z',
        schemaVersion: '1',
        source: 'openapi.index',
        sha256: '2'.repeat(64),
        entries: expectedOperations.map((operation) => {
            const [method, apiPath] = operation.split(' ');
            return {
                kind: 'api-operation',
                requirements: [],
                method,
                path: apiPath,
                operationId: `${method.toLowerCase()}Fixture`,
                location: { file: '', line: 0, identity: operation }
            };
        }),
        rawOpenApi: {
            openapi: '3.0.1',
            info: { title: 'Fixture API', version: '1.0.0' },
            paths: {
                '/fixtures': {
                    get: { operationId: 'listFixtures', responses: { '200': { description: 'ok' } } },
                    post: { operationId: 'createFixture', responses: { '201': { description: 'created' } } }
                }
            }
        }
    });
    return openApiIndex;
}

function runValidator(args: string[]) {
    runNodeTool('validate-front-end-standards.mjs', args);
}

harnessTest({
    requirement: 'REQ-006',
    name: 'AC1 백엔드 빌드가 build/app/indexes/openapi.index.json을 생성한다',
    covers: ['백엔드 빌드 한 번에 OpenAPI 계약 JSON이 `build/app/indexes/openapi.index.json`에 생성된다']
}, () => {
    const root = readJson(fixtureOpenApiIndex(tempDir()));
    assert.equal(root.schemaVersion, '1');
    assert.equal(root.source, 'openapi.index');
    assert.match(root.sha256, /^[0-9a-f]{64}$/);
    assert.ok(Array.isArray(root.entries));
    assert.ok(root.entries.length > 0);
    assert.equal(typeof root.rawOpenApi, 'object');
});

harnessTest({
    requirement: 'REQ-006',
    name: 'AC2 OpenAPI 계약이 백엔드의 모든 HTTP 엔드포인트를 포함한다',
    covers: ['OpenAPI 계약에는 현재 백엔드가 노출하는 모든 HTTP 엔드포인트의 method와 path가 포함된다']
}, () => {
    const root = readJson(fixtureOpenApiIndex(tempDir()));
    const indexedOperations = (root.entries ?? [])
        .filter((entry: any) => entry.kind === 'api-operation')
        .map((entry: any) => `${entry.method} ${entry.path}`);
    for (const operation of expectedOperations) {
        assert.ok(indexedOperations.includes(operation), `${operation} was missing from openapi.index.json`);
    }
});

harnessTest({
    requirement: 'REQ-006',
    name: 'AC3 FE 호출이 OpenAPI 계약에 없으면 FE-API-UNKNOWN-OPERATION 이 보고된다',
    covers: ['프런트엔드 API 모듈이 호출하는 method와 path가 OpenAPI 계약에 없으면 해당 호출이 검사 결과에 보고된다']
}, () => {
    const tmp = tempDir();
    const feIndex = {
        ...emptyFrontEndSourceIndex(),
        apiCalls: [{
            method: 'GET',
            path: '/totally-bogus-endpoint',
            file: 'front-end/src/api/bogus.ts',
            line: 1
        }]
    };
    const feFixture = path.join(tmp, 'front-end.source-index.json');
    const outFindings = path.join(tmp, 'findings.json');
    writeJson(feFixture, feIndex);

    runValidator([
        `--fe-source-index=${feFixture}`,
        `--openapi-index=${fixtureOpenApiIndex(tmp)}`,
        `--out=${outFindings}`
    ]);

    const findings = readJson(outFindings).findings ?? [];
    assert.ok(findings.some((finding: any) =>
        finding.ruleId === 'FE-API-UNKNOWN-OPERATION' &&
        finding.evidence?.path === '/totally-bogus-endpoint'
    ));
});

harnessTest({
    requirement: 'REQ-006',
    name: 'AC4 FE generated 클라이언트의 SHA-256이 계약과 다르면 FE-API-CLIENT-STALE이 보고된다',
    covers: ['프런트엔드 생성 클라이언트가 현재 OpenAPI 계약보다 오래되면 해당 클라이언트가 검사 결과에 보고된다']
}, () => {
    const tmp = tempDir();
    const feFixture = path.join(tmp, 'front-end.source-index.json');
    const staleMeta = path.join(tmp, 'openapi-source.sha256');
    const outFindings = path.join(tmp, 'findings.json');
    writeJson(feFixture, emptyFrontEndSourceIndex());
    writeText(staleMeta, `${'0'.repeat(64)}\n`);

    runValidator([
        `--fe-source-index=${feFixture}`,
        `--openapi-index=${fixtureOpenApiIndex(tmp)}`,
        `--generated-meta=${staleMeta}`,
        `--out=${outFindings}`
    ]);

    const findings = readJson(outFindings).findings ?? [];
    assert.ok(findings.some((finding: any) => finding.ruleId === 'FE-API-CLIENT-STALE'));
});

harnessTest({
    requirement: 'REQ-006',
    name: 'AC5 OpenAPI 계약 산출물이 없으면 FE-API-CONTRACT-MISSING이 보고된다',
    covers: ['OpenAPI 계약 산출물이 빌드 결과에 없으면 검사 결과에 별도로 보고된다']
}, () => {
    const tmp = tempDir();
    const feFixture = path.join(tmp, 'front-end.source-index.json');
    const missingOpenApi = path.join(tmp, 'not-here.json');
    const outFindings = path.join(tmp, 'findings.json');
    writeJson(feFixture, emptyFrontEndSourceIndex());

    assert.equal(fs.existsSync(missingOpenApi), false);
    runValidator([
        `--fe-source-index=${feFixture}`,
        `--openapi-index=${missingOpenApi}`,
        `--out=${outFindings}`
    ]);

    const findings = readJson(outFindings).findings ?? [];
    assert.ok(findings.some((finding: any) => finding.ruleId === 'FE-API-CONTRACT-MISSING'));
});
