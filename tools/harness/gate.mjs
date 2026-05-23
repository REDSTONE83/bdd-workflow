#!/usr/bin/env node
// Layer 4 단일 게이트 (REQ-010). state + findings/* + terminology.findings 를 읽어
// 8개 카테고리(TRACE/CARD/REF/TRC/BE/FE/SCN/TRM)로 분류한 실패 요약을 stdout 으로
// emit 하고 exit code 로 게이트 결과를 신호한다. 이 도구는 finding/state 를 다시
// 계산하지 않는다.
//
// CLI:
//   --check            카테고리 중 하나라도 차단 사유가 있으면 실패(exit 1)
//   --require-blue     --check 동작 + GREEN 카드 잔존도 TRACE 카테고리 실패로 본다
//   --requirement REQ-XXX   단일 카드 필터(반복 가능 또는 한 번)
//   --quiet            한 줄 요약만 출력

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const harnessDir = path.join(workspaceRoot, 'build', 'harness');
const stateFile = path.join(harnessDir, 'state', 'trace.state.json');
const findingsDir = path.join(harnessDir, 'findings');

const CATEGORY_ORDER = ['TRACE', 'CARD', 'REF', 'TRC', 'BE', 'FE', 'SCN', 'TRM'];

const FINDING_INPUTS = [
    { category: 'CARD', file: 'requirement-cards.findings.json', match: () => true },
    { category: 'REF', file: 'cross-artifact.findings.json', match: (f) => typeof f.ruleId === 'string' && f.ruleId.startsWith('REF-') },
    { category: 'TRC', file: 'cross-artifact.findings.json', match: (f) => typeof f.ruleId === 'string' && f.ruleId.startsWith('TRC-') },
    { category: 'BE', file: 'back-end-standards.findings.json', match: () => true },
    { category: 'FE', file: 'front-end-standards.findings.json', match: () => true },
    { category: 'SCN', file: 'scenarios.findings.json', match: () => true },
    { category: 'TRM', file: 'terminology.findings.json', match: () => true, severityField: 'strictSeverity' }
];

const REQUIRED_FINDING_FILES = [
    'requirement-cards.findings.json',
    'cross-artifact.findings.json',
    'back-end-standards.findings.json',
    'front-end-standards.findings.json',
    'scenarios.findings.json',
    'terminology.findings.json'
];

function parseCliArgs(argv) {
    const requirementIds = new Set();
    let checkMode = false;
    let requireBlue = false;
    let quiet = false;
    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        if (arg === '--check') { checkMode = true; i += 1; continue; }
        if (arg === '--require-blue') { requireBlue = true; i += 1; continue; }
        if (arg === '--quiet') { quiet = true; i += 1; continue; }
        if (arg === '--requirement') {
            const value = argv[i + 1];
            if (!value) throw new Error('--requirement requires a value');
            requirementIds.add(value.trim());
            i += 2; continue;
        }
        if (arg.startsWith('--requirement=')) {
            requirementIds.add(arg.slice('--requirement='.length).trim());
            i += 1; continue;
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
    return { requirementIds, checkMode, requireBlue, quiet };
}

function readJson(file) {
    if (!fs.existsSync(file)) return null;
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (err) {
        console.error(`failed to parse ${file}: ${err.message}`);
        process.exit(2);
    }
}

function loadState() {
    const model = readJson(stateFile);
    if (!model) {
        console.error(`Missing trace state: ${stateFile}\nRun evaluate-trace-state first.`);
        process.exit(2);
    }
    return model;
}

function loadFindings(file) {
    const full = path.join(findingsDir, file);
    if (!fs.existsSync(full)) {
        console.error(`Missing required findings file: ${full}\nRun the matching Layer 2 validator first (see docs/harness/data-contracts.md).`);
        process.exit(2);
    }
    const payload = readJson(full);
    return Array.isArray(payload?.findings) ? payload.findings : [];
}

function assertRequiredInputs() {
    const missing = [];
    if (!fs.existsSync(stateFile)) missing.push(stateFile);
    for (const file of REQUIRED_FINDING_FILES) {
        const full = path.join(findingsDir, file);
        if (!fs.existsSync(full)) missing.push(full);
    }
    if (missing.length > 0) {
        console.error('Missing required gate inputs:');
        for (const m of missing) console.error(`  - ${m}`);
        console.error('Run the matching Layer 2 validator first (see docs/harness/data-contracts.md).');
        process.exit(2);
    }
}

function findingMatchesSelection(finding, selectedIds) {
    if (!selectedIds) return true;
    const refs = Array.isArray(finding.requirements) ? finding.requirements : [];
    if (refs.length === 0) return false;
    return refs.some((ref) => selectedIds.has(ref));
}

function severityValue(finding, field) {
    return finding[field] ?? 'warning';
}

function categorizeFindings(selectedIds) {
    const buckets = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, { errors: 0, byRuleId: {} }]));
    const fileCache = new Map();
    for (const spec of FINDING_INPUTS) {
        if (!fileCache.has(spec.file)) fileCache.set(spec.file, loadFindings(spec.file));
        const findings = fileCache.get(spec.file);
        const severityField = spec.severityField ?? 'severity';
        for (const finding of findings) {
            if (!spec.match(finding)) continue;
            if (!findingMatchesSelection(finding, selectedIds)) continue;
            if (severityValue(finding, severityField) !== 'error') continue;
            buckets[spec.category].errors += 1;
            const ruleId = finding.ruleId ?? '(no ruleId)';
            buckets[spec.category].byRuleId[ruleId] = (buckets[spec.category].byRuleId[ruleId] ?? 0) + 1;
        }
    }
    return buckets;
}

function evaluateTrace(state, selectedIds, flags) {
    // TRACE 카운트는 항상 state.requirements 에서 selectedIds 로 다시 필터한다.
    // state.summary 는 state 가 생성될 때의 filter 기준이라 CLI filter 와 다를 수 있다.
    const requirements = Array.isArray(state.requirements) ? state.requirements : [];
    const filtered = selectedIds
        ? requirements.filter((r) => selectedIds.has(r.id))
        : requirements;
    const total = filtered.length;
    const red = filtered.filter((r) => r.state === 'RED').length;
    const green = filtered.filter((r) => r.state === 'GREEN').length;
    const reasons = [];
    if (flags.checkMode || flags.requireBlue) {
        if (total === 0) reasons.push('no requirements');
        if (red > 0) reasons.push(`red=${red}`);
    }
    if (flags.requireBlue && green > 0) reasons.push(`green=${green}`);
    return reasons;
}

function categoryReasonLine(category, bucket) {
    if (bucket.errors === 0) return null;
    const ruleSummary = Object.entries(bucket.byRuleId)
        .map(([rule, count]) => `${rule}=${count}`)
        .join(',');
    return `[${category}] errors=${bucket.errors}${ruleSummary ? ` rules=${ruleSummary}` : ''}`;
}

function renderSummary(buckets, traceReasons, filter) {
    const lines = [];
    if (traceReasons.length > 0) {
        lines.push(`[TRACE] ${traceReasons.join(',')}`);
    }
    for (const category of CATEGORY_ORDER) {
        if (category === 'TRACE') continue;
        const line = categoryReasonLine(category, buckets[category]);
        if (line) lines.push(line);
    }
    if (lines.length === 0) {
        const filterStr = filter ? ` filter=${filter.join(',')}` : '';
        return `gate: pass${filterStr}`;
    }
    return lines.join('\n');
}

function renderQuiet(buckets, traceReasons, filter, exit) {
    const parts = [`exit=${exit}`];
    if (traceReasons.length > 0) parts.push(`TRACE=${traceReasons.join('|')}`);
    for (const category of CATEGORY_ORDER) {
        if (category === 'TRACE') continue;
        if (buckets[category].errors > 0) parts.push(`${category}=${buckets[category].errors}`);
    }
    if (filter) parts.push(`filter=${filter.join(',')}`);
    return `gate: ${parts.join(' ')}`;
}

function main() {
    const cli = parseCliArgs(process.argv.slice(2));
    assertRequiredInputs();
    const state = loadState();
    const stateFilter = Array.isArray(state.filter) && state.filter.length > 0
        ? new Set(state.filter)
        : null;
    const cliFilter = cli.requirementIds.size > 0 ? cli.requirementIds : null;
    const selectedIds = cliFilter ?? stateFilter;

    const buckets = categorizeFindings(selectedIds);
    const traceReasons = evaluateTrace(state, selectedIds, { checkMode: cli.checkMode, requireBlue: cli.requireBlue });

    const anyCategoryFailing = CATEGORY_ORDER.some((c) => c !== 'TRACE' && buckets[c].errors > 0);
    const traceFailing = traceReasons.length > 0;
    const failed = (cli.checkMode || cli.requireBlue) && (anyCategoryFailing || traceFailing);
    const exit = failed ? 1 : 0;

    const filterArray = selectedIds ? [...selectedIds].sort() : null;
    if (cli.quiet) {
        console.log(renderQuiet(buckets, traceReasons, filterArray, exit));
    } else {
        console.log(renderSummary(buckets, traceReasons, filterArray));
    }
    process.exit(exit);
}

main();
