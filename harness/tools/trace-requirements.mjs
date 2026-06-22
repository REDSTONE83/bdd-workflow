#!/usr/bin/env node
// Orchestration wrapper: evaluate-trace-state → render-trace-report → gate 를
// 직렬로 호출한다. CLI 시그니처는 옛 monolith trace-requirements와 호환된다.
//
// 흐름:
//   1) evaluate-trace-state.mjs  (state/trace.state.json 갱신)
//   2) render-requirement-schema-report.mjs / render-change-set-report.mjs
//   3) render-trace-report.mjs   (reports/trace-report.{md,json} + 호환 평탄 경로 갱신)
//   4) gate.mjs                  (--check/--require-blue 인 경우 exit code 결정. REQ-010)
//
// 옛 monolith가 들고 있던 입력 수집/상태 계산/리포트 렌더링/게이트 판정 책임은 모두
// 세 도구로 분리되었다. 본 파일은 spawn 오케스트레이션만 담당한다.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { outputRootFor } from './workspace-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const harnessDir = outputRootFor();
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

function runTool(name, args, env) {
    const toolPath = path.join(__dirname, name);
    const result = spawnSync('node', [toolPath, ...args], { stdio: ['ignore', 'inherit', 'inherit'], env: env ?? process.env });
    if (result.error) {
        console.error(`failed to spawn ${name}: ${result.error.message}`);
        process.exit(2);
    }
    return result.status ?? 1;
}

function runToolQuiet(name, args, env) {
    const toolPath = path.join(__dirname, name);
    const result = spawnSync('node', [toolPath, ...args, '--quiet'], { stdio: ['ignore', 'ignore', 'inherit'], env: env ?? process.env });
    if (result.error) {
        console.error(`failed to spawn ${name}: ${result.error.message}`);
        process.exit(2);
    }
    return result.status ?? 1;
}

function currentReportMdPath(stateFileToRead) {
    if (!fs.existsSync(stateFileToRead)) return path.join(reportsDir, 'trace-report.md');
    const model = JSON.parse(fs.readFileSync(stateFileToRead, 'utf8'));
    const suffix = Array.isArray(model.filter) && model.filter.length > 0
        ? `-${model.filter.join('-')}`
        : '';
    return path.join(reportsDir, `trace-report${suffix}.md`);
}

const cli = parseCliArgs(process.argv.slice(2));

// 슬라이스(--requirement) 실행은 canonical trace.state.json 을 덮지 않도록 격리 state 파일에 쓰고,
// evaluate/render/gate 가 HARNESS_TRACE_STATE_FILE 로 그 파일을 공유한다. 전체 trace 는 canonical 을 쓴다.
const isSlice = cli.requirementArgs.length > 0;
const sliceStateFile = path.join(harnessDir, 'state', 'trace.state.slice.json');
const childEnv = isSlice ? { ...process.env, HARNESS_TRACE_STATE_FILE: sliceStateFile } : process.env;
const reportStateFile = isSlice ? sliceStateFile : statePath;

const evalArgs = [
    ...cli.requirementArgs,
    ...(cli.checkMode ? ['--check'] : []),
    ...(cli.requireBlue ? ['--require-blue'] : [])
];

// Step 1: 상태 계산
let status = runToolQuiet('evaluate-trace-state.mjs', evalArgs, childEnv);
if (status !== 0) process.exit(status);

// Step 2: 보조 리포트 렌더링. trace summary가 최신 Change Set warnings를 노출할 수 있게
// Change Set report를 trace report보다 먼저 갱신한다.
status = runToolQuiet('render-requirement-schema-report.mjs', [], childEnv);
if (status !== 0) process.exit(status);
status = runToolQuiet('render-change-set-report.mjs', [], childEnv);
if (status !== 0) process.exit(status);
status = runToolQuiet('render-trace-report.mjs', [], childEnv);
if (status !== 0) process.exit(status);

// 옛 monolith의 stdout 동작 보존:
//   - quiet 가 아니면 markdown 전체를 stdout 으로 출력
//   - quiet 면 한 줄 요약만 출력
if (cli.quiet) {
    // gate.mjs --quiet 한 줄만 출력한다.
} else {
    const reportMdPath = currentReportMdPath(reportStateFile);
    if (!fs.existsSync(reportMdPath)) {
        console.error(`missing rendered trace report: ${reportMdPath}`);
        process.exit(2);
    }
    process.stdout.write(fs.readFileSync(reportMdPath, 'utf8'));
    process.stdout.write('\n');
}

// Step 3: 게이트 (REQ-010: 통합 단일 판정기 gate.mjs)
const gateArgs = [
    ...cli.requirementArgs,
    ...(cli.checkMode ? ['--check'] : []),
    ...(cli.requireBlue ? ['--require-blue'] : []),
    ...(cli.quiet ? ['--quiet'] : [])
];
status = runTool('gate.mjs', gateArgs, childEnv);
process.exit(status);
