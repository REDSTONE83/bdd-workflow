import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const backendRoot = path.join(workspaceRoot, 'back-end');
const docsRoot = path.join(workspaceRoot, 'docs', 'requirements');
const outputDir = path.join(workspaceRoot, 'build', 'harness');
const sourceIndexPath = path.join(outputDir, 'source-index.backend.json');
const frontEndSourceIndexPath = path.join(outputDir, 'source-index.front-end.json');
const scenarioIndexPath = path.join(outputDir, 'scenario-index.json');
const terminologyReportPath = path.join(outputDir, 'terminology-report.json');
const terminologyIndexPath = path.join(outputDir, 'terminology-index.json');
const frontEndTestResultPath = path.join(workspaceRoot, 'front-end', 'test-results', 'e2e-results.json');
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
const ALLOWED_IMPLEMENTATION_TARGETS = ['back-end', 'front-end', 'full-stack'];
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
        const implementationTargetRaw = content.match(/^구현 대상:[ \t]*(.+)$/m)?.[1]?.trim() ?? '';
        const implementationTarget = ALLOWED_IMPLEMENTATION_TARGETS.includes(implementationTargetRaw)
            ? implementationTargetRaw
            : 'back-end';
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
            implementationTarget,
            implementationTargetRaw,
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
    if (card.implementationTargetRaw && !ALLOWED_IMPLEMENTATION_TARGETS.includes(card.implementationTargetRaw)) {
        issues.push(`구현 대상 값이 허용 목록(${ALLOWED_IMPLEMENTATION_TARGETS.join(', ')}) 외: "${card.implementationTargetRaw}"`);
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
        tests: (sourceIndex.tests ?? []).map((test) => ({ source: 'back-end', ...test })),
        entities: sourceIndex.entities ?? []
    };
}

function readFrontEndSourceIndex() {
    if (!fs.existsSync(frontEndSourceIndexPath)) {
        return {
            present: false,
            pages: [],
            routes: [],
            stories: [],
            tests: [],
            issues: [],
            textChannels: []
        };
    }

    const frontEndSourceIndex = JSON.parse(fs.readFileSync(frontEndSourceIndexPath, 'utf8'));
    return {
        present: true,
        generatedAt: frontEndSourceIndex.generatedAt ?? null,
        pages: frontEndSourceIndex.pages ?? [],
        routes: frontEndSourceIndex.routes ?? [],
        stories: frontEndSourceIndex.stories ?? [],
        tests: (frontEndSourceIndex.tests ?? []).map((test) => ({ source: 'front-end', ...test })),
        issues: frontEndSourceIndex.issues ?? [],
        textChannels: frontEndSourceIndex.textChannels ?? []
    };
}

function readScenarioIndex() {
    if (!fs.existsSync(scenarioIndexPath)) {
        return { present: false, features: [], issues: [] };
    }
    try {
        const data = JSON.parse(fs.readFileSync(scenarioIndexPath, 'utf8'));
        return {
            present: true,
            features: data.features ?? [],
            issues: data.issues ?? [],
            generatedAt: data.generatedAt ?? null
        };
    } catch (err) {
        return {
            present: false,
            features: [],
            issues: [{ line: 0, message: `scenario-index.json 파싱 실패: ${err.message}` }]
        };
    }
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

function normalizeRepoPath(filePath) {
    if (!filePath) {
        return '';
    }
    if (path.isAbsolute(filePath)) {
        return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
    }
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.startsWith('front-end/')) {
        return normalized;
    }
    if (!normalized.includes('/') && /\.spec\.[cm]?[tj]sx?$/.test(normalized)) {
        return `front-end/tests/e2e/${normalized}`;
    }
    return `front-end/${normalized}`;
}

function statusFromPlaywrightTest(test) {
    const results = test.results ?? [];
    if (test.outcome === 'skipped' || results.some((result) => result.status === 'skipped')) {
        return 'SKIP';
    }
    if (['unexpected', 'flaky'].includes(test.outcome)) {
        return 'FAIL';
    }
    if (results.some((result) => ['failed', 'timedOut', 'interrupted'].includes(result.status))) {
        return 'FAIL';
    }
    if (results.length === 0) {
        return 'NOT_RUN';
    }
    return 'PASS';
}

function readFrontEndTestResults() {
    const results = new Map();
    if (!fs.existsSync(frontEndTestResultPath)) {
        return results;
    }

    let report;
    try {
        report = JSON.parse(fs.readFileSync(frontEndTestResultPath, 'utf8'));
    } catch {
        return results;
    }

    function walkSuite(suite, describeStack = []) {
        const suiteTitle = suite.title && !/\.(spec|test)\.[cm]?[tj]sx?$/.test(suite.title)
            ? suite.title
            : null;
        const childDescribeStack = suiteTitle ? [...describeStack, suiteTitle] : describeStack;
        for (const spec of suite.specs ?? []) {
            const file = normalizeRepoPath(spec.file);
            const titlePath = [...childDescribeStack, spec.title].filter(Boolean);
            const line = spec.line ?? 0;
            const identity = `${file}:${line} > ${titlePath.join(' > ')}`;
            const identityNoLine = `${file} > ${titlePath.join(' > ')}`;
            const testStatuses = (spec.tests ?? []).map(statusFromPlaywrightTest);
            const status = combineStatuses(testStatuses.length > 0 ? testStatuses : ['NOT_RUN']);
            results.set(identity, status);
            results.set(identityNoLine, status);
        }
        for (const child of suite.suites ?? []) {
            walkSuite(child, childDescribeStack);
        }
    }

    for (const suite of report.suites ?? []) {
        walkSuite(suite, []);
    }
    return results;
}

function scenarioCovers(scenario) {
    return (scenario.covers ?? []).map((c) => (typeof c === 'string' ? c : c.text));
}

function combineStatuses(statuses) {
    if (statuses.length === 0) {
        return 'MISSING';
    }
    if (statuses.some((status) => status === 'FAIL')) {
        return 'FAIL';
    }
    if (statuses.some((status) => status === 'SKIP')) {
        return 'SKIP';
    }
    if (statuses.some((status) => status === 'NOT_RUN')) {
        return 'NOT_RUN';
    }
    if (statuses.some((status) => status === 'MISSING')) {
        return 'MISSING';
    }
    return 'PASS';
}

function resultForTest(test, results) {
    const keys = [
        test.identity,
        ...(test.resultKeys ?? []),
        `${test.className}.${test.displayName}`
    ].filter(Boolean);
    for (const key of keys) {
        if (results.has(key)) {
            return results.get(key);
        }
    }
    return 'NOT_RUN';
}

function statusForCriterion(criterion, tests, scenarios, results) {
    const matchingTests = tests.filter((test) => test.covers.includes(criterion));
    const matchingScenarios = scenarios.filter((scenario) =>
        scenarioCovers(scenario).includes(criterion)
    );

    const testStatuses = matchingTests.map((test) => ({
        ...test,
        result: resultForTest(test, results)
    }));

    // Scenario는 사용자 행위 단위, Test는 AC 검증 단위.
    // 한 AC를 다루는 Scenario와 한 AC를 검증하는 Test는 같은 AC에 함께 연결된다.
    // @DisplayName과 Scenario: 제목 일치 요건은 두지 않는다.
    const simplifiedScenarios = matchingScenarios.map((scenario) => ({
        title: scenario.title,
        file: scenario.file,
        line: scenario.line,
        stepCount: (scenario.steps ?? []).length,
        covers: scenarioCovers(scenario)
    }));

    const status = combineStatuses(testStatuses.map((test) => test.result));

    return { status, tests: testStatuses, scenarios: simplifiedScenarios };
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

function frontEndSurfacesForRequirement(card, frontEndIndex) {
    return {
        pages: (frontEndIndex.pages ?? []).filter((page) => (page.requirements ?? []).includes(card.id)),
        routes: (frontEndIndex.routes ?? []).filter((route) => (route.requirements ?? []).includes(card.id)),
        stories: (frontEndIndex.stories ?? []).filter((story) => (story.requirements ?? []).includes(card.id))
    };
}

function hasFrontEndSurface(frontEndSurfaces) {
    return (
        (frontEndSurfaces.pages ?? []).length > 0 ||
        (frontEndSurfaces.routes ?? []).length > 0 ||
        (frontEndSurfaces.stories ?? []).length > 0
    );
}

function targetCoverageForCriterion(criterion, requirementTests, requirementScenarios, results, implementationTarget) {
    const backEndTests = requirementTests.filter((test) => test.source !== 'front-end');
    const frontEndTests = requirementTests.filter((test) => test.source === 'front-end');

    if (implementationTarget === 'front-end') {
        const coverage = statusForCriterion(criterion, frontEndTests, requirementScenarios, results);
        return {
            ...coverage,
            requiredChecks: [{ target: 'front-end', status: coverage.status }]
        };
    }

    if (implementationTarget === 'full-stack') {
        const backEndCoverage = statusForCriterion(criterion, backEndTests, requirementScenarios, results);
        const frontEndCoverage = statusForCriterion(criterion, frontEndTests, requirementScenarios, results);
        return {
            status: combineStatuses([backEndCoverage.status, frontEndCoverage.status]),
            tests: [...backEndCoverage.tests, ...frontEndCoverage.tests],
            scenarios: backEndCoverage.scenarios,
            requiredChecks: [
                { target: 'back-end', status: backEndCoverage.status },
                { target: 'front-end', status: frontEndCoverage.status }
            ]
        };
    }

    const coverage = statusForCriterion(criterion, backEndTests, requirementScenarios, results);
    return {
        ...coverage,
        requiredChecks: [{ target: 'back-end', status: coverage.status }]
    };
}

function evaluateRequirement(card, apis, tests, scenarios, entities, results, frontEndIndex) {
    const requirementApis = apis.filter((api) => api.requirements.includes(card.id));
    const requirementTests = tests.filter((test) => test.requirements.includes(card.id));
    const requirementScenarios = scenarios.filter((scenario) =>
        (scenario.requirementIds ?? []).includes(card.id)
    );
    const requirementEntities = entities
        .map((entity) => ({
            ...entity,
            columns: entity.columns.filter((column) => column.requirements.includes(card.id))
        }))
        .filter((entity) => entity.requirements.includes(card.id) || entity.columns.length > 0);
    const frontEndSurfaces = frontEndSurfacesForRequirement(card, frontEndIndex);
    const coverage = card.acceptanceCriteria.map((criterion) => ({
        criterion,
        ...targetCoverageForCriterion(criterion, requirementTests, requirementScenarios, results, card.implementationTarget)
    }));

    const redReasons = [];
    if (card.acceptanceCriteria.length === 0) {
        redReasons.push('수용 기준 없음');
    }
    if (['back-end', 'full-stack'].includes(card.implementationTarget) && requirementApis.length === 0) {
        redReasons.push('관련 API 없음');
    }
    if (['front-end', 'full-stack'].includes(card.implementationTarget) && !hasFrontEndSurface(frontEndSurfaces)) {
        redReasons.push('관련 FE 화면/스토리 없음');
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
            scenarios: requirementScenarios,
            entities: requirementEntities,
            frontEnd: frontEndSurfaces,
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
        scenarios: requirementScenarios,
        entities: requirementEntities,
        frontEnd: frontEndSurfaces,
        coverage
    };
}

function flattenScenarios(scenarioIndex) {
    return (scenarioIndex.features ?? []).flatMap((feature) =>
        (feature.scenarios ?? []).map((scenario) => ({
            ...scenario,
            file: feature.file,
            featureTitle: feature.title,
            featureTags: feature.tags ?? [],
            requirementIds: feature.requirementIds ?? []
        }))
    );
}

function computeScenarioWarnings(scenarioIndex, cards, tests, knownRequirementIds) {
    const warnings = [];
    const cardById = new Map(cards.map((card) => [card.id, card]));
    const features = scenarioIndex.features ?? [];
    const allScenarios = flattenScenarios(scenarioIndex);

    // Warning 1: BDD 테스트(@Covers 있음)의 AC가 같은 요건의 어떤 .feature Scenario Covers:에도 없음.
    // 시나리오와 테스트의 연결은 AC 교집합으로 판단한다. @DisplayName은 JUnit 표시용으로만 두고
    // 시나리오 제목과 일치할 필요가 없다.
    for (const test of tests) {
        if (!Array.isArray(test.covers) || test.covers.length === 0) continue;
        const testReqs = test.requirements ?? [];
        const candidateScenarioCovers = new Set(
            allScenarios
                .filter((scenario) =>
                    (scenario.requirementIds ?? []).some((id) => testReqs.includes(id))
                )
                .flatMap((scenario) => scenarioCovers(scenario))
        );
        for (const ac of test.covers) {
            if (!candidateScenarioCovers.has(ac)) {
                warnings.push({
                    kind: 'TEST_COVERS_NO_SCENARIO_COVERS',
                    severity: 'warning',
                    requirementIds: testReqs,
                    covers: ac,
                    message: `테스트가 다루는 AC "${ac}" 를 커버하는 .feature Scenario가 없음`,
                    location: {
                        identity: test.identity,
                        file: test.file ?? null
                    }
                });
            }
        }
    }

    // Warning 2: .feature Scenario의 Covers: 항목이 카드 수용 기준과 정확히 일치하지 않음.
    for (const feature of features) {
        const featureCards = (feature.requirementIds ?? [])
            .map((id) => cardById.get(id))
            .filter(Boolean);
        if (featureCards.length === 0) continue;
        for (const scenario of feature.scenarios ?? []) {
            for (const acText of scenarioCovers(scenario)) {
                const found = featureCards.some((card) =>
                    (card.acceptanceCriteria ?? []).includes(acText)
                );
                if (!found) {
                    warnings.push({
                        kind: 'SCENARIO_COVERS_NO_CARD_AC',
                        severity: 'warning',
                        requirementIds: feature.requirementIds ?? [],
                        covers: acText,
                        scenarioTitle: scenario.title,
                        message: `.feature Covers: "${acText}" 가 카드 수용 기준과 일치하지 않음`,
                        location: {
                            file: feature.file,
                            line: scenario.line ?? null,
                            scenarioTitle: scenario.title
                        }
                    });
                }
            }
        }
    }

    // Warning 3: .feature @REQ-XXX 태그가 카드에 없음.
    for (const feature of features) {
        for (const ref of feature.requirementIds ?? []) {
            if (!knownRequirementIds.has(ref)) {
                warnings.push({
                    kind: 'FEATURE_UNKNOWN_REQ_TAG',
                    severity: 'warning',
                    requirementIds: feature.requirementIds ?? [],
                    unknownRef: ref,
                    message: `.feature @${ref} 태그가 카드에 없음`,
                    location: {
                        file: feature.file,
                        line: feature.line ?? null
                    }
                });
            }
        }
    }

    return warnings;
}

function buildModel(allCards, cards, apis, tests, entities, results, terminologyReport, terminologyIndex, scenarioIndex, frontEndIndex, selectedIds, flags = {}) {
    const knownRequirementIds = new Set(cards.map((card) => card.id));
    const terminologyBucket = bucketTerminologyFindings(terminologyReport, knownRequirementIds);
    const scenarios = flattenScenarios(scenarioIndex);
    const isSelected = (id) => !selectedIds || selectedIds.has(id);
    const allRequirements = cards
        .map((card) => evaluateRequirement(card, apis, tests, scenarios, entities, results, frontEndIndex))
        .map((req) => attachTerminology(req, terminologyBucket));
    const requirements = allRequirements.filter((req) => isSelected(req.id));
    const hasUnknown = (refs) => refs.length === 0 || refs.some((ref) => !knownRequirementIds.has(ref));
    const hasUnknownNonEmpty = (refs) => refs.length > 0 && refs.some((ref) => !knownRequirementIds.has(ref));
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
    const unknownFeatures = (scenarioIndex.features ?? [])
        .filter((feature) => hasUnknown(feature.requirementIds ?? []))
        .filter((feature) => {
            const refs = feature.requirementIds ?? [];
            // Features with no @REQ-* tag stay only in global reports.
            if (refs.length === 0) {
                return !selectedIds;
            }
            return intersectsSelection(refs);
        });
    const allFrontEndSurfaces = [
        ...(frontEndIndex.pages ?? []).map((surface) => ({ type: 'page', ...surface })),
        ...(frontEndIndex.routes ?? []).map((surface) => ({ type: 'route', ...surface })),
        ...(frontEndIndex.stories ?? []).map((surface) => ({ type: 'story', ...surface }))
    ];
    const unknownFrontEndSurfaces = allFrontEndSurfaces
        .filter((surface) => hasUnknownNonEmpty(surface.requirements ?? []))
        .filter((surface) => intersectsSelection(surface.requirements ?? []));
    const frontEndIndexIssues = (frontEndIndex.issues ?? []).filter((issue) => {
        const refs = issue.requirements ?? [];
        if (refs.length === 0) {
            return !selectedIds;
        }
        return intersectsSelection(refs);
    });
    const scenarioIssueFeatures = (scenarioIndex.features ?? [])
        .filter((feature) => (feature.issues ?? []).length > 0)
        .filter((feature) => {
            const refs = feature.requirementIds ?? [];
            if (refs.length === 0) {
                return !selectedIds;
            }
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

    const scenarioFeatureIssueCount = scenarioIssueFeatures.reduce(
        (sum, feature) => sum + (feature.issues ?? []).length,
        0
    );
    const globalScenarioIssues = selectedIds ? [] : (scenarioIndex.issues ?? []);

    const allScenarioWarnings = computeScenarioWarnings(scenarioIndex, cards, tests, knownRequirementIds);
    const scenarioWarnings = allScenarioWarnings.filter((warning) =>
        intersectsSelection(warning.requirementIds ?? [])
    );
    const scenarioWarningsByKind = scenarioWarnings.reduce((acc, warning) => {
        acc[warning.kind] = (acc[warning.kind] ?? 0) + 1;
        return acc;
    }, {});

    const summary = {
        total: requirements.length,
        red: requirements.filter((requirement) => requirement.state === 'RED').length,
        green: requirements.filter((requirement) => requirement.state === 'GREEN').length,
        blue: requirements.filter((requirement) => requirement.state === 'BLUE').length,
        unknownApis: unknownApis.length,
        unknownTests: unknownTests.length,
        unknownEntities: unknownEntities.length,
        unknownFeatures: unknownFeatures.length,
        unknownFrontEndSurfaces: unknownFrontEndSurfaces.length,
        frontEndIndexIssues: frontEndIndexIssues.length,
        scenarioIssues: scenarioFeatureIssueCount + globalScenarioIssues.length,
        scenarioWarnings: scenarioWarnings.length,
        scenarioWarningsByKind,
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
        unknownFeatures,
        unknownFrontEndSurfaces,
        frontEndIndex: {
            present: frontEndIndex.present !== false,
            generatedAt: frontEndIndex.generatedAt ?? null,
            issues: frontEndIndexIssues
        },
        scenarioIndex: {
            present: scenarioIndex.present !== false,
            generatedAt: scenarioIndex.generatedAt ?? null,
            globalIssues: globalScenarioIssues,
            featureIssues: scenarioIssueFeatures.map((feature) => ({
                file: feature.file,
                requirementIds: feature.requirementIds ?? [],
                issues: feature.issues ?? []
            }))
        },
        scenarioWarnings,
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
    lines.push(`- Unknown feature references: ${model.summary.unknownFeatures}`);
    lines.push(`- Unknown front-end surface references: ${model.summary.unknownFrontEndSurfaces}`);
    lines.push(`- Front-end source index issues: ${model.summary.frontEndIndexIssues}`);
    lines.push(`- Scenario index issues: ${model.summary.scenarioIssues}`);
    const sw = model.summary.scenarioWarnings;
    const swByKind = model.summary.scenarioWarningsByKind || {};
    const swKindStr = Object.keys(swByKind).length === 0
        ? ''
        : ` (by kind: ${Object.entries(swByKind).map(([k, v]) => `${k}=${v}`).join(', ')})`;
    lines.push(`- Scenario warnings: ${sw}${swKindStr} (report-only; --check 미반영)`);
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
        lines.push(`Implementation target: ${requirement.implementationTarget}`);
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
            lines.push(requirement.implementationTarget === 'front-end' ? '- (front-end 대상 - API 요구 없음)' : '- MISSING');
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

        lines.push('### Front-end', '');
        const pages = requirement.frontEnd?.pages ?? [];
        const routes = requirement.frontEnd?.routes ?? [];
        const stories = requirement.frontEnd?.stories ?? [];
        if (pages.length === 0 && routes.length === 0 && stories.length === 0) {
            lines.push('- (없음)');
        } else {
            for (const route of routes) {
                lines.push(`- route ${route.path} (${route.file}:${route.line ?? 0}) [${route.requirements.join(', ')}]`);
            }
            for (const page of pages) {
                const routeLabel = page.route ? ` route=${page.route}` : '';
                lines.push(`- page ${page.name}${routeLabel} (${page.file}:${page.line ?? 0}) [${page.requirements.join(', ')}]`);
            }
            for (const story of stories) {
                const storyTitle = [story.title, story.story].filter(Boolean).join(' / ');
                lines.push(`- story ${storyTitle} (${story.file}:${story.line ?? 0}) [${story.requirements.join(', ')}]`);
            }
        }
        lines.push('');

        lines.push('### Scenarios', '');
        if ((requirement.scenarios ?? []).length === 0) {
            lines.push('- (없음)');
        } else {
            for (const scenario of requirement.scenarios) {
                const loc = `${scenario.file}:${scenario.line}`;
                const coversList = scenarioCovers(scenario);
                lines.push(`- ${scenario.title} (${loc})`);
                lines.push(`  - Covers: ${coversList.length}건`);
                lines.push(`  - Steps: ${(scenario.steps ?? []).length}건`);
            }
        }
        lines.push('');

        lines.push('### Acceptance Criteria Coverage', '');
        for (const row of requirement.coverage) {
            lines.push(`- ${row.status}: ${row.criterion}`);
            if ((row.requiredChecks ?? []).length > 1) {
                lines.push(`  - Required checks: ${row.requiredChecks.map((check) => `${check.target}=${check.status}`).join(', ')}`);
            }
            const scenariosForRow = row.scenarios ?? [];
            if (scenariosForRow.length === 0 && row.tests.length === 0) {
                lines.push(`  - (시나리오 없음, 테스트 없음)`);
            }
            if (scenariosForRow.length === 0 && row.tests.length > 0) {
                lines.push(`  - (이 AC를 커버하는 .feature Scenario가 없음)`);
            }
            for (const scenario of scenariosForRow) {
                lines.push(`  - Scenario: ${scenario.title} (${scenario.file}:${scenario.line})`);
            }
            for (const test of row.tests) {
                const source = test.source ? `[${test.source}] ` : '';
                lines.push(`  - ${source}${test.identity}: ${test.result}`);
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

    if (model.unknownFeatures.length > 0) {
        lines.push('## Unknown Feature Requirement References', '');
        for (const feature of model.unknownFeatures) {
            const refs = (feature.requirementIds ?? []).length > 0
                ? formatUnknownRefs(feature.requirementIds)
                : '미지정';
            lines.push(`- [${refs}] ${feature.file}`);
        }
        lines.push('');
    }

    if (model.unknownFrontEndSurfaces.length > 0) {
        lines.push('## Unknown Front-end Surface Requirement References', '');
        for (const surface of model.unknownFrontEndSurfaces) {
            const label = surface.path || surface.name || surface.story || surface.title || '(unknown)';
            lines.push(`- [${formatUnknownRefs(surface.requirements ?? [])}] ${surface.type} ${label} (${surface.file}:${surface.line ?? 0})`);
        }
        lines.push('');
    }

    if ((model.frontEndIndex.issues ?? []).length > 0) {
        lines.push('## Front-end Source Index Issues', '');
        for (const issue of model.frontEndIndex.issues) {
            const loc = issue.location || {};
            const where = loc.file ? `${loc.file}:${loc.line ?? 0}` : '(global)';
            lines.push(`- [${issue.severity ?? 'warning'}] ${issue.kind}: ${issue.message} — ${where}`);
        }
        lines.push('');
    }

    if (
        (model.scenarioIndex.globalIssues ?? []).length > 0 ||
        (model.scenarioIndex.featureIssues ?? []).length > 0
    ) {
        lines.push('## Scenario Index Issues', '');
        for (const issue of (model.scenarioIndex.globalIssues ?? [])) {
            lines.push(`- (global) ${issue.message}`);
        }
        for (const feature of (model.scenarioIndex.featureIssues ?? [])) {
            for (const issue of feature.issues) {
                lines.push(`- ${feature.file}:${issue.line ?? 0} — ${issue.message}`);
            }
        }
        lines.push('');
    }

    if ((model.scenarioWarnings ?? []).length > 0) {
        lines.push('## Scenario Warnings', '');
        lines.push(
            '마이그레이션 진행 동안은 report-only다. 향후 ERROR로 승격 예정. ' +
                '근거: docs/standards/acceptance-test.md, docs/harness/requirement-authoring.md.'
        );
        lines.push('');
        for (const warning of model.scenarioWarnings) {
            const loc = warning.location ?? {};
            const locParts = [];
            if (loc.file) locParts.push(loc.line ? `${loc.file}:${loc.line}` : loc.file);
            if (loc.identity) locParts.push(loc.identity);
            const locStr = locParts.length > 0 ? ` — ${locParts.join(' / ')}` : '';
            const reqStr = (warning.requirementIds ?? []).length > 0
                ? ` [${warning.requirementIds.join(', ')}]`
                : '';
            lines.push(`- [${warning.kind}]${reqStr} ${warning.message}${locStr}`);
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
const frontEndIndex = readFrontEndSourceIndex();
const apis = sourceIndex.apis;
const tests = [...sourceIndex.tests, ...frontEndIndex.tests];
const entities = sourceIndex.entities;
const results = readTestResults();
for (const [key, value] of readFrontEndTestResults()) {
    results.set(key, value);
}
const terminologyReport = readTerminologyReport();
const terminologyIndex = readTerminologyIndex();
const scenarioIndex = readScenarioIndex();

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
const model = buildModel(allCardsRaw, cards, apis, tests, entities, results, terminologyReport, terminologyIndex, scenarioIndex, frontEndIndex, selectedIds, { checkMode, requireBlue });
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
    model.summary.unknownEntities > 0 ||
    model.summary.unknownFrontEndSurfaces > 0;
const hasStructureIssues = model.summary.structureIssues > 0;
if (checkMode && (model.summary.total === 0 || model.summary.red > 0 || hasUnknownReferences || hasStructureIssues)) {
    process.exitCode = 1;
}
if (requireBlue && (model.summary.total === 0 || model.summary.red > 0 || model.summary.green > 0 || hasUnknownReferences || hasStructureIssues)) {
    process.exitCode = 1;
}
