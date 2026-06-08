#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { appRoot, backendRoot, frontEndRoot, outputRootFor, workspaceRoot } from './workspace-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gradleWrapper = path.join(backendRoot, 'gradlew');
const harnessRoot = path.join(workspaceRoot, 'harness');
const appOutputRoot = outputRootFor('application');
const harnessOutputRoot = outputRootFor('harness');

function rel(file) {
    return path.relative(workspaceRoot, file).replace(/\\/g, '/');
}

function envFor(scope) {
    const outputRoot = scope === 'harness' ? harnessOutputRoot : appOutputRoot;
    const docsRoot = path.join(workspaceRoot, scope === 'harness' ? 'harness' : 'app', 'docs');
    return {
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
}

function run(label, command, args, options = {}) {
    const cwd = options.cwd ?? workspaceRoot;
    const scope = options.scope ?? 'application';
    console.log(`\n[${label}] ${[rel(command), ...args].join(' ')}`);
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: envFor(scope)
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

function runBackEndGradle(label, ...tasks) {
    run(label, gradleWrapper, ['-p', backendRoot, ...tasks], { scope: 'application' });
}

function runHarnessGradle(label, ...tasks) {
    run(label, gradleWrapper, ['-p', harnessRoot, ...tasks], { scope: 'harness' });
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
    const indexesDir = path.join(appOutputRoot, 'indexes');
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
        `--out=${path.join(appOutputRoot, 'indexes', 'front-end.source-index.json')}`
    ], { scope: 'application' });
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
    const indexesDir = path.join(harnessOutputRoot, 'indexes');
    for (const stale of ['backend.source-index.json', 'front-end.source-index.json', 'openapi.index.json']) {
        fs.rmSync(path.join(indexesDir, stale), { force: true });
    }
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
    frontEndNpm('front-end:e2e', 'e2e');
}

function frontEndLiveE2e() {
    frontEndNpm('front-end:e2e:live', 'e2e:live');
}

function frontEndBuildStorybook() {
    frontEndNpm('front-end:build-storybook', 'build-storybook');
}

function selfTest() {
    const files = selfTestFiles();
    if (files.length === 0) {
        console.log('[harness:self-test] no Node/TypeScript self-test files');
        return;
    }
    const resultDir = path.join(harnessOutputRoot, 'test-results', 'nodeSelfTest');
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
    indexTestResults('application');
    emitFindingsAndReports('application');
    runNodeTool('application', 'app:trace', 'trace-requirements.mjs', args);
}

function appValidate(args) {
    collectAppStaticInputs();
    frontEndBuildStorybook();
    backEndTest();
    frontEndE2e();
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
    indexTestResults('harness');
    emitFindingsAndReports('harness');
    runNodeTool('harness', 'harness:trace', 'trace-requirements.mjs', args);
}

function harnessValidate(args) {
    toolTest();
    collectHarnessStaticInputs();
    selfTest();
    indexTestResults('harness');
    emitFindingsAndReports('harness');
    runNodeTool('harness', 'harness:validate', 'trace-requirements.mjs', ['--check', ...args]);
}

function harnessTest() {
    toolTest();
    collectHarnessStaticInputs();
    selfTest();
}

function repoValidate(args) {
    appValidate(args);
    harnessValidate(args);
}

function usage() {
    console.error(`Usage: node harness/tools/run.mjs <command> [args]

Commands:
  app:validate [trace args...]       Run application tests, application indexes, validators, and app gate.
  app:trace [trace args...]          Refresh application indexes/findings/reports and render app trace.
  app:test                           Run application back-end JUnit tests.
  app:e2e                            Run application front-end mock Playwright E2E tests.
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
switch (command) {
    case 'app:validate':
        appValidate(args);
        break;
    case 'app:trace':
        appTrace(args);
        break;
    case 'app:test':
        appTest();
        break;
    case 'app:e2e':
        appE2e();
        break;
    case 'app:e2e:live':
        appLiveE2e();
        break;
    case 'app:source-index':
        sourceIndex();
        break;
    case 'app:front-end-source-index':
        frontEndSourceIndex();
        break;
    case 'app:scenario-index':
        scenarioIndex('application');
        break;
    case 'app:openapi-index':
        openApiIndex();
        break;
    case 'app:change-sets':
        changeSetsReport('application');
        break;
    case 'app:terminology':
        terminology('application', args);
        break;
    case 'app:standards':
        standards('application');
        break;
    case 'harness:validate':
        harnessValidate(args);
        break;
    case 'harness:trace':
        harnessTrace(args);
        break;
    case 'harness:test':
        harnessTest();
        break;
    case 'harness:tool-test':
        toolTest();
        break;
    case 'harness:self-test':
        collectHarnessStaticInputs();
        selfTest();
        break;
    case 'harness:self-test-index':
        harnessSelfTestIndex();
        break;
    case 'harness:change-sets':
        changeSetsReport('harness');
        break;
    case 'harness:terminology':
        terminology('harness', args);
        break;
    case 'harness:standards':
        standards('harness');
        break;
    case 'repo:validate':
        repoValidate(args);
        break;
    default:
        usage();
        process.exit(2);
}
