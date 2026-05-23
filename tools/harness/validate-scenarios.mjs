#!/usr/bin/env node
// Layer 2 validator: SCN-* findings.
// scenarios.index.json의 issues[]를 SCN-* finding으로 정규화한다.
//
// 입력: build/harness/indexes/scenarios.index.json
// 출력: build/harness/findings/scenarios.findings.json
//
// 룰 ID (모두 severity=error):
//   SCN-DIALECT-FORBIDDEN        '# language:' dialect 지시자 사용 금지
//   SCN-FEATURE-HEADER-MISSING   .feature 파일에 Feature 헤더가 없음
//   SCN-REQ-TAG-MISSING          Feature에 @REQ-XXX 태그가 없음
//   SCN-UNSUPPORTED-KEYWORD      Background / Scenario Outline 등 미지원 키워드 사용
//   SCN-STRAY-LINE               Feature 헤더 전 알 수 없는 줄
//   SCN-COVERS-OUTSIDE-SCENARIO  Covers: 가 Scenario 밖
//   SCN-STEP-OUTSIDE-SCENARIO    step이 Scenario 밖
//
// 정책:
//   각 finding의 `requirements`는 해당 feature의 @REQ-XXX 태그를 그대로 옮긴다.
//   태그 자체가 없는 finding(SCN-REQ-TAG-MISSING)이나 헤더가 없는 finding은
//   `requirements: []`로 전역 finding이 된다. 전체 게이트(validateHarness)는
//   모두 차단하고, 단일 카드 게이트는 evaluate-trace-state의 FE-* 정책과 동일하게
//   카드에 귀속된 finding만 차단한다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const DEFAULTS = {
    scenariosIndex: path.join(repoRoot, 'build', 'harness', 'indexes', 'scenarios.index.json'),
    out: path.join(repoRoot, 'build', 'harness', 'findings', 'scenarios.findings.json')
};

function parseCliArgs(argv) {
    const cfg = { ...DEFAULTS };
    for (const arg of argv) {
        if (arg.startsWith('--scenarios-index=')) cfg.scenariosIndex = path.resolve(arg.slice('--scenarios-index='.length));
        else if (arg.startsWith('--out=')) cfg.out = path.resolve(arg.slice('--out='.length));
        else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    }
    return cfg;
}

const REMEDIATION = 'docs/harness/requirement-authoring.md';
const KNOWN_KINDS = new Set([
    'SCN-DIALECT-FORBIDDEN',
    'SCN-FEATURE-HEADER-MISSING',
    'SCN-REQ-TAG-MISSING',
    'SCN-UNSUPPORTED-KEYWORD',
    'SCN-STRAY-LINE',
    'SCN-COVERS-OUTSIDE-SCENARIO',
    'SCN-STEP-OUTSIDE-SCENARIO'
]);

function buildSummary(findings) {
    const summary = { error: 0, warning: 0, info: 0, byRuleId: {} };
    for (const f of findings) {
        summary[f.severity] = (summary[f.severity] ?? 0) + 1;
        summary.byRuleId[f.ruleId] = (summary.byRuleId[f.ruleId] ?? 0) + 1;
    }
    return summary;
}

function findingFromIssue(issue, feature) {
    const kind = issue.kind ?? '';
    const ruleId = KNOWN_KINDS.has(kind) ? kind : 'SCN-STRAY-LINE';
    const file = feature?.file ?? '';
    return {
        ruleId,
        severity: 'error',
        strictSeverity: 'error',
        kind: 'static',
        message: issue.message ?? `(no message; kind=${kind || 'unknown'})`,
        requirements: feature?.requirementIds ?? [],
        location: {
            file,
            line: issue.line ?? 0,
            identity: `${file}:${issue.line ?? 0}`
        },
        evidence: {
            sourceIssueKind: kind || null,
            featureTitle: feature?.title ?? null
        },
        remediation: REMEDIATION
    };
}

function findingFromGlobalIssue(issue) {
    const kind = issue.kind ?? '';
    const ruleId = KNOWN_KINDS.has(kind) ? kind : 'SCN-STRAY-LINE';
    return {
        ruleId,
        severity: 'error',
        strictSeverity: 'error',
        kind: 'static',
        message: issue.message ?? `(no message; kind=${kind || 'unknown'})`,
        requirements: [],
        location: {
            file: '',
            line: issue.line ?? 0,
            identity: '(global)'
        },
        evidence: {
            sourceIssueKind: kind || null
        },
        remediation: REMEDIATION
    };
}

function writePayload(findings, outPath) {
    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        owner: 'scenarios',
        summary: buildSummary(findings),
        findings
    };
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
    return payload;
}

function main(argv) {
    const cfg = parseCliArgs(argv);

    if (!fs.existsSync(cfg.scenariosIndex)) {
        writePayload([], cfg.out);
        console.log('scenarios.findings.json: 0 finding(s) (scenarios index missing)');
        return;
    }

    const index = JSON.parse(fs.readFileSync(cfg.scenariosIndex, 'utf8'));
    const findings = [];
    for (const issue of index.issues ?? []) findings.push(findingFromGlobalIssue(issue));
    for (const feature of index.features ?? []) {
        for (const issue of feature.issues ?? []) findings.push(findingFromIssue(issue, feature));
    }

    const payload = writePayload(findings, cfg.out);
    const byRule = Object.entries(payload.summary.byRuleId).map(([k, v]) => `${k}=${v}`).join(', ') || 'none';
    console.log(`scenarios.findings.json: ${findings.length} finding(s) (error=${payload.summary.error}, warning=${payload.summary.warning}) [${byRule}]`);
}

main(process.argv.slice(2));
