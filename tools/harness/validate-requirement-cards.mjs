#!/usr/bin/env node
// Layer 2 validator: CARD-* findings.
// 입력: build/harness/indexes/requirements.index.json + build/harness/indexes/terminology.index.json
// 출력: build/harness/findings/requirement-cards.findings.json
//
// 카드 본문 자체의 형식/필수 항목/승인 상태 일관성을 본다.
// "알려지지 않은 REQ-XXX 참조"는 카드 구조가 아니라 reference 위반이므로 REF-CARD 룰에 속한다
// — 이 검사는 Step 2B의 validate-cross-artifact가 담당한다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const outputDir = path.join(repoRoot, 'build', 'harness');
const indexesDir = path.join(outputDir, 'indexes');
const findingsDir = path.join(outputDir, 'findings');
const requirementsIndexPath = path.join(indexesDir, 'requirements.index.json');
const terminologyIndexPath = path.join(indexesDir, 'terminology.index.json');
const outFile = path.join(findingsDir, 'requirement-cards.findings.json');

const REQUIRED_SECTIONS = [
    '사용자/목적',
    '범위',
    '표준 용어',
    '제외 범위',
    '수용 기준',
    '의사결정 로그',
    'BDD 테스트 리뷰',
    '열린 질문'
];
const ALLOWED_STATUSES = ['초안', '검토중', '승인'];
const ALLOWED_PRIORITIES = ['높음', '중간', '낮음'];
const ALLOWED_IMPLEMENTATION_TARGETS = ['back-end', 'front-end', 'full-stack', 'harness'];
const REQUIREMENT_ID_PATTERN = /^REQ-\d{3,}$/;
const REQUIREMENT_FILENAME_PATTERN = /^(REQ-\d{3,})-[^/]+\.md$/;
const TERM_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*){1,2}$/;
const REMEDIATION_CARD = 'docs/standards/requirement-card.md';
const REMEDIATION_TERM = 'docs/standards/terminology.md';

function relPath(absolute) {
    return path.relative(repoRoot, absolute);
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function duplicateItems(items) {
    const seen = new Map();
    const dupes = new Set();
    for (const item of items) {
        const key = item.trim();
        if (seen.has(key)) {
            dupes.add(key);
        } else {
            seen.set(key, true);
        }
    }
    return [...dupes];
}

function hasRegisteredTerm(index, termKey) {
    return Boolean(index?.terms?.[termKey]);
}

function findingForCard(card, ruleId, message, evidence = {}, severity = 'error') {
    return {
        ruleId,
        severity,
        strictSeverity: severity,
        kind: 'card-structure',
        message,
        requirements: card.id ? [card.id] : [],
        location: {
            file: card.location?.file ?? '',
            line: card.location?.line ?? 0,
            identity: card.location?.identity ?? card.id ?? card.idRaw ?? ''
        },
        evidence,
        remediation: REMEDIATION_CARD
    };
}

function validateCard(card, allCards, terminologyIndex) {
    const findings = [];
    const fname = path.basename(card.location?.file ?? '');
    const fnameMatch = fname.match(REQUIREMENT_FILENAME_PATTERN);

    if (!card.idRaw) {
        findings.push(findingForCard(card, 'CARD-ID-MISSING', '요건 ID 누락'));
    } else if (!REQUIREMENT_ID_PATTERN.test(card.idRaw)) {
        findings.push(findingForCard(card, 'CARD-ID-FORMAT', `요건 ID 형식이 REQ-NNN 아님: "${card.idRaw}"`,
            { idRaw: card.idRaw }));
    }

    if (!fnameMatch) {
        findings.push(findingForCard(card, 'CARD-FILENAME-FORMAT', `파일명이 REQ-NNN-*.md 형식 아님: ${fname}`,
            { filename: fname }));
    } else if (card.id && fnameMatch[1] !== card.id) {
        findings.push(findingForCard(card, 'CARD-FILENAME-ID-MISMATCH',
            `파일명 ID(${fnameMatch[1]})와 카드 ID(${card.id}) 불일치`,
            { filenameId: fnameMatch[1], cardId: card.id }));
    }

    if (!card.title) {
        findings.push(findingForCard(card, 'CARD-TITLE-MISSING', '제목 누락'));
    }

    if (!card.priority) {
        findings.push(findingForCard(card, 'CARD-PRIORITY-MISSING', '우선순위 누락'));
    } else if (!ALLOWED_PRIORITIES.includes(card.priority)) {
        findings.push(findingForCard(card, 'CARD-PRIORITY-INVALID',
            `우선순위 값이 허용 목록(${ALLOWED_PRIORITIES.join(', ')}) 외: "${card.priority}"`,
            { value: card.priority, allowed: ALLOWED_PRIORITIES }));
    }

    if (!card.status) {
        findings.push(findingForCard(card, 'CARD-STATUS-MISSING', '상태 누락'));
    } else if (!ALLOWED_STATUSES.includes(card.status)) {
        findings.push(findingForCard(card, 'CARD-STATUS-INVALID',
            `상태 값이 허용 목록(${ALLOWED_STATUSES.join(', ')}) 외: "${card.status}"`,
            { value: card.status, allowed: ALLOWED_STATUSES }));
    }

    if (card.implementationTargetRaw && !ALLOWED_IMPLEMENTATION_TARGETS.includes(card.implementationTargetRaw)) {
        findings.push(findingForCard(card, 'CARD-TARGET-INVALID',
            `구현 대상 값이 허용 목록(${ALLOWED_IMPLEMENTATION_TARGETS.join(', ')}) 외: "${card.implementationTargetRaw}"`,
            { value: card.implementationTargetRaw, allowed: ALLOWED_IMPLEMENTATION_TARGETS }));
    }

    for (const sec of REQUIRED_SECTIONS) {
        if (!card.sectionPresent?.[sec]) {
            findings.push(findingForCard(card, 'CARD-SECTION-MISSING',
                `필수 섹션 누락: ## ${sec}`,
                { section: sec }));
        }
    }

    if ((card.acceptanceCriteria ?? []).length === 0) {
        findings.push(findingForCard(card, 'CARD-AC-EMPTY', '수용 기준 비어 있음'));
    }
    for (const dupe of duplicateItems(card.acceptanceCriteria ?? [])) {
        findings.push(findingForCard(card, 'CARD-AC-DUPLICATE',
            `중복 수용 기준: "${dupe}"`,
            { criterion: dupe }));
    }

    for (const term of card.terms ?? []) {
        if (!TERM_KEY_PATTERN.test(term)) {
            findings.push({
                ...findingForCard(card, 'CARD-TERM-FORMAT', `표준 용어가 term key 형식 아님: "${term}"`, { term }),
                remediation: REMEDIATION_TERM
            });
            continue;
        }
        if (terminologyIndex && !hasRegisteredTerm(terminologyIndex, term)) {
            findings.push({
                ...findingForCard(card, 'CARD-TERM-UNREGISTERED', `표준 용어가 등록되어 있지 않음: "${term}"`, { term }),
                remediation: REMEDIATION_TERM
            });
        }
    }
    for (const dupe of duplicateItems(card.terms ?? [])) {
        findings.push({
            ...findingForCard(card, 'CARD-TERM-DUPLICATE', `중복 표준 용어: "${dupe}"`, { term: dupe }),
            remediation: REMEDIATION_TERM
        });
    }

    if (card.id) {
        const dupes = allCards.filter((other) => other.id === card.id && other.location?.file !== card.location?.file);
        if (dupes.length > 0) {
            const others = dupes.map((c) => c.location?.file ?? '').join(', ');
            findings.push(findingForCard(card, 'CARD-ID-DUPLICATE',
                `중복 요건 ID: ${others}`,
                { duplicates: dupes.map((c) => c.location?.file ?? '') }));
        }
    }

    if (card.approved) {
        if ((card.openQuestions ?? []).length > 0) {
            findings.push(findingForCard(card, 'CARD-APPROVAL-OPEN-QUESTIONS',
                '상태=승인이지만 열린 질문이 남아 있음'));
        }
        if (card.bddReviewIncomplete) {
            findings.push(findingForCard(card, 'CARD-APPROVAL-BDD-INCOMPLETE',
                '상태=승인이지만 BDD 테스트 리뷰에 "미완료" 표기 있음'));
        }
        if (!card.bddReviewApproved) {
            findings.push(findingForCard(card, 'CARD-APPROVAL-BDD-NO-APPROVAL',
                '상태=승인이지만 BDD 테스트 리뷰에 "결과: 승인" 줄이 없음'));
        }
    }

    return findings;
}

function buildSummary(findings) {
    const summary = { error: 0, warning: 0, info: 0, byRuleId: {} };
    for (const finding of findings) {
        summary[finding.severity] = (summary[finding.severity] ?? 0) + 1;
        summary.byRuleId[finding.ruleId] = (summary.byRuleId[finding.ruleId] ?? 0) + 1;
    }
    return summary;
}

function main() {
    if (!fs.existsSync(requirementsIndexPath)) {
        console.error(
            `Missing requirements index: ${relPath(requirementsIndexPath)}\n` +
            'Run node tools/harness/index-requirements.mjs first.'
        );
        process.exit(1);
    }

    const requirementsPayload = readJson(requirementsIndexPath);
    const cards = requirementsPayload.entries ?? [];

    const terminologyIndex = fs.existsSync(terminologyIndexPath) ? readJson(terminologyIndexPath) : null;
    const findings = [];

    if (!terminologyIndex) {
        // 운영 precondition. terminology가 없으면 CARD-TERM-UNREGISTERED 검사를 못 한다.
        // 단일 합성 finding으로 표시해 게이트가 이 상태를 알아챌 수 있게 한다.
        findings.push({
            ruleId: 'CARD-TERM-INDEX-MISSING',
            severity: 'error',
            strictSeverity: 'error',
            kind: 'card-structure',
            message: 'terminology.index.json이 없어 표준 용어 등록 검사를 수행하지 못함 — `./gradlew indexTerminology` 또는 `./gradlew validateTerminology` 먼저 실행',
            requirements: [],
            location: {
                file: path.relative(repoRoot, terminologyIndexPath).replace(/\\/g, '/'),
                line: 0,
                identity: '(global)'
            },
            evidence: { missingIndex: 'terminology.index.json' },
            remediation: REMEDIATION_TERM
        });
    }

    for (const card of cards) {
        findings.push(...validateCard(card, cards, terminologyIndex));
    }

    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        owner: 'requirement-cards',
        summary: buildSummary(findings),
        findings
    };

    fs.mkdirSync(findingsDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');

    console.log(`requirement-cards.findings.json: ${findings.length} finding(s) (error=${payload.summary.error}, warning=${payload.summary.warning})`);
}

main();
