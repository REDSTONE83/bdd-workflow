import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    assertRuleSeverity,
    emptyFrontEndSourceIndex,
    harnessTest,
    readJson,
    runCommand,
    runNodeTool,
    tempDir,
    workspaceRoot,
    writeJson,
    writeText
} from '../support/harness-test.ts';

function fixtureOpenApiIndex(tmp: string) {
    const openApiIndex = path.join(tmp, 'openapi.index.json');
    writeJson(openApiIndex, {
        generatedAt: '2026-05-23T00:00:00.000Z',
        schemaVersion: '1',
        source: 'openapi.index',
        sha256: '3'.repeat(64),
        entries: [{
            kind: 'api-operation',
            requirements: [],
            method: 'GET',
            path: '/known',
            operationId: 'known',
            location: { file: '', line: 0, identity: 'GET /known' }
        }],
        rawOpenApi: {
            openapi: '3.0.1',
            info: { title: 'Fixture API', version: '1.0.0' },
            paths: { '/known': { get: { operationId: 'known', responses: { '200': { description: 'ok' } } } } }
        }
    });
    return openApiIndex;
}

function writeFrontEndIndex(tmp: string, payload: any) {
    const feIndex = path.join(tmp, 'front-end.source-index.json');
    writeJson(feIndex, payload);
    return feIndex;
}

function runValidator(args: string[]) {
    runNodeTool('validate-front-end-standards.mjs', args, { env: { HARNESS_SCOPE: 'application' } });
}

harnessTest({
    requirement: 'REQ-008',
    name: 'AC1 OpenAPI 계약 산출물이 없으면 error finding으로 보고된다',
    covers: ['OpenAPI 계약 산출물이 없으면 FE API 계약 검사 결과가 오류로 보고된다']
}, () => {
    const tmp = tempDir();
    const feIndex = writeFrontEndIndex(tmp, emptyFrontEndSourceIndex());
    const outFindings = path.join(tmp, 'front-end-standards.findings.json');

    runValidator([
        `--fe-source-index=${feIndex}`,
        `--openapi-index=${path.join(tmp, 'missing-openapi.index.json')}`,
        `--out=${outFindings}`
    ]);

    assertRuleSeverity(outFindings, 'FE-API-CONTRACT-MISSING', 'error');
});

harnessTest({
    requirement: 'REQ-008',
    name: 'AC2 계약에 없는 FE API 호출은 error finding으로 보고된다',
    covers: ['프런트엔드 API 모듈이 OpenAPI 계약에 없는 method와 path를 호출하면 검사 결과가 오류로 보고된다']
}, () => {
    const tmp = tempDir();
    const feIndexPayload = {
        ...emptyFrontEndSourceIndex(),
        apiCalls: [{
            source: 'front-end',
            method: 'GET',
            path: '/totally-bogus-endpoint',
            file: 'front-end/src/api/bogus.ts',
            line: 1
        }]
    };
    const feIndex = writeFrontEndIndex(tmp, feIndexPayload);
    const outFindings = path.join(tmp, 'front-end-standards.findings.json');

    runValidator([
        `--fe-source-index=${feIndex}`,
        `--openapi-index=${fixtureOpenApiIndex(tmp)}`,
        `--out=${outFindings}`
    ]);

    assertRuleSeverity(outFindings, 'FE-API-UNKNOWN-OPERATION', 'error');
});

harnessTest({
    requirement: 'REQ-008',
    name: 'AC3 generated client 메타파일이 없으면 error finding으로 보고된다',
    covers: ['생성된 API client의 OpenAPI 메타파일이 없으면 검사 결과가 오류로 보고된다']
}, () => {
    const tmp = tempDir();
    const feIndex = writeFrontEndIndex(tmp, emptyFrontEndSourceIndex());
    const outFindings = path.join(tmp, 'front-end-standards.findings.json');

    runValidator([
        `--fe-source-index=${feIndex}`,
        `--openapi-index=${fixtureOpenApiIndex(tmp)}`,
        `--generated-meta=${path.join(tmp, 'missing.openapi-source.sha256')}`,
        `--out=${outFindings}`
    ]);

    assertRuleSeverity(outFindings, 'FE-API-CLIENT-NO-METADATA', 'error');
});

harnessTest({
    requirement: 'REQ-008',
    name: 'AC4 오래된 generated client는 error finding으로 보고된다',
    covers: ['생성된 API client가 현재 OpenAPI 계약보다 오래되면 검사 결과가 오류로 보고된다']
}, () => {
    const tmp = tempDir();
    const feIndex = writeFrontEndIndex(tmp, emptyFrontEndSourceIndex());
    const staleMeta = path.join(tmp, 'openapi-source.sha256');
    const outFindings = path.join(tmp, 'front-end-standards.findings.json');
    writeText(staleMeta, `${'0'.repeat(64)}\n`);

    runValidator([
        `--fe-source-index=${feIndex}`,
        `--openapi-index=${fixtureOpenApiIndex(tmp)}`,
        `--generated-meta=${staleMeta}`,
        `--out=${outFindings}`
    ]);

    assertRuleSeverity(outFindings, 'FE-API-CLIENT-STALE', 'error');
});

harnessTest({
    requirement: 'REQ-008',
    name: 'AC5 src/api 밖 직접 fetch는 error finding으로 보고된다',
    covers: ['애플리케이션 소스가 `app/front-end/src/api` 밖에서 직접 `fetch`를 호출하면 검사 결과가 오류로 보고된다']
}, () => {
    const tmp = tempDir();
    const tempFrontEnd = path.join(tmp, 'front-end');
    const badPage = path.join(tempFrontEnd, 'src', 'pages', 'BadPage.tsx');
    const apiModule = path.join(tempFrontEnd, 'src', 'api', 'todo.ts');
    fs.mkdirSync(path.dirname(badPage), { recursive: true });
    fs.mkdirSync(path.dirname(apiModule), { recursive: true });
    writeText(badPage, "export async function load() { return fetch('/bad') }\n");
    writeText(apiModule, "export async function listTodos() { return fetch('/todos') }\n");

    const feIndex = path.join(tmp, 'front-end.source-index.json');
    runCommand(process.execPath, [
        path.join(workspaceRoot, 'app', 'front-end', 'tools', 'source-index.mjs'),
        `--front-end-root=${tempFrontEnd}`,
        `--repo-root=${tmp}`,
        `--out=${feIndex}`
    ], { cwd: workspaceRoot });

    const directFetchIssueCount = (readJson(feIndex).issues ?? [])
        .filter((issue: any) => issue.kind === 'DIRECT_FETCH_OUTSIDE_API')
        .length;
    assert.equal(directFetchIssueCount, 1);

    const outFindings = path.join(tmp, 'front-end-standards.findings.json');
    runValidator([
        `--fe-source-index=${feIndex}`,
        `--openapi-index=${fixtureOpenApiIndex(tmp)}`,
        `--out=${outFindings}`
    ]);

    assertRuleSeverity(outFindings, 'FE-API-DIRECT-FETCH', 'error');
});
