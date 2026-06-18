#!/usr/bin/env node
// Layer 1 collector: read JUnit XML, Playwright JSON, and Storybook Vitest JUnit
// → indexes/test-results.index.json.
// 인덱스 단계에서는 어느 요건/AC에 속하는지 알지 못한다. 매칭은 Layer 3(trace)이 한다.
// identity + alternateIdentities 두 키를 emit해 line 변동에도 매칭이 유지되게 한다.
import fs from 'node:fs';
import path from 'node:path';
import { backendRoot, currentScope, frontEndRoot, outputRootFor, workspaceRoot } from './workspace-config.mjs';

const scope = currentScope();
const outputRoot = outputRootFor(scope);
const harnessUiRoot = path.join(workspaceRoot, 'harness', 'ui');
const frontEndTestResultPaths = [
    path.join(frontEndRoot, 'test-results', 'e2e-live-results.json')
];
const appStorybookVitestJunitPath = path.join(frontEndRoot, 'test-results', 'storybook-junit.xml');
const harnessStorybookVitestJunitPath = path.join(harnessUiRoot, 'test-results', 'storybook-junit.xml');
const outDir = path.join(outputRoot, 'indexes');
const outFile = path.join(outDir, 'test-results.index.json');

const junitRoots = scope === 'application'
    ? [
        { scope: 'application', root: path.join(backendRoot, 'target', 'surefire-reports') },
        { scope: 'application', root: path.join(backendRoot, 'build', 'test-results', 'test') },
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
        ? { scope: 'application', root: frontEndRoot, junitPath: appStorybookVitestJunitPath }
        : { scope: 'harness', root: harnessUiRoot, junitPath: harnessStorybookVitestJunitPath };
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

function main() {
    const entries = [...collectJUnit(), ...collectNodeJUnit(), ...collectPlaywright(), ...collectStorybookVitestJUnit()];
    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        source: 'test-results.index',
        entries,
        issues: []
    };
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);
    const byRuntime = entries.reduce((acc, e) => {
        const key = e.scope ? `${e.runtime}/${e.scope}` : e.runtime;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});
    const breakdown = Object.entries(byRuntime).map(([k, v]) => `${k}=${v}`).join(', ') || 'none';
    console.log(`test-results.index.json: ${entries.length} result(s) (${breakdown})`);
}

main();
