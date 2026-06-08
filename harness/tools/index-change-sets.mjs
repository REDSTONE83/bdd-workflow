#!/usr/bin/env node
// Layer 1 collector: parse docs/change-sets/*.md into indexes/change-sets.index.json.
// Change Set은 영구 명세 원천이 아니라 사용자 요청 단위 작업 범위다. 별도 사람이
// 관리하는 ID를 만들지 않고 파일 경로를 identity로 사용한다.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { changeSetsDirFor, outputRootFor, repoRelative } from './workspace-config.mjs';

const docsRoot = changeSetsDirFor();
const outDir = path.join(outputRootFor(), 'indexes');
const outFile = path.join(outDir, 'change-sets.index.json');

const REQUIRED_SECTIONS = [
    '요청 요약',
    '작업 범위',
    '제외 범위',
    '완료 조건',
    '검증 명령',
    '결정 로그',
    '열린 논의'
];
const REQUIRED_HEADERS = ['상태', '요청일', '변경 유형', '영향 요건', '논의 상태'];
const ALLOWED_STATUSES = ['계획', '진행중', '완료', '보류'];
const ALLOWED_CHANGE_TYPES = ['신규', '수정', '분리', '병합', '대체', '폐기', '마이그레이션', '하네스 개선', '표준 개정'];

function walk(dir, predicate = () => true) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(fullPath, predicate);
        return predicate(fullPath) ? [fullPath] : [];
    });
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function headerValue(content, label) {
    return content.match(new RegExp(`^${escapeRegExp(label)}:[ \\t]*(.+)$`, 'm'))?.[1]?.trim() ?? '';
}

function lineNumberOf(content, pattern) {
    const match = content.match(pattern);
    if (!match || match.index === undefined) return 0;
    return content.slice(0, match.index).split('\n').length;
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

function section(content, heading) {
    const start = content.search(new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, 'm'));
    if (start < 0) return '';
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

function title(content, file) {
    return content.match(/^# Change Set:[ \t]*(.+)$/m)?.[1]?.trim()
        ?? content.match(/^#\s+(.+)$/m)?.[1]?.trim()
        ?? path.basename(file, '.md');
}

function issueFor(fileRel, ruleId, message, evidence = {}, line = 0) {
    return {
        ruleId,
        severity: 'warning',
        strictSeverity: 'warning',
        kind: 'change-set-structure',
        message,
        requirements: [],
        location: {
            file: fileRel,
            line,
            identity: fileRel
        },
        evidence,
        remediation: 'harness/docs/change-set.md'
    };
}

function validateChangeSet(content, fileRel, parsed) {
    const issues = [];

    for (const header of REQUIRED_HEADERS) {
        if (headerValue(content, header)) continue;
        issues.push(issueFor(fileRel, 'CHANGE-SET-HEADER-MISSING',
            `필수 헤더 누락: ${header}:`, { header }));
    }

    if (parsed.status && !ALLOWED_STATUSES.includes(parsed.status)) {
        issues.push(issueFor(fileRel, 'CHANGE-SET-STATUS-INVALID',
            `상태 값이 허용 목록(${ALLOWED_STATUSES.join(', ')}) 외: "${parsed.status}"`,
            { value: parsed.status, allowed: ALLOWED_STATUSES },
            lineNumberOf(content, /^상태:/m)));
    }

    for (const changeType of parsed.changeTypes) {
        if (ALLOWED_CHANGE_TYPES.includes(changeType)) continue;
        issues.push(issueFor(fileRel, 'CHANGE-SET-TYPE-INVALID',
            `변경 유형 값이 허용 목록(${ALLOWED_CHANGE_TYPES.join(', ')}) 외: "${changeType}"`,
            { value: changeType, allowed: ALLOWED_CHANGE_TYPES },
            lineNumberOf(content, /^변경 유형:/m)));
    }

    for (const sec of REQUIRED_SECTIONS) {
        if (parsed.sectionPresent[sec]) continue;
        issues.push(issueFor(fileRel, 'CHANGE-SET-SECTION-MISSING',
            `필수 섹션 누락: ## ${sec}`, { section: sec }));
    }

    const discussionStatus = parsed.discussionStatus.trim();
    const hasOpenDiscussions = parsed.openDiscussions.length > 0;
    const discussionStatusNone = !discussionStatus || /^없음$/.test(discussionStatus);
    if (!hasOpenDiscussions && !discussionStatusNone) {
        issues.push(issueFor(fileRel, 'CHANGE-SET-DISCUSSION-MISMATCH',
            '열린 논의가 없으면 `논의 상태`는 `없음`이어야 함',
            { discussionStatus, openDiscussions: parsed.openDiscussions },
            lineNumberOf(content, /^논의 상태:/m)));
    } else if (hasOpenDiscussions && discussionStatusNone) {
        issues.push(issueFor(fileRel, 'CHANGE-SET-DISCUSSION-MISMATCH',
            '열린 논의가 있으면 `논의 상태`에 짧은 요약을 적어야 함',
            { discussionStatus, openDiscussions: parsed.openDiscussions },
            lineNumberOf(content, /^논의 상태:/m)));
    }

    return issues;
}

function parseChangeSet(file) {
    const content = fs.readFileSync(file, 'utf8');
    const fileRel = repoRelative(file);
    const sectionPresent = {};
    for (const sec of REQUIRED_SECTIONS) {
        sectionPresent[sec] = new RegExp(`^## ${escapeRegExp(sec)}\\s*$`, 'm').test(content);
    }
    const affectedRequirementIds = requirementRefs(headerValue(content, '영향 요건'));
    const parsed = {
        kind: 'change-set',
        requirements: affectedRequirementIds,
        location: {
            file: fileRel,
            line: 0,
            identity: fileRel
        },
        title: title(content, file),
        status: headerValue(content, '상태'),
        requestedDate: headerValue(content, '요청일'),
        changeTypes: splitList(headerValue(content, '변경 유형')),
        affectedRequirementIds,
        discussionStatus: headerValue(content, '논의 상태'),
        requestSummary: bulletItems(section(content, '요청 요약')),
        scopeItems: bulletItems(section(content, '작업 범위')),
        outOfScopeItems: bulletItems(section(content, '제외 범위')),
        completionCriteria: bulletItems(section(content, '완료 조건')),
        verificationCommands: bulletItems(section(content, '검증 명령')),
        decisions: bulletItems(section(content, '결정 로그')),
        openDiscussions: bulletItems(section(content, '열린 논의'))
            .filter((item) => !/^없음$/.test(item.trim())),
        sectionPresent,
        referencedRequirementIds: requirementRefs(content),
        issues: []
    };
    parsed.issues = validateChangeSet(content, fileRel, parsed);
    return parsed;
}

function main() {
    const files = walk(docsRoot, (file) => file.endsWith('.md')).sort();
    const entries = files.map(parseChangeSet);
    const issues = entries.flatMap((entry) => entry.issues ?? []);
    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        source: 'change-sets.index',
        entries,
        issues
    };

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`change-sets.index.json: ${entries.length} change set(s), ${issues.length} warning(s)`);
}

export { parseChangeSet, splitList, requirementRefs };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
