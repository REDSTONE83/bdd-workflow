#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultFrontEndRoot = path.resolve(__dirname, '..');
const defaultRepoRoot = path.resolve(defaultFrontEndRoot, '..', '..');
const defaultOut = path.join(defaultRepoRoot, 'build', 'harness', 'indexes', 'front-end.source-index.json');

function parseArgs(argv) {
    const cfg = {
        frontEndRoot: defaultFrontEndRoot,
        repoRoot: defaultRepoRoot,
        out: defaultOut
    };
    for (const arg of argv) {
        if (arg.startsWith('--front-end-root=')) cfg.frontEndRoot = path.resolve(arg.slice('--front-end-root='.length));
        else if (arg.startsWith('--repo-root=')) cfg.repoRoot = path.resolve(arg.slice('--repo-root='.length));
        else if (arg.startsWith('--out=')) cfg.out = path.resolve(arg.slice('--out='.length));
        else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    }
    return cfg;
}

function walk(dir, predicate = () => true) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full, predicate);
        return predicate(full) ? [full] : [];
    });
}

function repoRelative(repoRoot, file) {
    return path.relative(repoRoot, file).replace(/\\/g, '/');
}

function lineForOffset(source, offset) {
    return source.slice(0, offset).split('\n').length;
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function stringArrayFromLiteral(raw) {
    return unique([...raw.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]));
}

function collectPageMetadata(file, source, cfg) {
    const requirements = unique([...source.matchAll(/@Requirement\s+(REQ-\d{3,})/g)].map((match) => match[1]));
    const page = source.match(/@Page\s+([A-Za-z0-9_]+)/)?.[1];
    const route = source.match(/@Route\s+([^\s*]+)/)?.[1];
    if (!page && !route && requirements.length === 0) return { pages: [], routes: [] };

    const relativeFile = repoRelative(cfg.repoRoot, file);
    const line = source.match(/@Requirement|@Page|@Route/)?.index ?? 0;
    const baseLocation = {
        file: relativeFile,
        line: lineForOffset(source, line),
        identity: page ?? route ?? relativeFile,
        channel: 'FE.Page'
    };

    const pages = page ? [{
        kind: 'page',
        requirements,
        location: baseLocation,
        file: relativeFile,
        line: baseLocation.line,
        name: page,
        route: route ?? null
    }] : [];

    const routes = route ? [{
        kind: 'route',
        requirements,
        location: { ...baseLocation, identity: route, channel: 'FE.Route' },
        file: relativeFile,
        line: baseLocation.line,
        path: route,
        component: page ?? ''
    }] : [];

    return { pages, routes };
}

function collectStoryMetadata(file, source, cfg) {
    const title = source.match(/title\s*:\s*['"]([^'"]+)['"]/)?.[1];
    if (!title) return [];
    const requirementsRaw = source.match(/harness\s*:\s*\{\s*requirements\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? '';
    const requirements = stringArrayFromLiteral(requirementsRaw);
    const relativeFile = repoRelative(cfg.repoRoot, file);
    const component = title.split('/').at(-1) ?? title;
    const stories = [];
    const exportRegex = /export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/g;
    for (const match of source.matchAll(exportRegex)) {
        const story = match[1];
        stories.push({
            kind: 'story',
            requirements,
            location: {
                file: relativeFile,
                line: lineForOffset(source, match.index ?? 0),
                identity: `${title} / ${story}`,
                channel: 'FE.Story'
            },
            file: relativeFile,
            line: lineForOffset(source, match.index ?? 0),
            title,
            story,
            component
        });
    }
    return stories;
}

function nearestTestBlock(source, index) {
    const head = source.slice(0, index);
    const start = Math.max(head.lastIndexOf('test('), head.lastIndexOf('test.describe('));
    if (start < 0) return null;
    const title = source.slice(start, index).match(/test(?:\.describe)?\(\s*['"]([^'"]+)['"]/)?.[1] ?? '';
    return { start, title };
}

function collectPlaywrightMetadata(file, source, cfg) {
    const relativeFile = repoRelative(cfg.repoRoot, file);
    const annotations = [...source.matchAll(/\{\s*type\s*:\s*['"](Requirement|Covers)['"]\s*,\s*description\s*:\s*['"]([^'"]+)['"]\s*\}/g)];
    const testsByStart = new Map();
    const issues = [];
    for (const annotation of annotations) {
        const nearest = nearestTestBlock(source, annotation.index ?? 0);
        if (!nearest) continue;
        if (!testsByStart.has(nearest.start)) {
            testsByStart.set(nearest.start, {
                requirements: [],
                covers: [],
                title: nearest.title,
                line: lineForOffset(source, nearest.start)
            });
        }
        const bucket = testsByStart.get(nearest.start);
        if (annotation[1] === 'Requirement') bucket.requirements.push(annotation[2]);
        if (annotation[1] === 'Covers') bucket.covers.push(annotation[2]);
    }

    const tests = [];
    for (const test of testsByStart.values()) {
        const requirements = unique(test.requirements);
        const covers = unique(test.covers);
        if (covers.length > 0 && requirements.length === 0) {
            issues.push({
                kind: 'COVERS_WITHOUT_REQUIREMENT',
                severity: 'error',
                message: 'Covers annotation has no Requirement annotation',
                requirements: [],
                location: { file: relativeFile, line: test.line, identity: test.title }
            });
        }
        if (requirements.length > 0 && covers.length === 0) {
            issues.push({
                kind: 'REQUIREMENT_WITHOUT_COVERS',
                severity: 'error',
                message: 'Requirement annotation has no Covers annotation',
                requirements,
                location: { file: relativeFile, line: test.line, identity: test.title }
            });
        }
        tests.push({
            kind: 'test',
            source: 'front-end',
            runtime: 'playwright',
            requirements,
            covers,
            file: relativeFile,
            line: test.line,
            displayName: test.title,
            titlePath: [test.title],
            identity: `${relativeFile}:${test.line} > ${test.title}`,
            resultKeys: [`${relativeFile} > ${test.title}`],
            location: {
                file: relativeFile,
                line: test.line,
                identity: `${relativeFile}:${test.line} > ${test.title}`,
                channel: 'FE.Covers'
            }
        });
    }
    return { tests, issues };
}

function main() {
    const cfg = parseArgs(process.argv.slice(2));
    const srcFiles = walk(path.join(cfg.frontEndRoot, 'src'), (file) => /\.(ts|tsx)$/.test(file));
    const testFiles = walk(path.join(cfg.frontEndRoot, 'tests', 'e2e'), (file) => /\.(spec|test)\.[cm]?[tj]sx?$/.test(file));

    const pages = [];
    const routes = [];
    const stories = [];
    const tests = [];
    const issues = [];

    for (const file of srcFiles) {
        const source = fs.readFileSync(file, 'utf8');
        const pageMeta = collectPageMetadata(file, source, cfg);
        pages.push(...pageMeta.pages);
        routes.push(...pageMeta.routes);
        stories.push(...collectStoryMetadata(file, source, cfg));
    }

    for (const file of testFiles) {
        const source = fs.readFileSync(file, 'utf8');
        const metadata = collectPlaywrightMetadata(file, source, cfg);
        tests.push(...metadata.tests);
        issues.push(...metadata.issues);
    }

    const entries = [...pages, ...routes, ...stories, ...tests];
    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        source: 'front-end.source-index',
        entries,
        pages,
        routes,
        stories,
        tests,
        apiUsages: [],
        apiCalls: [],
        issues,
        textChannels: []
    };

    fs.mkdirSync(path.dirname(cfg.out), { recursive: true });
    fs.writeFileSync(cfg.out, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`front-end.source-index.json: pages=${pages.length}, routes=${routes.length}, stories=${stories.length}, tests=${tests.length}, issues=${issues.length}`);
}

main();
