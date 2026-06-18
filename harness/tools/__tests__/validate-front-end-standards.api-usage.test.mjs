import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const validator = path.join(repoRoot, 'harness', 'tools', 'validate-front-end-standards.mjs');

function apiEntry(method, apiPath) {
    return {
        kind: 'api-operation',
        method,
        path: apiPath,
        operationId: `${method.toLowerCase()}${apiPath.replace(/[^a-z0-9]/gi, '')}`
    };
}

function runValidator({ stories = [], apiUsages = [], apiCalls = [], issues = [], tests = [], cards = [], frontEndFiles = {} }) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-api-usage-'));
    const frontEndRoot = path.join(dir, 'front-end');
    const feSourceIndex = path.join(dir, 'front-end.source-index.json');
    const requirementsIndex = path.join(dir, 'requirements.index.json');
    const openApiIndex = path.join(dir, 'openapi.index.json');
    const generatedMeta = path.join(dir, '.openapi-source.sha256');
    const out = path.join(dir, 'front-end-standards.findings.json');

    for (const [relativeFile, content] of Object.entries(frontEndFiles)) {
        const full = path.join(frontEndRoot, relativeFile);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, content);
    }

    fs.writeFileSync(feSourceIndex, JSON.stringify({
        stories,
        tests,
        apiUsages,
        apiCalls,
        issues
    }, null, 2));
    fs.writeFileSync(requirementsIndex, JSON.stringify({
        entries: cards
    }, null, 2));
    fs.writeFileSync(openApiIndex, JSON.stringify({
        sha256: 'fixture-hash',
        entries: [
            apiEntry('GET', '/known'),
            apiEntry('POST', '/actual'),
            apiEntry('GET', '/paged'),
            apiEntry('PATCH', '/patched/{id}')
        ],
        rawOpenApi: {
            paths: {
                '/known': { get: {} },
                '/actual': { post: {} },
                '/paged': {
                    get: {
                        parameters: [{
                            name: 'pageable',
                            in: 'query',
                            required: true,
                            schema: { $ref: '#/components/schemas/Pageable' }
                        }]
                    }
                },
                '/patched/{id}': {
                    patch: {
                        requestBody: {
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/UpdateThingRequest' }
                                }
                            }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    Pageable: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer', format: 'int32' },
                            size: { type: 'integer', format: 'int32' }
                        }
                    },
                    JsonNullableString: {
                        type: 'object',
                        properties: { present: { type: 'boolean' } }
                    },
                    UpdateThingRequest: {
                        type: 'object',
                        properties: {
                            name: { $ref: '#/components/schemas/JsonNullableString' }
                        }
                    }
                }
            }
        }
    }, null, 2));
    fs.writeFileSync(generatedMeta, 'fixture-hash');

    execFileSync(process.execPath, [
        validator,
        `--front-end-root=${frontEndRoot}`,
        `--fe-source-index=${feSourceIndex}`,
        `--requirements-index=${requirementsIndex}`,
        `--openapi-index=${openApiIndex}`,
        `--generated-meta=${generatedMeta}`,
        `--out=${out}`
    ], { cwd: repoRoot, env: { ...process.env, HARNESS_SCOPE: 'application' } });

    return JSON.parse(fs.readFileSync(out, 'utf8'));
}

function ruleIds(payload) {
    return payload.findings.map((finding) => finding.ruleId).sort();
}

describe('validate-front-end-standards — @UsesApi contract', () => {
    it('passes when @UsesApi and actual calls match for the same requirement', () => {
        const payload = runValidator({
            apiUsages: [{
                requirements: ['REQ-001'],
                method: 'GET',
                path: '/known',
                file: 'front-end/src/Page.tsx',
                line: 3
            }],
            apiCalls: [{
                requirements: ['REQ-001'],
                method: 'GET',
                path: '/known',
                file: 'front-end/src/api/auth.ts',
                line: 10
            }]
        });

        assert.deepEqual(ruleIds(payload), []);
    });

    it('reports declared-but-not-called API usage', () => {
        const payload = runValidator({
            apiUsages: [{
                requirements: ['REQ-001'],
                method: 'GET',
                path: '/known',
                file: 'front-end/src/Page.tsx',
                line: 3
            }]
        });

        assert.deepEqual(ruleIds(payload), ['FE-API-DECLARED-NOT-CALLED']);
    });

    it('reports actual calls that have no @UsesApi declaration', () => {
        const payload = runValidator({
            apiCalls: [{
                requirements: ['REQ-001'],
                method: 'POST',
                path: '/actual',
                file: 'front-end/src/api/auth.ts',
                line: 10
            }]
        });

        assert.deepEqual(ruleIds(payload), ['FE-API-CALL-NOT-DECLARED']);
    });

    it('maps dynamic API call source-index issues to FE findings', () => {
        const payload = runValidator({
            issues: [{
                severity: 'error',
                kind: 'DYNAMIC_API_CALL',
                message: 'API client calls must use a literal OpenAPI path without query string.',
                location: {
                    file: 'front-end/src/api/auth.ts',
                    line: 10,
                    identity: 'apiClient.GET'
                },
                evidence: {
                    callee: 'apiClient.GET',
                    path: null
                }
            }]
        });

        assert.deepEqual(ruleIds(payload), ['FE-API-CALL-DYNAMIC']);
    });

    it('passes when Pageable and JsonNullable calls use canonical wire helpers', () => {
        const payload = runValidator({
            apiUsages: [
                {
                    requirements: ['REQ-001'],
                    method: 'GET',
                    path: '/paged',
                    file: 'front-end/src/Page.tsx',
                    line: 3
                },
                {
                    requirements: ['REQ-001'],
                    method: 'PATCH',
                    path: '/patched/{id}',
                    file: 'front-end/src/Page.tsx',
                    line: 4
                }
            ],
            apiCalls: [
                {
                    requirements: ['REQ-001'],
                    method: 'GET',
                    path: '/paged',
                    file: 'front-end/src/api/things.ts',
                    line: 10,
                    requestShape: {
                        usesPageableQuery: true,
                        usesPageableQueryString: true
                    }
                },
                {
                    requirements: ['REQ-001'],
                    method: 'PATCH',
                    path: '/patched/{id}',
                    file: 'front-end/src/api/things.ts',
                    line: 20,
                    requestShape: {
                        usesNullablePatchBody: true
                    }
                }
            ]
        });

        assert.deepEqual(ruleIds(payload), []);
    });

    it('reports Pageable and JsonNullable calls that skip canonical wire helpers', () => {
        const payload = runValidator({
            apiUsages: [
                {
                    requirements: ['REQ-001'],
                    method: 'GET',
                    path: '/paged',
                    file: 'front-end/src/Page.tsx',
                    line: 3
                },
                {
                    requirements: ['REQ-001'],
                    method: 'PATCH',
                    path: '/patched/{id}',
                    file: 'front-end/src/Page.tsx',
                    line: 4
                }
            ],
            apiCalls: [
                {
                    requirements: ['REQ-001'],
                    method: 'GET',
                    path: '/paged',
                    file: 'front-end/src/api/things.ts',
                    line: 10,
                    requestShape: {
                        usesPageableQuery: false,
                        usesPageableQueryString: false
                    }
                },
                {
                    requirements: ['REQ-001'],
                    method: 'PATCH',
                    path: '/patched/{id}',
                    file: 'front-end/src/api/things.ts',
                    line: 20,
                    requestShape: {
                        usesNullablePatchBody: false
                    }
                }
            ]
        });

        assert.deepEqual(ruleIds(payload), [
            'FE-API-PAGEABLE-WIRE-SHAPE',
            'FE-API-PATCH-WIRE-SHAPE'
        ]);
    });

    it('requires top-level E2E AC coverage to live under tests/e2e/live', () => {
        const payload = runValidator({
            cards: [{
                id: 'REQ-999',
                targetSystem: 'application',
                specRole: '상위 요건',
                verificationLevel: 'e2e',
                acceptanceCriteria: [{
                    target: 'E2E',
                    text: '상위 성과가 실서버에서 동작한다'
                }]
            }],
            tests: [{
                source: 'front-end',
                kind: 'playwright',
                requirements: ['REQ-999'],
                covers: ['상위 성과가 실서버에서 동작한다'],
                file: 'app/front-end/tests/e2e/mock-flow.spec.ts',
                line: 12,
                identity: 'app/front-end/tests/e2e/mock-flow.spec.ts > mock'
            }]
        });

        assert.deepEqual(ruleIds(payload), ['FE-E2E-LIVE-LOCATION']);
    });

    it('allows top-level E2E AC coverage from live Playwright specs', () => {
        const payload = runValidator({
            cards: [{
                id: 'REQ-999',
                targetSystem: 'application',
                specRole: '상위 요건',
                verificationLevel: 'e2e',
                acceptanceCriteria: [{
                    target: 'E2E',
                    text: '상위 성과가 실서버에서 동작한다'
                }]
            }],
            tests: [{
                source: 'front-end',
                kind: 'playwright',
                requirements: ['REQ-999'],
                covers: ['상위 성과가 실서버에서 동작한다'],
                file: 'app/front-end/tests/e2e/live/top-level.live.spec.ts',
                line: 12,
                identity: 'app/front-end/tests/e2e/live/top-level.live.spec.ts > live'
            }]
        });

        assert.deepEqual(ruleIds(payload), []);
    });

    it('rejects top-level E2E AC coverage from live directory files without the live spec suffix', () => {
        const payload = runValidator({
            cards: [{
                id: 'REQ-999',
                targetSystem: 'application',
                specRole: '상위 요건',
                verificationLevel: 'e2e',
                acceptanceCriteria: [{
                    target: 'E2E',
                    text: '상위 성과가 실서버에서 동작한다'
                }]
            }],
            tests: [{
                source: 'front-end',
                kind: 'playwright',
                requirements: ['REQ-999'],
                covers: ['상위 성과가 실서버에서 동작한다'],
                file: 'app/front-end/tests/e2e/live/top-level.spec.ts',
                line: 12,
                identity: 'app/front-end/tests/e2e/live/top-level.spec.ts > misnamed'
            }]
        });

        assert.deepEqual(ruleIds(payload), ['FE-E2E-LIVE-LOCATION']);
    });

    it('rejects API mock helper imports from live Playwright specs', () => {
        const payload = runValidator({
            frontEndFiles: {
                'tests/e2e/live/bad.live.spec.ts': [
                    'import { installAuthRoutes } from "../_helpers/auth-mocks"',
                    'import { test } from "@playwright/test"',
                    ''
                ].join('\n')
            }
        });

        assert.deepEqual(ruleIds(payload), ['FE-LIVE-MOCK-IMPORT']);
    });
});

describe('validate-front-end-standards — Storybook contract', () => {
    const card = {
        id: 'REQ-001',
        status: 'Skeleton 승인',
        location: { file: 'app/docs/requirements/REQ-001-demo.md', line: 1, identity: 'REQ-001' },
        storybookContract: [
            { title: 'Todos/TodoFormDialog', states: ['Create', 'Submitting'] }
        ]
    };

    it('passes when declared Storybook states exist and carry the requirement metadata', () => {
        const payload = runValidator({
            cards: [card],
            stories: [
                { title: 'Todos/TodoFormDialog', story: 'Create', requirements: ['REQ-001'], file: 'app/front-end/src/TodoFormDialog.stories.tsx', line: 10 },
                { title: 'Todos/TodoFormDialog', story: 'Submitting', requirements: ['REQ-001'], file: 'app/front-end/src/TodoFormDialog.stories.tsx', line: 20 }
            ]
        });

        assert.deepEqual(ruleIds(payload), []);
    });

    it('reports a missing Storybook surface from the requirement contract', () => {
        const payload = runValidator({ cards: [card] });

        assert.deepEqual(ruleIds(payload), ['FE-STORY-MISSING-SURFACE']);
    });

    it('reports missing named story states from the requirement contract', () => {
        const payload = runValidator({
            cards: [card],
            stories: [
                { title: 'Todos/TodoFormDialog', story: 'Create', requirements: ['REQ-001'], file: 'app/front-end/src/TodoFormDialog.stories.tsx', line: 10 }
            ]
        });

        assert.deepEqual(ruleIds(payload), ['FE-STORY-MISSING-STATE']);
    });

    it('reports story states that are not connected to the declaring requirement', () => {
        const payload = runValidator({
            cards: [card],
            stories: [
                { title: 'Todos/TodoFormDialog', story: 'Create', requirements: [], file: 'app/front-end/src/TodoFormDialog.stories.tsx', line: 10 },
                { title: 'Todos/TodoFormDialog', story: 'Submitting', requirements: ['REQ-001'], file: 'app/front-end/src/TodoFormDialog.stories.tsx', line: 20 }
            ]
        });

        assert.deepEqual(ruleIds(payload), ['FE-STORY-REQ-MISMATCH']);
    });
});
