#!/usr/bin/env node
// Layer 4 reporter: change-sets.index.json + requirements/card findings + trace state를
// 읽어 Change Set별 영향 REQ 상태를 출력한다. 이 도구는 state/finding을 다시 계산하지 않는다.

import fs from 'node:fs';
import path from 'node:path';
import { outputRootFor, workspaceRoot } from './workspace-config.mjs';

const harnessDir = outputRootFor();
const indexesDir = path.join(harnessDir, 'indexes');
const findingsDir = path.join(harnessDir, 'findings');
const stateDir = path.join(harnessDir, 'state');
const reportsDir = path.join(harnessDir, 'reports');
const changeSetsIndexPath = path.join(indexesDir, 'change-sets.index.json');
const requirementsIndexPath = path.join(indexesDir, 'requirements.index.json');
const cardFindingsPath = path.join(findingsDir, 'requirement-cards.findings.json');
const traceStatePath = path.join(stateDir, 'trace.state.json');
const reportMdPath = path.join(reportsDir, 'change-set-report.md');
const reportJsonPath = path.join(reportsDir, 'change-set-report.json');

function requirementIndexPaths() {
    const defaults = [
        requirementsIndexPath,
        path.join(workspaceRoot, 'build', 'app', 'indexes', 'requirements.index.json'),
        path.join(workspaceRoot, 'build', 'harness', 'indexes', 'requirements.index.json')
    ];
    const additional = (process.env.HARNESS_ADDITIONAL_REQUIREMENTS_INDEXES ?? '')
        .split(path.delimiter)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => path.resolve(item));
    const seen = new Set();
    return [...defaults, ...additional]
        .map((item) => path.resolve(item))
        .filter((item) => {
            if (seen.has(item)) return false;
            seen.add(item);
            return true;
        });
}

function parseCliArgs(argv) {
    let quiet = false;
    for (const arg of argv) {
        if (arg === '--quiet') quiet = true;
        else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    }
    return { quiet };
}

function readJsonRequired(file) {
    if (!fs.existsSync(file)) throw new Error(`Missing input: ${path.relative(workspaceRoot, file)}`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJsonOptional(file) {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function requirementIdsFromFinding(finding) {
    return Array.isArray(finding.requirements) ? finding.requirements : [];
}

function buildIndexes(requirementsPayloads, findingsPayload, tracePayload) {
    const cardsById = new Map();
    for (const payload of requirementsPayloads ?? []) {
        for (const entry of payload?.entries ?? []) {
            if (!entry.id || cardsById.has(entry.id)) continue;
            cardsById.set(entry.id, entry);
        }
    }
    const findingsByReq = new Map();
    for (const finding of findingsPayload?.findings ?? []) {
        for (const reqId of requirementIdsFromFinding(finding)) {
            if (!findingsByReq.has(reqId)) findingsByReq.set(reqId, []);
            findingsByReq.get(reqId).push(finding);
        }
    }
    const traceByReq = new Map((tracePayload?.requirements ?? [])
        .filter((entry) => entry.id)
        .map((entry) => [entry.id, entry]));
    return { cardsById, findingsByReq, traceByReq };
}

function schemaStatus(findings) {
    const errors = findings.filter((f) => f.severity === 'error').length;
    const warnings = findings.filter((f) => f.severity === 'warning').length;
    return {
        status: errors > 0 ? 'incomplete' : 'complete',
        error: errors,
        warning: warnings
    };
}

function buildAffectedRequirement(reqId, indexes) {
    const card = indexes.cardsById.get(reqId);
    const findings = indexes.findingsByReq.get(reqId) ?? [];
    const trace = indexes.traceByReq.get(reqId);
    const schema = schemaStatus(findings);
    return {
        id: reqId,
        title: card?.title ?? '(unknown requirement)',
        file: card?.location?.file ?? '',
        schemaStatus: card ? schema.status : 'unknown',
        schemaError: card ? schema.error : 0,
        schemaWarning: card ? schema.warning : 0,
        traceState: trace?.state ?? 'unknown',
        redReasonCount: Array.isArray(trace?.redReasons) ? trace.redReasons.length : 0
    };
}

function issueForChangeSet(changeSet, ruleId, message, evidence = {}) {
    return {
        ruleId,
        severity: 'warning',
        strictSeverity: 'warning',
        kind: 'change-set-structure',
        message,
        requirements: [],
        location: changeSet.location ?? { file: changeSet.file ?? '', line: 0, identity: changeSet.file ?? '' },
        evidence,
        remediation: 'harness/docs/change-set.md'
    };
}

function buildModel(changeSetsPayload, requirementsPayloads, findingsPayload, tracePayload) {
    const indexes = buildIndexes(requirementsPayloads, findingsPayload, tracePayload);
    const changeSets = (changeSetsPayload.entries ?? []).map((entry) => {
        const affectedRequirementIds = entry.affectedRequirementIds ?? [];
        const affectedRequirements = affectedRequirementIds.map((reqId) => buildAffectedRequirement(reqId, indexes));
        const issues = [...(entry.issues ?? [])];
        for (const req of affectedRequirements) {
            if (req.schemaStatus !== 'unknown') continue;
            issues.push(issueForChangeSet(entry, 'CHANGE-SET-AFFECTED-REQ-UNKNOWN',
                `영향 요건이 존재하지 않음: ${req.id}`,
                { affectedRequirementId: req.id }));
        }
        return {
            file: entry.location?.file ?? '',
            title: entry.title ?? '',
            status: entry.status ?? '',
            requestedDate: entry.requestedDate ?? '',
            changeTypes: entry.changeTypes ?? [],
            discussionStatus: entry.discussionStatus ?? '',
            requestSummary: entry.requestSummary ?? [],
            scopeItems: entry.scopeItems ?? [],
            outOfScopeItems: entry.outOfScopeItems ?? [],
            completionCriteria: entry.completionCriteria ?? [],
            verificationCommands: entry.verificationCommands ?? [],
            openDiscussions: entry.openDiscussions ?? [],
            issues,
            affectedRequirements
        };
    });
    const uniqueAffected = new Set(changeSets.flatMap((cs) => cs.affectedRequirements.map((req) => req.id)));
    const statusCounts = changeSets.reduce((acc, cs) => {
        const key = cs.status || 'missing';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});
    const issues = [
        ...(changeSetsPayload.issues ?? []),
        ...changeSets.flatMap((cs) => cs.issues ?? []).filter((issue) => issue.ruleId === 'CHANGE-SET-AFFECTED-REQ-UNKNOWN')
    ];
    return {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        source: 'change-set-report',
        summary: {
            total: changeSets.length,
            active: changeSets.filter((cs) => cs.status === '진행중').length,
            planned: statusCounts['계획'] ?? 0,
            completed: statusCounts['완료'] ?? 0,
            onHold: statusCounts['보류'] ?? 0,
            affectedRequirements: uniqueAffected.size,
            openDiscussions: changeSets.reduce((sum, cs) => sum + cs.openDiscussions.length, 0),
            changeSetWarnings: changeSets.reduce((sum, cs) => sum + (cs.issues?.length ?? 0), 0)
        },
        traceAvailable: Boolean(tracePayload),
        issues,
        changeSets
    };
}

function listLines(lines, items, emptyText = '없음') {
    if (items.length === 0) {
        lines.push(`- ${emptyText}`);
        return;
    }
    for (const item of items) lines.push(`- ${item}`);
}

function issueLabel(issue) {
    const file = issue.location?.file ?? '';
    const line = issue.location?.line ? `:${issue.location.line}` : '';
    return `[${issue.ruleId}] ${issue.message}${file ? ` (${file}${line})` : ''}`;
}

function buildMarkdown(model) {
    const lines = ['# Change Set Report', ''];
    lines.push(`Generated: ${model.generatedAt}`, '');
    lines.push('## Summary', '');
    lines.push(`- Total change sets: ${model.summary.total}`);
    lines.push(`- Active: ${model.summary.active}`);
    lines.push(`- Planned: ${model.summary.planned}`);
    lines.push(`- Completed: ${model.summary.completed}`);
    lines.push(`- On hold: ${model.summary.onHold}`);
    lines.push(`- Affected requirements: ${model.summary.affectedRequirements}`);
    lines.push(`- Open discussions: ${model.summary.openDiscussions}`);
    lines.push(`- Change Set warnings: ${model.summary.changeSetWarnings}`);
    lines.push(`- Trace state available: ${model.traceAvailable ? 'yes' : 'no'}`);
    lines.push('');

    if (model.changeSets.length === 0) {
        lines.push('## Change Sets', '');
        lines.push('- No change sets');
        lines.push('');
        return lines.join('\n');
    }

    lines.push('## Change Sets', '');
    for (const changeSet of model.changeSets) {
        lines.push(`### ${changeSet.title}`, '');
        lines.push(`File: ${changeSet.file}`);
        lines.push(`Status: ${changeSet.status || 'missing'}`);
        lines.push(`Requested: ${changeSet.requestedDate || 'missing'}`);
        lines.push(`Change types: ${changeSet.changeTypes.join(', ') || 'missing'}`);
        lines.push(`Discussion: ${changeSet.discussionStatus || '없음'}`);
        lines.push('');

        lines.push('Report-only issues:');
        listLines(lines, (changeSet.issues ?? []).map(issueLabel));
        lines.push('');

        lines.push('Request summary:');
        listLines(lines, changeSet.requestSummary);
        lines.push('');

        lines.push('Affected requirements:');
        if (changeSet.affectedRequirements.length === 0) {
            lines.push('- 없음');
        } else {
            lines.push('');
            lines.push('| REQ | Title | Schema | Trace |');
            lines.push('| --- | --- | --- | --- |');
            for (const req of changeSet.affectedRequirements) {
                const schema = req.schemaStatus === 'unknown'
                    ? 'unknown'
                    : `${req.schemaStatus} (error=${req.schemaError}, warning=${req.schemaWarning})`;
                const trace = req.traceState === 'unknown'
                    ? 'unknown'
                    : `${req.traceState}${req.redReasonCount ? ` (redReasons=${req.redReasonCount})` : ''}`;
                lines.push(`| ${req.id} | ${req.title} | ${schema} | ${trace} |`);
            }
        }
        lines.push('');

        lines.push('Completion criteria:');
        listLines(lines, changeSet.completionCriteria);
        lines.push('');

        lines.push('Verification commands:');
        listLines(lines, changeSet.verificationCommands);
        lines.push('');

        lines.push('Open discussions:');
        listLines(lines, changeSet.openDiscussions);
        lines.push('');
    }
    return lines.join('\n');
}

function main() {
    const cli = parseCliArgs(process.argv.slice(2));
    const changeSetsPayload = readJsonRequired(changeSetsIndexPath);
    const requirementsPayloads = requirementIndexPaths()
        .map((file) => readJsonOptional(file))
        .filter(Boolean);
    const findingsPayload = readJsonOptional(cardFindingsPath);
    const tracePayload = readJsonOptional(traceStatePath);
    const model = buildModel(changeSetsPayload, requirementsPayloads, findingsPayload, tracePayload);
    const markdown = buildMarkdown(model);
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(reportMdPath, markdown);
    fs.writeFileSync(reportJsonPath, `${JSON.stringify(model, null, 2)}\n`);
    if (!cli.quiet) {
        console.log(`change-set-report.md: ${markdown.split('\n').length} line(s) → ${path.relative(workspaceRoot, reportMdPath)}`);
    }
}

main();
