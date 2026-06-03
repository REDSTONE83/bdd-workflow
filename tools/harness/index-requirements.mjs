#!/usr/bin/env node
// Layer 1 collector: parse docs/requirements/*.md into indexes/requirements.index.json.
// 본문 raw content는 인덱스에 넣지 않는다. 다음 단계(card 구조 검사, cross-artifact 검사)가
// 필요로 하는 모든 필드를 미리 추출해 둔다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const docsRoot = path.join(workspaceRoot, 'docs', 'requirements');
const outDir = path.join(workspaceRoot, 'build', 'harness', 'indexes');
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

function repoRelative(filePath) {
    return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
}

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

function acceptanceCriterionItems(markdown) {
    return bulletItems(markdown).map((raw) => {
        const validMatch = raw.match(AC_MARKER_VALID_PATTERN);
        if (validMatch && AC_TARGET_TOKENS.includes(validMatch[1])) {
            return { text: raw.slice(validMatch[0].length), target: validMatch[1] };
        }
        const looseMatch = raw.match(AC_MARKER_LOOSE_PATTERN);
        if (looseMatch) {
            return { text: raw, target: null, invalidMarker: looseMatch[1] };
        }
        return { text: raw, target: null };
    });
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
    const acceptanceCriteria = acceptanceCriterionItems(section(content, '수용 기준'));
    const openQuestions = bulletItems(section(content, '열린 질문'))
        .filter((item) => !/^없음$/.test(item.trim()));
    const terms = bulletItems(section(content, '표준 용어'));
    const bddReview = section(content, 'BDD 테스트 리뷰');
    const bddReviewIncomplete = /미완료/.test(bddReview);
    const bddReviewApproved = /^[ \t]*결과:[ \t]*승인\s*$/m.test(bddReview);
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
        approved: normalizeApprovalStatus(status),
        acceptanceCriteria,
        openQuestions,
        terms,
        sectionPresent,
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
        approved: card.approved,
        acceptanceCriteria: card.acceptanceCriteria,
        openQuestions: card.openQuestions,
        terms: card.terms,
        sectionPresent: card.sectionPresent,
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

export { acceptanceCriterionItems, AC_TARGET_TOKENS, AC_MARKER_VALID_PATTERN, AC_MARKER_LOOSE_PATTERN };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
