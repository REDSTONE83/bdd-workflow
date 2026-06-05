#!/usr/bin/env node
// Layer 4 reporter: state/trace.state.json 을 읽어
// build/{app|harness}/reports/trace-report.{md,json}을 출력한다.
// 단일 카드 게이트(--requirement) 결과는 reports/trace-report-REQ-XXX.{md,json}로 떨어진다.
//
// 이 도구는 state를 다시 계산하지 않는다. 단순 렌더링만.

import fs from 'node:fs';
import path from 'node:path';
import { outputRootFor, workspaceRoot } from './workspace-config.mjs';

const outputDir = outputRootFor();
const stateOutFile = path.join(outputDir, 'state', 'trace.state.json');
const reportsDir = path.join(outputDir, 'reports');
const changeSetReportJsonPath = path.join(reportsDir, 'change-set-report.json');

function parseCliArgs(argv) {
    let quiet = false;
    for (const arg of argv) {
        if (arg === '--quiet') quiet = true;
        else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    }
    return { quiet };
}

function scenarioCovers(scenario) {
    return (scenario.covers ?? []).map((c) => (typeof c === 'string' ? c : c.text));
}

function reportBaseName(model) {
    const suffix = Array.isArray(model.filter) && model.filter.length > 0
        ? `-${model.filter.join('-')}`
        : '';
    return `trace-report${suffix}`;
}

function emptyTerminologyCounts() { return { error: 0, warning: 0, strictError: 0, byKind: {} }; }

function readChangeSetReportSummary() {
    if (!fs.existsSync(changeSetReportJsonPath)) {
        return { present: false, warnings: 0 };
    }
    try {
        const payload = JSON.parse(fs.readFileSync(changeSetReportJsonPath, 'utf8'));
        return {
            present: true,
            warnings: payload?.summary?.changeSetWarnings ?? 0
        };
    } catch {
        return { present: false, warnings: 0 };
    }
}

function tallyFindings(findings) {
    const counts = emptyTerminologyCounts();
    for (const finding of findings) {
        if (finding.severity === 'error') counts.error++;
        else if (finding.severity === 'warning') counts.warning++;
        if (finding.strictSeverity === 'error') counts.strictError++;
        counts.byKind[finding.kind] = (counts.byKind[finding.kind] || 0) + 1;
    }
    return counts;
}

function formatFindingLocation(finding) {
    const loc = finding.location || {};
    const parts = [];
    if (loc.file) parts.push(loc.line ? `${loc.file}:${loc.line}` : loc.file);
    if (loc.channel) parts.push(`[${loc.channel}]`);
    return parts.join(' ');
}

function formatFindingLine(finding) {
    const sev = finding.severity === finding.strictSeverity
        ? finding.severity
        : `${finding.severity}/strict:${finding.strictSeverity}`;
    const term = finding.term ? ` ${finding.term}` : (finding.originTerms ? ` (${finding.originTerms.join(', ')})` : '');
    const surface = finding.surface ? ` "${finding.surface}"` : '';
    const candidates = finding.candidates ? ` → ${finding.candidates.join(', ')}` : '';
    const loc = formatFindingLocation(finding);
    return `- [${sev}] ${finding.kind}${term}${surface}${candidates}${loc ? ' — ' + loc : ''}`;
}

function formatCountsLine(counts) {
    const byKindStr = Object.keys(counts.byKind).length === 0
        ? ''
        : ` (by kind: ${Object.entries(counts.byKind).map(([k, v]) => `${k}=${v}`).join(', ')})`;
    return `Findings: error=${counts.error}, warning=${counts.warning}, strictError=${counts.strictError}${byKindStr}`;
}

function buildMarkdown(model) {
    const lines = ['# Requirement Trace Report', ''];
    lines.push(`Generated: ${model.generatedAt}`, '');
    if (model.filter) lines.push(`Filter: ${model.filter.join(', ')}`, '');
    lines.push('## Summary', '');
    lines.push(`- Total: ${model.summary.total}`);
    lines.push(`- RED: ${model.summary.red}`);
    lines.push(`- GREEN: ${model.summary.green}`);
    lines.push(`- BLUE: ${model.summary.blue}`);
    if (typeof model.summary.inactive === 'number') lines.push(`- INACTIVE: ${model.summary.inactive}`);
    lines.push(`- Unknown API references: ${model.summary.unknownApis}`);
    lines.push(`- Unknown test references: ${model.summary.unknownTests}`);
    lines.push(`- Unknown entity references: ${model.summary.unknownEntities}`);
    lines.push(`- Unknown feature references: ${model.summary.unknownFeatures}`);
    lines.push(`- Unknown front-end surface references: ${model.summary.unknownFrontEndSurfaces}`);
    const feErr = model.summary.frontEndStandardsErrors ?? 0;
    const feWarn = model.summary.frontEndStandardsWarnings ?? 0;
    const feByRule = model.summary.frontEndStandardsByRuleId || {};
    const feByRuleStr = Object.keys(feByRule).length === 0
        ? ''
        : ` (by rule: ${Object.entries(feByRule).map(([k, v]) => `${k}=${v}`).join(', ')})`;
    lines.push(`- Front-end standards findings: error=${feErr}, warning=${feWarn}${feByRuleStr}`);
    const scnErr = model.summary.scenarioStandardsErrors ?? 0;
    const scnWarn = model.summary.scenarioStandardsWarnings ?? 0;
    const scnByRule = model.summary.scenarioStandardsByRuleId || {};
    const scnByRuleStr = Object.keys(scnByRule).length === 0
        ? ''
        : ` (by rule: ${Object.entries(scnByRule).map(([k, v]) => `${k}=${v}`).join(', ')})`;
    lines.push(`- Scenario standards findings: error=${scnErr}, warning=${scnWarn}${scnByRuleStr}`);
    const sw = model.summary.scenarioWarnings;
    const swByKind = model.summary.scenarioWarningsByKind || {};
    const swKindStr = Object.keys(swByKind).length === 0
        ? ''
        : ` (by kind: ${Object.entries(swByKind).map(([k, v]) => `${k}=${v}`).join(', ')})`;
    lines.push(`- Scenario warnings: ${sw}${swKindStr} (report-only; --check 미반영)`);
    lines.push(`- Card structure issues: ${model.summary.structureIssues}`);
    if (model.terminology.present) {
        const t = model.terminology;
        lines.push(`- Terminology mode: ${t.mode}`);
        lines.push(`- Terminology findings: error=${t.totals.error}, warning=${t.totals.warning}, strictError=${t.totals.strictError}`);
        if (t.totals.strictError > 0) {
            lines.push(`  (strict 실패 ${t.totals.strictError}건 — gate.mjs TRM 카테고리가 scope별 validate 게이트를 차단한다 (REQ-010).)`);
        }
    } else {
        lines.push('- Terminology report: 없음 (`./gradlew validateTerminology` 실행 필요)');
    }
    if (model.changeSetReport?.present) {
        lines.push(`- Change Set warnings: ${model.changeSetReport.warnings} (report-only; --check 미반영)`);
    } else {
        lines.push('- Change Set warnings: unavailable (`./gradlew generateChangeSetReport` 실행 필요)');
    }
    lines.push('');

    for (const requirement of model.requirements) {
        lines.push(`## ${requirement.id} ${requirement.title}`, '');
        lines.push(`State: ${requirement.state}`);
        lines.push(`Card status: ${requirement.status || '미기재'}`);
        lines.push(`Requirement type: ${requirement.requirementType || '미기재'}`);
        lines.push(`Spec role: ${requirement.specRole || '미기재'}`);
        lines.push(`Target system: ${requirement.targetSystem || '미기재'}`);
        lines.push(`Product area: ${requirement.productArea || '미기재'}`);
        lines.push(`Quality attributes: ${(requirement.qualityAttributes ?? []).join(', ') || '미기재'}`);
        lines.push(`Verification level: ${requirement.verificationLevel || '미기재'}`);
        if ((requirement.relatedRequirementIds ?? []).length > 0) {
            lines.push(`Related requirements: ${requirement.relatedRequirementIds.join(', ')}`);
        }
        if ((requirement.replacedByRequirementIds ?? []).length > 0) {
            lines.push(`Replaced by: ${requirement.replacedByRequirementIds.join(', ')}`);
        }
        lines.push(`Card: ${path.relative(workspaceRoot, requirement.file)}`);
        lines.push('');

        if (requirement.redReasons.length > 0) {
            lines.push('### RED Reasons', '');
            for (const reason of requirement.redReasons) {
                lines.push(`- [${reason.ruleId}] ${reason.message}`);
            }
            lines.push('');
        }

        if (requirement.state === 'GREEN' && (requirement.blueBlockedBy ?? []).length > 0) {
            lines.push('### BLUE Blockers', '');
            for (const blocker of requirement.blueBlockedBy) lines.push(`- ${blocker}`);
            lines.push('');
        }

        lines.push('### APIs', '');
        if (requirement.apis.length === 0) {
            lines.push('- (없음)');
        } else {
            for (const api of requirement.apis) {
                lines.push(`- ${api.http} / ${api.controller} [${api.requirements.join(', ')}]`);
            }
        }
        lines.push('');

        lines.push('### Entities', '');
        if (requirement.entities.length === 0) {
            lines.push('- (없음)');
        } else {
            for (const entity of requirement.entities) {
                lines.push(`- ${entity.className} → ${entity.table} [${entity.requirements.join(', ') || '(class-level 미지정)'}]`);
                for (const column of entity.columns) {
                    lines.push(`  - ${column.columnName} (${column.javaType}) [${column.requirements.join(', ') || '(field-level 미지정)'}]`);
                }
            }
        }
        lines.push('');

        lines.push('### Front-end', '');
        const pages = requirement.frontEnd?.pages ?? [];
        const routes = requirement.frontEnd?.routes ?? [];
        const stories = requirement.frontEnd?.stories ?? [];
        const apiUsages = requirement.frontEnd?.apiUsages ?? [];
        const apiCalls = requirement.frontEnd?.apiCalls ?? [];
        if (pages.length === 0 && routes.length === 0 && stories.length === 0 && apiUsages.length === 0 && apiCalls.length === 0) {
            lines.push('- (없음)');
        } else {
            for (const route of routes) {
                lines.push(`- route ${route.path} (${route.file}:${route.line ?? 0}) [${route.requirements.join(', ')}]`);
                for (const usage of route.usesApis ?? []) {
                    const trigger = usage.trigger ? ` ${usage.trigger}` : '';
                    lines.push(`  - uses ${usage.method} ${usage.path}${trigger}`);
                }
            }
            for (const page of pages) {
                const routeLabel = page.route ? ` route=${page.route}` : '';
                lines.push(`- page ${page.name}${routeLabel} (${page.file}:${page.line ?? 0}) [${page.requirements.join(', ')}]`);
                for (const usage of page.usesApis ?? []) {
                    const trigger = usage.trigger ? ` ${usage.trigger}` : '';
                    lines.push(`  - uses ${usage.method} ${usage.path}${trigger}`);
                }
            }
            for (const story of stories) {
                const storyTitle = [story.title, story.story].filter(Boolean).join(' / ');
                lines.push(`- story ${storyTitle} (${story.file}:${story.line ?? 0}) [${story.requirements.join(', ')}]`);
            }
            for (const usage of apiUsages) {
                const trigger = usage.trigger ? ` ${usage.trigger}` : '';
                const surface = [usage.route, usage.page].filter(Boolean).join(' ') || usage.surfaceType || 'file';
                lines.push(`- api usage ${usage.method} ${usage.path}${trigger} (${usage.file}:${usage.line ?? 0}) surface=${surface} [${usage.requirements.join(', ')}]`);
            }
            for (const call of apiCalls) {
                lines.push(`- api call ${call.method} ${call.path} (${call.file}:${call.line ?? 0}) [${call.requirements.join(', ')}]`);
            }
        }
        lines.push('');

        lines.push('### Scenarios', '');
        if ((requirement.scenarios ?? []).length === 0) {
            lines.push('- (없음)');
        } else {
            for (const scenario of requirement.scenarios) {
                const loc = `${scenario.file}:${scenario.line}`;
                const coversList = scenarioCovers(scenario);
                lines.push(`- ${scenario.title} (${loc})`);
                lines.push(`  - Covers: ${coversList.length}건`);
                lines.push(`  - Steps: ${(scenario.steps ?? []).length}건`);
            }
        }
        lines.push('');

        lines.push('### Acceptance Criteria Coverage', '');
        for (const row of requirement.coverage) {
            const marker = row.target ? `(${row.target}) ` : '';
            lines.push(`- ${row.status}: ${marker}${row.criterion}`);
            if ((row.requiredChecks ?? []).length > 1) {
                lines.push(`  - Required checks: ${row.requiredChecks.map((check) => `${check.target}=${check.status}`).join(', ')}`);
            }
            const scenariosForRow = row.scenarios ?? [];
            if (scenariosForRow.length === 0 && row.tests.length === 0) lines.push(`  - (시나리오 없음, 테스트 없음)`);
            if (scenariosForRow.length === 0 && row.tests.length > 0) lines.push(`  - (이 AC를 커버하는 .feature Scenario가 없음)`);
            for (const scenario of scenariosForRow) lines.push(`  - Scenario: ${scenario.title} (${scenario.file}:${scenario.line})`);
            for (const test of row.tests) {
                const sourceLabel = [test.source, test.scope].filter(Boolean).join('/');
                const source = sourceLabel ? `[${sourceLabel}] ` : '';
                lines.push(`  - ${source}${test.identity}: ${test.result}`);
            }
        }
        lines.push('');

        if (model.terminology.present) {
            lines.push('### Terminology', '');
            const t = requirement.terminology;
            lines.push(formatCountsLine(t.counts));
            if (t.findings.length > 0) {
                lines.push('');
                for (const finding of t.findings) lines.push(formatFindingLine(finding));
            }
            lines.push('');
        }
    }

    if (model.structureReports.some((report) => report.issues.length > 0)) {
        lines.push('## Card Structure Issues', '');
        for (const report of model.structureReports) {
            if (report.issues.length === 0) continue;
            lines.push(`### ${report.id}${report.title ? ' ' + report.title : ''}`);
            lines.push(`Card: ${path.relative(workspaceRoot, report.file)}`);
            for (const issue of report.issues) lines.push(`- ${issue}`);
            lines.push('');
        }
    }

    if (model.unknownApis.length > 0) {
        lines.push('## Unknown API Requirement References', '');
        for (const finding of model.unknownApis) lines.push(`- ${finding.message}`);
        lines.push('');
    }
    if (model.unknownTests.length > 0) {
        lines.push('## Unknown Test Requirement References', '');
        for (const finding of model.unknownTests) lines.push(`- ${finding.message}`);
        lines.push('');
    }
    if (model.unknownEntities.length > 0) {
        lines.push('## Unknown Entity Requirement References', '');
        for (const finding of model.unknownEntities) {
            lines.push(`- ${finding.message}`);
            for (const column of (finding.evidence?.offendingColumns ?? [])) {
                lines.push(`  - [${column.refsFormatted}] ${column.columnName} (${column.javaType})`);
            }
        }
        lines.push('');
    }
    if (model.unknownFeatures.length > 0) {
        lines.push('## Unknown Feature Requirement References', '');
        for (const finding of model.unknownFeatures) lines.push(`- ${finding.message}`);
        lines.push('');
    }
    if (model.unknownFrontEndSurfaces.length > 0) {
        lines.push('## Unknown Front-end Surface Requirement References', '');
        for (const finding of model.unknownFrontEndSurfaces) lines.push(`- ${finding.message}`);
        lines.push('');
    }

    const feStandardsFindings = model.frontEndStandards?.findings ?? [];
    if (feStandardsFindings.length > 0) {
        lines.push('## Front-end Standards Findings (FE-*)', '');
        for (const finding of feStandardsFindings) {
            const loc = finding.location || {};
            const where = loc.file ? `${loc.file}:${loc.line ?? 0}` : '(global)';
            lines.push(`- [${finding.severity ?? 'warning'}] ${finding.ruleId}: ${finding.message} — ${where}`);
        }
        lines.push('');
    }

    const scenarioStandardsFindings = model.scenarioStandards?.findings ?? [];
    if (scenarioStandardsFindings.length > 0) {
        lines.push('## Scenario Standards Findings (SCN-*)', '');
        for (const finding of scenarioStandardsFindings) {
            const loc = finding.location || {};
            const where = loc.file ? `${loc.file}:${loc.line ?? 0}` : '(global)';
            lines.push(`- [${finding.severity ?? 'warning'}] ${finding.ruleId}: ${finding.message} — ${where}`);
        }
        lines.push('');
    }

    if ((model.scenarioWarnings ?? []).length > 0) {
        lines.push('## Scenario Warnings', '');
        lines.push('마이그레이션 진행 동안은 report-only다. 향후 ERROR로 승격 예정. ' +
            '근거: harness/docs/standards/acceptance-test.md, harness/docs/requirement-authoring.md.');
        lines.push('');
        for (const warning of model.scenarioWarnings) {
            const kind = warning.evidence?.legacyKind ?? warning.ruleId;
            const loc = warning.location ?? {};
            const locParts = [];
            if (loc.file) locParts.push(loc.line ? `${loc.file}:${loc.line}` : loc.file);
            if (loc.identity) locParts.push(loc.identity);
            const locStr = locParts.length > 0 ? ` — ${locParts.join(' / ')}` : '';
            const reqStr = (warning.requirements ?? []).length > 0 ? ` [${warning.requirements.join(', ')}]` : '';
            lines.push(`- [${kind}]${reqStr} ${warning.message}${locStr}`);
        }
        lines.push('');
    }

    if (model.terminology.present && model.terminology.unattributed.length > 0) {
        lines.push('## Unattributed Terminology Findings', '');
        lines.push(formatCountsLine(tallyFindings(model.terminology.unattributed)));
        lines.push('');
        for (const finding of model.terminology.unattributed) lines.push(formatFindingLine(finding));
        lines.push('');
    }

    return lines.join('\n');
}

function main() {
    const cli = parseCliArgs(process.argv.slice(2));
    if (!fs.existsSync(stateOutFile)) {
        console.error(`Missing trace state: ${stateOutFile}\nRun node harness/tools/evaluate-trace-state.mjs first.`);
        process.exit(1);
    }
    const model = JSON.parse(fs.readFileSync(stateOutFile, 'utf8'));
    model.changeSetReport = readChangeSetReportSummary();
    const markdown = buildMarkdown(model);
    const baseName = reportBaseName(model);
    const reportMdPath = path.join(reportsDir, `${baseName}.md`);
    const reportJsonPath = path.join(reportsDir, `${baseName}.json`);
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(reportMdPath, markdown);
    fs.writeFileSync(reportJsonPath, JSON.stringify(model, null, 2) + '\n');
    if (!cli.quiet) {
        console.log(`trace-report.md: ${markdown.split('\n').length} line(s) → ${path.relative(workspaceRoot, reportMdPath)}`);
    }
}

main();
