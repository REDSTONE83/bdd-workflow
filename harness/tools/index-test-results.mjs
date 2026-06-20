#!/usr/bin/env node
// Layer 1 collector: read JUnit XML, Playwright JSON, and Storybook Vitest JUnit
// → indexes/test-results.index.json.
// 인덱스 단계에서는 어느 요건/AC에 속하는지 알지 못한다. 매칭은 Layer 3(trace)이 한다.
// identity + alternateIdentities 두 키를 emit해 line 변동에도 매칭이 유지되게 한다.
import fs from 'node:fs';
import path from 'node:path';
import { currentScope, frontEndRoot, outputRootFor, repoRelative, workspaceRoot } from './workspace-config.mjs';
import { FRONT_END_RESULT_FILES, computeTestFingerprint, sha256 } from './test-result-fingerprint.mjs';

const scope = currentScope();
const outputRoot = outputRootFor(scope);
const harnessUiRoot = path.join(workspaceRoot, 'harness', 'ui');
const frontEndTestResultPaths = [
    path.join(outputRoot, 'test-results', 'e2e-live-results.json')
];
const storybookVitestJunitPath = path.join(outputRoot, 'test-results', 'storybook-junit.xml');
// app scope freshness 입력: 실행 시점 source metadata와 비교할 현재 FE BDD source index.
const frontEndSourceIndexPath = path.join(outputRoot, 'indexes', 'front-end.source-index.json');
const outDir = path.join(outputRoot, 'indexes');
const outFile = path.join(outDir, 'test-results.index.json');

const junitRoots = scope === 'application'
    ? [
        { scope: 'application', root: path.join(outputRoot, 'test-results', 'test') },
        { scope: 'application', root: path.join(outputRoot, 'test-results', 'generateOpenApiIndex') }
    ]
    : [];

const nodeJunitRoots = scope === 'harness'
    ? [{ scope: 'harness', root: path.join(outputRoot, 'test-results', 'nodeSelfTest') }]
    : [];

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

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function normalizeRepoPath(filePath) {
    if (!filePath) {
        return '';
    }
    if (path.isAbsolute(filePath)) {
        return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
    }
    const normalized = filePath.replace(/\\/g, '/');
    const frontEndRepoPrefix = path.relative(workspaceRoot, frontEndRoot).replace(/\\/g, '/');
    if (normalized.startsWith(`${frontEndRepoPrefix}/`)) {
        return normalized;
    }
    if (normalized.startsWith('tests/e2e/')) {
        return `${frontEndRepoPrefix}/${normalized}`;
    }
    if (/\.spec\.[cm]?[tj]sx?$/.test(normalized)) {
        return `${frontEndRepoPrefix}/tests/e2e/${normalized}`;
    }
    return `${frontEndRepoPrefix}/${normalized}`;
}

function decodeXmlAttribute(value) {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function parseAttributes(attrs) {
    const out = {};
    const attrRegex = /\b([\w:-]+)="([^"]*)"/g;
    for (const match of attrs.matchAll(attrRegex)) {
        out[match[1]] = decodeXmlAttribute(match[2]);
    }
    return out;
}

function statusFromPlaywrightTest(test) {
    const results = test.results ?? [];
    if (test.outcome === 'skipped' || results.some((r) => r.status === 'skipped')) {
        return 'SKIP';
    }
    if (['unexpected', 'flaky'].includes(test.outcome)) {
        return 'FAIL';
    }
    if (results.some((r) => ['failed', 'timedOut', 'interrupted'].includes(r.status))) {
        return 'FAIL';
    }
    if (results.length === 0) {
        return 'NOT_RUN';
    }
    return 'PASS';
}

function combineStatuses(statuses) {
    if (statuses.length === 0) return 'NOT_RUN';
    if (statuses.some((s) => s === 'FAIL')) return 'FAIL';
    if (statuses.some((s) => s === 'SKIP')) return 'SKIP';
    if (statuses.some((s) => s === 'NOT_RUN')) return 'NOT_RUN';
    return 'PASS';
}

function collectJUnit() {
    const entries = [];
    for (const { scope, root } of junitRoots) {
        for (const file of walk(root, (c) => c.endsWith('.xml'))) {
            const content = fs.readFileSync(file, 'utf8');
            // self-closing 형태를 먼저 매칭해 BODY 패턴이 SELF 태그를 흡수하지 않도록 한다.
            const testcaseRegex = /<testcase\b([^>]*)\/>|<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g;
            for (const match of content.matchAll(testcaseRegex)) {
                const attrs = match[1] ?? match[2] ?? '';
                const attr = parseAttributes(attrs);
                const body = match[3] ?? '';
                const className = attr.classname?.split('.').pop();
                const name = attr.name;
                if (!className || !name) continue;
                let status = 'PASS';
                if (body.includes('<failure') || body.includes('<error')) status = 'FAIL';
                else if (body.includes('<skipped')) status = 'SKIP';
                const identity = `${className}.${name}`;
                entries.push({
                    kind: 'test-result',
                    requirements: [],
                    runtime: 'junit',
                    scope,
                    status,
                    identity,
                    alternateIdentities: [],
                    location: {
                        file: path.relative(workspaceRoot, file).replace(/\\/g, '/'),
                        line: 0,
                        identity
                    }
                });
            }
        }
    }
    return entries;
}

function collectNodeJUnit() {
    const entries = [];
    for (const { scope, root } of nodeJunitRoots) {
        for (const file of walk(root, (c) => c.endsWith('.xml'))) {
            const content = fs.readFileSync(file, 'utf8');
            const testcaseRegex = /<testcase\b([^>]*)\/>|<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g;
            for (const match of content.matchAll(testcaseRegex)) {
                const attr = parseAttributes(match[1] ?? match[2] ?? '');
                const body = match[3] ?? '';
                const name = attr.name;
                if (!name) continue;
                let status = 'PASS';
                if (body.includes('<failure') || body.includes('<error')) status = 'FAIL';
                else if (body.includes('<skipped')) status = 'SKIP';
                const repoFile = attr.file
                    ? path.relative(workspaceRoot, attr.file).replace(/\\/g, '/')
                    : path.relative(workspaceRoot, file).replace(/\\/g, '/');
                const identity = `${repoFile} > ${name}`;
                entries.push({
                    kind: 'test-result',
                    requirements: [],
                    runtime: 'node',
                    scope,
                    status,
                    identity,
                    alternateIdentities: [name],
                    location: {
                        file: repoFile,
                        line: 0,
                        identity
                    }
                });
            }
        }
    }
    return entries;
}

function collectPlaywrightReport(reportPath) {
    const entries = [];
    if (!fs.existsSync(reportPath)) {
        return entries;
    }
    let report;
    try {
        report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch {
        return entries;
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
            entries.push({
                kind: 'test-result',
                requirements: [],
                runtime: 'playwright',
                scope: 'application',
                status,
                identity,
                alternateIdentities: [identityNoLine],
                location: {
                    file,
                    line,
                    identity
                }
            });
        }
        for (const child of suite.suites ?? []) {
            walkSuite(child, childDescribeStack);
        }
    }

    for (const suite of report.suites ?? []) {
        walkSuite(suite, []);
    }
    return entries;
}

function collectPlaywright() {
    if (scope !== 'application') {
        return [];
    }
    return frontEndTestResultPaths.flatMap((reportPath) => collectPlaywrightReport(reportPath));
}

function normalizeStorybookPath(filePath, storybookRoot, defaultResultPath) {
    if (!filePath) {
        return path.relative(workspaceRoot, defaultResultPath).replace(/\\/g, '/');
    }
    if (path.isAbsolute(filePath)) {
        return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
    }
    const normalized = filePath.replace(/\\/g, '/');
    const storybookPrefix = path.relative(workspaceRoot, storybookRoot).replace(/\\/g, '/');
    if (normalized.startsWith(`${storybookPrefix}/`)) {
        return normalized;
    }
    if (normalized.startsWith('src/')) {
        return `${storybookPrefix}/${normalized}`;
    }
    return `${storybookPrefix}/${normalized}`;
}

function collectStorybookVitestJUnit() {
    const config = scope === 'application'
        ? { scope: 'application', root: frontEndRoot, junitPath: storybookVitestJunitPath }
        : { scope: 'harness', root: harnessUiRoot, junitPath: storybookVitestJunitPath };
    if (!fs.existsSync(config.junitPath)) {
        return [];
    }
    const entries = [];
    const content = fs.readFileSync(config.junitPath, 'utf8');
    const testcaseRegex = /<testcase\b([^>]*)\/>|<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g;
    for (const match of content.matchAll(testcaseRegex)) {
        const attr = parseAttributes(match[1] ?? match[2] ?? '');
        const body = match[3] ?? '';
        const name = attr.name;
        if (!name) continue;
        let status = 'PASS';
        if (body.includes('<failure') || body.includes('<error')) status = 'FAIL';
        else if (body.includes('<skipped')) status = 'SKIP';
        const className = attr.classname ?? '';
        const file = normalizeStorybookPath(attr.file, config.root, config.junitPath);
        const line = Number(attr.line ?? 0);
        const identity = className ? `${className} > ${name}` : name;
        entries.push({
            kind: 'test-result',
            requirements: [],
            runtime: 'storybook-vitest',
            scope: config.scope,
            status,
            identity,
            alternateIdentities: unique([
                name,
                className ? `${className} / ${name}` : '',
                className ? `${className}.${name}` : '',
                className,
                `${file} > ${name}`
            ]),
            location: {
                file,
                line,
                identity
            }
        });
    }
    return entries;
}

function readFrontEndSourceTests() {
    if (!fs.existsSync(frontEndSourceIndexPath)) return [];
    try {
        const index = JSON.parse(fs.readFileSync(frontEndSourceIndexPath, 'utf8'));
        return index.tests ?? [];
    } catch {
        return [];
    }
}

function readManifest(manifestPath) {
    if (!fs.existsSync(manifestPath)) return null;
    try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
        return null;
    }
}

function entryStableKeys(entry) {
    return [entry.identity, ...(entry.alternateIdentities ?? [])].filter(Boolean);
}

function staleIssue(runtime, config, reason, entry) {
    const issue = {
        kind: 'FE_TEST_RESULT_STALE',
        runtime,
        reason,
        resultFile: repoRelative(path.join(frontEndRoot, 'test-results', config.resultFile))
    };
    if (entry) {
        issue.identity = entry.identity;
        issue.location = entry.location ?? { file: '', line: 0, identity: entry.identity };
    }
    return issue;
}

// app scope FE 실행 결과는 sidecar manifest fingerprint가 현재 FE BDD source fingerprint와
// 일치할 때만 AC 커버 결과로 인정한다. 불일치/manifest 누락/결과 파일 hash 불일치는 stale로
// 빼고 issues[]에 남긴다. harness scope는 manifest가 없어 이 필터를 적용하지 않는다.
function filterFreshFrontEndResults(entries, runtime, sourceTests) {
    const config = FRONT_END_RESULT_FILES[runtime];
    const resultFilePath = path.join(outputRoot, 'test-results', config.resultFile);
    const manifestPath = path.join(outputRoot, 'test-results', config.manifestFile);

    const currentByKey = new Map();
    for (const test of sourceTests) {
        if (test.runtime !== runtime) continue;
        const fingerprint = computeTestFingerprint(test);
        for (const key of [test.identity, ...(test.resultKeys ?? [])]) {
            if (key) currentByKey.set(key, fingerprint);
        }
    }

    const manifest = readManifest(manifestPath);
    const manifestByKey = new Map();
    let fileReason = null;
    if (!manifest) {
        fileReason = 'manifest-missing';
    } else {
        for (const manifestEntry of manifest.entries ?? []) {
            for (const key of manifestEntry.resultKeys ?? []) {
                if (key) manifestByKey.set(key, manifestEntry.fingerprint);
            }
        }
        const actualSha = fs.existsSync(resultFilePath) ? sha256(fs.readFileSync(resultFilePath)) : null;
        if (!actualSha || manifest.resultFileSha256 !== actualSha) {
            fileReason = 'result-file-hash-mismatch';
        }
    }

    const fresh = [];
    const issues = [];
    let fileIssueRecorded = false;
    for (const entry of entries) {
        const keys = entryStableKeys(entry);
        let currentFp;
        for (const key of keys) {
            if (currentByKey.has(key)) { currentFp = currentByKey.get(key); break; }
        }
        if (currentFp === undefined) {
            // 현재 source에 대응 test가 없으면 어떤 AC도 커버하지 않으므로 무해하게 통과시킨다.
            fresh.push(entry);
            continue;
        }
        if (fileReason) {
            // 파일 단위 사유(manifest 누락/hash 불일치)는 결과당 1회만 기록하고 전부 stale 처리한다.
            if (!fileIssueRecorded) {
                issues.push(staleIssue(runtime, config, fileReason, null));
                fileIssueRecorded = true;
            }
            continue;
        }
        let runFp;
        for (const key of keys) {
            if (manifestByKey.has(key)) { runFp = manifestByKey.get(key); break; }
        }
        if (runFp === undefined || runFp !== currentFp) {
            issues.push(staleIssue(runtime, config, 'fingerprint-mismatch', entry));
            continue;
        }
        fresh.push(entry);
    }
    return { fresh, issues };
}

function main() {
    const junitEntries = [...collectJUnit(), ...collectNodeJUnit()];
    let playwrightEntries = collectPlaywright();
    let storybookEntries = collectStorybookVitestJUnit();
    const issues = [];
    if (scope === 'application') {
        const sourceTests = readFrontEndSourceTests();
        const storybookResult = filterFreshFrontEndResults(storybookEntries, 'storybook-vitest', sourceTests);
        storybookEntries = storybookResult.fresh;
        issues.push(...storybookResult.issues);
        const playwrightResult = filterFreshFrontEndResults(playwrightEntries, 'playwright', sourceTests);
        playwrightEntries = playwrightResult.fresh;
        issues.push(...playwrightResult.issues);
    }
    const entries = [...junitEntries, ...playwrightEntries, ...storybookEntries];
    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        source: 'test-results.index',
        entries,
        issues
    };
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);
    const byRuntime = entries.reduce((acc, e) => {
        const key = e.scope ? `${e.runtime}/${e.scope}` : e.runtime;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});
    const breakdown = Object.entries(byRuntime).map(([k, v]) => `${k}=${v}`).join(', ') || 'none';
    const staleNote = payload.issues.length > 0 ? `, ${payload.issues.length} stale issue(s)` : '';
    console.log(`test-results.index.json: ${entries.length} result(s) (${breakdown})${staleNote}`);
}

main();
