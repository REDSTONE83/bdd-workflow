#!/usr/bin/env node
// Layer 1 collector: parse scope docs/requirements/*.md into indexes/requirements.index.json.
// 본문 raw content는 인덱스에 넣지 않는다. 다음 단계(card 구조 검사, cross-artifact 검사)가
// 필요로 하는 모든 필드를 미리 추출해 둔다.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { outputRootFor, repoRelative, requirementsDirFor } from './workspace-config.mjs';

const docsRoot = requirementsDirFor();
const outDir = path.join(outputRootFor(), 'indexes');
const outFile = path.join(outDir, 'requirements.index.json');

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
const REQUIREMENT_ID_PATTERN = /^REQ-\d{3,}$/;

function walk(dir, predicate = () => true) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return walk(fullPath, predicate);
        }
        return predicate(fullPath) ? [fullPath] : [];
    });
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function section(content, heading) {
    const start = content.search(new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, 'm'));
    if (start < 0) {
        return '';
    }
    const afterHeading = content.slice(start).replace(new RegExp(`^## ${escapeRegExp(heading)}\\s*`, 'm'), '');
    const nextHeading = afterHeading.search(/^## /m);
    return nextHeading >= 0 ? afterHeading.slice(0, nextHeading) : afterHeading;
}

function bulletItems(markdown) {
    return markdown
        .split('\n')
        .map((line) => line.match(/^\s*-\s+(?:\[[ xX]\]\s*)?(.+?)\s*$/)?.[1])
        .filter(Boolean);
}

const AC_TARGET_TOKENS = ['API', 'UI', 'E2E', 'STATIC'];
// 마커는 bullet 시작의 `(TOKEN) ` 형태로만 valid이다. 괄호 안에 공백이 없는 토큰을 마커
// 후보로 넓게 잡고, 허용 토큰(API/UI/E2E/STATIC)이며 뒤에 공백이 따라오는 경우만 stripped target으로
// 인정한다. 그 외 — 허용 외 토큰이거나 뒤에 공백이 없는 malformed 형태(예: `(API):`,
// `(API-V1)`, `(api)`) — 는 invalidMarker로 보고한다. `(see foo)`, `(예: A)`처럼 괄호 안에
// 공백이 있으면 자연어로 간주해 마커 후보에서 제외한다.
const AC_MARKER_VALID_PATTERN = /^\(([^()\s]+)\)\s+/;
const AC_MARKER_LOOSE_PATTERN = /^\(([^()\s]+)\)/;
const BULLET_PATTERN = /^\s*-\s+(?:\[[ xX]\]\s*)?(.+?)\s*$/;

function parseAcMarker(raw) {
    const validMatch = raw.match(AC_MARKER_VALID_PATTERN);
    if (validMatch && AC_TARGET_TOKENS.includes(validMatch[1])) {
        return { text: raw.slice(validMatch[0].length), target: validMatch[1] };
    }
    const looseMatch = raw.match(AC_MARKER_LOOSE_PATTERN);
    if (looseMatch) {
        return { text: raw, target: null, invalidMarker: looseMatch[1] };
    }
    return { text: raw, target: null };
}

function acceptanceCriterionItems(markdown) {
    return bulletItems(markdown).map(parseAcMarker);
}

// 카드 본문 전체를 줄 단위로 훑어 `## 수용 기준` 섹션의 각 AC bullet에 1-based 줄
// 번호를 부여한다. section() 부분 문자열은 절대 줄 번호를 잃으므로 본문을 직접 스캔한다.
function acceptanceCriteriaWithLines(content) {
    const lines = content.split('\n');
    const headingIndex = lines.findIndex((line) => /^## 수용 기준\s*$/.test(line));
    if (headingIndex < 0) return [];
    const items = [];
    for (let i = headingIndex + 1; i < lines.length; i += 1) {
        if (/^## /.test(lines[i])) break;
        const bullet = lines[i].match(BULLET_PATTERN);
        if (!bullet) continue;
        items.push({ ...parseAcMarker(bullet[1]), line: i + 1 });
    }
    return items;
}

function normalizeApprovalStatus(status) {
    const normalized = status.trim().toLowerCase();
    return ['승인', 'approved', 'blue'].includes(normalized);
}

function headerValue(content, label) {
    return content.match(new RegExp(`^${escapeRegExp(label)}:[ \\t]*(.+)$`, 'm'))?.[1]?.trim() ?? '';
}

function splitList(raw) {
    if (!raw || /^없음$/.test(raw.trim())) return [];
    return raw
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function requirementRefs(raw) {
    return [...new Set(raw.match(/\bREQ-\d{3,}\b/g) ?? [])];
}

function normalizeRequiredFlag(raw) {
    const value = raw.trim().toLowerCase();
    if (['필요', 'required', 'yes', 'true'].includes(value)) return true;
    if (['불필요', '해당 없음', '없음', 'not required', 'no', 'false'].includes(value)) return false;
    return null;
}

function verificationTargetItems(markdown) {
    const targets = {};
    for (const item of bulletItems(markdown)) {
        const match = item.match(/^([^:：]+)[:：]\s*(.+)$/);
        if (!match) continue;
        const key = match[1].trim();
        const required = normalizeRequiredFlag(match[2]);
        targets[key] = {
            required,
            raw: match[2].trim()
        };
    }
    return targets;
}

function stripCodeTicks(value) {
    return value.trim().replace(/^`|`$/g, '');
}

function storybookContractItems(markdown) {
    return bulletItems(markdown)
        .map((item) => {
            const match = item.match(/^([^:：]+)[:：]\s*(.+)$/);
            if (!match) return null;
            const title = stripCodeTicks(match[1]);
            const states = match[2]
                .split(/[,，]/)
                .map(stripCodeTicks)
                .filter(Boolean);
            if (!title || states.length === 0) return null;
            return { title, states, raw: item };
        })
        .filter(Boolean);
}

const BDD_REVIEW_RESULT_LINE_PATTERN = /^[ \t]*(?:-\s*)?결과[ \t]*[:：][ \t]*(.+?)\s*$/;

function normalizeBddReviewResultStatus(status) {
    return status.trim().replace(/[.。]+$/u, '').toLowerCase();
}

function bddReviewResultItems(markdown) {
    return markdown
        .split('\n')
        .map((line, index) => {
            const match = line.match(BDD_REVIEW_RESULT_LINE_PATTERN);
            if (!match) return null;
            const status = match[1].trim();
            return {
                line: index + 1,
                status,
                normalizedStatus: normalizeBddReviewResultStatus(status)
            };
        })
        .filter(Boolean);
}

function bddReviewResultSummary(markdown) {
    const results = bddReviewResultItems(markdown);
    const latest = results.at(-1) ?? null;
    return {
        latest,
        incomplete: latest?.normalizedStatus === '미완료',
        approved: ['승인', 'approved', 'blue'].includes(latest?.normalizedStatus ?? '')
    };
}

function decisionLogItems(markdown) {
    const fields = {
        '결정일': 'date',
        '결정': 'decision',
        '이유': 'reason',
        '결정자': 'decisionMaker',
        '영향': 'impact'
    };
    const logs = [];
    let current = null;

    for (const line of markdown.split('\n')) {
        const match = line.match(/^[ \t]*(?:-\s*)?(결정일|결정|이유|결정자|영향)[ \t]*[:：][ \t]*(.+?)\s*$/);
        if (!match) continue;

        const [, label, value] = match;
        if (label === '결정일') {
            if (current) logs.push(current);
            current = {
                date: value,
                decision: '',
                reason: '',
                decisionMaker: '',
                impact: ''
            };
            continue;
        }

        if (!current) {
            current = {
                date: '',
                decision: '',
                reason: '',
                decisionMaker: '',
                impact: ''
            };
        }
        current[fields[label]] = value;
    }

    if (current) logs.push(current);
    return logs.filter((log) => log.date || log.decision || log.reason || log.decisionMaker || log.impact);
}

function firstNonEmptySection(content, headings) {
    for (const heading of headings) {
        const value = section(content, heading).trim();
        if (value) return value;
    }
    return '';
}

function parseCard(file) {
    const content = fs.readFileSync(file, 'utf8');
    const idRaw = headerValue(content, '요건 ID');
    const id = REQUIREMENT_ID_PATTERN.test(idRaw) ? idRaw : '';
    const title = headerValue(content, '제목');
    const priority = headerValue(content, '우선순위');
    const status = headerValue(content, '상태');
    const requirementType = headerValue(content, '요건 종류');
    const specRole = headerValue(content, '명세 역할');
    const targetSystem = headerValue(content, '대상 시스템');
    const productArea = headerValue(content, '제품 영역');
    const qualityAttributes = splitList(headerValue(content, '품질 속성'));
    const verificationLevel = headerValue(content, '검증 수준');
    const relatedRequirementIds = requirementRefs(headerValue(content, '관련 요건'));
    const replacedByRequirementIds = requirementRefs(headerValue(content, '대체 요건'));
    const parentRequirementIds = requirementRefs(headerValue(content, '상위 요건'));
    const acceptanceCriteria = acceptanceCriteriaWithLines(content);
    const purpose = section(content, '사용자/목적').trim();
    const scopeItems = bulletItems(section(content, '범위'));
    const openQuestions = bulletItems(section(content, '열린 질문'))
        .filter((item) => !/^없음$/.test(item.trim()));
    const terms = bulletItems(section(content, '표준 용어'));
    const outOfScopeItems = bulletItems(section(content, '제외 범위'));
    const decisionLogs = decisionLogItems(section(content, '의사결정 로그'));
    const verificationTargets = verificationTargetItems(section(content, '검증 대상'));
    const apiSkeleton = bulletItems(section(content, 'API Skeleton'));
    const dbSkeleton = bulletItems(section(content, 'DB Skeleton'));
    const uiSkeleton = bulletItems(firstNonEmptySection(content, ['UI Skeleton', '화면/라우팅 Skeleton']));
    const storybookContract = storybookContractItems(firstNonEmptySection(content, [
        'Storybook 계약',
        'UI / Storybook 계약',
        'UI Storybook 계약'
    ]));
    const bddReview = section(content, 'BDD 테스트 리뷰');
    const bddReviewResult = bddReviewResultSummary(bddReview);
    const bddReviewIncomplete = bddReviewResult.incomplete;
    const bddReviewApproved = bddReviewResult.approved;
    const sectionPresent = {};
    for (const sec of REQUIRED_SECTIONS) {
        sectionPresent[sec] = new RegExp(`^## ${escapeRegExp(sec)}\\s*$`, 'm').test(content);
    }
    const referencedRequirementIds = [...new Set(content.match(/\bREQ-\d{3,}\b/g) ?? [])];

    return {
        file: repoRelative(file),
        idRaw,
        id,
        title,
        priority,
        status,
        requirementType,
        specRole,
        targetSystem,
        productArea,
        qualityAttributes,
        verificationLevel,
        relatedRequirementIds,
        replacedByRequirementIds,
        parentRequirementIds,
        approved: normalizeApprovalStatus(status),
        purpose,
        scopeItems,
        acceptanceCriteria,
        openQuestions,
        terms,
        outOfScopeItems,
        decisionLogs,
        verificationTargets,
        apiSkeleton,
        dbSkeleton,
        uiSkeleton,
        storybookContract,
        sectionPresent,
        bddReviewResult: bddReviewResult.latest,
        bddReviewIncomplete,
        bddReviewApproved,
        referencedRequirementIds
    };
}

function toEntry(card) {
    return {
        kind: 'card',
        requirements: card.id ? [card.id] : [],
        location: {
            file: card.file,
            line: 0,
            identity: card.id || card.idRaw || `(no-id):${card.file}`
        },
        idRaw: card.idRaw,
        id: card.id,
        title: card.title,
        priority: card.priority,
        status: card.status,
        requirementType: card.requirementType,
        specRole: card.specRole,
        targetSystem: card.targetSystem,
        productArea: card.productArea,
        qualityAttributes: card.qualityAttributes,
        verificationLevel: card.verificationLevel,
        relatedRequirementIds: card.relatedRequirementIds,
        replacedByRequirementIds: card.replacedByRequirementIds,
        parentRequirementIds: card.parentRequirementIds,
        approved: card.approved,
        purpose: card.purpose,
        scopeItems: card.scopeItems,
        acceptanceCriteria: card.acceptanceCriteria,
        openQuestions: card.openQuestions,
        terms: card.terms,
        outOfScopeItems: card.outOfScopeItems,
        decisionLogs: card.decisionLogs,
        verificationTargets: card.verificationTargets,
        apiSkeleton: card.apiSkeleton,
        dbSkeleton: card.dbSkeleton,
        uiSkeleton: card.uiSkeleton,
        storybookContract: card.storybookContract,
        sectionPresent: card.sectionPresent,
        bddReviewResult: card.bddReviewResult,
        bddReviewIncomplete: card.bddReviewIncomplete,
        bddReviewApproved: card.bddReviewApproved,
        referencedRequirementIds: card.referencedRequirementIds
    };
}

function main() {
    const files = walk(docsRoot, (file) => file.endsWith('.md'));
    const entries = files.map(parseCard).map(toEntry);
    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        source: 'requirements.index',
        entries,
        issues: []
    };

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`requirements.index.json: ${entries.length} card(s)`);
}

export {
    acceptanceCriterionItems,
    acceptanceCriteriaWithLines,
    parseAcMarker,
    bddReviewResultItems,
    bddReviewResultSummary,
    decisionLogItems,
    verificationTargetItems,
    storybookContractItems,
    AC_TARGET_TOKENS,
    AC_MARKER_VALID_PATTERN,
    AC_MARKER_LOOSE_PATTERN
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
