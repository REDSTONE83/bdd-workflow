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
const evaluator = path.join(repoRoot, 'harness', 'tools', 'evaluate-trace-state.mjs');

function cardEntry(overrides = {}) {
    const id = overrides.id ?? 'REQ-901';
    return {
        kind: 'card',
        requirements: [id],
        location: {
            file: `harness/docs/requirements/${id.toLowerCase()}-fixture.md`,
            line: 0,
            identity: id
        },
        idRaw: id,
        id,
        title: `${id} fixture`,
        priority: '중간',
        status: '초안',
        requirementType: '하네스',
        specRole: '원자 요건',
        targetSystem: 'harness',
        productArea: 'harness',
        qualityAttributes: ['none'],
        verificationLevel: 'static',
        parentRequirementIds: [],
        relatedRequirementIds: [],
        replacedByRequirementIds: [],
        approved: false,
        acceptanceCriteria: [{ text: `${id} AC`, target: 'STATIC', line: 42 }],
        openQuestions: ['검증 전 질문'],
        terms: [],
        acceptanceTestReviewIncomplete: true,
        acceptanceTestReviewApproved: false,
        bddReviewIncomplete: true,
        bddReviewApproved: false,
        referencedRequirementIds: [],
        sectionPresent: {},
        ...overrides
    };
}

function writeRequirementsIndex(outputRoot, entries) {
    const indexes = path.join(outputRoot, 'indexes');
    fs.mkdirSync(indexes, { recursive: true });
    fs.writeFileSync(path.join(indexes, 'requirements.index.json'), JSON.stringify({
        generatedAt: '2026-06-16T00:00:00.000Z',
        schemaVersion: '1',
        source: 'requirements.index',
        entries,
        issues: []
    }, null, 2));
}

function runEvaluator(outputRoot) {
    execFileSync(process.execPath, [evaluator, '--quiet'], {
        cwd: repoRoot,
        env: {
            ...process.env,
            HARNESS_SCOPE: 'harness',
            HARNESS_OUTPUT_ROOT: outputRoot
        }
    });
    return JSON.parse(fs.readFileSync(path.join(outputRoot, 'state', 'trace.state.json'), 'utf8'));
}

describe('evaluate-trace-state — UI data contract fields', () => {
    it('propagates parent links, reverse child links, AC lines, RED blue blockers, and repo-relative files', () => {
        const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-contract-'));
        writeRequirementsIndex(outputRoot, [
            cardEntry({
                id: 'REQ-900',
                specRole: '상위 요건',
                location: { file: 'harness/docs/requirements/REQ-900-parent.md', line: 0, identity: 'REQ-900' },
                acceptanceCriteria: [{ text: 'parent AC', target: 'STATIC', line: 35 }],
                openQuestions: [],
                approved: true
            }),
            cardEntry({
                id: 'REQ-902',
                parentRequirementIds: ['REQ-900'],
                location: { file: 'harness/docs/requirements/REQ-902-child.md', line: 0, identity: 'REQ-902' }
            }),
            cardEntry({
                id: 'REQ-901',
                parentRequirementIds: ['REQ-900'],
                location: { file: 'harness/docs/requirements/REQ-901-child.md', line: 0, identity: 'REQ-901' }
            })
        ]);

        const state = runEvaluator(outputRoot);
        const parent = state.requirements.find((requirement) => requirement.id === 'REQ-900');
        const child = state.requirements.find((requirement) => requirement.id === 'REQ-901');

        assert.deepEqual(child.parentRequirementIds, ['REQ-900']);
        assert.deepEqual(parent.childRequirementIds, ['REQ-901', 'REQ-902']);
        assert.equal(child.file, 'harness/docs/requirements/REQ-901-child.md');
        assert.equal(child.coverage[0].line, 42);
        assert.equal(child.state, 'RED');
        assert.deepEqual(child.blueBlockedBy, [
            '요건 카드 상태가 승인 아님: 초안',
            '열린 질문 남음'
        ]);
    });
});
