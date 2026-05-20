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
const testResultRoots = [
    path.join(backendRoot, 'target', 'surefire-reports'),
    path.join(backendRoot, 'build', 'test-results', 'test')
];

const args = new Set(process.argv.slice(2));
const checkMode = args.has('--check');
const requireBlue = args.has('--require-blue');

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

function readRequirementCards() {
    return walk(docsRoot, (file) => file.endsWith('.md')).map((file) => {
        const content = fs.readFileSync(file, 'utf8');
        const id = content.match(/^요건 ID:\s*(REQ-\d+)/m)?.[1] ?? '';
        const title = content.match(/^제목:\s*(.+)$/m)?.[1]?.trim() ?? '';
        const status = content.match(/^상태:\s*(.+)$/m)?.[1]?.trim() ?? '';
        const acceptanceCriteria = bulletItems(section(content, '수용 기준'));
        const openQuestions = bulletItems(section(content, '열린 질문'))
            .filter((item) => !/^없음$/.test(item.trim()));

        return {
            id,
            title,
            status,
            approved: normalizeApprovalStatus(status),
            file,
            acceptanceCriteria,
            openQuestions
        };
    }).filter((card) => card.id);
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
        tests: sourceIndex.tests ?? []
    };
}

function readTestResults() {
    const results = new Map();
    for (const file of testResultRoots.flatMap((root) => walk(root, (candidate) => candidate.endsWith('.xml')))) {
        const content = fs.readFileSync(file, 'utf8');
        const testcaseRegex = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>|<testcase\b([^>]*)\/>/g;
        for (const match of content.matchAll(testcaseRegex)) {
            const attrs = match[1] ?? match[3] ?? '';
            const body = match[2] ?? '';
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

function evaluateRequirement(card, apis, tests, results) {
    const requirementApis = apis.filter((api) => api.requirement === card.id);
    const requirementTests = tests.filter((test) => test.requirement === card.id);
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
        coverage
    };
}

function buildModel(cards, apis, tests, results) {
    const knownRequirementIds = new Set(cards.map((card) => card.id));
    const requirements = cards.map((card) => evaluateRequirement(card, apis, tests, results));
    const unknownApis = apis.filter((api) => !knownRequirementIds.has(api.requirement));
    const unknownTests = tests.filter((test) => !knownRequirementIds.has(test.requirement));
    const summary = {
        total: requirements.length,
        red: requirements.filter((requirement) => requirement.state === 'RED').length,
        green: requirements.filter((requirement) => requirement.state === 'GREEN').length,
        blue: requirements.filter((requirement) => requirement.state === 'BLUE').length,
        unknownApis: unknownApis.length,
        unknownTests: unknownTests.length
    };

    return {
        generatedAt: new Date().toISOString(),
        summary,
        requirements,
        unknownApis,
        unknownTests
    };
}

function buildMarkdown(model) {
    const lines = ['# Requirement Trace Report', ''];
    lines.push(`Generated: ${model.generatedAt}`, '');
    lines.push('## Summary', '');
    lines.push(`- Total: ${model.summary.total}`);
    lines.push(`- RED: ${model.summary.red}`);
    lines.push(`- GREEN: ${model.summary.green}`);
    lines.push(`- BLUE: ${model.summary.blue}`);
    lines.push(`- Unknown API references: ${model.summary.unknownApis}`);
    lines.push(`- Unknown test references: ${model.summary.unknownTests}`);
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
                lines.push(`- ${api.http} / ${api.controller}`);
            }
        }
        lines.push('', '### Acceptance Criteria Coverage', '');
        for (const row of requirement.coverage) {
            lines.push(`- ${row.status}: ${row.criterion}`);
            for (const test of row.tests) {
                lines.push(`  - ${test.identity}: ${test.result}`);
            }
        }
        lines.push('');
    }

    if (model.unknownApis.length > 0) {
        lines.push('## Unknown API Requirement References', '');
        for (const api of model.unknownApis) {
            lines.push(`- ${api.requirement}: ${api.http} / ${api.controller}`);
        }
        lines.push('');
    }

    if (model.unknownTests.length > 0) {
        lines.push('## Unknown Test Requirement References', '');
        for (const test of model.unknownTests) {
            lines.push(`- ${test.requirement}: ${test.identity}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

const cards = readRequirementCards();
const sourceIndex = readSourceIndex();
const apis = sourceIndex.apis;
const tests = sourceIndex.tests;
const results = readTestResults();
const model = buildModel(cards, apis, tests, results);
const markdown = buildMarkdown(model);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'trace-report.md'), markdown);
fs.writeFileSync(path.join(outputDir, 'trace-report.json'), `${JSON.stringify(model, null, 2)}\n`);

console.log(markdown);

const hasUnknownReferences = model.summary.unknownApis > 0 || model.summary.unknownTests > 0;
if (checkMode && (model.summary.total === 0 || model.summary.red > 0 || hasUnknownReferences)) {
    process.exitCode = 1;
}
if (requireBlue && (model.summary.total === 0 || model.summary.red > 0 || model.summary.green > 0 || hasUnknownReferences)) {
    process.exitCode = 1;
}
