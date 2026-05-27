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
const validator = path.join(repoRoot, 'tools', 'harness', 'validate-front-end-standards.mjs');

function apiEntry(method, apiPath) {
    return {
        kind: 'api-operation',
        method,
        path: apiPath,
        operationId: `${method.toLowerCase()}${apiPath.replace(/[^a-z0-9]/gi, '')}`
    };
}

function runValidator({ apiUsages = [], apiCalls = [], issues = [] }) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-api-usage-'));
    const feSourceIndex = path.join(dir, 'front-end.source-index.json');
    const openApiIndex = path.join(dir, 'openapi.index.json');
    const generatedMeta = path.join(dir, '.openapi-source.sha256');
    const out = path.join(dir, 'front-end-standards.findings.json');

    fs.writeFileSync(feSourceIndex, JSON.stringify({
        stories: [],
        apiUsages,
        apiCalls,
        issues
    }, null, 2));
    fs.writeFileSync(openApiIndex, JSON.stringify({
        sha256: 'fixture-hash',
        entries: [apiEntry('GET', '/known'), apiEntry('POST', '/actual')]
    }, null, 2));
    fs.writeFileSync(generatedMeta, 'fixture-hash');

    execFileSync(process.execPath, [
        validator,
        `--fe-source-index=${feSourceIndex}`,
        `--openapi-index=${openApiIndex}`,
        `--generated-meta=${generatedMeta}`,
        `--out=${out}`
    ], { cwd: repoRoot });

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
});
