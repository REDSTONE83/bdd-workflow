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
const validator = path.join(repoRoot, 'harness', 'tools', 'validate-requirement-cards.mjs');

function cardFixture(overrides = {}) {
    const id = overrides.id ?? 'REQ-901';
    return {
        kind: 'card',
        requirements: [id],
        location: { file: `docs/requirements/${id}.md`, line: 0, identity: id },
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
        acceptanceCriteria: [{ text: `${id} AC`, target: 'STATIC', line: 20 }],
        openQuestions: [],
        terms: [],
        sectionPresent: {
            '사용자/목적': true,
            '범위': true,
            '표준 용어': true,
            '제외 범위': true,
            '수용 기준': true,
            '의사결정 로그': true,
            '수용 테스트 리뷰': true,
            '열린 질문': true
        },
        acceptanceTestReviewIncomplete: true,
        acceptanceTestReviewApproved: false,
        bddReviewIncomplete: true,
        bddReviewApproved: false,
        referencedRequirementIds: [],
        ...overrides
    };
}

function runValidator(entries) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'card-parent-'));
    const requirementsIndex = path.join(dir, 'requirements.index.json');
    const terminologyIndex = path.join(dir, 'terminology.index.json');
    const out = path.join(dir, 'requirement-cards.findings.json');

    fs.writeFileSync(requirementsIndex, JSON.stringify({
        generatedAt: '2026-06-16T00:00:00.000Z',
        schemaVersion: '1',
        source: 'requirements.index',
        entries,
        issues: []
    }, null, 2));
    fs.writeFileSync(terminologyIndex, JSON.stringify({ terms: {} }, null, 2));

    execFileSync(process.execPath, [
        validator,
        `--requirements-index=${requirementsIndex}`,
        `--terminology-index=${terminologyIndex}`,
        `--out=${out}`
    ], { cwd: repoRoot });

    return JSON.parse(fs.readFileSync(out, 'utf8'));
}

function parentFindings(payload) {
    return payload.findings
        .filter((finding) => finding.ruleId.startsWith('CARD-PARENT-'))
        .map((finding) => ({
            ruleId: finding.ruleId,
            requirement: finding.requirements[0],
            parent: finding.evidence?.parentRequirementId,
            parentSpecRole: finding.evidence?.parentSpecRole
        }));
}

describe('validate-requirement-cards — 상위 요건', () => {
    it('accepts an atomic requirement that points to an existing parent requirement card', () => {
        const payload = runValidator([
            cardFixture({ id: 'REQ-900', specRole: '상위 요건' }),
            cardFixture({ id: 'REQ-901', parentRequirementIds: ['REQ-900'] })
        ]);

        assert.deepEqual(parentFindings(payload), []);
    });

    it('rejects a parent reference to itself', () => {
        const payload = runValidator([
            cardFixture({ id: 'REQ-901', parentRequirementIds: ['REQ-901'] })
        ]);

        assert.deepEqual(parentFindings(payload), [
            { ruleId: 'CARD-PARENT-SELF', requirement: 'REQ-901', parent: 'REQ-901', parentSpecRole: undefined }
        ]);
    });

    it('rejects an unknown parent requirement', () => {
        const payload = runValidator([
            cardFixture({ id: 'REQ-901', parentRequirementIds: ['REQ-999'] })
        ]);

        assert.deepEqual(parentFindings(payload), [
            { ruleId: 'CARD-PARENT-REQ-UNKNOWN', requirement: 'REQ-901', parent: 'REQ-999', parentSpecRole: undefined }
        ]);
    });

    it('rejects a parent requirement whose spec role is not 상위 요건', () => {
        const payload = runValidator([
            cardFixture({ id: 'REQ-900', specRole: '원자 요건' }),
            cardFixture({ id: 'REQ-901', parentRequirementIds: ['REQ-900'] })
        ]);

        assert.deepEqual(parentFindings(payload), [
            { ruleId: 'CARD-PARENT-REQ-NOT-PARENT', requirement: 'REQ-901', parent: 'REQ-900', parentSpecRole: '원자 요건' }
        ]);
    });

    it('rejects more than one parent requirement', () => {
        const payload = runValidator([
            cardFixture({ id: 'REQ-900', specRole: '상위 요건' }),
            cardFixture({ id: 'REQ-902', specRole: '상위 요건' }),
            cardFixture({ id: 'REQ-901', parentRequirementIds: ['REQ-900', 'REQ-902'] })
        ]);

        const finding = payload.findings.find((item) => item.ruleId === 'CARD-PARENT-MULTIPLE');
        assert.equal(finding.requirements[0], 'REQ-901');
        assert.deepEqual(finding.evidence.parentRequirementIds, ['REQ-900', 'REQ-902']);
    });

    it('rejects parent requirements on inactive cards', () => {
        const payload = runValidator([
            cardFixture({ id: 'REQ-900', specRole: '상위 요건' }),
            cardFixture({
                id: 'REQ-901',
                status: '대체됨',
                parentRequirementIds: ['REQ-900'],
                replacedByRequirementIds: ['REQ-900']
            })
        ]);

        const finding = payload.findings.find((item) => item.ruleId === 'CARD-PARENT-INACTIVE-FORBIDDEN');
        assert.equal(finding.requirements[0], 'REQ-901');
        assert.deepEqual(finding.evidence, {
            status: '대체됨',
            parentRequirementIds: ['REQ-900']
        });
    });

    it('rejects cycles in parent requirement links', () => {
        const payload = runValidator([
            cardFixture({ id: 'REQ-900', specRole: '상위 요건', parentRequirementIds: ['REQ-901'] }),
            cardFixture({ id: 'REQ-901', specRole: '상위 요건', parentRequirementIds: ['REQ-900'] })
        ]);

        const cycles = payload.findings
            .filter((item) => item.ruleId === 'CARD-PARENT-CYCLE')
            .map((item) => ({ requirement: item.requirements[0], cycle: item.evidence.cycle }))
            .sort((a, b) => a.requirement.localeCompare(b.requirement));
        assert.deepEqual(cycles, [
            { requirement: 'REQ-900', cycle: ['REQ-900', 'REQ-901', 'REQ-900'] },
            { requirement: 'REQ-901', cycle: ['REQ-901', 'REQ-900', 'REQ-901'] }
        ]);
    });
});
