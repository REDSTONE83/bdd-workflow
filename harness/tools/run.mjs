#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { appRoot, backendRoot, frontEndRoot, workspaceRoot } from './workspace-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gradleWrapper = path.join(backendRoot, 'gradlew');
const harnessRoot = path.join(workspaceRoot, 'harness');
const harnessUiRoot = path.join(harnessRoot, 'ui');
const canonicalOutputRoots = {
    application: path.join(workspaceRoot, 'build', 'app'),
    harness: path.join(workspaceRoot, 'build', 'harness')
};
const publishableTopLevelDirs = ['indexes', 'findings', 'reports', 'state', 'test-results', 'playwright-report'];
const manualUiCommands = new Set(['harness:ui', 'harness:ui:serve']);
const portIsolatedCommands = new Set(['app:validate', 'app:e2e:live', 'repo:validate']);

function rel(file) {
    return path.relative(workspaceRoot, file).replace(/\\/g, '/');
}

function generateRunId() {
    const now = new Date();
    const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('');
    return `${stamp}-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;
}

function parsePortEnv(name) {
    const value = process.env[name];
    if (!value) return null;
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`${name} must be a TCP port number: ${value}`);
    }
    return port;
}

function portFromUrlEnv(name) {
    const value = process.env[name];
    if (!value) return null;
    try {
        const parsed = new URL(value);
        if (!parsed.port) return null;
        const port = Number(parsed.port);
        return Number.isInteger(port) ? port : null;
    } catch {
        throw new Error(`${name} must be a valid URL when provided: ${value}`);
    }
}

function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.listen({ host: '127.0.0.1', port }, () => {
            server.close(() => resolve(true));
        });
    });
}

async function findFreePort(excluded = new Set()) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        const port = await new Promise((resolve, reject) => {
            const server = net.createServer();
            server.once('error', reject);
            server.listen({ host: '127.0.0.1', port: 0 }, () => {
                const address = server.address();
                const selected = typeof address === 'object' && address ? address.port : null;
                server.close(() => {
                    if (selected) resolve(selected);
                    else reject(new Error('Could not allocate a TCP port'));
                });
            });
        });
        if (!excluded.has(port)) return port;
    }
    throw new Error('Could not allocate a unique TCP port for this run');
}

function portOwner(port) {
    const result = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
        encoding: 'utf8'
    });
    if (result.status !== 0 || !result.stdout.trim()) {
        return 'owner process unavailable from lsof';
    }
    return result.stdout.trim().split('\n').slice(0, 4).join('\n');
}

async function assertExplicitPortAvailable(name, port) {
    if (await isPortAvailable(port)) return;
    throw new Error(`${name}=${port} is already in use.\n${portOwner(port)}\nChoose a free port or unset ${name} so the runner can allocate one.`);
}

async function createPortContext() {
    const frontendFromEnv = parsePortEnv('E2E_FRONTEND_PORT') ?? portFromUrlEnv('E2E_BASE_URL');
    const backendFromEnv = parsePortEnv('E2E_BACKEND_PORT') ?? portFromUrlEnv('VITE_BACKEND_ORIGIN');
    const frontendPort = frontendFromEnv ?? await findFreePort();
    if (frontendFromEnv) {
        await assertExplicitPortAvailable('E2E_FRONTEND_PORT', frontendPort);
    }
    const backendPort = backendFromEnv ?? await findFreePort(new Set([frontendPort]));
    if (backendFromEnv) {
        await assertExplicitPortAvailable('E2E_BACKEND_PORT', backendPort);
    }
    if (frontendPort === backendPort) {
        throw new Error(`E2E_FRONTEND_PORT and E2E_BACKEND_PORT must be different: ${frontendPort}`);
    }
    return {
        frontendPort,
        backendPort,
        baseUrl: process.env.E2E_BASE_URL ?? `http://127.0.0.1:${frontendPort}`,
        backendOrigin: process.env.VITE_BACKEND_ORIGIN ?? `http://127.0.0.1:${backendPort}`
    };
}

async function createRunContext(options = {}) {
    const runId = process.env.HARNESS_RUN_ID || generateRunId();
    const outputRoots = {
        application: path.join(canonicalOutputRoots.application, 'runs', runId),
        harness: path.join(canonicalOutputRoots.harness, 'runs', runId)
    };
    fs.mkdirSync(outputRoots.application, { recursive: true });
    fs.mkdirSync(outputRoots.harness, { recursive: true });
    return {
        enabled: true,
        runId,
        outputRoots,
        ports: options.allocatePorts ? await createPortContext() : null
    };
}

function createCanonicalContext() {
    return {
        enabled: false,
        runId: null,
        outputRoots: canonicalOutputRoots,
        ports: null
    };
}

function outputRootForScope(scope, useRunRoot = true) {
    if (!useRunRoot || !runContext.enabled) return canonicalOutputRoots[scope];
    return runContext.outputRoots[scope];
}

function gradleBuildDirFor(scope) {
    return path.join(outputRootForScope(scope), 'gradle-build');
}

function gradleProjectCacheDirFor(scope) {
    return path.join(outputRootForScope(scope), 'gradle-cache');
}

function appOutputRoot() {
    return outputRootForScope('application');
}

function harnessOutputRoot() {
    return outputRootForScope('harness');
}

function envFor(scope, options = {}) {
    const useRunRoot = options.useRunRoot ?? true;
    const outputRoot = outputRootForScope(scope, useRunRoot);
    const docsRoot = path.join(workspaceRoot, scope === 'harness' ? 'harness' : 'app', 'docs');
    const env = {
        ...process.env,
        HARNESS_SCOPE: scope,
        HARNESS_OUTPUT_ROOT: outputRoot,
        HARNESS_DOCS_ROOT: docsRoot,
        HARNESS_REQUIREMENTS_DIR: path.join(docsRoot, 'requirements'),
        HARNESS_SCENARIOS_DIR: path.join(docsRoot, 'scenarios'),
        HARNESS_CHANGE_SETS_DIR: path.join(docsRoot, 'change-sets'),
        HARNESS_TERMINOLOGY_DIR: path.join(workspaceRoot, 'harness', 'docs', 'terminology'),
        APP_ROOT: appRoot,
        BACKEND_ROOT: backendRoot,
        FRONTEND_ROOT: frontEndRoot
    };
    if (runContext.enabled && useRunRoot) {
        env.HARNESS_RUN_ID = runContext.runId;
        env.HARNESS_GRADLE_BUILD_DIR = gradleBuildDirFor(scope);
        env.HARNESS_GRADLE_PROJECT_CACHE_DIR = gradleProjectCacheDirFor(scope);
        env.STORYBOOK_JUNIT_FILE = path.join(outputRoot, 'test-results', 'storybook-junit.xml');
        if (scope === 'application' && runContext.ports) {
            env.E2E_FRONTEND_PORT = String(runContext.ports.frontendPort);
            env.E2E_BACKEND_PORT = String(runContext.ports.backendPort);
            env.E2E_BASE_URL = runContext.ports.baseUrl;
            env.VITE_BACKEND_ORIGIN = runContext.ports.backendOrigin;
            env.E2E_RESULTS_FILE = path.join(outputRoot, 'test-results', 'e2e-results.json');
            env.E2E_LIVE_RESULTS_FILE = path.join(outputRoot, 'test-results', 'e2e-live-results.json');
            env.E2E_LIVE_ARTIFACTS_DIR = path.join(outputRoot, 'test-results', 'live-artifacts');
            env.E2E_LIVE_HTML_REPORT_DIR = path.join(outputRoot, 'playwright-report', 'live');
        }
    }
    return env;
}

function run(label, command, args, options = {}) {
    const cwd = options.cwd ?? workspaceRoot;
    const scope = options.scope ?? 'application';
    const useRunRoot = options.useRunRoot ?? true;
    console.log(`\n[${label}] ${[rel(command), ...args].join(' ')}`);
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: envFor(scope, { useRunRoot })
    });
    if (result.error) {
        console.error(`[${label}] spawn failed: ${result.error.message}`);
        process.exit(2);
    }
    const status = result.status ?? 1;
    if (status !== 0) {
        console.error(`[${label}] failed with exit ${status}`);
        process.exit(status);
    }
}

function runNodeTool(scope, label, name, args = []) {
    run(label, process.execPath, [path.join(__dirname, name), ...args], { scope });
}

function atomicCopyFile(source, destination) {
    if (!fs.existsSync(source)) return false;
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (fs.existsSync(destination) && fs.statSync(destination).isDirectory()) {
        fs.rmSync(destination, { recursive: true, force: true });
    }
    const temp = `${destination}.tmp-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;
    fs.copyFileSync(source, temp);
    fs.renameSync(temp, destination);
    return true;
}

function mirrorDirectory(source, destination, options = {}) {
    if (!fs.existsSync(source)) return false;
    fs.mkdirSync(destination, { recursive: true });
    const sourceEntries = new Map(fs.readdirSync(source, { withFileTypes: true }).map((entry) => [entry.name, entry]));
    for (const [name, entry] of sourceEntries) {
        const sourcePath = path.join(source, name);
        const destinationPath = path.join(destination, name);
        if (entry.isDirectory()) {
            if (fs.existsSync(destinationPath) && !fs.statSync(destinationPath).isDirectory()) {
                fs.rmSync(destinationPath, { force: true });
            }
            mirrorDirectory(sourcePath, destinationPath, options);
        } else if (entry.isFile()) {
            atomicCopyFile(sourcePath, destinationPath);
        }
    }
    if (options.deleteExtraneous) {
        for (const entry of fs.readdirSync(destination, { withFileTypes: true })) {
            if (!sourceEntries.has(entry.name)) {
                fs.rmSync(path.join(destination, entry.name), { recursive: true, force: true });
            }
        }
    }
    return true;
}

function publishPath(scope, relativePath, options = {}) {
    const source = path.join(outputRootForScope(scope), relativePath);
    const destination = path.join(canonicalOutputRoots[scope], relativePath);
    if (!fs.existsSync(source)) return false;
    const stat = fs.statSync(source);
    if (stat.isDirectory()) {
        return mirrorDirectory(source, destination, { deleteExtraneous: options.deleteExtraneous });
    }
    if (stat.isFile()) {
        return atomicCopyFile(source, destination);
    }
    return false;
}

function publishFrontEndArtifacts() {
    const root = appOutputRoot();
    const published = [];
    const testResultsDir = path.join(frontEndRoot, 'test-results');
    if (atomicCopyFile(path.join(root, 'test-results', 'storybook-junit.xml'), path.join(testResultsDir, 'storybook-junit.xml'))) {
        published.push('app/front-end/test-results/storybook-junit.xml');
    }
    if (atomicCopyFile(path.join(root, 'test-results', 'e2e-live-results.json'), path.join(testResultsDir, 'e2e-live-results.json'))) {
        published.push('app/front-end/test-results/e2e-live-results.json');
    }
    if (mirrorDirectory(path.join(root, 'test-results', 'live-artifacts'), path.join(testResultsDir, 'live-artifacts'), { deleteExtraneous: true })) {
        published.push('app/front-end/test-results/live-artifacts');
    }
    if (mirrorDirectory(path.join(root, 'playwright-report', 'live'), path.join(frontEndRoot, 'playwright-report', 'live'), { deleteExtraneous: true })) {
        published.push('app/front-end/playwright-report/live');
    }
    return published;
}

function publishHarnessUiArtifacts() {
    const published = [];
    if (atomicCopyFile(
        path.join(harnessOutputRoot(), 'test-results', 'storybook-junit.xml'),
        path.join(harnessUiRoot, 'test-results', 'storybook-junit.xml')
    )) {
        published.push('harness/ui/test-results/storybook-junit.xml');
    }
    return published;
}

function publishScope(scope, options = {}) {
    if (!runContext.enabled) return;
    const paths = options.paths ?? publishableTopLevelDirs.filter((name) => {
        const source = path.join(outputRootForScope(scope), name);
        return fs.existsSync(source);
    });
    const published = [];
    for (const relativePath of paths) {
        if (publishPath(scope, relativePath, { deleteExtraneous: options.mirror })) {
            published.push(`${scope === 'harness' ? 'build/harness' : 'build/app'}/${relativePath}`);
        }
    }
    if (options.frontEndArtifacts) {
        published.push(...publishFrontEndArtifacts());
    }
    if (options.harnessUiArtifacts) {
        published.push(...publishHarnessUiArtifacts());
    }
    const summary = published.length > 0 ? published.join(', ') : 'no publishable artifacts';
    console.log(`[publish:${scope}] ${rel(outputRootForScope(scope))} -> ${summary}`);
}

function hydrateTraceTestResults(scope) {
    if (!runContext.enabled) return;
    if (scope === 'application') {
        mirrorDirectory(
            path.join(canonicalOutputRoots.application, 'test-results', 'test'),
            path.join(appOutputRoot(), 'test-results', 'test'),
            { deleteExtraneous: true }
        );
        atomicCopyFile(
            path.join(frontEndRoot, 'test-results', 'storybook-junit.xml'),
            path.join(appOutputRoot(), 'test-results', 'storybook-junit.xml')
        );
        atomicCopyFile(
            path.join(frontEndRoot, 'test-results', 'e2e-live-results.json'),
            path.join(appOutputRoot(), 'test-results', 'e2e-live-results.json')
        );
        return;
    }
    mirrorDirectory(
        path.join(canonicalOutputRoots.harness, 'test-results', 'nodeSelfTest'),
        path.join(harnessOutputRoot(), 'test-results', 'nodeSelfTest'),
        { deleteExtraneous: true }
    );
    atomicCopyFile(
        path.join(harnessUiRoot, 'test-results', 'storybook-junit.xml'),
        path.join(harnessOutputRoot(), 'test-results', 'storybook-junit.xml')
    );
}

function runBackEndGradle(label, ...tasks) {
    run(label, gradleWrapper, [
        '-p',
        backendRoot,
        '--project-cache-dir',
        gradleProjectCacheDirFor('application'),
        ...tasks
    ], { scope: 'application' });
}

function runHarnessGradle(label, ...tasks) {
    run(label, gradleWrapper, [
        '-p',
        harnessRoot,
        '--project-cache-dir',
        gradleProjectCacheDirFor('harness'),
        ...tasks
    ], { scope: 'harness' });
}

function nodeTestFiles() {
    const testDir = path.join(__dirname, '__tests__');
    if (!fs.existsSync(testDir)) return [];
    return fs.readdirSync(testDir)
        .filter((name) => name.endsWith('.test.mjs'))
        .sort()
        .map((name) => path.join(testDir, name));
}

function walk(dir, predicate = () => true) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full, predicate);
        return predicate(full) ? [full] : [];
    });
}

function selfTestFiles() {
    return walk(path.join(workspaceRoot, 'harness', 'self-test'), (file) => file.endsWith('.test.ts')).sort();
}

function toolTest() {
    const files = nodeTestFiles();
    if (files.length === 0) {
        console.log('[harness:tool-test] no node test files');
        return;
    }
    run('harness:tool-test', process.execPath, ['--test', ...files], { scope: 'harness' });
}

function sourceIndex() {
    const indexesDir = path.join(appOutputRoot(), 'indexes');
    fs.mkdirSync(indexesDir, { recursive: true });
    const args = [
        workspaceRoot,
        path.join(backendRoot, 'src', 'main', 'java'),
        path.join(backendRoot, 'src', 'test', 'java'),
        path.join(indexesDir, 'backend.source-index.json')
    ].join(' ');
    runHarnessGradle('app:source-index', ':bdd-workflow-harness-source-indexer:run', `--args=${args}`);
}

function harnessSelfTestIndex() {
    runNodeTool('harness', 'harness:self-test-index', 'index-harness-self-tests.mjs');
}

function frontEndSourceIndex() {
    run('app:front-end-source-index', process.execPath, [
        path.join(frontEndRoot, 'tools', 'source-index.mjs'),
        `--front-end-root=${frontEndRoot}`,
        `--repo-root=${workspaceRoot}`,
        `--out=${path.join(appOutputRoot(), 'indexes', 'front-end.source-index.json')}`
    ], { scope: 'application' });
}

function harnessFrontEndSourceIndex() {
    const sourceIndexTool = path.join(harnessUiRoot, 'tools', 'source-index.mjs');
    if (!fs.existsSync(sourceIndexTool)) {
        console.log('[harness:front-end-source-index] harness/ui source indexer not present');
        return;
    }
    run('harness:front-end-source-index', process.execPath, [
        sourceIndexTool,
        `--front-end-root=${harnessUiRoot}`,
        `--repo-root=${workspaceRoot}`,
        `--out=${path.join(harnessOutputRoot(), 'indexes', 'front-end.source-index.json')}`
    ], { scope: 'harness' });
}

function scenarioIndex(scope) {
    runNodeTool(scope, `${scope === 'harness' ? 'harness' : 'app'}:scenario-index`, 'scenario-index.mjs');
}

function requirementIndex(scope) {
    runNodeTool(scope, `${scope === 'harness' ? 'harness' : 'app'}:index-requirements`, 'index-requirements.mjs');
}

function changeSetIndex(scope) {
    runNodeTool(scope, `${scope === 'harness' ? 'harness' : 'app'}:index-change-sets`, 'index-change-sets.mjs');
}

function terminologyIndex(scope) {
    runNodeTool(scope, `${scope === 'harness' ? 'harness' : 'app'}:index-terminology`, 'terminology.mjs', ['index']);
}

function openApiIndex() {
    runBackEndGradle('back-end:generateOpenApiIndex', 'generateOpenApiIndex');
}

function collectAppStaticInputs() {
    sourceIndex();
    frontEndSourceIndex();
    scenarioIndex('application');
    requirementIndex('application');
    changeSetIndex('application');
    terminologyIndex('application');
    openApiIndex();
}

function collectHarnessStaticInputs() {
    const indexesDir = path.join(harnessOutputRoot(), 'indexes');
    for (const stale of ['backend.source-index.json', 'front-end.source-index.json', 'openapi.index.json']) {
        fs.rmSync(path.join(indexesDir, stale), { force: true });
    }
    harnessFrontEndSourceIndex();
    harnessSelfTestIndex();
    scenarioIndex('harness');
    requirementIndex('harness');
    changeSetIndex('harness');
    terminologyIndex('harness');
}

function emitFindingsAndReports(scope) {
    const prefix = scope === 'harness' ? 'harness' : 'app';
    runNodeTool(scope, `${prefix}:validate-requirement-cards`, 'validate-requirement-cards.mjs');
    runNodeTool(scope, `${prefix}:render-requirement-schema-report`, 'render-requirement-schema-report.mjs');
    runNodeTool(scope, `${prefix}:validate-cross-artifact`, 'validate-cross-artifact.mjs');
    runNodeTool(scope, `${prefix}:validate-front-end-standards`, 'validate-front-end-standards.mjs');
    runNodeTool(scope, `${prefix}:validate-scenarios`, 'validate-scenarios.mjs');
    runNodeTool(scope, `${prefix}:validate-back-end-standards`, 'validate-back-end-standards.mjs');
    runNodeTool(scope, `${prefix}:validate-terminology`, 'terminology.mjs', ['validate']);
    runNodeTool(scope, `${prefix}:render-change-set-report`, 'render-change-set-report.mjs');
}

function changeSetsReport(scope) {
    const prefix = scope === 'harness' ? 'harness' : 'app';
    changeSetIndex(scope);
    runNodeTool(scope, `${prefix}:render-change-set-report`, 'render-change-set-report.mjs');
}

function terminology(scope, args) {
    const prefix = scope === 'harness' ? 'harness' : 'app';
    runNodeTool(scope, `${prefix}:terminology`, 'terminology.mjs', args);
}

function standards(scope) {
    const prefix = scope === 'harness' ? 'harness' : 'app';
    runNodeTool(scope, `${prefix}:validate-back-end-standards`, 'validate-back-end-standards.mjs');
    runNodeTool(scope, `${prefix}:validate-front-end-standards`, 'validate-front-end-standards.mjs');
}

function indexTestResults(scope) {
    runNodeTool(scope, `${scope === 'harness' ? 'harness' : 'app'}:index-test-results`, 'index-test-results.mjs');
}

function backEndTest() {
    runBackEndGradle('back-end:test', 'test');
}

function frontEndNpm(label, script) {
    run(label, 'npm', ['run', script], { cwd: frontEndRoot, scope: 'application' });
}

function frontEndE2e() {
    frontEndStorybookTest();
}

function frontEndLiveE2e() {
    frontEndNpm('front-end:e2e:live', 'e2e:live');
}

function frontEndStorybookTest() {
    const junitFile = path.join(appOutputRoot(), 'test-results', 'storybook-junit.xml');
    fs.mkdirSync(path.dirname(junitFile), { recursive: true });
    fs.rmSync(junitFile, { force: true });
    frontEndNpm('front-end:test-storybook', 'test:storybook');
}

function frontEndBuildStorybook() {
    frontEndNpm('front-end:build-storybook', 'build-storybook');
}

function harnessUiNpm(label, script, args = []) {
    run(label, 'npm', ['run', script, ...args], { cwd: harnessUiRoot, scope: 'harness' });
}

function harnessUi() {
    harnessUiNpm('harness:ui', 'dev');
}

function harnessUiServe() {
    harnessUiNpm('harness:ui:serve', 'serve');
}

function harnessUiBuildStorybook() {
    harnessUiNpm('harness:ui:build-storybook', 'build-storybook');
}

function harnessUiStorybookTest() {
    const junitFile = path.join(harnessOutputRoot(), 'test-results', 'storybook-junit.xml');
    fs.mkdirSync(path.dirname(junitFile), { recursive: true });
    fs.rmSync(junitFile, { force: true });
    harnessUiNpm('harness:ui:test-storybook', 'test:storybook');
}

function selfTest() {
    const files = selfTestFiles();
    if (files.length === 0) {
        console.log('[harness:self-test] no Node/TypeScript self-test files');
        return;
    }
    const resultDir = path.join(harnessOutputRoot(), 'test-results', 'nodeSelfTest');
    fs.rmSync(resultDir, { recursive: true, force: true });
    fs.mkdirSync(resultDir, { recursive: true });
    run('harness:self-test', process.execPath, [
        '--experimental-strip-types',
        '--test',
        '--test-concurrency=1',
        '--test-reporter=spec',
        '--test-reporter-destination=stdout',
        '--test-reporter=junit',
        `--test-reporter-destination=${path.join(resultDir, 'junit.xml')}`,
        ...files
    ], { scope: 'harness' });
}

function appTrace(args) {
    collectAppStaticInputs();
    hydrateTraceTestResults('application');
    indexTestResults('application');
    emitFindingsAndReports('application');
    runNodeTool('application', 'app:trace', 'trace-requirements.mjs', args);
}

function appValidate(args) {
    collectAppStaticInputs();
    frontEndStorybookTest();
    frontEndBuildStorybook();
    backEndTest();
    frontEndLiveE2e();
    indexTestResults('application');
    emitFindingsAndReports('application');
    runNodeTool('application', 'app:validate', 'trace-requirements.mjs', ['--check', ...args]);
}

function appTest() {
    backEndTest();
}

function appE2e() {
    frontEndE2e();
}

function appLiveE2e() {
    frontEndLiveE2e();
}

function harnessTrace(args) {
    collectHarnessStaticInputs();
    hydrateTraceTestResults('harness');
    indexTestResults('harness');
    emitFindingsAndReports('harness');
    runNodeTool('harness', 'harness:trace', 'trace-requirements.mjs', args);
}

function harnessValidate(args) {
    toolTest();
    collectHarnessStaticInputs();
    harnessUiStorybookTest();
    harnessUiBuildStorybook();
    selfTest();
    indexTestResults('harness');
    emitFindingsAndReports('harness');
    runNodeTool('harness', 'harness:validate', 'trace-requirements.mjs', ['--check', ...args]);
}

function harnessTest() {
    toolTest();
    collectHarnessStaticInputs();
    harnessUiStorybookTest();
    selfTest();
}

function repoValidate(args) {
    appValidate(args);
    publishScope('application', { mirror: true, frontEndArtifacts: true });
    harnessValidate(args);
    publishScope('harness', { mirror: true, harnessUiArtifacts: true });
}

function usage() {
    console.error(`Usage: node harness/tools/run.mjs <command> [args]

Commands:
  app:validate [trace args...]       Run application tests, application indexes, validators, and app gate.
  app:trace [trace args...]          Refresh application indexes/findings/reports and render app trace.
  app:test                           Run application back-end JUnit tests.
  app:e2e                            Run application front-end Storybook Vitest tests.
  app:e2e:live                       Run application live Playwright integration smoke tests.
  app:source-index                   Generate build/app/indexes/backend.source-index.json.
  app:front-end-source-index         Generate build/app/indexes/front-end.source-index.json.
  app:scenario-index                 Generate build/app/indexes/scenarios.index.json.
  app:openapi-index                  Generate build/app/indexes/openapi.index.json.
  app:change-sets                    Render application change set report.
  app:terminology [args...]           Run terminology tool in application scope.
  app:standards                      Emit application standards findings.
  harness:validate [trace args...]   Run harness tool tests, self-tests, validators, and harness gate.
  harness:trace [trace args...]      Refresh harness indexes/findings/reports and render harness trace.
  harness:test                       Run Node tool tests and harness self-test.
  harness:front-end-source-index     Generate build/harness/indexes/front-end.source-index.json from harness/ui.
  harness:ui                         Start the local harness UI dev server.
  harness:ui:serve                   Build and serve the harness UI with the Express production server.
  harness:change-sets                Render harness change set report.
  harness:terminology [args...]       Run terminology tool in harness scope.
  harness:standards                  Emit harness standards findings.
  harness:tool-test                  Run Node tool tests only.
  harness:self-test                  Run harness Node/TypeScript self-test.
  harness:self-test-index            Generate build/harness/indexes/harness.self-test.index.json.
  repo:validate [trace args...]      Run app:validate then harness:validate.
`);
}

const [command, ...args] = process.argv.slice(2);
const usesRunContext = command && !manualUiCommands.has(command);
let runContext = createCanonicalContext();
try {
    if (usesRunContext) {
        runContext = await createRunContext({ allocatePorts: portIsolatedCommands.has(command) });
        console.log(`[run] runId=${runContext.runId}`);
        console.log(`[run] appRoot=${rel(runContext.outputRoots.application)} harnessRoot=${rel(runContext.outputRoots.harness)}`);
        if (runContext.ports) {
            console.log(`[run] ports frontend=${runContext.ports.frontendPort} backend=${runContext.ports.backendPort}`);
        }
    }
} catch (error) {
    console.error(`[run] ${error.message}`);
    process.exit(2);
}

switch (command) {
    case 'app:validate':
        appValidate(args);
        publishScope('application', { mirror: true, frontEndArtifacts: true });
        break;
    case 'app:trace':
        appTrace(args);
        publishScope('application', { mirror: true, frontEndArtifacts: true });
        break;
    case 'app:test':
        appTest();
        publishScope('application');
        break;
    case 'app:e2e':
        appE2e();
        publishScope('application', { frontEndArtifacts: true });
        break;
    case 'app:e2e:live':
        appLiveE2e();
        publishScope('application', { frontEndArtifacts: true });
        break;
    case 'app:source-index':
        sourceIndex();
        publishScope('application');
        break;
    case 'app:front-end-source-index':
        frontEndSourceIndex();
        publishScope('application');
        break;
    case 'app:scenario-index':
        scenarioIndex('application');
        publishScope('application');
        break;
    case 'app:openapi-index':
        openApiIndex();
        publishScope('application');
        break;
    case 'app:change-sets':
        changeSetsReport('application');
        publishScope('application');
        break;
    case 'app:terminology':
        terminology('application', args);
        publishScope('application');
        break;
    case 'app:standards':
        standards('application');
        publishScope('application');
        break;
    case 'harness:validate':
        harnessValidate(args);
        publishScope('harness', { mirror: true, harnessUiArtifacts: true });
        break;
    case 'harness:trace':
        harnessTrace(args);
        publishScope('harness', { mirror: true, harnessUiArtifacts: true });
        break;
    case 'harness:test':
        harnessTest();
        publishScope('harness', { harnessUiArtifacts: true });
        break;
    case 'harness:tool-test':
        toolTest();
        publishScope('harness');
        break;
    case 'harness:self-test':
        collectHarnessStaticInputs();
        selfTest();
        publishScope('harness');
        break;
    case 'harness:self-test-index':
        harnessSelfTestIndex();
        publishScope('harness');
        break;
    case 'harness:front-end-source-index':
        harnessFrontEndSourceIndex();
        publishScope('harness');
        break;
    case 'harness:ui':
        harnessUi();
        break;
    case 'harness:ui:serve':
        harnessUiServe();
        break;
    case 'harness:change-sets':
        changeSetsReport('harness');
        publishScope('harness');
        break;
    case 'harness:terminology':
        terminology('harness', args);
        publishScope('harness');
        break;
    case 'harness:standards':
        standards('harness');
        publishScope('harness');
        break;
    case 'repo:validate':
        repoValidate(args);
        break;
    default:
        usage();
        process.exit(2);
}
