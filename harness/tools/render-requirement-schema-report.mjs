#!/usr/bin/env node
// Layer 4 reporter: requirements.index.json + requirement-cards.findings.json 을 읽어
// 새 요건 카드 스키마 적합성 리포트를 출력한다. 이 도구는 finding을 다시 계산하지 않는다.

import fs from 'node:fs';
import path from 'node:path';
import { outputRootFor, workspaceRoot } from './workspace-config.mjs';

const harnessDir = outputRootFor();
const requirementsIndexPath = path.join(harnessDir, 'indexes', 'requirements.index.json');
const cardFindingsPath = path.join(harnessDir, 'findings', 'requirement-cards.findings.json');
const reportsDir = path.join(harnessDir, 'reports');
const reportMdPath = path.join(reportsDir, 'requirement-schema-report.md');
const reportJsonPath = path.join(reportsDir, 'requirement-schema-report.json');

function parseCliArgs(argv) {
    let quiet = false;
    for (const arg of argv) {
        if (arg === '--quiet') quiet = true;
        else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    }
    return { quiet };
}

function readJson(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`Missing input: ${path.relative(workspaceRoot, file)}`);
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function cardIdFromFinding(finding) {
    return (finding.requirements ?? [])[0] || '(global)';
}

function buildModel(requirementsPayload, findingsPayload) {
    const cards = requirementsPayload.entries ?? [];
    const findings = findingsPayload.findings ?? [];
    const byCard = new Map();
    for (const finding of findings) {
        const cardId = cardIdFromFinding(finding);
        if (!byCard.has(cardId)) byCard.set(cardId, []);
        byCard.get(cardId).push(finding);
    }
    const rows = cards.map((card) => {
        const cardFindings = byCard.get(card.id) ?? [];
        const errors = cardFindings.filter((f) => f.severity === 'error').length;
        const warnings = cardFindings.filter((f) => f.severity === 'warning').length;
        return {
            id: card.id || card.idRaw || '(no id)',
            title: card.title || '',
            file: card.location?.file || '',
            status: errors === 0 ? 'complete' : 'incomplete',
            error: errors,
            warning: warnings,
            requirementType: card.requirementType || '',
            specRole: card.specRole || '',
            targetSystem: card.targetSystem || '',
            productArea: card.productArea || '',
            qualityAttributes: card.qualityAttributes ?? [],
            verificationLevel: card.verificationLevel || '',
            findings: cardFindings.map((finding) => ({
                ruleId: finding.ruleId,
                severity: finding.severity,
                message: finding.message,
                line: finding.location?.line ?? 0
            }))
        };
    });
    const globalFindings = byCard.get('(global)') ?? [];
    return {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        source: 'requirement-schema-report',
        summary: {
            total: rows.length,
            complete: rows.filter((row) => row.status === 'complete').length,
            incomplete: rows.filter((row) => row.status === 'incomplete').length,
            error: findings.filter((f) => f.severity === 'error').length,
            warning: findings.filter((f) => f.severity === 'warning').length
        },
        cards: rows,
        globalFindings
    };
}

function buildMarkdown(model) {
    const lines = ['# Requirement Schema Report', ''];
    lines.push(`Generated: ${model.generatedAt}`, '');
    lines.push('## Summary', '');
    lines.push(`- Total cards: ${model.summary.total}`);
    lines.push(`- Complete: ${model.summary.complete}`);
    lines.push(`- Incomplete: ${model.summary.incomplete}`);
    lines.push(`- Findings: error=${model.summary.error}, warning=${model.summary.warning}`);
    lines.push('');

    if (model.globalFindings.length > 0) {
        lines.push('## Global Findings', '');
        for (const finding of model.globalFindings) {
            lines.push(`- [${finding.severity}] ${finding.ruleId}: ${finding.message}`);
        }
        lines.push('');
    }

    lines.push('## Cards', '');
    for (const card of model.cards) {
        lines.push(`### ${card.id} ${card.title}`, '');
        lines.push(`Status: ${card.status}`);
        lines.push(`Card: ${card.file}`);
        lines.push(`Metadata: type=${card.requirementType || 'missing'}, role=${card.specRole || 'missing'}, target=${card.targetSystem || 'missing'}, area=${card.productArea || 'missing'}, quality=${card.qualityAttributes.join(', ') || 'missing'}, verification=${card.verificationLevel || 'missing'}`);
        if (card.findings.length === 0) {
            lines.push('');
            lines.push('- No schema findings');
            lines.push('');
            continue;
        }
        lines.push('');
        for (const finding of card.findings) {
            const loc = finding.line ? `:${finding.line}` : '';
            lines.push(`- [${finding.severity}] ${finding.ruleId}${loc}: ${finding.message}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}

function main() {
    const cli = parseCliArgs(process.argv.slice(2));
    const requirementsPayload = readJson(requirementsIndexPath);
    const findingsPayload = readJson(cardFindingsPath);
    const model = buildModel(requirementsPayload, findingsPayload);
    const markdown = buildMarkdown(model);
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(reportMdPath, markdown);
    fs.writeFileSync(reportJsonPath, `${JSON.stringify(model, null, 2)}\n`);
    if (!cli.quiet) {
        console.log(`requirement-schema-report.md: ${markdown.split('\n').length} line(s) → ${path.relative(workspaceRoot, reportMdPath)}`);
    }
}

main();
