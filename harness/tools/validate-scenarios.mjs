#!/usr/bin/env node
// Layer 2 validator: SCN-* findings.
// scenarios.index.json의 issues[]를 SCN-* finding으로 정규화한다.
//
// 입력: build/{app|harness}/indexes/scenarios.index.json
// 출력: build/{app|harness}/findings/scenarios.findings.json
//
// 룰 ID (구조 위반, severity=error):
//   SCN-DIALECT-FORBIDDEN        '# language:' dialect 지시자 사용 금지
//   SCN-FEATURE-HEADER-MISSING   .feature 파일에 Feature 헤더가 없음
//   SCN-REQ-TAG-MISSING          Feature에 @REQ-XXX 태그가 없음
//   SCN-UNSUPPORTED-KEYWORD      Background / Scenario Outline 등 미지원 키워드 사용
//   SCN-STRAY-LINE               Feature 헤더 전 알 수 없는 줄
//   SCN-COVERS-OUTSIDE-SCENARIO  Covers: 가 Scenario 밖
//   SCN-STEP-OUTSIDE-SCENARIO    step이 Scenario 밖
//
// 룰 ID (관찰 언어 권고, severity=warning, 게이트 비차단):
//   SCN-STEP-IMPL-VOCAB          Given/When/Then step에 사용자가 관찰할 수 없는 전송/구현 어휘.
//                                현재는 오탐을 막기 위해 "요청이 전송 / 전송되지 않" 같은
//                                요청 전송 단정만 본다. 네트워크 미전송은 시나리오가 아니라
//                                Playwright assertion에 둔다.
//
// 정책:
//   각 finding의 `requirements`는 해당 feature의 @REQ-XXX 태그를 그대로 옮긴다.
//   태그 자체가 없는 finding(SCN-REQ-TAG-MISSING)이나 헤더가 없는 finding은
//   `requirements: []`로 전역 finding이 된다. scope 전체 게이트는
//   모두 차단하고, 단일 카드 게이트는 evaluate-trace-state의 FE-* 정책과 동일하게
//   카드에 귀속된 finding만 차단한다.

import fs from 'node:fs';
import path from 'node:path';
import { outputRootFor, workspaceRoot } from './workspace-config.mjs';

const repoRoot = workspaceRoot;
const outputRoot = outputRootFor();
const DEFAULTS = {
    scenariosIndex: path.join(outputRoot, 'indexes', 'scenarios.index.json'),
    out: path.join(outputRoot, 'findings', 'scenarios.findings.json')
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

const REMEDIATION = 'harness/docs/requirement-authoring.md';
const KNOWN_KINDS = new Set([
    'SCN-DIALECT-FORBIDDEN',
    'SCN-FEATURE-HEADER-MISSING',
    'SCN-REQ-TAG-MISSING',
    'SCN-UNSUPPORTED-KEYWORD',
    'SCN-STRAY-LINE',
    'SCN-COVERS-OUTSIDE-SCENARIO',
    'SCN-STEP-OUTSIDE-SCENARIO'
]);

// SCN-STEP-IMPL-VOCAB: step 본문의 전송/구현 어휘 탐지 (경고).
// 오탐을 막기 위해 현재는 "요청 전송 단정"만 본다 — 사용자는 요청이 전송됐는지 자체를 관찰할 수 없다.
// (`API 호출자`(행위자), `엔드포인트`(계약 카드), `응답을 반환`(서버 동작 When)처럼
//  문맥에 따라 정당한 표현까지 잡지 않도록 패턴을 의도적으로 좁게 둔다.)
const STEP_IMPL_VOCAB_PATTERNS = [
    {
        re: /요청[이을]\s*전송|전송되지\s*않|전송하지\s*않|네트워크\s*요청/,
        hint: '요청 전송 여부는 사용자가 직접 관찰할 수 없다. "저장되지 않고 같은 화면에 머문다"처럼 관찰 가능한 결과로 바꾸고, 네트워크 미전송 단정은 Playwright assertion에 둔다.'
    }
];

function stepImplVocabFindings(index) {
    const out = [];
    for (const feature of index.features ?? []) {
        for (const scenario of feature.scenarios ?? []) {
            for (const step of scenario.steps ?? []) {
                const text = step.text ?? '';
                const hit = STEP_IMPL_VOCAB_PATTERNS.find((p) => p.re.test(text));
                if (!hit) continue;
                const file = feature.file ?? '';
                out.push({
                    ruleId: 'SCN-STEP-IMPL-VOCAB',
                    severity: 'warning',
                    strictSeverity: 'warning',
                    kind: 'static',
                    message: `시나리오 step이 사용자 관찰 언어가 아님: "${step.keyword} ${text}" — ${hit.hint}`,
                    requirements: feature.requirementIds ?? [],
                    location: { file, line: step.line ?? 0, identity: `${file}:${step.line ?? 0}` },
                    evidence: { keyword: step.keyword, text },
                    remediation: REMEDIATION
                });
            }
        }
    }
    return out;
}

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
    findings.push(...stepImplVocabFindings(index));

    const payload = writePayload(findings, cfg.out);
    const byRule = Object.entries(payload.summary.byRuleId).map(([k, v]) => `${k}=${v}`).join(', ') || 'none';
    console.log(`scenarios.findings.json: ${findings.length} finding(s) (error=${payload.summary.error}, warning=${payload.summary.warning}) [${byRule}]`);
}

main(process.argv.slice(2));
