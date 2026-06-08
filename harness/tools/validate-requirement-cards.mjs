#!/usr/bin/env node
// Layer 2 validator: CARD-* findings.
// 입력: build/{app|harness}/indexes/requirements.index.json + build/{app|harness}/indexes/terminology.index.json
// 출력: build/{app|harness}/findings/requirement-cards.findings.json
//
// 카드 본문 자체의 형식/필수 항목/승인 상태 일관성을 본다.
// "알려지지 않은 REQ-XXX 참조"는 카드 구조가 아니라 reference 위반이므로 REF-CARD 룰에 속한다
// — 이 검사는 Step 2B의 validate-cross-artifact가 담당한다.

import fs from 'node:fs';
import path from 'node:path';
import { outputRootFor, workspaceRoot } from './workspace-config.mjs';

// 단위 테스트가 fixture 경로를 주입할 수 있도록 CLI override를 허용한다.
// 기본값은 build/{scope} 산출물 경로다.
function parseCliOptions(argv) {
    const opts = {};
    for (const arg of argv) {
        const match = arg.match(/^--([^=]+)=(.*)$/);
        if (match) opts[match[1]] = match[2];
    }
    return opts;
}

const cliOptions = parseCliOptions(process.argv.slice(2));
const repoRoot = workspaceRoot;
const outputDir = outputRootFor();
const indexesDir = path.join(outputDir, 'indexes');
const findingsDir = path.join(outputDir, 'findings');
const requirementsIndexPath = cliOptions['requirements-index']
    ? path.resolve(cliOptions['requirements-index'])
    : path.join(indexesDir, 'requirements.index.json');
const terminologyIndexPath = cliOptions['terminology-index']
    ? path.resolve(cliOptions['terminology-index'])
    : path.join(indexesDir, 'terminology.index.json');
const outFile = cliOptions['out']
    ? path.resolve(cliOptions['out'])
    : path.join(findingsDir, 'requirement-cards.findings.json');

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
const ALLOWED_STATUSES = [
    '초안',
    'Skeleton 검토중',
    'Skeleton 승인',
    '테스트 작성중',
    '테스트 승인',
    '구현중',
    '검증중',
    '승인',
    '대체됨',
    '폐기',
    // legacy migration status. New cards should use the staged workflow states above.
    '검토중'
];
const ALLOWED_PRIORITIES = ['높음', '중간', '낮음'];
const ALLOWED_REQUIREMENT_TYPES = ['기능', '비기능', '통합', '정책', '하네스'];
const ALLOWED_SPEC_ROLES = ['원자 요건', '상위 요건', '구현 슬라이스'];
const ALLOWED_TARGET_SYSTEMS = ['application', 'harness'];
const ALLOWED_QUALITY_ATTRIBUTES = ['none', 'accessibility', 'security', 'performance', 'compatibility', 'usability'];
const ALLOWED_VERIFICATION_LEVELS = ['acceptance', 'e2e', 'mixed', 'static'];
const PRODUCT_AREA_PATTERN = /^[a-z][a-z0-9-]*$/;
const REQUIREMENT_ID_PATTERN = /^REQ-\d{3,}$/;
const REQUIREMENT_FILENAME_PATTERN = /^(REQ-\d{3,})-[^/]+\.md$/;
const TERM_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*){1,2}$/;
const REMEDIATION_CARD = 'harness/docs/standards/requirement-card.md';
const REMEDIATION_TERM = 'harness/docs/standards/terminology.md';
const REMEDIATION_UI_VOCABULARY = 'harness/docs/standards/ui-vocabulary.md';

const STATUSES_REQUIRING_VERIFICATION_TARGETS = new Set([
    'Skeleton 승인',
    '테스트 작성중',
    '테스트 승인',
    '구현중',
    '검증중'
]);
const STATUSES_VALIDATING_DECLARED_TARGETS = new Set([
    ...STATUSES_REQUIRING_VERIFICATION_TARGETS,
    '승인'
]);

// 카드 `## 표준 용어`에 둘 수 없는 UI 컴포넌트/위젯 원자 키.
// 이 목록이 CARD-TERM-UI-PRIMITIVE 판정의 단일 소스(SSOT)다. 표준 문서는 이 목록을 설명·링크만 한다.
// UI 원자는 추적용 표준 용어로 등록하지 않고 문서 작성용 UI 어휘 표준의 정규 명칭으로 본문에 표현한다.
// 새 UI 컴포넌트가 생기면 이 목록에 증분 추가한다.
const UI_PRIMITIVE_DENY_LIST = new Set([
    'ui.button',
    'ui.input',
    'ui.checkbox',
    'ui.dialog',
    'ui.formDialog',
    'ui.confirmDialog',
    'ui.tooltip',
    'ui.modal',
    'ui.dropdown',
    'ui.tab',
    'ui.toggle'
]);
const scenariosDir = path.join(repoRoot, 'docs', 'scenarios');
// 카드의 "시나리오 문서:" 줄이 아직 작성 예정으로 남아 있는지 판단하는 표기.
const SCENARIO_STALE_MARKERS = /작성\s*예정|\(예정\)|미작성|\bTBD\b/;

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

const AC_TARGET_TOKENS = ['API', 'UI', 'E2E', 'STATIC'];

function acText(criterion) {
    return typeof criterion === 'string' ? criterion : criterion.text;
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

// CARD-SCENARIO-STALE (warning): .feature 시나리오 문서가 이미 존재하는데
// 카드의 "시나리오 문서:" 줄이 여전히 "작성 예정" 등으로 남아 있으면 상태 표기가 낡은 것.
function scenarioStaleFinding(card) {
    if (!card.id) return null;
    const cardFileRel = card.location?.file;
    if (!cardFileRel) return null;
    const cardAbs = path.isAbsolute(cardFileRel) ? cardFileRel : path.join(repoRoot, cardFileRel);
    if (!fs.existsSync(cardAbs)) return null;

    let featureExists = false;
    try {
        featureExists = fs.readdirSync(scenariosDir)
            .some((name) => name.startsWith(`${card.id}-`) && name.endsWith('.feature'));
    } catch {
        featureExists = false;
    }
    if (!featureExists) return null;

    const lines = fs.readFileSync(cardAbs, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
        if (/시나리오 문서:/.test(lines[i]) && SCENARIO_STALE_MARKERS.test(lines[i])) {
            const finding = findingForCard(card, 'CARD-SCENARIO-STALE',
                `시나리오 문서(.feature)가 이미 존재하는데 카드의 "시나리오 문서:" 줄이 작성 예정으로 남아 있음: "${lines[i].trim()}"`,
                { line: lines[i].trim() }, 'warning');
            finding.location = { ...(finding.location ?? {}), line: i + 1, identity: `${cardFileRel}:${i + 1}` };
            return finding;
        }
    }
    return null;
}

function verificationLevelTargetFinding(card) {
    const targets = [...new Set((card.acceptanceCriteria ?? [])
        .map((criterion) => typeof criterion === 'string' ? null : criterion.target)
        .filter(Boolean))];
    if (!card.verificationLevel || targets.length === 0) return null;

    const allowed = {
        acceptance: ['API', 'UI'],
        e2e: ['E2E'],
        mixed: AC_TARGET_TOKENS,
        static: ['STATIC']
    }[card.verificationLevel];
    if (!allowed) return null;

    const invalidTargets = targets.filter((target) => !allowed.includes(target));
    if (invalidTargets.length > 0) {
        return findingForCard(card, 'CARD-VERIFICATION-LEVEL-AC-MISMATCH',
            `검증 수준 "${card.verificationLevel}"과 맞지 않는 AC 마커가 있음: ${invalidTargets.join(', ')}`,
            { verificationLevel: card.verificationLevel, targets, allowedTargets: allowed });
    }

    if (card.verificationLevel === 'mixed' && targets.length < 2) {
        return findingForCard(card, 'CARD-VERIFICATION-LEVEL-AC-MISMATCH',
            '검증 수준 "mixed"는 둘 이상의 AC 마커 종류가 필요함',
            { verificationLevel: card.verificationLevel, targets });
    }

    if (card.verificationLevel !== 'mixed' && targets.length > 1) {
        return findingForCard(card, 'CARD-VERIFICATION-LEVEL-AC-MISMATCH',
            `검증 수준 "${card.verificationLevel}"은 단일 AC 마커 종류만 가져야 함`,
            { verificationLevel: card.verificationLevel, targets });
    }

    return null;
}

function targetRequired(card, key) {
    return card.verificationTargets?.[key]?.required === true;
}

function hasAnyVerificationTarget(card) {
    return Object.keys(card.verificationTargets ?? {}).length > 0;
}

function verificationContractFindings(card) {
    const findings = [];
    const mustHaveTargets = STATUSES_REQUIRING_VERIFICATION_TARGETS.has(card.status);
    const shouldValidateDeclaredTargets = STATUSES_VALIDATING_DECLARED_TARGETS.has(card.status);
    if (!shouldValidateDeclaredTargets) return findings;

    if (mustHaveTargets && !hasAnyVerificationTarget(card)) {
        findings.push(findingForCard(card, 'CARD-VERIFICATION-TARGETS-MISSING',
            `${card.status} 상태는 ## 검증 대상 섹션이 필요함`));
        return findings;
    }

    if (targetRequired(card, 'API') && (card.apiSkeleton ?? []).length === 0) {
        findings.push(findingForCard(card, 'CARD-API-SKELETON-MISSING',
            '검증 대상 API=필요이지만 ## API Skeleton 섹션 항목이 없음'));
    }
    if (targetRequired(card, 'DB') && (card.dbSkeleton ?? []).length === 0) {
        findings.push(findingForCard(card, 'CARD-DB-SKELETON-MISSING',
            '검증 대상 DB=필요이지만 ## DB Skeleton 섹션 항목이 없음'));
    }
    if (targetRequired(card, 'UI') && (card.uiSkeleton ?? []).length === 0) {
        findings.push(findingForCard(card, 'CARD-UI-SKELETON-MISSING',
            '검증 대상 UI=필요이지만 ## UI Skeleton 또는 ## 화면/라우팅 Skeleton 섹션 항목이 없음'));
    }
    if (targetRequired(card, 'Storybook') && (card.storybookContract ?? []).length === 0) {
        findings.push(findingForCard(card, 'CARD-STORYBOOK-CONTRACT-MISSING',
            '검증 대상 Storybook=필요이지만 ## Storybook 계약 섹션 항목이 없음'));
    }
    return findings;
}

function validateCard(card, allCards, terminologyIndex) {
    const findings = [];
    const fname = path.basename(card.location?.file ?? '');
    const fnameMatch = fname.match(REQUIREMENT_FILENAME_PATTERN);
    const knownIds = new Set(allCards.map((c) => c.id).filter(Boolean));

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

    if (!card.requirementType) {
        findings.push(findingForCard(card, 'CARD-REQUIREMENT-TYPE-MISSING', '요건 종류 누락'));
    } else if (!ALLOWED_REQUIREMENT_TYPES.includes(card.requirementType)) {
        findings.push(findingForCard(card, 'CARD-REQUIREMENT-TYPE-INVALID',
            `요건 종류 값이 허용 목록(${ALLOWED_REQUIREMENT_TYPES.join(', ')}) 외: "${card.requirementType}"`,
            { value: card.requirementType, allowed: ALLOWED_REQUIREMENT_TYPES }));
    }

    if (!card.specRole) {
        findings.push(findingForCard(card, 'CARD-SPEC-ROLE-MISSING', '명세 역할 누락'));
    } else if (!ALLOWED_SPEC_ROLES.includes(card.specRole)) {
        findings.push(findingForCard(card, 'CARD-SPEC-ROLE-INVALID',
            `명세 역할 값이 허용 목록(${ALLOWED_SPEC_ROLES.join(', ')}) 외: "${card.specRole}"`,
            { value: card.specRole, allowed: ALLOWED_SPEC_ROLES }));
    }

    if (!card.targetSystem) {
        findings.push(findingForCard(card, 'CARD-TARGET-SYSTEM-MISSING', '대상 시스템 누락'));
    } else if (!ALLOWED_TARGET_SYSTEMS.includes(card.targetSystem)) {
        findings.push(findingForCard(card, 'CARD-TARGET-SYSTEM-INVALID',
            `대상 시스템 값이 허용 목록(${ALLOWED_TARGET_SYSTEMS.join(', ')}) 외: "${card.targetSystem}"`,
            { value: card.targetSystem, allowed: ALLOWED_TARGET_SYSTEMS }));
    }

    if (!card.productArea) {
        findings.push(findingForCard(card, 'CARD-PRODUCT-AREA-MISSING', '제품 영역 누락'));
    } else if (!PRODUCT_AREA_PATTERN.test(card.productArea)) {
        findings.push(findingForCard(card, 'CARD-PRODUCT-AREA-INVALID',
            `제품 영역은 소문자/숫자/하이픈 키 형식이어야 함: "${card.productArea}"`,
            { value: card.productArea }));
    }

    const qualityAttributes = card.qualityAttributes ?? [];
    if (qualityAttributes.length === 0) {
        findings.push(findingForCard(card, 'CARD-QUALITY-ATTRIBUTE-MISSING', '품질 속성 누락'));
    }
    for (const attr of qualityAttributes) {
        if (ALLOWED_QUALITY_ATTRIBUTES.includes(attr)) continue;
        findings.push(findingForCard(card, 'CARD-QUALITY-ATTRIBUTE-INVALID',
            `품질 속성 값이 허용 목록(${ALLOWED_QUALITY_ATTRIBUTES.join(', ')}) 외: "${attr}"`,
            { value: attr, allowed: ALLOWED_QUALITY_ATTRIBUTES }));
    }
    if (qualityAttributes.includes('none') && qualityAttributes.length > 1) {
        findings.push(findingForCard(card, 'CARD-QUALITY-ATTRIBUTE-NONE-MIXED',
            '`품질 속성: none`은 다른 품질 속성과 함께 쓸 수 없음',
            { qualityAttributes }));
    }

    if (!card.verificationLevel) {
        findings.push(findingForCard(card, 'CARD-VERIFICATION-LEVEL-MISSING', '검증 수준 누락'));
    } else if (!ALLOWED_VERIFICATION_LEVELS.includes(card.verificationLevel)) {
        findings.push(findingForCard(card, 'CARD-VERIFICATION-LEVEL-INVALID',
            `검증 수준 값이 허용 목록(${ALLOWED_VERIFICATION_LEVELS.join(', ')}) 외: "${card.verificationLevel}"`,
            { value: card.verificationLevel, allowed: ALLOWED_VERIFICATION_LEVELS }));
    }

    for (const related of card.relatedRequirementIds ?? []) {
        if (knownIds.has(related)) continue;
        findings.push(findingForCard(card, 'CARD-RELATED-REQ-UNKNOWN',
            `관련 요건이 존재하지 않음: ${related}`,
            { relatedRequirementId: related }));
    }

    for (const replacement of card.replacedByRequirementIds ?? []) {
        if (knownIds.has(replacement)) continue;
        findings.push(findingForCard(card, 'CARD-REPLACED-BY-UNKNOWN',
            `대체 요건이 존재하지 않음: ${replacement}`,
            { replacedByRequirementId: replacement }));
    }

    if (card.status === '대체됨' && (card.replacedByRequirementIds ?? []).length === 0) {
        findings.push(findingForCard(card, 'CARD-REPLACED-BY-REQUIRED',
            '상태=대체됨인 카드는 대체 요건을 적어야 함'));
    }

    if (card.specRole === '구현 슬라이스' && (card.relatedRequirementIds ?? []).length === 0) {
        findings.push(findingForCard(card, 'CARD-SLICE-RELATED-REQ-MISSING',
            '명세 역할=구현 슬라이스인 카드는 관련 요건을 적어야 함'));
    }

    if (card.requirementType === '통합') {
        if (!['e2e', 'mixed'].includes(card.verificationLevel)) {
            findings.push(findingForCard(card, 'CARD-INTEGRATION-VERIFICATION-LEVEL',
                '요건 종류=통합인 카드는 검증 수준이 e2e 또는 mixed여야 함',
                { verificationLevel: card.verificationLevel }));
        }
        if (!(card.acceptanceCriteria ?? []).some((criterion) => typeof criterion !== 'string' && criterion.target === 'E2E')) {
            findings.push(findingForCard(card, 'CARD-INTEGRATION-E2E-AC-MISSING',
                '요건 종류=통합인 카드는 (E2E) 수용 기준을 하나 이상 가져야 함'));
        }
    }

    if (card.requirementType === '하네스' && card.targetSystem && card.targetSystem !== 'harness') {
        findings.push(findingForCard(card, 'CARD-HARNESS-TARGET-SYSTEM',
            '요건 종류=하네스인 카드는 대상 시스템이 harness여야 함',
            { targetSystem: card.targetSystem }));
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
    const acceptanceCriteriaTexts = (card.acceptanceCriteria ?? []).map(acText);
    for (const dupe of duplicateItems(acceptanceCriteriaTexts)) {
        findings.push(findingForCard(card, 'CARD-AC-DUPLICATE',
            `중복 수용 기준: "${dupe}"`,
            { criterion: dupe }));
    }
    for (const criterion of card.acceptanceCriteria ?? []) {
        if (typeof criterion === 'string') continue;
        if (criterion.invalidMarker) {
            findings.push(findingForCard(card, 'CARD-AC-MARKER-INVALID',
                `수용 기준 마커가 허용값(${AC_TARGET_TOKENS.join('/')}) 아님: "(${criterion.invalidMarker})"`,
                { criterion: criterion.text, invalidMarker: criterion.invalidMarker, allowed: AC_TARGET_TOKENS }));
        } else if (!criterion.target) {
            findings.push(findingForCard(card, 'CARD-AC-MARKER-MISSING',
                `수용 기준 마커 누락: "${criterion.text}"`,
                { criterion: criterion.text, allowed: AC_TARGET_TOKENS }));
        }
    }
    const verificationFinding = verificationLevelTargetFinding(card);
    if (verificationFinding) findings.push(verificationFinding);
    findings.push(...verificationContractFindings(card));

    for (const term of card.terms ?? []) {
        if (!TERM_KEY_PATTERN.test(term)) {
            findings.push({
                ...findingForCard(card, 'CARD-TERM-FORMAT', `표준 용어가 term key 형식 아님: "${term}"`, { term }),
                remediation: REMEDIATION_TERM
            });
            continue;
        }
        // UI 컴포넌트/위젯 원자는 등록 누락이 아니라 잘못된 레이어에 둔 용어다.
        // CARD-TERM-UNREGISTERED보다 먼저 판정해, 용어집 등록이 아니라 UI 어휘 표준으로 안내한다.
        if (UI_PRIMITIVE_DENY_LIST.has(term)) {
            findings.push({
                ...findingForCard(card, 'CARD-TERM-UI-PRIMITIVE',
                    `UI 컴포넌트/위젯 원자 용어는 카드 표준 용어에 둘 수 없음: "${term}". 용어집에 등록하지 말고 UI 어휘 표준의 정규 명칭으로 본문/수용 기준/시나리오에 표현한다.`,
                    { term }),
                remediation: REMEDIATION_UI_VOCABULARY
            });
            continue;
        }
        if (terminologyIndex && !hasRegisteredTerm(terminologyIndex, term)) {
            findings.push({
                ...findingForCard(card, 'CARD-TERM-UNREGISTERED',
                    `표준 용어가 등록되어 있지 않음: "${term}". 업무/정책/품질 의미 용어이면 용어집에 draft 또는 approved로 등록하고, UI 원자나 구현 세부사항이면 카드 표준 용어에서 제거하고 UI 어휘 표준의 정규 명칭으로 본문/수용 기준/시나리오에 표현한다.`,
                    { term }),
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

    const staleFinding = scenarioStaleFinding(card);
    if (staleFinding) findings.push(staleFinding);

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
            'Run node harness/tools/index-requirements.mjs first.'
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

    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');

    console.log(`requirement-cards.findings.json: ${findings.length} finding(s) (error=${payload.summary.error}, warning=${payload.summary.warning})`);
}

main();
