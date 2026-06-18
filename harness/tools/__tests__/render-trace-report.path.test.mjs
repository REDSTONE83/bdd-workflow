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
const renderer = path.join(repoRoot, 'harness', 'tools', 'render-trace-report.mjs');

function writeTraceState(outputRoot) {
    fs.mkdirSync(path.join(outputRoot, 'state'), { recursive: true });
    fs.writeFileSync(path.join(outputRoot, 'state', 'trace.state.json'), JSON.stringify({
        generatedAt: '2026-06-16T00:00:00.000Z',
        schemaVersion: '1',
        source: 'trace.state',
        filter: null,
        summary: {
            total: 1,
            red: 0,
            green: 0,
            blue: 1,
            unknownApis: 0,
            unknownTests: 0,
            unknownEntities: 0,
            unknownFeatures: 0,
            unknownFrontEndSurfaces: 0,
            structureIssues: 1,
            scenarioWarnings: 0
        },
        terminology: { present: false },
        requirements: [
            {
                id: 'REQ-900',
                title: 'fixture',
                state: 'BLUE',
                status: '승인',
                requirementType: '하네스',
                specRole: '원자 요건',
                targetSystem: 'harness',
                productArea: 'harness',
                qualityAttributes: ['none'],
                verificationLevel: 'static',
                relatedRequirementIds: [],
                replacedByRequirementIds: [],
                file: 'harness/docs/requirements/REQ-900-fixture.md',
                redReasons: [],
                blueBlockedBy: [],
                apis: [],
                tests: [],
                scenarios: [],
                entities: [],
                frontEnd: { pages: [], routes: [], stories: [], apiUsages: [], apiCalls: [] },
                coverage: []
            }
        ],
        structureReports: [
            {
                id: 'REQ-901',
                title: 'issue fixture',
                file: 'harness/docs/requirements/REQ-901-issue.md',
                issues: ['fixture issue']
            }
        ],
        unknownApis: [],
        unknownTests: [],
        unknownEntities: [],
        unknownFeatures: [],
        unknownFrontEndSurfaces: [],
        frontEndStandards: { findings: [] },
        scenarioStandards: { findings: [] },
        scenarioWarnings: []
    }, null, 2));
}

describe('render-trace-report — repo-relative paths', () => {
    it('renders trace state file paths as-is even when cwd is not the repo root', () => {
        const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-report-path-'));
        writeTraceState(outputRoot);

        execFileSync(process.execPath, [renderer, '--quiet'], {
            cwd: path.join(repoRoot, 'harness'),
            env: {
                ...process.env,
                HARNESS_SCOPE: 'harness',
                HARNESS_OUTPUT_ROOT: outputRoot
            }
        });

        const report = fs.readFileSync(path.join(outputRoot, 'reports', 'trace-report.md'), 'utf8');
        assert.match(report, /^Card: harness\/docs\/requirements\/REQ-900-fixture\.md$/m);
        assert.match(report, /^Card: harness\/docs\/requirements\/REQ-901-issue\.md$/m);
        assert.doesNotMatch(report, /harness\/harness\/docs/);
    });
});
