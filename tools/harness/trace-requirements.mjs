#!/usr/bin/env node
// Orchestration wrapper: evaluate-trace-state → render-trace-report → gate-trace 를
// 직렬로 호출한다. CLI 시그니처는 옛 monolith trace-requirements와 호환된다.
//
// 흐름:
//   1) evaluate-trace-state.mjs  (state/trace.state.json 갱신)
//   2) render-trace-report.mjs   (reports/trace-report.{md,json} + 호환 평탄 경로 갱신)
//   3) gate-trace.mjs            (--check/--require-blue 인 경우 exit code 결정)
//
// 옛 monolith가 들고 있던 입력 수집/상태 계산/리포트 렌더링/게이트 판정 책임은 모두
// 세 도구로 분리되었다. 본 파일은 spawn 오케스트레이션만 담당한다.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const harnessDir = path.join(workspaceRoot, 'build', 'harness');
const statePath = path.join(harnessDir, 'state', 'trace.state.json');
const reportsDir = path.join(harnessDir, 'reports');

function parseCliArgs(argv) {
    const requirementArgs = [];
    let checkMode = false;
    let requireBlue = false;
    let quiet = false;
    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        if (arg === '--check') { checkMode = true; i += 1; continue; }
        if (arg === '--require-blue') { requireBlue = true; i += 1; continue; }
        if (arg === '--quiet') { quiet = true; i += 1; continue; }
        if (arg === '--requirement' || arg === '--requirement-file') {
            const value = argv[i + 1];
            if (!value) throw new Error(`${arg} requires a value`);
            requirementArgs.push(arg, value);
            i += 2; continue;
        }
        if (arg.startsWith('--requirement=') || arg.startsWith('--requirement-file=')) {
            requirementArgs.push(arg);
            i += 1; continue;
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
    return { requirementArgs, checkMode, requireBlue, quiet };
}

function runTool(name, args) {
    const toolPath = path.join(__dirname, name);
    const result = spawnSync('node', [toolPath, ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
    if (result.error) {
        console.error(`failed to spawn ${name}: ${result.error.message}`);
        process.exit(2);
    }
    return result.status ?? 1;
}

function runToolQuiet(name, args) {
    const toolPath = path.join(__dirname, name);
    const result = spawnSync('node', [toolPath, ...args, '--quiet'], { stdio: ['ignore', 'ignore', 'inherit'] });
    if (result.error) {
        console.error(`failed to spawn ${name}: ${result.error.message}`);
        process.exit(2);
    }
    return result.status ?? 1;
}

function currentReportMdPath() {
    if (!fs.existsSync(statePath)) return path.join(reportsDir, 'trace-report.md');
    const model = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const suffix = Array.isArray(model.filter) && model.filter.length > 0
        ? `-${model.filter.join('-')}`
        : '';
    return path.join(reportsDir, `trace-report${suffix}.md`);
}

const cli = parseCliArgs(process.argv.slice(2));
const evalArgs = [
    ...cli.requirementArgs,
    ...(cli.checkMode ? ['--check'] : []),
    ...(cli.requireBlue ? ['--require-blue'] : [])
];

// Step 1: 상태 계산
let status = runToolQuiet('evaluate-trace-state.mjs', evalArgs);
if (status !== 0) process.exit(status);

// Step 2: 리포트 렌더링. wrapper의 stdout은 옛 CLI 호환 규칙만 따른다.
status = runToolQuiet('render-trace-report.mjs', []);
if (status !== 0) process.exit(status);

// 옛 monolith의 stdout 동작 보존:
//   - quiet 가 아니면 markdown 전체를 stdout 으로 출력
//   - quiet 면 한 줄 요약만 출력
if (cli.quiet) {
    // gate-trace --quiet 한 줄만 출력한다.
} else {
    const reportMdPath = currentReportMdPath();
    if (!fs.existsSync(reportMdPath)) {
        console.error(`missing rendered trace report: ${reportMdPath}`);
        process.exit(2);
    }
    process.stdout.write(fs.readFileSync(reportMdPath, 'utf8'));
    process.stdout.write('\n');
}

// Step 3: 게이트
const gateArgs = [
    ...(cli.checkMode ? ['--check'] : []),
    ...(cli.requireBlue ? ['--require-blue'] : []),
    ...(cli.quiet ? ['--quiet'] : [])
];
status = runTool('gate-trace.mjs', gateArgs);
process.exit(status);
