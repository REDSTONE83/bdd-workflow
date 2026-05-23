#!/usr/bin/env node
// Layer 2 validator: cross-artifact findings.
// 여러 인덱스를 교차해야 판단 가능한 위반을 모은다.
//
// 입력:
//   indexes/requirements.index.json
//   indexes/backend.source-index.json
//   indexes/front-end.source-index.json
//   indexes/scenarios.index.json
//
// 출력:
//   findings/cross-artifact.findings.json
//
// 룰 ID:
//   REF-API           API @Requirement에 카드에 없는 ID
//   REF-TEST          test @Requirement에 카드에 없는 ID
//   REF-ENTITY        entity/column @Requirement에 카드에 없는 ID
//   REF-FEATURE       .feature @REQ-XXX 태그가 카드에 없는 ID (TRC-COV-03 폐기 후 통합)
//   REF-FE-SURFACE    FE page/route/story 메타데이터의 미등록 ID
//   REF-CARD          카드 본문이 알려지지 않은 REQ-XXX 참조
//   TRC-COV-01        테스트 @Covers AC가 같은 요건의 어떤 .feature Scenario Covers 에도 없음
//   TRC-COV-02        .feature Scenario Covers 항목이 카드 수용 기준과 정확 일치하지 않음

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const outputDir = path.join(repoRoot, 'build', 'harness');
const indexesDir = path.join(outputDir, 'indexes');
const findingsDir = path.join(outputDir, 'findings');

const requirementsIndexPath = path.join(indexesDir, 'requirements.index.json');
const backendIndexPath = path.join(indexesDir, 'backend.source-index.json');
const frontEndIndexPath = path.join(indexesDir, 'front-end.source-index.json');
const scenariosIndexPath = path.join(indexesDir, 'scenarios.index.json');
const outFile = path.join(findingsDir, 'cross-artifact.findings.json');

function readJson(p) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function safeRead(p, fallback) {
    if (!fs.existsSync(p)) return fallback;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return fallback;
    }
}

function scenarioCovers(scenario) {
    return (scenario.covers ?? []).map((c) => (typeof c === 'string' ? c : c.text));
}

function flattenScenarios(scenarioIndex) {
    return (scenarioIndex.features ?? []).flatMap((feature) =>
        (feature.scenarios ?? []).map((scenario) => ({
            ...scenario,
            file: feature.file,
            featureTitle: feature.title,
            featureTags: feature.tags ?? [],
            requirementIds: feature.requirementIds ?? []
        }))
    );
}

function hasUnknownRef(refs, knownIds) {
    return refs.length === 0 || refs.some((ref) => !knownIds.has(ref));
}

function hasUnknownNonEmpty(refs, knownIds) {
    return refs.length > 0 && refs.some((ref) => !knownIds.has(ref));
}

function formatRefs(refs, knownIds) {
    if (refs.length === 0) return '미지정';
    return refs.map((ref) => knownIds.has(ref) ? ref : `${ref}(!)`).join(', ');
}

function buildSummary(findings) {
    const summary = { error: 0, warning: 0, info: 0, byRuleId: {} };
    for (const f of findings) {
        summary[f.severity] = (summary[f.severity] ?? 0) + 1;
        summary.byRuleId[f.ruleId] = (summary.byRuleId[f.ruleId] ?? 0) + 1;
    }
    return summary;
}

function main() {
    if (!fs.existsSync(requirementsIndexPath)) {
        console.error(`Missing ${requirementsIndexPath}. Run indexRequirements first.`);
        process.exit(1);
    }
    if (!fs.existsSync(backendIndexPath)) {
        console.error(`Missing ${backendIndexPath}. Run generateHarnessSourceIndex first.`);
        process.exit(1);
    }

    const requirementsPayload = readJson(requirementsIndexPath);
    const cards = requirementsPayload.entries ?? [];
    const knownIds = new Set(cards.map((c) => c.id).filter(Boolean));

    const backendIndex = readJson(backendIndexPath);
    const apis = backendIndex.apis ?? [];
    const beTests = (backendIndex.tests ?? []).map((t) => ({ source: 'back-end', ...t }));
    const entities = backendIndex.entities ?? [];

    const frontEndIndex = safeRead(frontEndIndexPath, { pages: [], routes: [], stories: [], tests: [] });
    const fePages = frontEndIndex.pages ?? [];
    const feRoutes = frontEndIndex.routes ?? [];
    const feStories = frontEndIndex.stories ?? [];
    const feTests = (frontEndIndex.tests ?? []).map((t) => ({ source: 'front-end', ...t }));
    const tests = [...beTests, ...feTests];

    const scenarioIndex = safeRead(scenariosIndexPath, { features: [] });
    const features = scenarioIndex.features ?? [];
    const scenarios = flattenScenarios(scenarioIndex);

    const findings = [];

    // --- REF-API ---
    for (const api of apis) {
        if (!hasUnknownRef(api.requirements ?? [], knownIds)) continue;
        findings.push({
            ruleId: 'REF-API',
            severity: 'error',
            strictSeverity: 'error',
            kind: 'reference',
            message: `[${formatRefs(api.requirements ?? [], knownIds)}] ${api.http} / ${api.controller}`,
            requirements: api.requirements ?? [],
            location: {
                file: api.file ?? '',
                line: api.line ?? 0,
                identity: `${api.http} ${api.controller}`
            },
            evidence: {
                http: api.http,
                controller: api.controller,
                requirements: api.requirements ?? []
            },
            remediation: 'docs/standards/api-contract.md'
        });
    }

    // --- REF-TEST ---
    for (const test of tests) {
        if (!hasUnknownRef(test.requirements ?? [], knownIds)) continue;
        const identity = test.identity ?? `${test.className ?? ''}.${test.method ?? test.displayName ?? ''}`;
        findings.push({
            ruleId: 'REF-TEST',
            severity: 'error',
            strictSeverity: 'error',
            kind: 'reference',
            message: `[${formatRefs(test.requirements ?? [], knownIds)}] ${identity}`,
            requirements: test.requirements ?? [],
            location: {
                file: test.file ?? '',
                line: test.line ?? 0,
                identity
            },
            evidence: {
                source: test.source,
                identity,
                requirements: test.requirements ?? []
            },
            remediation: 'docs/standards/acceptance-test.md'
        });
    }

    // --- REF-ENTITY ---
    for (const entity of entities) {
        const columnRefs = (entity.columns ?? []).flatMap((c) => c.requirements ?? []);
        const allRefs = [...(entity.requirements ?? []), ...columnRefs];
        if (!hasUnknownRef(allRefs, knownIds)) continue;
        const offendingColumns = (entity.columns ?? []).filter((column) =>
            (column.requirements ?? []).length === 0 ||
            (column.requirements ?? []).some((ref) => !knownIds.has(ref))
        ).map((column) => ({
            columnName: column.columnName,
            javaType: column.javaType,
            requirements: column.requirements ?? [],
            refsFormatted: formatRefs(column.requirements ?? [], knownIds)
        }));
        findings.push({
            ruleId: 'REF-ENTITY',
            severity: 'error',
            strictSeverity: 'error',
            kind: 'reference',
            message: `[${formatRefs(entity.requirements ?? [], knownIds)}] ${entity.className} → ${entity.table}`,
            requirements: entity.requirements ?? [],
            location: {
                file: entity.file ?? '',
                line: entity.line ?? 0,
                identity: `${entity.className} → ${entity.table}`
            },
            evidence: {
                className: entity.className,
                table: entity.table,
                requirements: entity.requirements ?? [],
                offendingColumns
            },
            remediation: 'docs/standards/persistence-schema.md'
        });
    }

    // --- REF-FEATURE ---
    for (const feature of features) {
        if (!hasUnknownRef(feature.requirementIds ?? [], knownIds)) continue;
        const refs = (feature.requirementIds ?? []).length > 0
            ? formatRefs(feature.requirementIds ?? [], knownIds)
            : '미지정';
        findings.push({
            ruleId: 'REF-FEATURE',
            severity: 'warning',
            strictSeverity: 'error',
            kind: 'reference',
            message: `[${refs}] ${feature.file}`,
            requirements: feature.requirementIds ?? [],
            location: {
                file: feature.file ?? '',
                line: feature.line ?? 0,
                identity: feature.file ?? ''
            },
            evidence: {
                requirementIds: feature.requirementIds ?? []
            },
            remediation: 'docs/standards/acceptance-test.md'
        });
    }

    // --- REF-FE-SURFACE ---
    const feSurfaces = [
        ...fePages.map((s) => ({ type: 'page', ...s })),
        ...feRoutes.map((s) => ({ type: 'route', ...s })),
        ...feStories.map((s) => ({ type: 'story', ...s }))
    ];
    for (const surface of feSurfaces) {
        if (!hasUnknownNonEmpty(surface.requirements ?? [], knownIds)) continue;
        const label = surface.path || surface.name || surface.story || surface.title || '(unknown)';
        findings.push({
            ruleId: 'REF-FE-SURFACE',
            severity: 'error',
            strictSeverity: 'error',
            kind: 'reference',
            message: `[${formatRefs(surface.requirements ?? [], knownIds)}] ${surface.type} ${label} (${surface.file}:${surface.line ?? 0})`,
            requirements: surface.requirements ?? [],
            location: {
                file: surface.file ?? '',
                line: surface.line ?? 0,
                identity: `${surface.type}:${label}`
            },
            evidence: {
                type: surface.type,
                label,
                requirements: surface.requirements ?? []
            },
            remediation: 'docs/standards/front-end-project-structure.md'
        });
    }

    // --- REF-CARD ---
    for (const card of cards) {
        for (const ref of card.referencedRequirementIds ?? []) {
            if (knownIds.has(ref)) continue;
            findings.push({
                ruleId: 'REF-CARD',
                severity: 'error',
                strictSeverity: 'error',
                kind: 'reference',
                message: `존재하지 않는 요건 ID 참조: ${ref}`,
                requirements: card.id ? [card.id] : [],
                location: {
                    file: card.location?.file ?? '',
                    line: card.location?.line ?? 0,
                    identity: card.location?.identity ?? card.id ?? ''
                },
                evidence: { unknownRef: ref },
                remediation: 'docs/standards/requirement-card.md'
            });
        }
    }

    // --- TRC-COV-01 ---
    // 테스트의 @Covers AC가 같은 요건의 어떤 .feature Scenario Covers 에도 없음
    for (const test of tests) {
        if (!Array.isArray(test.covers) || test.covers.length === 0) continue;
        const testReqs = test.requirements ?? [];
        const candidateScenarioCovers = new Set(
            scenarios
                .filter((s) => (s.requirementIds ?? []).some((id) => testReqs.includes(id)))
                .flatMap((s) => scenarioCovers(s))
        );
        for (const ac of test.covers) {
            if (candidateScenarioCovers.has(ac)) continue;
            findings.push({
                ruleId: 'TRC-COV-01',
                severity: 'warning',
                strictSeverity: 'warning',
                kind: 'cross-artifact',
                message: `테스트가 다루는 AC "${ac}" 를 커버하는 .feature Scenario가 없음`,
                requirements: testReqs,
                location: {
                    file: test.file ?? '',
                    line: test.line ?? 0,
                    identity: test.identity ?? ''
                },
                evidence: {
                    legacyKind: 'TEST_COVERS_NO_SCENARIO_COVERS',
                    covers: ac,
                    testRequirements: testReqs
                },
                remediation: 'docs/standards/acceptance-test.md'
            });
        }
    }

    // --- TRC-COV-02 ---
    // .feature Scenario Covers: 항목이 카드 수용 기준과 정확히 일치하지 않음
    const cardById = new Map(cards.filter((c) => c.id).map((c) => [c.id, c]));
    for (const feature of features) {
        const featureCards = (feature.requirementIds ?? [])
            .map((id) => cardById.get(id))
            .filter(Boolean);
        if (featureCards.length === 0) continue;
        for (const scenario of feature.scenarios ?? []) {
            for (const acText of scenarioCovers(scenario)) {
                const found = featureCards.some((card) => (card.acceptanceCriteria ?? []).includes(acText));
                if (found) continue;
                findings.push({
                    ruleId: 'TRC-COV-02',
                    severity: 'warning',
                    strictSeverity: 'warning',
                    kind: 'cross-artifact',
                    message: `.feature Covers: "${acText}" 가 카드 수용 기준과 일치하지 않음`,
                    requirements: feature.requirementIds ?? [],
                    location: {
                        file: feature.file ?? '',
                        line: scenario.line ?? 0,
                        identity: scenario.title ?? ''
                    },
                    evidence: {
                        legacyKind: 'SCENARIO_COVERS_NO_CARD_AC',
                        covers: acText,
                        scenarioTitle: scenario.title ?? ''
                    },
                    remediation: 'docs/standards/acceptance-test.md'
                });
            }
        }
    }

    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        owner: 'cross-artifact',
        summary: buildSummary(findings),
        findings
    };

    fs.mkdirSync(findingsDir, { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');

    const counts = payload.summary;
    const byRule = Object.entries(counts.byRuleId).map(([k, v]) => `${k}=${v}`).join(', ') || 'none';
    console.log(`cross-artifact.findings.json: ${findings.length} finding(s) (error=${counts.error}, warning=${counts.warning}) [${byRule}]`);
}

main();
