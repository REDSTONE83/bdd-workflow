import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(backendRoot, '..');
const docsRoot = path.join(workspaceRoot, 'docs', 'requirements');
const outputDir = path.join(backendRoot, 'build', 'harness');
const sourceIndexPath = path.join(outputDir, 'source-index.json');
const terminologyReportPath = path.join(outputDir, 'terminology-report.json');
const terminologyIndexPath = path.join(outputDir, 'terminology-index.json');
const testResultRoots = [
    path.join(backendRoot, 'target', 'surefire-reports'),
    path.join(backendRoot, 'build', 'test-results', 'test')
];

function parseCliArgs(argv) {
    const requirementIds = new Set();
    const requirementFiles = new Set();
    let checkMode = false;
    let requireBlue = false;
    let quiet = false;
    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        if (arg === '--check') {
            checkMode = true;
            i += 1;
            continue;
        }
        if (arg === '--require-blue') {
            requireBlue = true;
            i += 1;
            continue;
        }
        if (arg === '--quiet') {
            quiet = true;
            i += 1;
            continue;
        }
        if (arg === '--requirement') {
            const value = argv[i + 1];
            if (!value) {
                throw new Error('--requirement requires a value');
            }
            requirementIds.add(value.trim());
            i += 2;
            continue;
        }
        if (arg.startsWith('--requirement=')) {
            requirementIds.add(arg.slice('--requirement='.length).trim());
            i += 1;
            continue;
        }
        if (arg === '--requirement-file') {
            const value = argv[i + 1];
            if (!value) {
                throw new Error('--requirement-file requires a value');
            }
            requirementFiles.add(path.resolve(process.cwd(), value));
            i += 2;
            continue;
        }
        if (arg.startsWith('--requirement-file=')) {
            requirementFiles.add(path.resolve(process.cwd(), arg.slice('--requirement-file='.length)));
            i += 1;
            continue;
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
    return { requirementIds, requirementFiles, checkMode, requireBlue, quiet };
}

const cli = parseCliArgs(process.argv.slice(2));
const checkMode = cli.checkMode;
const requireBlue = cli.requireBlue;
const quiet = cli.quiet;

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
const REQUIREMENT_ID_PATTERN = /^REQ-\d{3,}$/;
const REQUIREMENT_FILENAME_PATTERN = /^(REQ-\d{3,})-[^/]+\.md$/;
const TERM_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*){1,2}$/;

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

function section(content, heading) {
    const start = content.search(new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, 'm'));
    if (start < 0) {
        return '';
    }
    const afterHeading = content.slice(start).replace(new RegExp(`^## ${escapeRegExp(heading)}\\s*`, 'm'), '');
    const nextHeading = afterHeading.search(/^## /m);
    return nextHeading >= 0 ? afterHeading.slice(0, nextHeading) : afterHeading;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function bulletItems(markdown) {
    return markdown
        .split('\n')
        .map((line) => line.match(/^\s*-\s+(?:\[[ xX]\]\s*)?(.+?)\s*$/)?.[1])
        .filter(Boolean);
}

function normalizeApprovalStatus(status) {
    const normalized = status.trim().toLowerCase();
    return ['승인', 'approved', 'blue'].includes(normalized);
}

function readAllRequirementCards() {
    return walk(docsRoot, (file) => file.endsWith('.md')).map((file) => {
        const content = fs.readFileSync(file, 'utf8');
        const idRaw = content.match(/^요건 ID:[ \t]*(.+)$/m)?.[1]?.trim() ?? '';
        const id = REQUIREMENT_ID_PATTERN.test(idRaw) ? idRaw : '';
        const title = content.match(/^제목:[ \t]*(.+)$/m)?.[1]?.trim() ?? '';
        const priority = content.match(/^우선순위:[ \t]*(.+)$/m)?.[1]?.trim() ?? '';
        const status = content.match(/^상태:[ \t]*(.+)$/m)?.[1]?.trim() ?? '';
        const acceptanceCriteria = bulletItems(section(content, '수용 기준'));
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

        return {
            id,
            idRaw,
            title,
            priority,
            status,
            approved: normalizeApprovalStatus(status),
            file,
            content,
            acceptanceCriteria,
            openQuestions,
            terms,
            bddReviewIncomplete,
            bddReviewApproved,
            sectionPresent
        };
    });
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

function referencedRequirementIds(content) {
    const matches = content?.match(/\bREQ-\d{3,}\b/g) ?? [];
    return [...new Set(matches)];
}

function validateRequirementCardStructure(card, allCards, terminologyIndex) {
    const issues = [];
    const fname = path.basename(card.file);
    const fnameMatch = fname.match(REQUIREMENT_FILENAME_PATTERN);

    if (!card.idRaw) {
        issues.push('요건 ID 누락');
    } else if (!REQUIREMENT_ID_PATTERN.test(card.idRaw)) {
        issues.push(`요건 ID 형식이 REQ-NNN 아님: "${card.idRaw}"`);
    }

    if (!fnameMatch) {
        issues.push(`파일명이 REQ-NNN-*.md 형식 아님: ${fname}`);
    } else if (card.id && fnameMatch[1] !== card.id) {
        issues.push(`파일명 ID(${fnameMatch[1]})와 카드 ID(${card.id}) 불일치`);
    }

    if (!card.title) {
        issues.push('제목 누락');
    }
    if (!card.priority) {
        issues.push('우선순위 누락');
    } else if (!ALLOWED_PRIORITIES.includes(card.priority)) {
        issues.push(`우선순위 값이 허용 목록(${ALLOWED_PRIORITIES.join(', ')}) 외: "${card.priority}"`);
    }
    if (!card.status) {
        issues.push('상태 누락');
    } else if (!ALLOWED_STATUSES.includes(card.status)) {
        issues.push(`상태 값이 허용 목록(${ALLOWED_STATUSES.join(', ')}) 외: "${card.status}"`);
    }

    for (const sec of REQUIRED_SECTIONS) {
        if (!card.sectionPresent[sec]) {
            issues.push(`필수 섹션 누락: ## ${sec}`);
        }
    }

    if (card.acceptanceCriteria.length === 0) {
        issues.push('수용 기준 비어 있음');
    }
    for (const dupe of duplicateItems(card.acceptanceCriteria)) {
        issues.push(`중복 수용 기준: "${dupe}"`);
    }

    for (const term of card.terms) {
        if (!TERM_KEY_PATTERN.test(term)) {
            issues.push(`표준 용어가 term key 형식 아님: "${term}"`);
            continue;
        }
        if (terminologyIndex && !hasRegisteredTerm(terminologyIndex, term)) {
            issues.push(`표준 용어가 등록되어 있지 않음: "${term}"`);
        }
    }
    for (const dupe of duplicateItems(card.terms)) {
        issues.push(`중복 표준 용어: "${dupe}"`);
    }

    if (card.id) {
        const dupes = allCards.filter((other) => other.id === card.id && other.file !== card.file);
        if (dupes.length > 0) {
            const others = dupes.map((c) => path.relative(workspaceRoot, c.file)).join(', ');
            issues.push(`중복 요건 ID: ${others}`);
        }
    }

    if (card.content) {
        const knownIds = new Set(allCards.map((c) => c.id).filter(Boolean));
        for (const ref of referencedRequirementIds(card.content)) {
            if (!knownIds.has(ref)) {
                issues.push(`존재하지 않는 요건 ID 참조: ${ref}`);
            }
        }
    }

    if (card.approved) {
        if (card.openQuestions.length > 0) {
            issues.push('상태=승인이지만 열린 질문이 남아 있음');
        }
        if (card.bddReviewIncomplete) {
            issues.push('상태=승인이지만 BDD 테스트 리뷰에 "미완료" 표기 있음');
        }
        if (!card.bddReviewApproved) {
            issues.push('상태=승인이지만 BDD 테스트 리뷰에 "결과: 승인" 줄이 없음');
        }
    }

    return issues;
}

function readSourceIndex() {
    if (!fs.existsSync(sourceIndexPath)) {
        throw new Error(
            `Missing JavaParser source index: ${sourceIndexPath}\n` +
            'Run ./gradlew generateHarnessSourceIndex or ./gradlew traceRequirements first.'
        );
    }

    const sourceIndex = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));
    return {
        apis: sourceIndex.apis ?? [],
        tests: sourceIndex.tests ?? [],
        entities: sourceIndex.entities ?? []
    };
}

function readTerminologyReport() {
    if (!fs.existsSync(terminologyReportPath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(terminologyReportPath, 'utf8'));
    } catch (err) {
        return null;
    }
}

function readTerminologyIndex() {
    if (!fs.existsSync(terminologyIndexPath)) {
        return null;
    }
    try {
        const parsed = JSON.parse(fs.readFileSync(terminologyIndexPath, 'utf8'));
        return { terms: parsed.terms ?? {} };
    } catch (err) {
        return null;
    }
}

function hasRegisteredTerm(index, termKey) {
    return Boolean(index?.terms?.[termKey]);
}

function emptyTerminologyCounts() {
    return { error: 0, warning: 0, strictError: 0, byKind: {} };
}

function tallyFindings(findings) {
    const counts = emptyTerminologyCounts();
    for (const finding of findings) {
        if (finding.severity === 'error') counts.error++;
        else if (finding.severity === 'warning') counts.warning++;
        if (finding.strictSeverity === 'error') counts.strictError++;
        counts.byKind[finding.kind] = (counts.byKind[finding.kind] || 0) + 1;
    }
    return counts;
}

function bucketTerminologyFindings(report, knownIds) {
    if (!report) {
        return { present: false, perRequirement: new Map(), unattributed: [], totals: emptyTerminologyCounts(), mode: null, generatedAt: null };
    }
    const perRequirement = new Map();
    const unattributed = [];
    for (const finding of report.findings || []) {
        const attributed = (finding.requirements || []).filter((req) => knownIds.has(req));
        if (attributed.length === 0) {
            unattributed.push(finding);
            continue;
        }
        for (const reqId of attributed) {
            if (!perRequirement.has(reqId)) {
                perRequirement.set(reqId, []);
            }
            perRequirement.get(reqId).push(finding);
        }
    }
    return {
        present: true,
        perRequirement,
        unattributed,
        totals: tallyFindings(report.findings || []),
        mode: report.mode || null,
        generatedAt: report.generatedAt || null
    };
}

function formatFindingLocation(finding) {
    const loc = finding.location || {};
    const parts = [];
    if (loc.file) parts.push(loc.line ? `${loc.file}:${loc.line}` : loc.file);
    if (loc.channel) parts.push(`[${loc.channel}]`);
    return parts.join(' ');
}

function formatFindingLine(finding) {
    const sev = finding.severity === finding.strictSeverity
        ? finding.severity
        : `${finding.severity}/strict:${finding.strictSeverity}`;
    const term = finding.term ? ` ${finding.term}` : (finding.originTerms ? ` (${finding.originTerms.join(', ')})` : '');
    const surface = finding.surface ? ` "${finding.surface}"` : '';
    const candidates = finding.candidates ? ` → ${finding.candidates.join(', ')}` : '';
    const loc = formatFindingLocation(finding);
    return `- [${sev}] ${finding.kind}${term}${surface}${candidates}${loc ? ' — ' + loc : ''}`;
}

function readTestResults() {
    const results = new Map();
    for (const file of testResultRoots.flatMap((root) => walk(root, (candidate) => candidate.endsWith('.xml')))) {
        const content = fs.readFileSync(file, 'utf8');
        // self-closing 형태를 먼저 시도해 BODY 패턴이 SELF 태그를 흡수하지 않도록 한다.
        // (BODY 패턴이 `<testcase ... />` 의 opening을 attrs로 삼키고 다음 `</testcase>`까지 가
        //  뒤에 오는 BODY 테스트케이스 1건을 통째로 가리는 회귀를 막는다.)
        const testcaseRegex = /<testcase\b([^>]*)\/>|<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g;
        for (const match of content.matchAll(testcaseRegex)) {
            // 그룹 1: self-closing의 attrs. 그룹 2: body 형태의 attrs. 그룹 3: body 본문.
            const attrs = match[1] ?? match[2] ?? '';
            const body = match[3] ?? '';
            const className = attrs.match(/\bclassname="([^"]+)"/)?.[1]?.split('.').pop();
            const name = attrs.match(/\bname="([^"]+)"/)?.[1];
            if (!className || !name) {
                continue;
            }
            let status = 'PASS';
            if (body.includes('<failure') || body.includes('<error')) {
                status = 'FAIL';
            } else if (body.includes('<skipped')) {
                status = 'SKIP';
            }
            results.set(`${className}.${name}`, status);
        }
    }
    return results;
}

function statusForCriterion(criterion, tests, results) {
    const matchingTests = tests.filter((test) => test.covers.includes(criterion));
    if (matchingTests.length === 0) {
        return { status: 'MISSING', tests: [] };
    }

    const testStatuses = matchingTests.map((test) => ({
        ...test,
        result: results.get(test.identity) ?? results.get(`${test.className}.${test.displayName}`) ?? 'NOT_RUN'
    }));

    if (testStatuses.some((test) => test.result === 'FAIL')) {
        return { status: 'FAIL', tests: testStatuses };
    }
    if (testStatuses.some((test) => test.result === 'SKIP')) {
        return { status: 'SKIP', tests: testStatuses };
    }
    if (testStatuses.some((test) => test.result === 'NOT_RUN')) {
        return { status: 'NOT_RUN', tests: testStatuses };
    }
    return { status: 'PASS', tests: testStatuses };
}

function attachTerminology(requirement, bucket) {
    const findings = bucket.perRequirement.get(requirement.id) || [];
    return {
        ...requirement,
        terminology: {
            findings,
            counts: tallyFindings(findings)
        }
    };
}

function evaluateRequirement(card, apis, tests, entities, results) {
    const requirementApis = apis.filter((api) => api.requirements.includes(card.id));
    const requirementTests = tests.filter((test) => test.requirements.includes(card.id));
    const requirementEntities = entities
        .map((entity) => ({
            ...entity,
            columns: entity.columns.filter((column) => column.requirements.includes(card.id))
        }))
        .filter((entity) => entity.requirements.includes(card.id) || entity.columns.length > 0);
    const coverage = card.acceptanceCriteria.map((criterion) => ({
        criterion,
        ...statusForCriterion(criterion, requirementTests, results)
    }));

    const redReasons = [];
    if (card.acceptanceCriteria.length === 0) {
        redReasons.push('수용 기준 없음');
    }
    if (requirementApis.length === 0) {
        redReasons.push('관련 API 없음');
    }
    for (const row of coverage) {
        if (row.status !== 'PASS') {
            redReasons.push(`${row.criterion}: ${row.status}`);
        }
    }

    if (redReasons.length > 0) {
        return {
            ...card,
            state: 'RED',
            redReasons,
            apis: requirementApis,
            tests: requirementTests,
            entities: requirementEntities,
            coverage
        };
    }

    const blueBlockedBy = [];
    if (!card.approved) {
        blueBlockedBy.push(`요건 카드 상태가 승인 아님: ${card.status || '미기재'}`);
    }
    if (card.openQuestions.length > 0) {
        blueBlockedBy.push('열린 질문 남음');
    }

    return {
        ...card,
        state: blueBlockedBy.length === 0 ? 'BLUE' : 'GREEN',
        redReasons,
        blueBlockedBy,
        apis: requirementApis,
        tests: requirementTests,
        entities: requirementEntities,
        coverage
    };
}

function buildModel(allCards, cards, apis, tests, entities, results, terminologyReport, terminologyIndex, selectedIds, flags = {}) {
    const knownRequirementIds = new Set(cards.map((card) => card.id));
    const terminologyBucket = bucketTerminologyFindings(terminologyReport, knownRequirementIds);
    const isSelected = (id) => !selectedIds || selectedIds.has(id);
    const allRequirements = cards
        .map((card) => evaluateRequirement(card, apis, tests, entities, results))
        .map((req) => attachTerminology(req, terminologyBucket));
    const requirements = allRequirements.filter((req) => isSelected(req.id));
    const hasUnknown = (refs) => refs.length === 0 || refs.some((ref) => !knownRequirementIds.has(ref));
    const intersectsSelection = (refs) => !selectedIds || refs.some((ref) => selectedIds.has(ref));
    const unknownApis = apis
        .filter((api) => hasUnknown(api.requirements))
        .filter((api) => intersectsSelection(api.requirements));
    const unknownTests = tests
        .filter((test) => hasUnknown(test.requirements))
        .filter((test) => intersectsSelection(test.requirements));
    const unknownEntities = entities
        .filter((entity) => {
            const refs = [
                ...entity.requirements,
                ...entity.columns.flatMap((column) => column.requirements)
            ];
            return hasUnknown(refs);
        })
        .filter((entity) => {
            const refs = [
                ...entity.requirements,
                ...entity.columns.flatMap((column) => column.requirements)
            ];
            return intersectsSelection(refs);
        });

    const candidateCards = selectedIds
        ? allCards.filter((card) => selectedIds.has(card.id))
        : allCards;
    const structureReports = candidateCards.map((card) => ({
        file: card.file,
        id: card.id || card.idRaw || '(no id)',
        title: card.title,
        issues: validateRequirementCardStructure(card, allCards, terminologyIndex)
    }));
    if (!terminologyIndex && (flags.checkMode || flags.requireBlue)) {
        structureReports.unshift({
            file: terminologyIndexPath,
            id: '(global)',
            title: 'terminology-index.json 누락',
            issues: ['terminology-index.json이 없어 표준 용어 등록 검사를 수행하지 못함 — `./gradlew indexTerminology` 또는 `./gradlew validateTerminology` 먼저 실행']
        });
    }
    const structureIssueCount = structureReports.reduce((sum, report) => sum + report.issues.length, 0);

    const summary = {
        total: requirements.length,
        red: requirements.filter((requirement) => requirement.state === 'RED').length,
        green: requirements.filter((requirement) => requirement.state === 'GREEN').length,
        blue: requirements.filter((requirement) => requirement.state === 'BLUE').length,
        unknownApis: unknownApis.length,
        unknownTests: unknownTests.length,
        unknownEntities: unknownEntities.length,
        structureIssues: structureIssueCount
    };

    return {
        generatedAt: new Date().toISOString(),
        filter: selectedIds ? [...selectedIds].sort() : null,
        summary,
        knownRequirementIds: [...knownRequirementIds],
        requirements,
        structureReports,
        unknownApis,
        unknownTests,
        unknownEntities,
        terminology: {
            present: terminologyBucket.present,
            mode: terminologyBucket.mode,
            generatedAt: terminologyBucket.generatedAt,
            totals: terminologyBucket.totals,
            unattributed: terminologyBucket.unattributed
        }
    };
}

function formatCountsLine(counts) {
    const byKindStr = Object.keys(counts.byKind).length === 0
        ? ''
        : ` (by kind: ${Object.entries(counts.byKind).map(([k, v]) => `${k}=${v}`).join(', ')})`;
    return `Findings: error=${counts.error}, warning=${counts.warning}, strictError=${counts.strictError}${byKindStr}`;
}

function buildMarkdown(model) {
    const lines = ['# Requirement Trace Report', ''];
    lines.push(`Generated: ${model.generatedAt}`, '');
    if (model.filter) {
        lines.push(`Filter: ${model.filter.join(', ')}`, '');
    }
    lines.push('## Summary', '');
    lines.push(`- Total: ${model.summary.total}`);
    lines.push(`- RED: ${model.summary.red}`);
    lines.push(`- GREEN: ${model.summary.green}`);
    lines.push(`- BLUE: ${model.summary.blue}`);
    lines.push(`- Unknown API references: ${model.summary.unknownApis}`);
    lines.push(`- Unknown test references: ${model.summary.unknownTests}`);
    lines.push(`- Unknown entity references: ${model.summary.unknownEntities}`);
    lines.push(`- Card structure issues: ${model.summary.structureIssues}`);
    if (model.terminology.present) {
        const t = model.terminology;
        lines.push(`- Terminology mode: ${t.mode}`);
        lines.push(`- Terminology findings: error=${t.totals.error}, warning=${t.totals.warning}, strictError=${t.totals.strictError}`);
        if (t.totals.strictError > 0) {
            lines.push(`  (잠재 strict 실패 ${t.totals.strictError}건 — validateHarness 판정에는 영향 없음. validateTerminologyStrict로 별도 검증.)`);
        }
    } else {
        lines.push('- Terminology report: 없음 (`./gradlew validateTerminology` 실행 필요)');
    }
    lines.push('');

    for (const requirement of model.requirements) {
        lines.push(`## ${requirement.id} ${requirement.title}`, '');
        lines.push(`State: ${requirement.state}`);
        lines.push(`Card status: ${requirement.status || '미기재'}`);
        lines.push(`Card: ${path.relative(workspaceRoot, requirement.file)}`);
        lines.push('');

        if (requirement.redReasons.length > 0) {
            lines.push('### RED Reasons', '');
            for (const reason of requirement.redReasons) {
                lines.push(`- ${reason}`);
            }
            lines.push('');
        }

        if (requirement.state === 'GREEN' && requirement.blueBlockedBy.length > 0) {
            lines.push('### BLUE Blockers', '');
            for (const blocker of requirement.blueBlockedBy) {
                lines.push(`- ${blocker}`);
            }
            lines.push('');
        }

        lines.push('### APIs', '');
        if (requirement.apis.length === 0) {
            lines.push('- MISSING');
        } else {
            for (const api of requirement.apis) {
                lines.push(`- ${api.http} / ${api.controller} [${api.requirements.join(', ')}]`);
            }
        }
        lines.push('');

        lines.push('### Entities', '');
        if (requirement.entities.length === 0) {
            lines.push('- (없음)');
        } else {
            for (const entity of requirement.entities) {
                lines.push(`- ${entity.className} → ${entity.table} [${entity.requirements.join(', ') || '(class-level 미지정)'}]`);
                for (const column of entity.columns) {
                    lines.push(`  - ${column.columnName} (${column.javaType}) [${column.requirements.join(', ') || '(field-level 미지정)'}]`);
                }
            }
        }
        lines.push('');

        lines.push('### Acceptance Criteria Coverage', '');
        for (const row of requirement.coverage) {
            lines.push(`- ${row.status}: ${row.criterion}`);
            for (const test of row.tests) {
                lines.push(`  - ${test.identity}: ${test.result}`);
            }
        }
        lines.push('');

        if (model.terminology.present) {
            lines.push('### Terminology', '');
            const t = requirement.terminology;
            lines.push(formatCountsLine(t.counts));
            if (t.findings.length > 0) {
                lines.push('');
                for (const finding of t.findings) {
                    lines.push(formatFindingLine(finding));
                }
            }
            lines.push('');
        }
    }

    const formatUnknownRefs = (refs) => {
        if (refs.length === 0) {
            return '미지정';
        }
        return refs.map((ref) => model.knownRequirementIds.includes(ref) ? ref : `${ref}(!)`).join(', ');
    };

    if (model.structureReports.some((report) => report.issues.length > 0)) {
        lines.push('## Card Structure Issues', '');
        for (const report of model.structureReports) {
            if (report.issues.length === 0) continue;
            lines.push(`### ${report.id}${report.title ? ' ' + report.title : ''}`);
            lines.push(`Card: ${path.relative(workspaceRoot, report.file)}`);
            for (const issue of report.issues) {
                lines.push(`- ${issue}`);
            }
            lines.push('');
        }
    }

    if (model.unknownApis.length > 0) {
        lines.push('## Unknown API Requirement References', '');
        for (const api of model.unknownApis) {
            lines.push(`- [${formatUnknownRefs(api.requirements)}] ${api.http} / ${api.controller}`);
        }
        lines.push('');
    }

    if (model.unknownTests.length > 0) {
        lines.push('## Unknown Test Requirement References', '');
        for (const test of model.unknownTests) {
            lines.push(`- [${formatUnknownRefs(test.requirements)}] ${test.identity}`);
        }
        lines.push('');
    }

    if (model.unknownEntities.length > 0) {
        lines.push('## Unknown Entity Requirement References', '');
        for (const entity of model.unknownEntities) {
            lines.push(`- [${formatUnknownRefs(entity.requirements)}] ${entity.className} → ${entity.table}`);
            const offendingColumns = entity.columns.filter((column) =>
                column.requirements.length === 0 ||
                column.requirements.some((ref) => !model.knownRequirementIds.includes(ref))
            );
            for (const column of offendingColumns) {
                lines.push(`  - [${formatUnknownRefs(column.requirements)}] ${column.columnName} (${column.javaType})`);
            }
        }
        lines.push('');
    }

    if (model.terminology.present && model.terminology.unattributed.length > 0) {
        lines.push('## Unattributed Terminology Findings', '');
        lines.push(formatCountsLine(tallyFindings(model.terminology.unattributed)));
        lines.push('');
        for (const finding of model.terminology.unattributed) {
            lines.push(formatFindingLine(finding));
        }
        lines.push('');
    }

    return lines.join('\n');
}

const allCardsRaw = readAllRequirementCards();
const cards = allCardsRaw.filter((card) => card.id);
const sourceIndex = readSourceIndex();
const apis = sourceIndex.apis;
const tests = sourceIndex.tests;
const entities = sourceIndex.entities;
const results = readTestResults();
const terminologyReport = readTerminologyReport();
const terminologyIndex = readTerminologyIndex();

function resolveSelectedIds(cli, allCards) {
    if (cli.requirementIds.size === 0 && cli.requirementFiles.size === 0) {
        return null;
    }
    const selected = new Set();
    const errors = [];
    for (const reqId of cli.requirementIds) {
        if (!REQUIREMENT_ID_PATTERN.test(reqId)) {
            errors.push(`--requirement 값이 REQ-NNN 형식 아님: "${reqId}"`);
            continue;
        }
        const match = allCards.find((card) => card.id === reqId);
        if (!match) {
            errors.push(`--requirement ${reqId}: ${path.relative(workspaceRoot, docsRoot)}에서 카드를 찾을 수 없음`);
            continue;
        }
        selected.add(reqId);
    }
    for (const reqFile of cli.requirementFiles) {
        if (!fs.existsSync(reqFile)) {
            errors.push(`--requirement-file 경로가 존재하지 않음: ${reqFile}`);
            continue;
        }
        const resolvedFile = fs.realpathSync(reqFile);
        const match = allCards.find((card) => fs.realpathSync(card.file) === resolvedFile);
        if (!match) {
            errors.push(`--requirement-file: ${path.relative(workspaceRoot, reqFile)}에 일치하는 카드 없음`);
            continue;
        }
        if (!match.id) {
            errors.push(`--requirement-file: ${path.relative(workspaceRoot, reqFile)} 카드에 유효한 요건 ID 없음`);
            continue;
        }
        selected.add(match.id);
    }
    if (errors.length > 0) {
        for (const err of errors) {
            console.error(`error: ${err}`);
        }
        process.exit(2);
    }
    return selected;
}

const selectedIds = resolveSelectedIds(cli, allCardsRaw);
const model = buildModel(allCardsRaw, cards, apis, tests, entities, results, terminologyReport, terminologyIndex, selectedIds, { checkMode, requireBlue });
const markdown = buildMarkdown(model);

fs.mkdirSync(outputDir, { recursive: true });
const reportSuffix = selectedIds ? `-${[...selectedIds].sort().join('-')}` : '';
const mdPath = path.join(outputDir, `trace-report${reportSuffix}.md`);
const jsonPath = path.join(outputDir, `trace-report${reportSuffix}.json`);
fs.writeFileSync(mdPath, markdown);
fs.writeFileSync(jsonPath, `${JSON.stringify(model, null, 2)}\n`);

if (quiet) {
    const summary = model.summary;
    console.log(`Trace report written to ${path.relative(process.cwd(), mdPath)} — total=${summary.total} red=${summary.red} green=${summary.green} blue=${summary.blue} structureIssues=${summary.structureIssues}`);
} else {
    console.log(markdown);
}

const hasUnknownReferences =
    model.summary.unknownApis > 0 ||
    model.summary.unknownTests > 0 ||
    model.summary.unknownEntities > 0;
const hasStructureIssues = model.summary.structureIssues > 0;
if (checkMode && (model.summary.total === 0 || model.summary.red > 0 || hasUnknownReferences || hasStructureIssues)) {
    process.exitCode = 1;
}
if (requireBlue && (model.summary.total === 0 || model.summary.red > 0 || model.summary.green > 0 || hasUnknownReferences || hasStructureIssues)) {
    process.exitCode = 1;
}
