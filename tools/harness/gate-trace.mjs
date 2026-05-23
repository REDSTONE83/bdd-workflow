#!/usr/bin/env node
// Layer 4 gate: state/trace.state.json 을 읽어 게이트 모드에 따라 exit code 결정.
//
// CLI:
//   --check          RED 또는 알려지지 않은 ref / 구조 위반이 있으면 실패
//   --require-blue   --check 동작 + GREEN도 실패 (BLUE만 통과)
//   --quiet          한 줄 요약을 stdout에 출력
//
// 이 도구는 state를 다시 계산하지 않는다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const stateOutFile = path.join(workspaceRoot, 'build', 'harness', 'state', 'trace.state.json');

function parseCliArgs(argv) {
    let checkMode = false;
    let requireBlue = false;
    let quiet = false;
    for (const arg of argv) {
        if (arg === '--check') checkMode = true;
        else if (arg === '--require-blue') requireBlue = true;
        else if (arg === '--quiet') quiet = true;
        else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    }
    return { checkMode, requireBlue, quiet };
}

function main() {
    const cli = parseCliArgs(process.argv.slice(2));
    if (!fs.existsSync(stateOutFile)) {
        console.error(`Missing trace state: ${stateOutFile}\nRun evaluate-trace-state first.`);
        process.exit(2);
    }
    const model = JSON.parse(fs.readFileSync(stateOutFile, 'utf8'));
    const s = model.summary;

    const hasUnknownReferences =
        s.unknownApis > 0 ||
        s.unknownTests > 0 ||
        s.unknownEntities > 0 ||
        s.unknownFrontEndSurfaces > 0;
    const hasStructureIssues = s.structureIssues > 0;
    // FE-* finding 정책: severity=error는 게이트 실패, warning은 통과(다른 layer 2 finding과 일관).
    const hasFrontEndStandardsErrors = (s.frontEndStandardsErrors ?? 0) > 0;

    let exit = 0;
    const reasons = [];
    if (cli.checkMode) {
        if (s.total === 0) { exit = 1; reasons.push('no requirements'); }
        if (s.red > 0) { exit = 1; reasons.push(`red=${s.red}`); }
        if (hasUnknownReferences) { exit = 1; reasons.push('unknown-references'); }
        if (hasStructureIssues) { exit = 1; reasons.push(`structureIssues=${s.structureIssues}`); }
        if (hasFrontEndStandardsErrors) { exit = 1; reasons.push(`feStandardsErrors=${s.frontEndStandardsErrors}`); }
    }
    if (cli.requireBlue) {
        if (s.total === 0) { exit = 1; reasons.push('no requirements'); }
        if (s.red > 0) { exit = 1; reasons.push(`red=${s.red}`); }
        if (s.green > 0) { exit = 1; reasons.push(`green=${s.green}`); }
        if (hasUnknownReferences) { exit = 1; reasons.push('unknown-references'); }
        if (hasStructureIssues) { exit = 1; reasons.push(`structureIssues=${s.structureIssues}`); }
        if (hasFrontEndStandardsErrors) { exit = 1; reasons.push(`feStandardsErrors=${s.frontEndStandardsErrors}`); }
    }

    if (cli.quiet) {
        const filterStr = model.filter ? ` filter=${model.filter.join(',')}` : '';
        const reasonStr = reasons.length > 0 ? ` reasons=${reasons.join(',')}` : '';
        console.log(`gate-trace: exit=${exit} total=${s.total} red=${s.red} green=${s.green} blue=${s.blue} structureIssues=${s.structureIssues}${filterStr}${reasonStr}`);
    }
    process.exit(exit);
}

main();
