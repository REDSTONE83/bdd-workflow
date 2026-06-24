#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { appRoot, backendRoot, frontEndRoot, workspaceRoot } from './workspace-config.mjs';
import { createPortContext, generateRunId } from './run-context.mjs';
import { atomicCopyFile, mirrorDirectory } from './fs-mirror.mjs';
import { FRONT_END_RESULT_FILES, manifestEntryForTest, sha256 } from './test-result-fingerprint.mjs';

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
            env.E2E_LIVE_RESULTS_FILE = path.join(outputRoot, 'test-results', 'e2e-live-results.json');
            env.E2E_LIVE_ARTIFACTS_DIR = path.join(outputRoot, 'test-results', 'live-artifacts');
            env.E2E_LIVE_HTML_REPORT_DIR = path.join(outputRoot, 'playwright-report', 'live');
        }
    }
    return env;
}

// 테스트 실패는 freshness 실패가 아니므로, FE 실행 결과 wrapper는 즉시 종료하지 않고
// manifest를 만든 뒤 실패 코드를 미뤘다가 publish 이후에 종료한다.
let deferredExitCode = 0;
function deferFailure(status) {
    if (status && !deferredExitCode) deferredExitCode = status;
}

function spawnStep(label, command, args, options = {}) {
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
    return result.status ?? 1;
}

function run(label, command, args, options = {}) {
    const status = spawnStep(label, command, args, options);
    if (status !== 0) {
        console.error(`[${label}] failed with exit ${status}`);
        process.exit(status);
    }
    return status;
}

function runNodeTool(scope, label, name, args = []) {
    run(label, process.execPath, [path.join(__dirname, name), ...args], { scope });
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
    // 결과 파일과 그 freshness manifest는 한 단위로 함께 publish한다(분리하면 false-stale).
    for (const { resultFile, manifestFile } of Object.values(FRONT_END_RESULT_FILES)) {
        if (atomicCopyFile(path.join(root, 'test-results', resultFile), path.join(testResultsDir, resultFile))) {
            published.push(`app/front-end/test-results/${resultFile}`);
        }
        if (atomicCopyFile(path.join(root, 'test-results', manifestFile), path.join(testResultsDir, manifestFile))) {
            published.push(`app/front-end/test-results/${manifestFile}`);
        }
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
        // 결과 파일과 그 manifest sidecar를 한 단위로 hydrate한다. index-test-results는
        // manifest fingerprint를 현재 FE source fingerprint와 비교해 stale을 판정한다.
        for (const { resultFile, manifestFile } of Object.values(FRONT_END_RESULT_FILES)) {
            atomicCopyFile(
                path.join(frontEndRoot, 'test-results', resultFile),
                path.join(appOutputRoot(), 'test-results', resultFile)
            );
            atomicCopyFile(
                path.join(frontEndRoot, 'test-results', manifestFile),
                path.join(appOutputRoot(), 'test-results', manifestFile)
            );
        }
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

function frontEndNpm(label, script, options = {}) {
    if (options.allowFailure) {
        return spawnStep(label, 'npm', ['run', script], { cwd: frontEndRoot, scope: 'application' });
    }
    return run(label, 'npm', ['run', script], { cwd: frontEndRoot, scope: 'application' });
}

function frontEndE2e() {
    frontEndStorybookTest();
}

// 결과 파일과 같은 실행의 FE BDD source fingerprint를 sidecar manifest로 기록한다.
// 테스트가 실패해도 결과 파일이 있으면 manifest를 만들고(최신 FAIL을 trace에 반영),
// 결과 파일조차 없으면(실행 중단) 명령을 실패시킨다.
function finalizeFrontEndManifest({ runtime, resultFile, manifestFile, status, startedAt, completedAt }) {
    const config = FRONT_END_RESULT_FILES[runtime];
    if (!fs.existsSync(resultFile)) {
        console.error(`[manifest:${runtime}] result file missing: ${rel(resultFile)} — cannot record freshness manifest`);
        process.exit(status || 1);
    }
    const sourceIndexPath = path.join(appOutputRoot(), 'indexes', 'front-end.source-index.json');
    if (!fs.existsSync(sourceIndexPath)) {
        console.error(`[manifest:${runtime}] FE source index missing: ${rel(sourceIndexPath)} — run app:front-end-source-index first`);
        process.exit(1);
    }
    let sourceTests;
    try {
        const index = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));
        sourceTests = (index.tests ?? []).filter((test) => test.runtime === runtime);
    } catch (error) {
        console.error(`[manifest:${runtime}] cannot read FE source index: ${error.message}`);
        process.exit(1);
    }
    const manifest = {
        schemaVersion: '1',
        source: 'fe-test-result-manifest',
        runtime,
        resultFile: rel(path.join(frontEndRoot, 'test-results', config.resultFile)),
        resultFileSha256: sha256(fs.readFileSync(resultFile)),
        startedAt,
        completedAt,
        exitStatus: status,
        entries: sourceTests.map(manifestEntryForTest)
    };
    fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`[manifest:${runtime}] ${rel(manifestFile)}: ${manifest.entries.length} fingerprint(s), exit=${status}`);
}

function runFrontEndResultStep({ runtime, label, script }) {
    const config = FRONT_END_RESULT_FILES[runtime];
    const testResultsDir = path.join(appOutputRoot(), 'test-results');
    const resultFile = path.join(testResultsDir, config.resultFile);
    const manifestFile = path.join(testResultsDir, config.manifestFile);
    fs.mkdirSync(testResultsDir, { recursive: true });
    // 실행 시작 전에 이 run root의 결과 파일과 manifest를 비운다.
    fs.rmSync(resultFile, { force: true });
    fs.rmSync(manifestFile, { force: true });
    const startedAt = new Date().toISOString();
    const status = frontEndNpm(label, script, { allowFailure: true });
    const completedAt = new Date().toISOString();
    finalizeFrontEndManifest({ runtime, resultFile, manifestFile, status, startedAt, completedAt });
    deferFailure(status);
}

function frontEndLiveE2e() {
    runFrontEndResultStep({ runtime: 'playwright', label: 'front-end:e2e:live', script: 'e2e:live' });
}

function frontEndStorybookTest() {
    runFrontEndResultStep({ runtime: 'storybook-vitest', label: 'front-end:test-storybook', script: 'test:storybook' });
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

function harnessUiUnitTest() {
    harnessUiNpm('harness:ui:test', 'test');
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
    // manifest fingerprint는 실행 시점 source metadata가 필요하므로 단독 경로도 먼저 인덱싱한다.
    frontEndSourceIndex();
    frontEndE2e();
}

function appLiveE2e() {
    frontEndSourceIndex();
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
    harnessUiUnitTest();
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
    harnessUiUnitTest();
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

// FE 실행 결과 wrapper가 미뤄 둔 테스트 실패는 결과/manifest publish 이후에 종료시킨다.
if (deferredExitCode) {
    process.exit(deferredExitCode);
}
