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
const reporter = path.join(repoRoot, 'harness', 'tools', 'render-change-set-report.mjs');

function writeJson(file, payload) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

describe('render-change-set-report — cross-scope requirements', () => {
    it('does not warn when affected requirement exists in an additional requirements index', () => {
        const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'change-set-report-'));
        const peerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'change-set-report-peer-'));
        const peerRequirementsIndex = path.join(peerDir, 'requirements.index.json');

        writeJson(path.join(outputRoot, 'indexes', 'change-sets.index.json'), {
            generatedAt: '2026-06-19T00:00:00.000Z',
            schemaVersion: '1',
            source: 'change-sets.index',
            entries: [
                {
                    location: {
                        file: 'harness/docs/change-sets/2026-06-19-cross-scope.md',
                        line: 1,
                        identity: 'harness/docs/change-sets/2026-06-19-cross-scope.md'
                    },
                    title: '2026-06-19 cross scope fixture',
                    status: '완료',
                    requestedDate: '2026-06-19',
                    changeTypes: ['하네스 개선'],
                    discussionStatus: '없음',
                    affectedRequirementIds: ['REQ-901'],
                    requestSummary: [],
                    scopeItems: [],
                    outOfScopeItems: [],
                    completionCriteria: [],
                    verificationCommands: [],
                    openDiscussions: [],
                    issues: []
                }
            ],
            issues: []
        });
        writeJson(path.join(outputRoot, 'indexes', 'requirements.index.json'), {
            generatedAt: '2026-06-19T00:00:00.000Z',
            schemaVersion: '1',
            source: 'requirements.index',
            entries: []
        });
        writeJson(path.join(outputRoot, 'findings', 'requirement-cards.findings.json'), {
            generatedAt: '2026-06-19T00:00:00.000Z',
            schemaVersion: '1',
            source: 'requirement-cards',
            findings: []
        });
        writeJson(path.join(outputRoot, 'state', 'trace.state.json'), {
            generatedAt: '2026-06-19T00:00:00.000Z',
            schemaVersion: '1',
            source: 'trace.state',
            requirements: []
        });
        writeJson(peerRequirementsIndex, {
            generatedAt: '2026-06-19T00:00:00.000Z',
            schemaVersion: '1',
            source: 'requirements.index',
            entries: [
                {
                    id: 'REQ-901',
                    title: 'peer requirement',
                    location: { file: 'app/docs/requirements/REQ-901-peer.md' }
                }
            ]
        });

        execFileSync(process.execPath, [reporter, '--quiet'], {
            cwd: repoRoot,
            env: {
                ...process.env,
                HARNESS_SCOPE: 'harness',
                HARNESS_OUTPUT_ROOT: outputRoot,
                HARNESS_ADDITIONAL_REQUIREMENTS_INDEXES: peerRequirementsIndex
            }
        });

        const report = JSON.parse(fs.readFileSync(path.join(outputRoot, 'reports', 'change-set-report.json'), 'utf8'));
        assert.equal(report.summary.changeSetWarnings, 0);
        assert.deepEqual(report.issues, []);
        assert.equal(report.changeSets[0].affectedRequirements[0].title, 'peer requirement');
    });
});
