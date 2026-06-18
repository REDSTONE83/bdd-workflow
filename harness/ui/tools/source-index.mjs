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

function arrayPropertyFromText(text, property) {
    const match = text.match(new RegExp(`\\b${property}\\s*:\\s*\\[([\\s\\S]*?)\\]`));
    return stringArrayFromLiteral(match?.[1] ?? '');
}

function harnessArrayFromText(text, property) {
    const match = text.match(new RegExp(`harness\\s*:\\s*\\{[\\s\\S]*?\\b${property}\\s*:\\s*\\[([\\s\\S]*?)\\]`));
    return stringArrayFromLiteral(match?.[1] ?? '');
}

function storyDisplayName(story) {
    return story
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .trim();
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
    if (!title) return { stories: [], tests: [], issues: [] };
    const exportRegex = /export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/g;
    const exports = [...source.matchAll(exportRegex)];
    const metaText = source.slice(0, exports[0]?.index ?? source.length);
    const metaRequirements = harnessArrayFromText(metaText, 'requirements');
    const metaTags = arrayPropertyFromText(metaText, 'tags');
    const relativeFile = repoRelative(cfg.repoRoot, file);
    const component = title.split('/').at(-1) ?? title;
    const stories = [];
    const tests = [];
    const issues = [];
    for (const [index, match] of exports.entries()) {
        const story = match[1];
        const storyBlock = source.slice(match.index ?? 0, exports[index + 1]?.index ?? source.length);
        const storyTags = arrayPropertyFromText(storyBlock, 'tags');
        const requirements = unique([...metaRequirements, ...harnessArrayFromText(storyBlock, 'requirements')]);
        const covers = harnessArrayFromText(storyBlock, 'covers');
        const enabledForStorybookVitest = (metaTags.includes('test') || storyTags.includes('test')) && !storyTags.includes('!test');
        const hasPlay = /\bplay\s*:/.test(storyBlock);
        const hasAssertion = /\bexpect\s*\(|\bassert[A-Za-z0-9_]*\b/.test(storyBlock);
        const line = lineForOffset(source, match.index ?? 0);
        const displayStory = storyDisplayName(story);
        stories.push({
            kind: 'story',
            requirements,
            location: {
                file: relativeFile,
                line,
                identity: `${title} / ${story}`,
                channel: 'FE.Story'
            },
            file: relativeFile,
            line,
            title,
            story,
            component,
            hasPlay,
            hasAssertion
        });

        if (covers.length > 0 && requirements.length === 0) {
            issues.push({
                kind: 'COVERS_WITHOUT_REQUIREMENT',
                severity: 'error',
                message: 'Storybook Vitest covers metadata has no requirement metadata',
                requirements: [],
                location: { file: relativeFile, line, identity: `${title} / ${story}` }
            });
        }
        if (!enabledForStorybookVitest || covers.length === 0) {
            continue;
        }
        tests.push({
            kind: 'test',
            source: 'front-end',
            runtime: 'storybook-vitest',
            requirements,
            covers,
            file: relativeFile,
            line,
            displayName: `${title} / ${story}`,
            titlePath: [title, story],
            hasPlay,
            hasAssertion,
            identity: `${relativeFile}:${line} > ${title} / ${story}`,
            resultKeys: [
                `${title} / ${story}`,
                `${title} > ${story}`,
                `${relativeFile} > ${displayStory}`,
                `${path.relative(cfg.frontEndRoot, file).replace(/\\/g, '/')} > ${displayStory}`,
                displayStory,
                story,
                `${relativeFile} > ${title} / ${story}`
            ],
            location: {
                file: relativeFile,
                line,
                identity: `${relativeFile}:${line} > ${title} / ${story}`,
                channel: 'FE.StorybookVitest'
            }
        });
    }
    return { stories, tests, issues };
}

function main() {
    const cfg = parseArgs(process.argv.slice(2));
    const srcFiles = walk(path.join(cfg.frontEndRoot, 'src'), (file) => /\.(ts|tsx)$/.test(file));

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
        const metadata = collectStoryMetadata(file, source, cfg);
        stories.push(...metadata.stories);
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
