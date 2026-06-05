import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

export interface HarnessTestMetadata {
    requirement: string;
    name: string;
    covers: string[];
}

export interface CommandResult {
    status: number;
    output: string;
}

export interface FileBackup {
    target: string;
    backup: string | null;
    existed: boolean;
}

const supportDir = path.dirname(fileURLToPath(import.meta.url));

export const workspaceRoot = path.resolve(supportDir, '..', '..', '..');
export const indexesDir = path.join(workspaceRoot, 'build', 'harness', 'indexes');
export const findingsDir = path.join(workspaceRoot, 'build', 'harness', 'findings');
export const stateDir = path.join(workspaceRoot, 'build', 'harness', 'state');
export const reportsDir = path.join(workspaceRoot, 'build', 'harness', 'reports');

export const findingFiles = [
    'requirement-cards.findings.json',
    'cross-artifact.findings.json',
    'back-end-standards.findings.json',
    'front-end-standards.findings.json',
    'scenarios.findings.json',
    'terminology.findings.json'
];

const fileOwners = new Map([
    ['requirement-cards.findings.json', 'requirement-cards'],
    ['cross-artifact.findings.json', 'cross-artifact'],
    ['back-end-standards.findings.json', 'back-end-standards'],
    ['front-end-standards.findings.json', 'front-end-standards'],
    ['scenarios.findings.json', 'scenarios'],
    ['terminology.findings.json', 'terminology']
]);

export function harnessTest(metadata: HarnessTestMetadata, body: () => void | Promise<void>) {
    assert.match(metadata.requirement, /^REQ-\d{3,}$/);
    assert.ok(metadata.name.length > 0, 'harness test name is required');
    assert.ok(metadata.covers.length > 0, 'harness test covers at least one AC');

    test(metadata.name, async () => {
        await body();
    });
}

export function readText(file: string): string {
    return fs.readFileSync(file, 'utf8');
}

export function writeText(file: string, value: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value, 'utf8');
}

export function readJson(file: string): any {
    return JSON.parse(readText(file));
}

export function writeJson(file: string, value: any) {
    writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function tempDir(prefix = 'harness-self-test-'): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function runCommand(
    command: string,
    args: string[],
    options: { cwd?: string; timeoutMs?: number; allowNonZero?: boolean } = {}
): CommandResult {
    const result = spawnSync(command, args, {
        cwd: options.cwd ?? workspaceRoot,
        encoding: 'utf8',
        timeout: options.timeoutMs ?? 30_000,
        maxBuffer: 20 * 1024 * 1024
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    if (result.error) {
        throw new Error(`command failed to spawn: ${command} ${args.join(' ')}\n${result.error.message}\n${output}`);
    }
    const status = result.status ?? 1;
    if (!options.allowNonZero) {
        assert.equal(status, 0, `command exited ${status}: ${command} ${args.join(' ')}\n${output}`);
    }
    return { status, output };
}

export function runNodeTool(toolName: string, args: string[] = [], options: { allowNonZero?: boolean; timeoutMs?: number } = {}) {
    return runCommand(process.execPath, [path.join(workspaceRoot, 'harness', 'tools', toolName), ...args], {
        cwd: workspaceRoot,
        allowNonZero: options.allowNonZero,
        timeoutMs: options.timeoutMs
    });
}

export function runFrontEnd(args: string[], options: { timeoutMs?: number } = {}) {
    return runCommand(args[0], args.slice(1), {
        cwd: path.join(workspaceRoot, 'app', 'front-end'),
        timeoutMs: options.timeoutMs ?? 60_000
    });
}

export function backupFile(target: string): FileBackup {
    if (!fs.existsSync(target)) {
        return { target, backup: null, existed: false };
    }
    const backup = path.join(tempDir('harness-backup-'), path.basename(target));
    fs.copyFileSync(target, backup);
    return { target, backup, existed: true };
}

export function restoreFile(entry: FileBackup) {
    if (entry.existed && entry.backup) {
        fs.mkdirSync(path.dirname(entry.target), { recursive: true });
        fs.copyFileSync(entry.backup, entry.target);
        fs.rmSync(path.dirname(entry.backup), { recursive: true, force: true });
        return;
    }
    fs.rmSync(entry.target, { force: true });
}

export function withFileBackups<T>(targets: string[], body: () => T): T {
    const backups = targets.map(backupFile);
    try {
        return body();
    } finally {
        for (const backup of backups.reverse()) {
            restoreFile(backup);
        }
    }
}

export function emptyFrontEndSourceIndex() {
    return {
        generatedAt: '2026-05-23T00:00:00.000Z',
        schemaVersion: '1',
        source: 'front-end.source-index',
        pages: [],
        routes: [],
        stories: [],
        tests: [],
        apiCalls: [],
        textChannels: [],
        issues: []
    };
}

export function emptyFindingPayload(fileName: string) {
    if (fileName === 'terminology.findings.json') {
        return {
            generatedAt: '2026-05-23T00:00:00.000Z',
            schemaVersion: '1',
            mode: 'safe',
            counts: { error: 0, warning: 0, strictError: 0 },
            findings: []
        };
    }
    return {
        generatedAt: '2026-05-23T00:00:00.000Z',
        schemaVersion: '1',
        owner: fileOwners.get(fileName),
        summary: { error: 0, warning: 0, info: 0 },
        findings: []
    };
}

export function allCleanFindings() {
    return Object.fromEntries(findingFiles.map((file) => [file, emptyFindingPayload(file)]));
}

export function addFinding(findings: Record<string, any>, file: string, ruleId: string, severity: string, requirements: string[]) {
    findings[file].findings.push({
        ruleId,
        severity,
        strictSeverity: severity,
        requirements,
        message: `fixture finding ${ruleId}`
    });
}

export function addTerminologyFinding(
    findings: Record<string, any>,
    ruleId: string,
    severity: string,
    strictSeverity: string,
    requirements: string[]
) {
    findings['terminology.findings.json'].findings.push({
        ruleId,
        severity,
        strictSeverity,
        requirements,
        kind: ruleId,
        message: `fixture TRM finding ${ruleId}`
    });
}

export function stateWithCards(cards: Array<{ id: string; state: string }>) {
    const summary = {
        total: cards.length,
        red: cards.filter((card) => card.state === 'RED').length,
        green: cards.filter((card) => card.state === 'GREEN').length,
        blue: cards.filter((card) => card.state === 'BLUE').length
    };
    return {
        generatedAt: '2026-05-23T00:00:00.000Z',
        schemaVersion: '1',
        source: 'trace.state',
        flags: {},
        filter: null,
        summary,
        requirements: cards.map((card) => ({ id: card.id, state: card.state }))
    };
}

export function runGateFixture(
    state: any,
    findings: Record<string, any>,
    args: string[],
    options: { omitFile?: string } = {}
): CommandResult {
    const stateFile = path.join(stateDir, 'trace.state.json');
    const files = [stateFile, ...findingFiles.map((file) => path.join(findingsDir, file))];
    return withFileBackups(files, () => {
        writeJson(stateFile, state);
        for (const file of findingFiles) {
            const target = path.join(findingsDir, file);
            if (file === options.omitFile) {
                fs.rmSync(target, { force: true });
            } else {
                writeJson(target, findings[file] ?? emptyFindingPayload(file));
            }
        }
        return runNodeTool('gate.mjs', args, { allowNonZero: true });
    });
}

export function assertHasRule(findingsPath: string, ruleId: string, severity = 'error') {
    const findings = readJson(findingsPath).findings ?? [];
    assert.ok(
        findings.some((finding: any) => finding.ruleId === ruleId && finding.severity === severity),
        `${ruleId} finding with severity=${severity} was not present in ${JSON.stringify(findings)}`
    );
}

export function assertRuleSeverity(findingsPath: string, ruleId: string, severity: string) {
    assertHasRule(findingsPath, ruleId, severity);
}

export function array(values: string[]) {
    return [...values];
}
