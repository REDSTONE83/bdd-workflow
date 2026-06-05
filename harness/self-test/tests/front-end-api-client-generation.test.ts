import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    emptyFrontEndSourceIndex,
    harnessTest,
    readJson,
    readText,
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
        sha256: '1'.repeat(64),
        entries: [{
            kind: 'api-operation',
            requirements: [],
            method: 'GET',
            path: '/fixtures',
            operationId: 'listFixtures',
            location: { file: '', line: 0, identity: 'GET /fixtures' }
        }],
        rawOpenApi: {
            openapi: '3.0.1',
            info: { title: 'Fixture API', version: '1.0.0' },
            paths: {
                '/fixtures': {
                    get: {
                        operationId: 'listFixtures',
                        parameters: [{
                            name: 'pageable',
                            in: 'query',
                            required: false,
                            schema: { $ref: '#/components/schemas/Pageable' }
                        }],
                        responses: {
                            '200': {
                                description: 'ok',
                                content: {
                                    'application/json': {
                                        schema: { $ref: '#/components/schemas/JsonNullableString' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    JsonNullableString: { type: 'object' },
                    Pageable: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer', format: 'int32' },
                            size: { type: 'integer', format: 'int32' },
                            sort: { type: 'array', items: { type: 'string' } }
                        }
                    }
                }
            }
        }
    });
    return openApiIndex;
}

function fixtureFrontEnd(tmp: string) {
    const frontEndRoot = path.join(tmp, 'front-end');
    writeJson(path.join(frontEndRoot, 'package.json'), {
        scripts: {
            'api:generate': 'node tools/generate-api-client.mjs',
            'api:check': 'node tools/generate-api-client.mjs --check',
            validate: 'npm run api:check && npm run typecheck && npm run lint && npm run test && npm run build && npm run source-index',
            'validate:full': 'npm run validate && npm run build-storybook && npm run e2e'
        }
    });
    return frontEndRoot;
}

function generatedDir(frontEndRoot: string) {
    return path.join(frontEndRoot, 'src', 'api', 'generated');
}

function generatedFiles(frontEndRoot: string) {
    return fs.readdirSync(generatedDir(frontEndRoot), { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort();
}

function runGenerator(frontEndRoot: string, openApiIndex: string, check = false) {
    runCommand(process.execPath, [
        path.join(workspaceRoot, 'app', 'front-end', 'tools', 'generate-api-client.mjs'),
        `--front-end-root=${frontEndRoot}`,
        `--openapi-index=${openApiIndex}`,
        ...(check ? ['--check'] : [])
    ], { timeoutMs: 60_000 });
}

harnessTest({
    requirement: 'REQ-007',
    name: 'AC1 한 명령으로 현재 OpenAPI 계약 기준의 API client를 생성한다',
    covers: ['프런트엔드 개발자는 한 명령으로 현재 OpenAPI 계약 기준의 API client를 생성할 수 있다']
}, () => {
    const tmp = tempDir();
    const frontEndRoot = fixtureFrontEnd(tmp);
    const openApiIndex = fixtureOpenApiIndex(tmp);
    runGenerator(frontEndRoot, openApiIndex);

    const schema = path.join(generatedDir(frontEndRoot), 'schema.d.ts');
    const client = path.join(generatedDir(frontEndRoot), 'client.ts');
    const index = path.join(generatedDir(frontEndRoot), 'index.ts');

    assert.ok(fs.existsSync(schema));
    assert.ok(fs.existsSync(client));
    assert.ok(fs.existsSync(index));
    const schemaContent = readText(schema);
    assert.ok(schemaContent.includes('export interface paths'));
    assert.ok(schemaContent.includes('JsonNullableString: string | null'));
    assert.equal(schemaContent.includes('present?: boolean'), false);
    assert.ok(schemaContent.includes('page?: number'));
    assert.ok(schemaContent.includes('size?: number'));
    assert.equal(schemaContent.includes('pageable: components["schemas"]["Pageable"]'), false);
    assert.ok(readText(client).includes('createClient<paths>'));
    assert.ok(readText(index).includes('apiClient'));
});

harnessTest({
    requirement: 'REQ-007',
    name: 'AC2 생성된 API client 파일은 generated 경계 아래에만 존재한다',
    covers: ['생성된 API client는 `app/front-end/src/api/generated` 아래에만 기록된다']
}, () => {
    const tmp = tempDir();
    const frontEndRoot = fixtureFrontEnd(tmp);
    const openApiIndex = fixtureOpenApiIndex(tmp);
    runGenerator(frontEndRoot, openApiIndex);
    assert.deepEqual(generatedFiles(frontEndRoot), [
        '.openapi-source.sha256',
        'client.ts',
        'index.ts',
        'schema.d.ts'
    ]);
});

harnessTest({
    requirement: 'REQ-007',
    name: 'AC3 API client 생성 시 OpenAPI sha256 메타파일이 함께 갱신된다',
    covers: ['API client를 생성하면 현재 OpenAPI 계약을 가리키는 메타파일이 함께 갱신된다']
}, () => {
    const tmp = tempDir();
    const frontEndRoot = fixtureFrontEnd(tmp);
    const openApiIndex = fixtureOpenApiIndex(tmp);
    runGenerator(frontEndRoot, openApiIndex);
    const currentContractSha = readJson(openApiIndex).sha256;
    const generatedSha = readText(path.join(generatedDir(frontEndRoot), '.openapi-source.sha256')).trim();

    assert.equal(generatedSha, currentContractSha);
    assert.match(generatedSha, /^[0-9a-f]{64}$/);
});

harnessTest({
    requirement: 'REQ-007',
    name: 'AC4 OpenAPI 계약이 바뀌었는데 API client가 오래되면 finding이 보고된다',
    covers: ['OpenAPI 계약이 바뀐 뒤 API client를 다시 생성하지 않으면 검사 결과에 오래된 client로 보고된다']
}, () => {
    const tmp = tempDir();
    const feIndex = path.join(tmp, 'front-end.source-index.json');
    const staleMeta = path.join(tmp, 'openapi-source.sha256');
    const outFindings = path.join(tmp, 'front-end-standards.findings.json');
    writeJson(feIndex, emptyFrontEndSourceIndex());
    writeText(staleMeta, `${'0'.repeat(64)}\n`);

    runNodeTool('validate-front-end-standards.mjs', [
        `--fe-source-index=${feIndex}`,
        `--openapi-index=${fixtureOpenApiIndex(tmp)}`,
        `--generated-meta=${staleMeta}`,
        `--out=${outFindings}`
    ]);

    const findings = readJson(outFindings).findings ?? [];
    assert.ok(findings.some((finding: any) => finding.ruleId === 'FE-API-CLIENT-STALE'));
});

harnessTest({
    requirement: 'REQ-007',
    name: 'AC5 프런트엔드 전체 검증 명령이 API client check를 포함한다',
    covers: ['프런트엔드 전체 검증 명령은 API client 생성 결과와 계약 검사를 함께 확인한다']
}, () => {
    const tmp = tempDir();
    const frontEndRoot = fixtureFrontEnd(tmp);
    const openApiIndex = fixtureOpenApiIndex(tmp);
    runGenerator(frontEndRoot, openApiIndex);
    runGenerator(frontEndRoot, openApiIndex, true);

    const scripts = readJson(path.join(frontEndRoot, 'package.json')).scripts;
    assert.ok(scripts.validate.includes('npm run api:check'));
    assert.ok(scripts['validate:full'].includes('npm run validate'));
});
