#!/usr/bin/env node
// Layer 2 validator: FE-* findings.
// 첫 단계에서는 front-end source index의 issues[]를 FE-* finding으로 정규화한다.
// 신규 룰은 후속 step에서 같은 finding 모양으로 추가한다.
//
// 입력: build/harness/indexes/front-end.source-index.json
// 출력: build/harness/findings/front-end-standards.findings.json
//
// 룰 ID:
//   FE-TEST-DYN              Playwright BDD annotation이 literal {type,description} 형태가 아님
//   FE-TEST-COVERS-NO-REQ    Covers 메타데이터는 있으나 Requirement 메타데이터 없음
//   FE-TEST-REQ-NO-COVERS    Requirement 메타데이터는 있으나 Covers 메타데이터 없음
//   FE-STORY-MISSING-STATE   공통 UI primitive의 stories 파일에 표준 정의 필수 상태가 누락
//   FE-API-CONTRACT-MISSING  OpenAPI 계약 산출물 부재
//   FE-API-UNKNOWN-OPERATION FE actual API 호출이 OpenAPI 계약의 method+path에 없음
//   FE-API-USAGE-UNKNOWN-OPERATION FE @UsesApi 선언이 OpenAPI 계약의 method+path에 없음
//   FE-API-DECLARED-NOT-CALLED @UsesApi 선언을 뒷받침하는 정적 API 호출이 없음
//   FE-API-CALL-NOT-DECLARED 정적 API 호출을 설명하는 @UsesApi 선언이 없음
//   FE-API-CALL-DYNAMIC      정적 대조가 불가능한 동적 API path 호출
//   FE-API-USAGE-INVALID     @UsesApi 선언 형식이 표준과 다름
//   FE-API-USAGE-NO-REQ      @UsesApi 선언 파일에 @Requirement가 없음
//   FE-API-CLIENT-NO-METADATA FE generated client의 OpenAPI SHA-256 메타파일 부재
//   FE-API-CLIENT-STALE      FE generated client의 OpenAPI SHA-256 메타파일이 현재 계약과 불일치
//   FE-API-DIRECT-FETCH      FE src/api/** 밖 애플리케이션 소스의 직접 fetch 호출
//   FE-INDEX-UNKNOWN         source index가 보고한 분류 불가 issue (안전망)
//
// 정책:
//   필수 상태 검사는 해당 컴포넌트의 *.stories.tsx 파일이 존재할 때만 적용한다.
//   아직 만들어지지 않은 컴포넌트의 스토리를 미리 강제하지 않는다.
//   필수 상태 목록은 docs/standards/front-end-ui.md "필수 상태" 절을 따른다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const DEFAULTS = {
    feSourceIndex: path.join(repoRoot, 'build', 'harness', 'indexes', 'front-end.source-index.json'),
    openApiIndex: path.join(repoRoot, 'build', 'harness', 'indexes', 'openapi.index.json'),
    generatedMeta: path.join(repoRoot, 'front-end', 'src', 'api', 'generated', '.openapi-source.sha256'),
    out: path.join(repoRoot, 'build', 'harness', 'findings', 'front-end-standards.findings.json')
};

// 테스트 가능하도록 4개 경로를 CLI 인자로 덮어쓸 수 있게 한다. 기본값은 production 경로.
function parseCliArgs(argv) {
    const cfg = { ...DEFAULTS };
    for (const arg of argv) {
        if (arg.startsWith('--fe-source-index=')) cfg.feSourceIndex = path.resolve(arg.slice('--fe-source-index='.length));
        else if (arg.startsWith('--openapi-index=')) cfg.openApiIndex = path.resolve(arg.slice('--openapi-index='.length));
        else if (arg.startsWith('--generated-meta=')) cfg.generatedMeta = path.resolve(arg.slice('--generated-meta='.length));
        else if (arg.startsWith('--out=')) cfg.out = path.resolve(arg.slice('--out='.length));
        else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    }
    return cfg;
}

const REMEDIATION_TESTING = 'docs/standards/front-end-testing.md';
const REMEDIATION_UI = 'docs/standards/front-end-ui.md';
const REMEDIATION_API = 'docs/standards/front-end-api-contract.md';

// REQ-008: FE API 계약 drift는 validateHarness에서 차단한다.
const FE_API_CONTRACT_MISSING_SEVERITY = 'error';
const FE_API_UNKNOWN_OPERATION_SEVERITY = 'error';
const FE_API_USAGE_UNKNOWN_OPERATION_SEVERITY = 'error';
const FE_API_DECLARED_NOT_CALLED_SEVERITY = 'error';
const FE_API_CALL_NOT_DECLARED_SEVERITY = 'error';
const FE_API_CLIENT_NO_METADATA_SEVERITY = 'error';
const FE_API_CLIENT_STALE_SEVERITY = 'error';
// FE generated client가 base OpenAPI hash를 기록해 두는 파일 경로(표시용).
const FE_GENERATED_HASH_RELATIVE = 'front-end/src/api/generated/.openapi-source.sha256';

const ISSUE_TO_RULE = {
    DYNAMIC_TEST_ANNOTATION:  { ruleId: 'FE-TEST-DYN',           remediation: REMEDIATION_TESTING },
    COVERS_WITHOUT_REQUIREMENT: { ruleId: 'FE-TEST-COVERS-NO-REQ', remediation: REMEDIATION_TESTING },
    REQUIREMENT_WITHOUT_COVERS: { ruleId: 'FE-TEST-REQ-NO-COVERS', remediation: REMEDIATION_TESTING },
    DIRECT_FETCH_OUTSIDE_API: { ruleId: 'FE-API-DIRECT-FETCH', remediation: REMEDIATION_API },
    INVALID_USES_API: { ruleId: 'FE-API-USAGE-INVALID', remediation: REMEDIATION_API },
    USES_API_WITHOUT_REQUIREMENT: { ruleId: 'FE-API-USAGE-NO-REQ', remediation: REMEDIATION_API },
    DYNAMIC_API_CALL: { ruleId: 'FE-API-CALL-DYNAMIC', remediation: REMEDIATION_API }
};

// 컴포넌트별 필수 stories 상태. 표준은 docs/standards/front-end-ui.md "필수 상태" 절.
// stories 파일이 존재할 때만 검사한다(스캐폴드 강제 금지).
const REQUIRED_STORY_STATES = {
    Button: ['Default', 'Disabled', 'Loading']
};

function readJson(p) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function buildSummary(findings) {
    const summary = { error: 0, warning: 0, info: 0, byRuleId: {} };
    for (const f of findings) {
        summary[f.severity] = (summary[f.severity] ?? 0) + 1;
        summary.byRuleId[f.ruleId] = (summary.byRuleId[f.ruleId] ?? 0) + 1;
    }
    return summary;
}

function normalizeSeverity(rawSeverity) {
    if (rawSeverity === 'error' || rawSeverity === 'warning' || rawSeverity === 'info') {
        return rawSeverity;
    }
    return 'warning';
}

function findingFromIssue(issue) {
    const mapping = ISSUE_TO_RULE[issue.kind];
    const ruleId = mapping?.ruleId ?? 'FE-INDEX-UNKNOWN';
    const severity = normalizeSeverity(issue.severity);
    return {
        ruleId,
        severity,
        strictSeverity: severity,
        kind: 'static',
        message: issue.message ?? `(no message; kind=${issue.kind})`,
        requirements: issue.requirements ?? [],
        location: {
            file: issue.location?.file ?? '',
            line: issue.location?.line ?? 0,
            identity: issue.location?.identity ?? ''
        },
        evidence: {
            sourceIndexKind: issue.kind ?? null,
            ...(issue.evidence ?? {})
        },
        remediation: mapping?.remediation ?? REMEDIATION_TESTING
    };
}

function findingsForMissingStoryStates(stories) {
    // 컴포넌트별 stories 파일 그룹: { componentName: { file, line, stories: Set<storyName>, requirements } }
    const byComponent = new Map();
    for (const story of stories) {
        const component = story.component;
        if (!component) continue;
        const required = REQUIRED_STORY_STATES[component];
        if (!required) continue;
        if (!byComponent.has(component)) {
            byComponent.set(component, {
                file: story.file ?? '',
                line: story.line ?? 0,
                stories: new Set(),
                requirements: new Set(story.requirements ?? [])
            });
        }
        const bucket = byComponent.get(component);
        bucket.stories.add(story.story);
        for (const req of story.requirements ?? []) bucket.requirements.add(req);
    }

    const findings = [];
    for (const [component, bucket] of byComponent.entries()) {
        const required = REQUIRED_STORY_STATES[component] ?? [];
        const missing = required.filter((name) => !bucket.stories.has(name));
        if (missing.length === 0) continue;
        findings.push({
            ruleId: 'FE-STORY-MISSING-STATE',
            severity: 'error',
            strictSeverity: 'error',
            kind: 'static',
            message: `Storybook story ${component}: 필수 상태 누락 — ${missing.join(', ')}`,
            requirements: [...bucket.requirements],
            location: {
                file: bucket.file,
                line: bucket.line,
                identity: component
            },
            evidence: {
                component,
                required,
                present: [...bucket.stories],
                missing
            },
            remediation: REMEDIATION_UI
        });
    }
    return findings;
}

// --- FE-API-* 룰 ---
// 인덱스 입력 유무에 따라 다음을 본다.
//   - openapi.index.json 부재         → FE-API-CONTRACT-MISSING (전역 finding)
//   - apiCalls의 (method, path)가 OpenAPI entries에 없음 → FE-API-UNKNOWN-OPERATION
//   - apiUsages(@UsesApi)의 (method, path)가 OpenAPI entries에 없음 → FE-API-USAGE-UNKNOWN-OPERATION
//   - @UsesApi 선언과 실제 API 호출의 요건 단위 집합 불일치 → FE-API-DECLARED-NOT-CALLED / FE-API-CALL-NOT-DECLARED
//   - FE generated 디렉터리의 OpenAPI hash 메타파일 부재 → FE-API-CLIENT-NO-METADATA
//   - FE generated 디렉터리의 OpenAPI hash 메타파일과 인덱스 SHA-256 불일치 → FE-API-CLIENT-STALE
//   - src/api/** 밖 직접 fetch 호출은 source index issue를 FE-API-DIRECT-FETCH로 정규화한다.
// 실제 path 정규화(템플릿 변수 ↔ {param})는 후속 step에서 정확도를 보강한다.

function readOpenApiIndex(openApiIndexPath) {
    if (!fs.existsSync(openApiIndexPath)) return null;
    try {
        return readJson(openApiIndexPath);
    } catch {
        return null;
    }
}

function readGeneratedHashMetaSha(generatedMetaPath) {
    if (!fs.existsSync(generatedMetaPath)) return null;
    try {
        return fs.readFileSync(generatedMetaPath, 'utf8').trim();
    } catch {
        return null;
    }
}

function findingForContractMissing(openApiIndexPath) {
    const relIndex = path.relative(repoRoot, openApiIndexPath).replace(/\\/g, '/');
    return {
        ruleId: 'FE-API-CONTRACT-MISSING',
        severity: FE_API_CONTRACT_MISSING_SEVERITY,
        strictSeverity: FE_API_CONTRACT_MISSING_SEVERITY,
        kind: 'static',
        message: `OpenAPI 계약 산출물(${relIndex})이 없어 FE API 룰 검사를 수행하지 못함`,
        requirements: [],
        location: { file: relIndex, line: 0, identity: '(global)' },
        evidence: { missingIndex: 'openapi.index.json' },
        remediation: REMEDIATION_API
    };
}

function findingForClientNoMetadata(generatedMetaPath) {
    const relMeta = path.relative(repoRoot, generatedMetaPath).replace(/\\/g, '/');
    return {
        ruleId: 'FE-API-CLIENT-NO-METADATA',
        severity: FE_API_CLIENT_NO_METADATA_SEVERITY,
        strictSeverity: FE_API_CLIENT_NO_METADATA_SEVERITY,
        kind: 'static',
        message: `FE generated 클라이언트 OpenAPI SHA-256 메타파일(${relMeta})이 없음`,
        requirements: [],
        location: { file: relMeta, line: 0, identity: '(generated-client)' },
        evidence: { missingMeta: relMeta },
        remediation: REMEDIATION_API
    };
}

function findingsForUnknownOperations(apiCalls, contract) {
    const known = openApiOperationSet(contract);
    const findings = [];
    for (const call of apiCalls ?? []) {
        const key = operationKey(call);
        if (known.has(key)) continue;
        findings.push({
            ruleId: 'FE-API-UNKNOWN-OPERATION',
            severity: FE_API_UNKNOWN_OPERATION_SEVERITY,
            strictSeverity: FE_API_UNKNOWN_OPERATION_SEVERITY,
            kind: 'static',
            message: `FE가 호출하는 ${call.method} ${call.path} 가 OpenAPI 계약에 없음`,
            requirements: call.requirements ?? [],
            location: {
                file: call.file ?? '',
                line: call.line ?? 0,
                identity: key
            },
            evidence: { method: call.method, path: call.path, callee: call.callee ?? null },
            remediation: REMEDIATION_API
        });
    }
    return findings;
}

function openApiOperationSet(contract) {
    const known = new Set();
    for (const entry of contract.entries ?? []) {
        if (entry.kind !== 'api-operation') continue;
        const method = (entry.method ?? '').toUpperCase();
        const opPath = entry.path ?? '';
        if (method && opPath) known.add(`${method} ${opPath}`);
    }
    return known;
}

function operationKey(entry) {
    return `${(entry.method ?? '').toUpperCase()} ${entry.path ?? ''}`;
}

function pushByRequirement(map, entry) {
    const key = operationKey(entry);
    const requirements = entry.requirements ?? [];
    for (const req of requirements) {
        if (!map.has(req)) map.set(req, new Map());
        const byKey = map.get(req);
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key).push(entry);
    }
}

function entriesByRequirement(entries) {
    const byRequirement = new Map();
    const unscoped = new Map();
    const anyRequirement = new Map();
    for (const entry of entries ?? []) {
        const key = operationKey(entry);
        if (!anyRequirement.has(key)) anyRequirement.set(key, []);
        anyRequirement.get(key).push(entry);
        if ((entry.requirements ?? []).length === 0) {
            if (!unscoped.has(key)) unscoped.set(key, []);
            unscoped.get(key).push(entry);
        }
        pushByRequirement(byRequirement, entry);
    }
    return { byRequirement, unscoped, anyRequirement };
}

function hasOperationForRequirements(grouped, entry) {
    const key = operationKey(entry);
    const requirements = entry.requirements ?? [];
    if (requirements.length === 0) {
        return grouped.anyRequirement.has(key);
    }
    return requirements.some((req) => grouped.byRequirement.get(req)?.has(key)) || grouped.unscoped.has(key);
}

function findingsForUnknownDeclaredApiUsages(apiUsages, contract) {
    const known = openApiOperationSet(contract);
    const findings = [];
    for (const usage of apiUsages ?? []) {
        const key = operationKey(usage);
        if (known.has(key)) continue;
        findings.push({
            ruleId: 'FE-API-USAGE-UNKNOWN-OPERATION',
            severity: FE_API_USAGE_UNKNOWN_OPERATION_SEVERITY,
            strictSeverity: FE_API_USAGE_UNKNOWN_OPERATION_SEVERITY,
            kind: 'static',
            message: `FE @UsesApi ${usage.method} ${usage.path} 가 OpenAPI 계약에 없음`,
            requirements: usage.requirements ?? [],
            location: {
                file: usage.file ?? '',
                line: usage.line ?? 0,
                identity: key
            },
            evidence: {
                method: usage.method,
                path: usage.path,
                route: usage.route ?? null,
                page: usage.page ?? null,
                trigger: usage.trigger ?? null
            },
            remediation: REMEDIATION_API
        });
    }
    return findings;
}

function findingsForDeclaredButNotCalled(apiUsages, apiCalls) {
    const actual = entriesByRequirement(apiCalls ?? []);
    const findings = [];
    for (const usage of apiUsages ?? []) {
        if (hasOperationForRequirements(actual, usage)) continue;
        const key = operationKey(usage);
        findings.push({
            ruleId: 'FE-API-DECLARED-NOT-CALLED',
            severity: FE_API_DECLARED_NOT_CALLED_SEVERITY,
            strictSeverity: FE_API_DECLARED_NOT_CALLED_SEVERITY,
            kind: 'static',
            message: `FE @UsesApi ${usage.method} ${usage.path} 선언을 뒷받침하는 정적 API 호출이 없음`,
            requirements: usage.requirements ?? [],
            location: {
                file: usage.file ?? '',
                line: usage.line ?? 0,
                identity: key
            },
            evidence: {
                declared: { method: usage.method, path: usage.path },
                route: usage.route ?? null,
                page: usage.page ?? null,
                trigger: usage.trigger ?? null
            },
            remediation: REMEDIATION_API
        });
    }
    return findings;
}

function findingsForCallsNotDeclared(apiCalls, apiUsages) {
    const declared = entriesByRequirement(apiUsages ?? []);
    const findings = [];
    for (const call of apiCalls ?? []) {
        if (hasOperationForRequirements(declared, call)) continue;
        const key = operationKey(call);
        findings.push({
            ruleId: 'FE-API-CALL-NOT-DECLARED',
            severity: FE_API_CALL_NOT_DECLARED_SEVERITY,
            strictSeverity: FE_API_CALL_NOT_DECLARED_SEVERITY,
            kind: 'static',
            message: `FE 실제 API 호출 ${call.method} ${call.path} 를 설명하는 @UsesApi 선언이 없음`,
            requirements: call.requirements ?? [],
            location: {
                file: call.file ?? '',
                line: call.line ?? 0,
                identity: key
            },
            evidence: {
                actual: { method: call.method, path: call.path },
                callee: call.callee ?? null,
                apiModule: call.apiModule ?? false
            },
            remediation: REMEDIATION_API
        });
    }
    return findings;
}

function findingForClientStale(contract, generatedMetaPath) {
    const recordedHash = readGeneratedHashMetaSha(generatedMetaPath);
    if (recordedHash == null) {
        return findingForClientNoMetadata(generatedMetaPath);
    }
    const contractHash = contract.sha256 ?? '';
    if (!contractHash || recordedHash === contractHash) return null;
    return {
        ruleId: 'FE-API-CLIENT-STALE',
        severity: FE_API_CLIENT_STALE_SEVERITY,
        strictSeverity: FE_API_CLIENT_STALE_SEVERITY,
        kind: 'static',
        message: 'FE generated 클라이언트가 현재 OpenAPI 계약보다 오래됨 (SHA-256 불일치)',
        requirements: [],
        location: { file: FE_GENERATED_HASH_RELATIVE, line: 0, identity: '(generated-client)' },
        evidence: { contractSha256: contractHash, generatedSha256: recordedHash },
        remediation: REMEDIATION_API
    };
}

function feApiFindings(frontEndIndex, cfg) {
    const contract = readOpenApiIndex(cfg.openApiIndex);
    if (!contract) {
        return [findingForContractMissing(cfg.openApiIndex)];
    }
    const findings = [];
    findings.push(...findingsForUnknownOperations(frontEndIndex.apiCalls ?? [], contract));
    findings.push(...findingsForUnknownDeclaredApiUsages(frontEndIndex.apiUsages ?? [], contract));
    findings.push(...findingsForDeclaredButNotCalled(frontEndIndex.apiUsages ?? [], frontEndIndex.apiCalls ?? []));
    findings.push(...findingsForCallsNotDeclared(frontEndIndex.apiCalls ?? [], frontEndIndex.apiUsages ?? []));
    const staleFinding = findingForClientStale(contract, cfg.generatedMeta);
    if (staleFinding) findings.push(staleFinding);
    return findings;
}

function writePayload(findings, outPath) {
    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        owner: 'front-end-standards',
        summary: buildSummary(findings),
        findings
    };
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
    return payload;
}

function main(argv) {
    const cfg = parseCliArgs(argv);

    if (!fs.existsSync(cfg.feSourceIndex)) {
        // FE 소스 인덱스가 없으면 검사할 게 없으므로 빈 findings로 종료.
        // (back-end-only 프로젝트에서도 이 validator를 무해하게 실행할 수 있게 한다.)
        writePayload([], cfg.out);
        console.log('front-end-standards.findings.json: 0 finding(s) (front-end source index missing)');
        return;
    }

    const index = readJson(cfg.feSourceIndex);
    const issues = index.issues ?? [];
    const stories = index.stories ?? [];
    const findings = [
        ...issues.map(findingFromIssue),
        ...findingsForMissingStoryStates(stories),
        ...feApiFindings(index, cfg)
    ];
    const payload = writePayload(findings, cfg.out);

    const byRule = Object.entries(payload.summary.byRuleId).map(([k, v]) => `${k}=${v}`).join(', ') || 'none';
    console.log(`front-end-standards.findings.json: ${findings.length} finding(s) (error=${payload.summary.error}, warning=${payload.summary.warning}) [${byRule}]`);
}

main(process.argv.slice(2));
