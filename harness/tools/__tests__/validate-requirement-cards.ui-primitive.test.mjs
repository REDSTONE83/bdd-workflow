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

// 표준 용어 검사 외 다른 CARD-* finding이 끼지 않도록 완전한 카드 fixture를 만든다.
function cardFixture(terms) {
    return {
        kind: 'card',
        requirements: ['REQ-900'],
        location: { file: 'docs/requirements/REQ-900-fixture.md', line: 0, identity: 'REQ-900' },
        idRaw: 'REQ-900',
        id: 'REQ-900',
        title: 'fixture card',
        priority: '중간',
        status: '초안',
        requirementType: '하네스',
        specRole: '원자 요건',
        targetSystem: 'harness',
        productArea: 'harness',
        qualityAttributes: ['none'],
        verificationLevel: 'static',
        relatedRequirementIds: [],
        replacedByRequirementIds: [],
        approved: false,
        acceptanceCriteria: [{ text: 'fixture AC', target: 'STATIC' }],
        openQuestions: [],
        terms,
        sectionPresent: {
            '사용자/목적': true,
            '범위': true,
            '표준 용어': true,
            '제외 범위': true,
            '수용 기준': true,
            '의사결정 로그': true,
            'BDD 테스트 리뷰': true,
            '열린 질문': true
        },
        bddReviewIncomplete: true,
        bddReviewApproved: false,
        referencedRequirementIds: []
    };
}

function runValidator(terms) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'card-ui-primitive-'));
    const requirementsIndex = path.join(dir, 'requirements.index.json');
    const terminologyIndex = path.join(dir, 'terminology.index.json');
    const out = path.join(dir, 'requirement-cards.findings.json');

    fs.writeFileSync(requirementsIndex, JSON.stringify({
        generatedAt: '2026-06-06T00:00:00.000Z',
        schemaVersion: '1',
        source: 'requirements.index',
        entries: [cardFixture(terms)],
        issues: []
    }, null, 2));
    // ui.appShell은 등록된 화면 품질 용어(통과), todo.title은 일반 도메인 등록 용어.
    fs.writeFileSync(terminologyIndex, JSON.stringify({
        terms: {
            'ui.appShell': { ko: '앱셸', en: 'app shell' },
            'todo.title': { ko: '할 일 제목', en: 'todo title' }
        }
    }, null, 2));

    execFileSync(process.execPath, [
        validator,
        `--requirements-index=${requirementsIndex}`,
        `--terminology-index=${terminologyIndex}`,
        `--out=${out}`
    ], { cwd: repoRoot });

    return JSON.parse(fs.readFileSync(out, 'utf8'));
}

function termFindings(payload) {
    return payload.findings
        .filter((finding) => finding.ruleId.startsWith('CARD-TERM-'))
        .map((finding) => ({ ruleId: finding.ruleId, term: finding.evidence?.term }));
}

describe('validate-requirement-cards — CARD-TERM-UI-PRIMITIVE', () => {
    it('UI 컴포넌트 원자 키는 CARD-TERM-UI-PRIMITIVE로 차단한다 (UNREGISTERED 아님)', () => {
        const payload = runValidator(['ui.formDialog']);
        assert.deepEqual(termFindings(payload), [
            { ruleId: 'CARD-TERM-UI-PRIMITIVE', term: 'ui.formDialog' }
        ]);
    });

    it('사전에 등록돼 있어도 deny-list 키(ui.dialog)는 UI-PRIMITIVE로 차단한다', () => {
        const payload = runValidator(['ui.dialog']);
        assert.deepEqual(termFindings(payload), [
            { ruleId: 'CARD-TERM-UI-PRIMITIVE', term: 'ui.dialog' }
        ]);
    });

    it('deny-list 밖의 미등록 도메인 용어는 CARD-TERM-UNREGISTERED로 남긴다', () => {
        const payload = runValidator(['zzz.unregisteredConcept']);
        assert.deepEqual(termFindings(payload), [
            { ruleId: 'CARD-TERM-UNREGISTERED', term: 'zzz.unregisteredConcept' }
        ]);
    });

    it('한 카드에 두 종류가 섞이면 각각 분리 판정하고 UI 원자는 UNREGISTERED로 잡지 않는다', () => {
        const payload = runValidator(['ui.checkbox', 'zzz.unregisteredConcept']);
        const found = termFindings(payload);
        assert.deepEqual(
            found.filter((finding) => finding.term === 'ui.checkbox'),
            [{ ruleId: 'CARD-TERM-UI-PRIMITIVE', term: 'ui.checkbox' }]
        );
        assert.deepEqual(
            found.filter((finding) => finding.term === 'zzz.unregisteredConcept'),
            [{ ruleId: 'CARD-TERM-UNREGISTERED', term: 'zzz.unregisteredConcept' }]
        );
    });

    it('등록된 화면 품질 용어(ui.appShell)는 표준 용어로 통과한다', () => {
        const payload = runValidator(['ui.appShell']);
        assert.deepEqual(termFindings(payload), []);
    });
});
