#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const selfTestRoot = path.join(workspaceRoot, 'harness', 'self-test');
const outDir = path.join(workspaceRoot, 'build', 'harness', 'indexes');
const outFile = path.join(outDir, 'harness.self-test.index.json');

function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return entry.name.endsWith('.test.ts') ? [full] : [];
    });
}

function rel(file) {
    return path.relative(workspaceRoot, file).replace(/\\/g, '/');
}

function skipString(source, index) {
    const quote = source[index];
    let i = index + 1;
    while (i < source.length) {
        if (source[i] === '\\') {
            i += 2;
            continue;
        }
        if (quote === '`' && source[i] === '$' && source[i + 1] === '{') {
            throw new Error('Template interpolation is not supported in harnessTest metadata');
        }
        if (source[i] === quote) return i + 1;
        i += 1;
    }
    throw new Error('Unterminated string literal in harnessTest metadata');
}

function parseStringLiteral(source, index) {
    const quote = source[index];
    let value = '';
    let i = index + 1;
    while (i < source.length) {
        const ch = source[i];
        if (ch === '\\') {
            const next = source[i + 1];
            if (next === 'n') value += '\n';
            else if (next === 'r') value += '\r';
            else if (next === 't') value += '\t';
            else value += next;
            i += 2;
            continue;
        }
        if (quote === '`' && ch === '$' && source[i + 1] === '{') {
            throw new Error('Template interpolation is not supported in harnessTest metadata');
        }
        if (ch === quote) return { value, end: i + 1 };
        value += ch;
        i += 1;
    }
    throw new Error('Unterminated string literal in harnessTest metadata');
}

function skipLineComment(source, index) {
    const nl = source.indexOf('\n', index + 2);
    return nl === -1 ? source.length : nl + 1;
}

function skipBlockComment(source, index) {
    const end = source.indexOf('*/', index + 2);
    return end === -1 ? source.length : end + 2;
}

function findMatchingBrace(source, start) {
    let depth = 0;
    for (let i = start; i < source.length; i += 1) {
        const ch = source[i];
        if (ch === '"' || ch === '\'' || ch === '`') {
            i = skipString(source, i) - 1;
            continue;
        }
        if (ch === '/' && source[i + 1] === '/') {
            i = skipLineComment(source, i) - 1;
            continue;
        }
        if (ch === '/' && source[i + 1] === '*') {
            i = skipBlockComment(source, i) - 1;
            continue;
        }
        if (ch === '{') depth += 1;
        if (ch === '}') {
            depth -= 1;
            if (depth === 0) return i;
        }
    }
    throw new Error('Unmatched harnessTest metadata object');
}

function findHarnessTestObjects(source) {
    const objects = [];
    const marker = 'harnessTest';
    let offset = 0;
    while (offset < source.length) {
        const idx = source.indexOf(marker, offset);
        if (idx === -1) break;
        const before = source[idx - 1] ?? '';
        const after = source[idx + marker.length] ?? '';
        if (/[\w$]/.test(before) || /[\w$]/.test(after)) {
            offset = idx + marker.length;
            continue;
        }
        const paren = nextNonWhitespace(source, idx + marker.length);
        if (source[paren] !== '(') {
            offset = idx + marker.length;
            continue;
        }
        const brace = source.indexOf('{', paren);
        if (brace === -1) {
            offset = idx + marker.length;
            continue;
        }
        const end = findMatchingBrace(source, brace);
        objects.push(source.slice(brace, end + 1));
        offset = end + 1;
    }
    return objects;
}

function propertyStart(objectSource, property) {
    const regex = new RegExp(`\\b${property}\\s*:`);
    const match = regex.exec(objectSource);
    if (!match) return -1;
    return match.index + match[0].length;
}

function nextNonWhitespace(source, index) {
    let i = index;
    while (i < source.length && /\s/.test(source[i])) i += 1;
    return i;
}

function parseStringProperty(objectSource, property) {
    const start = propertyStart(objectSource, property);
    if (start === -1) return null;
    const i = nextNonWhitespace(objectSource, start);
    if (!['"', '\'', '`'].includes(objectSource[i])) {
        throw new Error(`${property} must be a string literal`);
    }
    return parseStringLiteral(objectSource, i).value;
}

function parseStringArrayProperty(objectSource, property) {
    const start = propertyStart(objectSource, property);
    if (start === -1) return [];
    let i = nextNonWhitespace(objectSource, start);
    if (objectSource[i] !== '[') throw new Error(`${property} must be a string array literal`);
    i += 1;
    const values = [];
    while (i < objectSource.length) {
        i = nextNonWhitespace(objectSource, i);
        if (objectSource[i] === ']') return values;
        if (!['"', '\'', '`'].includes(objectSource[i])) {
            throw new Error(`${property} contains a non-string element`);
        }
        const parsed = parseStringLiteral(objectSource, i);
        values.push(parsed.value);
        i = nextNonWhitespace(objectSource, parsed.end);
        if (objectSource[i] === ',') {
            i += 1;
            continue;
        }
        if (objectSource[i] === ']') return values;
        throw new Error(`${property} must separate string elements with commas`);
    }
    throw new Error(`Unterminated ${property} array`);
}

function lineNumber(source, offset) {
    return source.slice(0, offset).split('\n').length;
}

function parseFile(file) {
    const source = fs.readFileSync(file, 'utf8');
    const objects = findHarnessTestObjects(source);
    const repoFile = rel(file);
    return objects.map((objectSource) => {
        const requirement = parseStringProperty(objectSource, 'requirement');
        const name = parseStringProperty(objectSource, 'name');
        const covers = parseStringArrayProperty(objectSource, 'covers');
        if (!requirement || !name || covers.length === 0) {
            throw new Error(`${repoFile}: harnessTest metadata requires requirement, name, and covers`);
        }
        const objectOffset = source.indexOf(objectSource);
        const identity = `${repoFile} > ${name}`;
        return {
            kind: 'test',
            scope: 'harness',
            source: 'harness',
            runtime: 'node',
            requirements: [requirement],
            identity,
            displayName: name,
            covers,
            resultKeys: [name],
            location: {
                file: repoFile,
                line: lineNumber(source, objectOffset),
                identity
            },
            file: repoFile,
            line: lineNumber(source, objectOffset)
        };
    });
}

function main() {
    const entries = walk(selfTestRoot).sort().flatMap(parseFile);
    const payload = {
        generatedAt: new Date().toISOString(),
        schemaVersion: '1',
        source: 'harness.self-test.index',
        tests: entries,
        issues: []
    };
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`harness.self-test.index.json: ${entries.length} test(s)`);
}

main();
