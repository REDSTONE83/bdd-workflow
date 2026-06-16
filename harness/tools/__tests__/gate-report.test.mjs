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
const gate = path.join(repoRoot, 'harness', 'tools', 'gate.mjs');

const findingFiles = [
    'requirement-cards.findings.json',
    'cross-artifact.findings.json',
    'back-end-standards.findings.json',
    'front-end-standards.findings.json',
    'scenarios.findings.json',
    'terminology.findings.json'
];

function writeGateInputs(outputRoot) {
    fs.mkdirSync(path.join(outputRoot, 'state'), { recursive: true });
    fs.mkdirSync(path.join(outputRoot, 'findings'), { recursive: true });
    fs.writeFileSync(path.join(outputRoot, 'state', 'trace.state.json'), JSON.stringify({
        generatedAt: '2026-06-16T00:00:00.000Z',
        schemaVersion: '1',
        source: 'trace.state',
        filter: null,
        requirements: [
            {
                id: 'REQ-900',
                status: '승인',
                state: 'BLUE',
                redReasons: [],
                blueBlockedBy: []
            }
        ]
    }, null, 2));
    for (const file of findingFiles) {
        fs.writeFileSync(path.join(outputRoot, 'findings', file), JSON.stringify({
            generatedAt: '2026-06-16T00:00:00.000Z',
            schemaVersion: '1',
            owner: file.replace('.findings.json', ''),
            summary: { error: 0, warning: 0, info: 0 },
            findings: []
        }, null, 2));
    }
}

describe('gate report', () => {
    it('writes a UI-readable gate-report.json on every gate run', () => {
        const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-report-'));
        writeGateInputs(outputRoot);

        execFileSync(process.execPath, [gate, '--check', '--quiet'], {
            cwd: repoRoot,
            env: {
                ...process.env,
                HARNESS_SCOPE: 'harness',
                HARNESS_OUTPUT_ROOT: outputRoot
            }
        });

        const report = JSON.parse(fs.readFileSync(path.join(outputRoot, 'reports', 'gate-report.json'), 'utf8'));

        assert.equal(report.schemaVersion, '1');
        assert.equal(report.source, 'gate');
        assert.equal(report.scope, 'harness');
        assert.deepEqual(report.summary, {
            passed: true,
            traceFailing: false,
            categoryFailing: false
        });
        assert.deepEqual(report.categories.map((category) => category.category), [
            'TRACE',
            'CARD',
            'REF',
            'TRC',
            'BE',
            'FE',
            'SCN',
            'TRM'
        ]);
        assert.equal(report.categories[0].blocked, false);
        assert.equal(report.categories[0].errors, 0);
    });
});
