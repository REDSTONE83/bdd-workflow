import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const terminologyDir = path.join(repoRoot, 'docs', 'terminology');
const domainsDir = path.join(terminologyDir, 'domains');
const draftPath = path.join(terminologyDir, 'draft.json');
const outputDir = path.join(repoRoot, 'build', 'harness');
const indexesDir = path.join(outputDir, 'indexes');
const findingsDir = path.join(outputDir, 'findings');
const reportsDir = path.join(outputDir, 'reports');
const indexPath = path.join(indexesDir, 'terminology.index.json');
const sourceIndexPath = path.join(indexesDir, 'backend.source-index.json');
const frontEndSourceIndexPath = path.join(indexesDir, 'front-end.source-index.json');
const reportJsonPath = path.join(findingsDir, 'terminology.findings.json');
const reportMdPath = path.join(reportsDir, 'terminology-report.md');
const requirementsDir = path.join(repoRoot, 'docs', 'requirements');

const TERM_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*){1,2}$/;
const NAME_CATEGORIES = ['java', 'method', 'field', 'column', 'table', 'json', 'path'];
const SCALAR_TERM_FIELDS = ['ko', 'en', 'meaning', 'note', 'reason'];

const STRICT_SEVERITY = {
    BAN_VIOLATION: 'error',
    UNKNOWN_TERM: 'error',
    INVALID_TERM_KEY: 'error',
    GLOSSARY_NAME_DUPLICATE: 'error',
    DRAFT_TERM: 'error',
    UNREGISTERED_CODE_NAME: 'warning',
    AMBIGUOUS_SURFACE: 'warning'
};

function severityFor(kind, mode) {
    const strict = STRICT_SEVERITY[kind] || 'warning';
    if (mode === 'strict') return strict;
    return 'warning';
}

function relativeToRepo(filePath) {
    return path.relative(repoRoot, filePath);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadTermsFromFile(filePath, status) {
    const diagnostics = [];
    const sourceFile = relativeToRepo(filePath);
    let parsed;
    try {
        parsed = readJson(filePath);
    } catch (err) {
        diagnostics.push({
            severity: 'error',
            kind: 'PARSE_ERROR',
            file: sourceFile,
            message: `JSON parse 실패: ${err.message}`
        });
        return { entries: [], diagnostics };
    }
    if (!parsed || typeof parsed !== 'object' || !parsed.terms || typeof parsed.terms !== 'object') {
        diagnostics.push({
            severity: 'error',
            kind: 'INVALID_STRUCTURE',
            file: sourceFile,
            message: 'top-level "terms" 객체가 없음'
        });
        return { entries: [], diagnostics };
    }
    const entries = [];
    for (const [key, term] of Object.entries(parsed.terms)) {
        if (!TERM_KEY_PATTERN.test(key)) {
            diagnostics.push({
                severity: 'error',
                kind: 'INVALID_KEY',
                file: sourceFile,
                term: key,
                message: `key 형식 위반 (${key})`
            });
        }
        for (const required of ['ko', 'en', 'meaning']) {
            if (typeof term[required] !== 'string' || term[required].length === 0) {
                diagnostics.push({
                    severity: 'error',
                    kind: 'MISSING_FIELD',
                    file: sourceFile,
                    term: key,
                    message: `필수 필드 ${required} 누락`
                });
            }
        }
        if (term.names && typeof term.names === 'object') {
            for (const category of Object.keys(term.names)) {
                if (!NAME_CATEGORIES.includes(category)) {
                    diagnostics.push({
                        severity: 'error',
                        kind: 'UNKNOWN_CATEGORY',
                        file: sourceFile,
                        term: key,
                        message: `허용되지 않는 names 카테고리 (${category})`
                    });
                }
            }
        }
        entries.push({ key, status, sourceFile, term });
    }
    return { entries, diagnostics };
}

function loadTerminology() {
    const diagnostics = [];
    const byKey = new Map();

    function addEntries(entries) {
        for (const entry of entries) {
            const existing = byKey.get(entry.key);
            if (existing) {
                const crossStatus = existing.status !== entry.status;
                diagnostics.push({
                    severity: 'error',
                    kind: crossStatus ? 'KEY_IN_BOTH_DOMAIN_AND_DRAFT' : 'KEY_DUPLICATE_FILES',
                    term: entry.key,
                    files: [existing.sourceFile, entry.sourceFile],
                    message: crossStatus
                        ? `${entry.key}이 ${existing.sourceFile}와 ${entry.sourceFile}에 동시에 존재`
                        : `${entry.key}이 ${existing.sourceFile}와 ${entry.sourceFile}에 중복 정의`
                });
                continue;
            }
            byKey.set(entry.key, entry);
        }
    }

    if (fs.existsSync(domainsDir)) {
        const files = fs.readdirSync(domainsDir)
            .filter((f) => f.endsWith('.json'))
            .sort();
        for (const file of files) {
            const result = loadTermsFromFile(path.join(domainsDir, file), 'approved');
            diagnostics.push(...result.diagnostics);
            addEntries(result.entries);
        }
    }

    if (fs.existsSync(draftPath)) {
        const result = loadTermsFromFile(draftPath, 'draft');
        diagnostics.push(...result.diagnostics);
        addEntries(result.entries);
    }

    return { entries: Array.from(byKey.values()), diagnostics };
}

function normalize(s) {
    if (s == null) return '';
    return String(s).toLowerCase().replace(/[\s_\-]/g, '');
}

function collectSurfaces(entry) {
    const surfaces = [];
    const t = entry.term;
    if (typeof t.ko === 'string') surfaces.push({ value: t.ko, kind: 'canonical-ko' });
    if (typeof t.en === 'string') surfaces.push({ value: t.en, kind: 'canonical-en' });
    if (Array.isArray(t.allow)) {
        for (const s of t.allow) surfaces.push({ value: s, kind: 'alias' });
    }
    if (Array.isArray(t.ban)) {
        for (const s of t.ban) surfaces.push({ value: s, kind: 'banned' });
    }
    if (t.names && typeof t.names === 'object') {
        for (const [category, names] of Object.entries(t.names)) {
            if (!Array.isArray(names)) continue;
            for (const name of names) {
                surfaces.push({ value: name, kind: 'code-name', category });
            }
        }
    }
    return surfaces;
}

function buildIndex(loaded) {
    const surfaceIndex = {};
    const codeNameIndex = {};
    const nameDuplicates = [];
    const termSummaries = {};
    const counts = { approved: 0, draft: 0 };

    function pushSurface(term, kind, surface, category) {
        const norm = normalize(surface);
        if (!norm) return;
        if (!surfaceIndex[norm]) surfaceIndex[norm] = [];
        const entry = { term, kind, surface };
        if (category) entry.category = category;
        surfaceIndex[norm].push(entry);
    }

    for (const entry of loaded.entries) {
        const { key, term, status, sourceFile } = entry;
        counts[status] = (counts[status] || 0) + 1;

        const summary = {
            status,
            sourceFile,
            ko: term.ko,
            en: term.en,
            meaning: term.meaning,
            allow: Array.isArray(term.allow) ? term.allow.slice() : [],
            ban: Array.isArray(term.ban) ? term.ban.slice() : [],
            names: {}
        };
        if (typeof term.note === 'string') summary.note = term.note;

        if (typeof term.ko === 'string') pushSurface(key, 'canonical-ko', term.ko);
        if (typeof term.en === 'string') pushSurface(key, 'canonical-en', term.en);
        for (const surface of summary.allow) pushSurface(key, 'alias', surface);
        for (const surface of summary.ban) pushSurface(key, 'banned', surface);

        if (term.names && typeof term.names === 'object') {
            for (const [category, names] of Object.entries(term.names)) {
                if (!Array.isArray(names)) continue;
                summary.names[category] = names.slice();
                for (const name of names) {
                    pushSurface(key, 'code-name', name, category);
                    if (!codeNameIndex[category]) codeNameIndex[category] = {};
                    if (!codeNameIndex[category][name]) codeNameIndex[category][name] = [];
                    codeNameIndex[category][name].push(key);
                }
            }
        }

        termSummaries[key] = summary;
    }

    for (const [category, byName] of Object.entries(codeNameIndex)) {
        for (const [name, terms] of Object.entries(byName)) {
            if (terms.length > 1) {
                nameDuplicates.push({ category, name, terms: terms.slice() });
            }
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        counts,
        terms: termSummaries,
        surfaceIndex,
        codeNameIndex,
        nameDuplicates
    };
}

function reportDiagnostics(diagnostics) {
    const errors = diagnostics.filter((d) => d.severity === 'error');
    if (errors.length === 0) return false;
    for (const err of errors) {
        const where = err.term ? ` term=${err.term}` : '';
        const file = err.file ? ` file=${err.file}` : '';
        console.error(`  [${err.kind}]${where}${file} ${err.message}`);
    }
    return true;
}

function commandIndex() {
    const loaded = loadTerminology();
    if (reportDiagnostics(loaded.diagnostics)) {
        console.error('Terminology 로딩 실패. 위 오류를 정리한 뒤 다시 실행하라.');
        process.exit(1);
    }
    const index = buildIndex(loaded);
    fs.mkdirSync(indexesDir, { recursive: true });
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
    console.log(`Wrote ${relativeToRepo(indexPath)}`);
    console.log(`  approved: ${index.counts.approved}, draft: ${index.counts.draft}, name duplicates: ${index.nameDuplicates.length}`);
    for (const dup of index.nameDuplicates) {
        console.log(`  duplicate ${dup.category}.${dup.name}: ${dup.terms.join(', ')}`);
    }
}

function commandSearch(rawQuery) {
    if (!rawQuery || rawQuery.trim() === '') {
        console.error('Usage: node tools/harness/terminology.mjs search <query>');
        process.exit(2);
    }
    const loaded = loadTerminology();
    if (loaded.diagnostics.some((d) => d.severity === 'error')) {
        console.error('주의: 용어 파일에 오류가 있다. 검색은 계속 진행한다.');
        reportDiagnostics(loaded.diagnostics);
        console.error('');
    }
    const query = rawQuery.trim();
    const q = normalize(query);
    const matchesByTerm = new Map();

    function pushMatch(entry, item) {
        if (!matchesByTerm.has(entry.key)) {
            matchesByTerm.set(entry.key, { entry, items: [] });
        }
        matchesByTerm.get(entry.key).items.push(item);
    }

    for (const entry of loaded.entries) {
        const exactKeyMatch = normalize(entry.key) === q;
        if (exactKeyMatch) {
            pushMatch(entry, { value: entry.key, kind: 'term-key' });
        }
        for (const surface of collectSurfaces(entry)) {
            const norm = normalize(surface.value);
            if (!norm) continue;
            const substringMatch = norm.includes(q) || q.includes(norm);
            if (exactKeyMatch || substringMatch) {
                pushMatch(entry, surface);
            }
        }
    }

    if (matchesByTerm.size === 0) {
        console.log(`No matches for "${query}".`);
        return;
    }

    console.log(`Query: "${query}" (normalized: "${q}")`);
    console.log(`Matches: ${matchesByTerm.size} term(s)`);
    for (const { entry, items } of matchesByTerm.values()) {
        console.log('');
        console.log(`${entry.key} [${entry.status}]`);
        for (const item of items) {
            const kindLabel = item.category ? `${item.kind}:${item.category}` : item.kind;
            console.log(`  ${kindLabel.padEnd(22)} "${item.value}"`);
        }
        console.log(`  source: ${entry.sourceFile}`);
    }
}

function loadRequirementCards() {
    if (!fs.existsSync(requirementsDir)) return [];
    const files = fs.readdirSync(requirementsDir)
        .filter((f) => f.endsWith('.md'))
        .sort();
    return files.map((file) => {
        const fullPath = path.join(requirementsDir, file);
        const body = fs.readFileSync(fullPath, 'utf8');
        return parseRequirementCard(body, relativeToRepo(fullPath));
    });
}

function parseRequirementCard(body, file) {
    const lines = body.split(/\r?\n/);
    let requirementId = '';
    const declaredTerms = [];
    const declaredTermLines = {};
    const invalidTermBullets = [];
    let inStandardTermsSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const idMatch = line.match(/^요건 ID:\s*(\S+)/);
        if (idMatch && !requirementId) {
            requirementId = idMatch[1];
            continue;
        }
        if (/^##\s+표준 용어\s*$/.test(line)) {
            inStandardTermsSection = true;
            continue;
        }
        if (inStandardTermsSection && /^##\s+/.test(line)) {
            inStandardTermsSection = false;
            continue;
        }
        if (inStandardTermsSection) {
            const bullet = line.match(/^-\s+(.+?)\s*$/);
            if (bullet) {
                const raw = bullet[1].trim();
                if (TERM_KEY_PATTERN.test(raw)) {
                    declaredTerms.push(raw);
                    declaredTermLines[raw] = i + 1;
                } else {
                    invalidTermBullets.push({ raw, line: i + 1 });
                }
            }
        }
    }
    return { file, requirementId, declaredTerms, declaredTermLines, invalidTermBullets, body };
}

function stripFencedCode(text) {
    return text.replace(/```[\s\S]*?```/g, (match) => match.replace(/[^\n]/g, ' '));
}

function lineFromIndex(text, position) {
    let line = 1;
    for (let i = 0; i < position && i < text.length; i++) {
        if (text[i] === '\n') line++;
    }
    return line;
}

function collectAllowSurfaces(index) {
    const set = new Set();
    for (const summary of Object.values(index.terms)) {
        if (summary.ko) set.add(summary.ko);
        if (summary.en) set.add(summary.en);
        for (const s of summary.allow || []) set.add(s);
        for (const names of Object.values(summary.names || {})) {
            for (const n of names) set.add(n);
        }
    }
    return Array.from(set).filter((s) => s.length > 0);
}

function collectBanSurfaces(index) {
    const map = new Map();
    for (const [key, summary] of Object.entries(index.terms)) {
        for (const s of summary.ban || []) {
            if (!map.has(s)) map.set(s, []);
            map.get(s).push(key);
        }
    }
    return map;
}

function findBanViolations(text, banSurfaces, allowSurfaces) {
    if (!text) return [];
    const allowRanges = [];
    for (const allow of allowSurfaces) {
        let idx = text.indexOf(allow);
        while (idx !== -1) {
            allowRanges.push([idx, idx + allow.length]);
            idx = text.indexOf(allow, idx + 1);
        }
    }
    function isCovered(start, end) {
        return allowRanges.some(([s, e]) => s <= start && e >= end);
    }
    const findings = [];
    for (const [ban, originTerms] of banSurfaces) {
        let idx = text.indexOf(ban);
        while (idx !== -1) {
            const end = idx + ban.length;
            if (!isCovered(idx, end)) {
                findings.push({ surface: ban, originTerms: originTerms.slice(), position: idx });
            }
            idx = text.indexOf(ban, idx + 1);
        }
    }
    return findings;
}

function collectAmbiguousSurfaces(index) {
    const ambiguous = [];
    for (const entries of Object.values(index.surfaceIndex || {})) {
        const candidates = new Set();
        let representative = '';
        for (const e of entries) {
            if (e.kind === 'canonical-ko' || e.kind === 'canonical-en' || e.kind === 'alias') {
                candidates.add(e.term);
                if (!representative) representative = e.surface;
            }
        }
        if (candidates.size > 1) {
            ambiguous.push({ surface: representative, candidates: Array.from(candidates) });
        }
    }
    return ambiguous;
}

function findAmbiguousSurfaceMatches(text, ambiguousSurfaces) {
    if (!text) return [];
    const findings = [];
    for (const { surface, candidates } of ambiguousSurfaces) {
        let idx = text.indexOf(surface);
        while (idx !== -1) {
            findings.push({ surface, candidates: candidates.slice(), position: idx });
            idx = text.indexOf(surface, idx + 1);
        }
    }
    return findings;
}

function collectCodeNames(sIndex) {
    const out = [];
    for (const e of sIndex.entities || []) {
        out.push({ category: 'java', name: e.className, file: e.file, line: 0, source: e.className, requirements: e.requirements || [], channel: 'entity-class' });
        out.push({ category: 'table', name: e.table, file: e.file, line: 0, source: e.className, requirements: e.requirements || [], channel: 'entity-table' });
        for (const c of e.columns || []) {
            out.push({ category: 'field', name: c.fieldName, file: e.file, line: 0, source: e.className + '.' + c.fieldName, requirements: c.requirements || [], channel: 'entity-field' });
            out.push({ category: 'column', name: c.columnName, file: e.file, line: 0, source: e.className + '.' + c.fieldName, requirements: c.requirements || [], channel: 'entity-column' });
        }
    }
    for (const d of sIndex.dtos || []) {
        out.push({ category: 'java', name: d.className, file: d.file, line: d.schemaLine || 0, source: d.className, requirements: d.requirements || [], channel: 'dto-class' });
        for (const f of d.fields || []) {
            out.push({ category: 'field', name: f.name, file: d.file, line: f.line, source: d.className + '.' + f.name, requirements: d.requirements || [], channel: 'dto-field' });
            out.push({ category: 'json', name: f.name, file: d.file, line: f.line, source: d.className + '.' + f.name, requirements: d.requirements || [], channel: 'dto-json' });
        }
    }
    for (const a of sIndex.apis || []) {
        const dotIdx = a.controller.indexOf('.');
        const className = dotIdx >= 0 ? a.controller.slice(0, dotIdx) : a.controller;
        const methodName = dotIdx >= 0 ? a.controller.slice(dotIdx + 1) : '';
        out.push({ category: 'java', name: className, file: a.file, line: 0, source: a.controller, requirements: a.requirements || [], channel: 'controller-class' });
        if (methodName) {
            out.push({ category: 'method', name: methodName, file: a.file, line: 0, source: a.controller, requirements: a.requirements || [], channel: 'controller-method' });
        }
        const httpParts = a.http.split(' ');
        const httpPath = httpParts.length > 1 ? httpParts[1] : '';
        const segments = httpPath.split('/').filter((s) => s && !s.startsWith('{'));
        for (const seg of segments) {
            out.push({ category: 'path', name: seg, file: a.file, line: 0, source: a.controller, requirements: a.requirements || [], channel: 'controller-path' });
        }
    }
    const seen = new Map();
    for (const cn of out) {
        const key = `${cn.category}::${cn.name}`;
        if (!seen.has(key)) seen.set(key, cn);
    }
    return Array.from(seen.values());
}

function summarizeCounts(findings, index) {
    const counts = { error: 0, warning: 0, strictError: 0, termApproved: 0, termDraft: 0 };
    for (const f of findings) {
        if (f.severity === 'error') counts.error++;
        else if (f.severity === 'warning') counts.warning++;
        if (f.strictSeverity === 'error') counts.strictError++;
    }
    for (const summary of Object.values(index.terms)) {
        if (summary.status === 'approved') counts.termApproved++;
        else if (summary.status === 'draft') counts.termDraft++;
    }
    return counts;
}

function extractTermStatus(index) {
    const out = {};
    for (const [key, summary] of Object.entries(index.terms)) {
        out[key] = summary.status;
    }
    return out;
}

function extractCardTerms(cards) {
    const out = {};
    for (const card of cards) {
        if (card.requirementId) out[card.requirementId] = card.declaredTerms.slice();
    }
    return out;
}

function renderReportMd(report) {
    const lines = [];
    lines.push('# Terminology Report');
    lines.push('');
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push(`Mode: ${report.mode}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Findings: error=${report.counts.error}, warning=${report.counts.warning}, strictError=${report.counts.strictError}`);
    lines.push(`- Terms: approved=${report.counts.termApproved}, draft=${report.counts.termDraft}`);
    lines.push('');

    const byKind = {};
    for (const f of report.findings) {
        if (!byKind[f.kind]) byKind[f.kind] = [];
        byKind[f.kind].push(f);
    }
    const kindOrder = [
        'BAN_VIOLATION',
        'INVALID_TERM_KEY',
        'UNKNOWN_TERM',
        'GLOSSARY_NAME_DUPLICATE',
        'DRAFT_TERM',
        'UNREGISTERED_CODE_NAME',
        'AMBIGUOUS_SURFACE'
    ];
    for (const kind of kindOrder) {
        const items = byKind[kind] || [];
        if (items.length === 0) continue;
        lines.push(`## ${kind} (${items.length})`);
        lines.push('');
        for (const f of items) {
            const loc = f.location
                ? `${f.location.file || ''}${f.location.line ? ':' + f.location.line : ''}${f.location.channel ? ' [' + f.location.channel + ']' : ''}`
                : '';
            const term = f.term ? ` ${f.term}` : (f.originTerms ? ` (${f.originTerms.join(', ')})` : '');
            const surface = f.surface ? ` "${f.surface}"` : '';
            const candidates = f.candidates ? ` → ${f.candidates.join(', ')}` : '';
            const sevLabel = f.severity === f.strictSeverity
                ? f.severity
                : `${f.severity}/strict:${f.strictSeverity}`;
            lines.push(`- [${sevLabel}]${term}${surface}${candidates} — ${loc}`);
            if (f.source) lines.push(`  source: ${f.source}`);
            if (f.message) lines.push(`  ${f.message}`);
        }
        lines.push('');
    }

    lines.push('## Term Status');
    lines.push('');
    for (const [key, status] of Object.entries(report.termStatus).sort()) {
        lines.push(`- ${key}: ${status}`);
    }
    lines.push('');

    lines.push('## Card Standard Terms');
    lines.push('');
    for (const [req, terms] of Object.entries(report.cardTerms)) {
        lines.push(`- ${req}: ${terms.length === 0 ? '(empty)' : terms.join(', ')}`);
    }
    lines.push('');
    return lines.join('\n');
}

function commandValidate(options) {
    const mode = (options && options.mode === 'strict') ? 'strict' : 'safe';
    const loaded = loadTerminology();
    if (reportDiagnostics(loaded.diagnostics)) {
        console.error('Terminology 로딩 실패. 위 오류를 정리한 뒤 다시 실행하라.');
        process.exit(1);
    }
    const index = buildIndex(loaded);

    if (!fs.existsSync(sourceIndexPath)) {
        console.error(`Missing ${relativeToRepo(sourceIndexPath)}. 먼저 ./gradlew generateHarnessSourceIndex 를 실행하라.`);
        process.exit(1);
    }
    const sIndex = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));
    const feIndex = fs.existsSync(frontEndSourceIndexPath)
        ? JSON.parse(fs.readFileSync(frontEndSourceIndexPath, 'utf8'))
        : { textChannels: [] };
    const cards = loadRequirementCards();
    const findings = [];

    function pushFinding(kind, base) {
        findings.push({
            kind,
            severity: severityFor(kind, mode),
            strictSeverity: STRICT_SEVERITY[kind] || 'warning',
            ...base
        });
    }

    for (const card of cards) {
        for (const invalid of card.invalidTermBullets || []) {
            pushFinding('INVALID_TERM_KEY', {
                surface: invalid.raw,
                location: { file: card.file, line: invalid.line, channel: 'requirement-card.standardTerms' },
                source: card.requirementId,
                requirements: card.requirementId ? [card.requirementId] : [],
                message: `표준 용어 bullet "${invalid.raw}"이 term key 형식({domain}.{concept}[.{subConcept}])에 맞지 않는다.`
            });
        }
        for (const termKey of card.declaredTerms) {
            const summary = index.terms[termKey];
            const line = card.declaredTermLines[termKey] || 0;
            if (!summary) {
                pushFinding('UNKNOWN_TERM', {
                    term: termKey,
                    location: { file: card.file, line, channel: 'requirement-card.standardTerms' },
                    source: card.requirementId,
                    requirements: card.requirementId ? [card.requirementId] : [],
                    message: `카드의 표준 용어 ${termKey}이 어디에도 정의되어 있지 않다.`
                });
            } else if (summary.status === 'draft') {
                pushFinding('DRAFT_TERM', {
                    term: termKey,
                    location: { file: card.file, line, channel: 'requirement-card.standardTerms' },
                    source: card.requirementId,
                    requirements: card.requirementId ? [card.requirementId] : [],
                    message: `${termKey}은 draft 상태다. 최종 검증(strict)까지 남으면 error로 보고된다.`
                });
            }
        }
    }

    for (const dup of index.nameDuplicates || []) {
        pushFinding('GLOSSARY_NAME_DUPLICATE', {
            originTerms: dup.terms,
            surface: dup.name,
            location: { channel: 'glossary' },
            requirements: [],
            message: `${dup.category}.${dup.name}이 ${dup.terms.join(', ')}에 중복 등록되어 있다.`
        });
    }

    const allowSurfaces = collectAllowSurfaces(index);
    const banSurfaces = collectBanSurfaces(index);
    const ambiguousSurfaces = collectAmbiguousSurfaces(index);

    for (const card of cards) {
        const stripped = stripFencedCode(card.body);
        const banFindings = findBanViolations(stripped, banSurfaces, allowSurfaces);
        for (const bf of banFindings) {
            pushFinding('BAN_VIOLATION', {
                originTerms: bf.originTerms,
                surface: bf.surface,
                location: { file: card.file, line: lineFromIndex(stripped, bf.position), channel: 'requirement-card' },
                source: card.requirementId,
                requirements: card.requirementId ? [card.requirementId] : [],
                message: `금지 표현 "${bf.surface}" 사용. ${bf.originTerms.join(', ')} 참고.`
            });
        }
        const ambFindings = findAmbiguousSurfaceMatches(stripped, ambiguousSurfaces);
        for (const af of ambFindings) {
            pushFinding('AMBIGUOUS_SURFACE', {
                surface: af.surface,
                candidates: af.candidates,
                location: { file: card.file, line: lineFromIndex(stripped, af.position), channel: 'requirement-card' },
                source: card.requirementId,
                requirements: card.requirementId ? [card.requirementId] : [],
                message: `"${af.surface}"이 여러 term을 가리킨다.`
            });
        }
    }

    for (const ch of [...(sIndex.textChannels || []), ...(feIndex.textChannels || [])]) {
        const banFindings = findBanViolations(ch.content, banSurfaces, allowSurfaces);
        for (const bf of banFindings) {
            pushFinding('BAN_VIOLATION', {
                originTerms: bf.originTerms,
                surface: bf.surface,
                location: { file: ch.file, line: ch.line, channel: ch.channel },
                source: ch.source,
                requirements: ch.requirements || [],
                message: `금지 표현 "${bf.surface}" 사용. ${bf.originTerms.join(', ')} 참고.`
            });
        }
        const ambFindings = findAmbiguousSurfaceMatches(ch.content, ambiguousSurfaces);
        for (const af of ambFindings) {
            pushFinding('AMBIGUOUS_SURFACE', {
                surface: af.surface,
                candidates: af.candidates,
                location: { file: ch.file, line: ch.line, channel: ch.channel },
                source: ch.source,
                requirements: ch.requirements || [],
                message: `"${af.surface}"이 여러 term을 가리킨다.`
            });
        }
    }

    const codeNames = collectCodeNames(sIndex);
    for (const cn of codeNames) {
        const byCategory = index.codeNameIndex[cn.category] || {};
        const terms = byCategory[cn.name] || [];
        if (terms.length === 0) {
            pushFinding('UNREGISTERED_CODE_NAME', {
                surface: cn.name,
                location: { file: cn.file, line: cn.line, channel: cn.channel },
                source: cn.source,
                requirements: cn.requirements,
                message: `${cn.category}.${cn.name}이 어떤 term의 names에도 등록되어 있지 않다.`
            });
        }
    }

    const counts = summarizeCounts(findings, index);
    const report = {
        generatedAt: new Date().toISOString(),
        mode,
        counts,
        findings,
        termStatus: extractTermStatus(index),
        cardTerms: extractCardTerms(cards)
    };

    fs.mkdirSync(findingsDir, { recursive: true });
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(reportMdPath, renderReportMd(report));
    console.log(`Wrote ${relativeToRepo(reportJsonPath)}`);
    console.log(`Wrote ${relativeToRepo(reportMdPath)}`);
    console.log(`  mode: ${report.mode}, error: ${counts.error}, warning: ${counts.warning}, strictError: ${counts.strictError}, terms: approved=${counts.termApproved} draft=${counts.termDraft}`);
    if (mode === 'safe' && counts.strictError > 0) {
        console.log(`  safe mode: strict로 검증하면 error=${counts.strictError}이 된다.`);
    }

    if (mode === 'strict' && counts.error > 0) {
        process.exit(1);
    }
}

function parseFlags(argv) {
    const positional = [];
    const flags = {};
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (token.startsWith('--')) {
            const name = token.slice(2);
            const next = argv[i + 1];
            if (next === undefined || next.startsWith('--')) {
                if (!flags[name]) flags[name] = [];
                flags[name].push(true);
            } else {
                if (!flags[name]) flags[name] = [];
                flags[name].push(next);
                i++;
            }
        } else {
            positional.push(token);
        }
    }
    return { positional, flags };
}

function requireSingle(flags, name) {
    const vals = flags[name];
    if (!vals || vals.length === 0) {
        throw new Error(`필수 옵션 누락: --${name}`);
    }
    if (vals.length > 1) {
        throw new Error(`--${name}은 한 번만 지정할 수 있다.`);
    }
    if (vals[0] === true) {
        throw new Error(`--${name}에 값이 필요하다.`);
    }
    return vals[0];
}

function optionalSingle(flags, name) {
    const vals = flags[name];
    if (!vals || vals.length === 0) return undefined;
    if (vals.length > 1) {
        throw new Error(`--${name}은 한 번만 지정할 수 있다.`);
    }
    if (vals[0] === true) {
        throw new Error(`--${name}에 값이 필요하다.`);
    }
    return vals[0];
}

function multi(flags, name) {
    const vals = flags[name];
    if (!vals) return [];
    return vals.filter((v) => v !== true);
}

function booleanFlag(flags, name) {
    return Array.isArray(flags[name]) && flags[name].length > 0;
}

function rejectUnknownFlags(flags, allowed, context) {
    const unknown = Object.keys(flags).filter((name) => !allowed.includes(name));
    if (unknown.length > 0) {
        throw new Error(`${context}에서 알 수 없는 옵션: ${unknown.map((n) => '--' + n).join(', ')}`);
    }
}

function rejectPositional(positional, expected, context) {
    if (positional.length !== expected) {
        throw new Error(`${context}는 위치 인자 ${expected}개를 기대한다. 받은 값: ${positional.length}개${positional.length > 0 ? ' (' + positional.join(', ') + ')' : ''}`);
    }
}

function parseCategoryValue(spec, flagName) {
    const eq = spec.indexOf('=');
    if (eq < 0) {
        throw new Error(`--${flagName} 형식이 잘못됨: "${spec}". category=value로 적어라.`);
    }
    const category = spec.slice(0, eq).trim();
    const value = spec.slice(eq + 1);
    if (!NAME_CATEGORIES.includes(category)) {
        throw new Error(`알 수 없는 names 카테고리 "${category}". 허용: ${NAME_CATEGORIES.join(', ')}`);
    }
    if (!value) {
        throw new Error(`--${flagName} "${spec}"의 값이 비어 있다.`);
    }
    return { category, value };
}

function parseSetSpec(spec) {
    const eq = spec.indexOf('=');
    if (eq < 0) {
        throw new Error(`--set 형식이 잘못됨: "${spec}". field=value로 적어라.`);
    }
    const field = spec.slice(0, eq).trim();
    const value = spec.slice(eq + 1);
    if (!SCALAR_TERM_FIELDS.includes(field)) {
        throw new Error(`--set은 ${SCALAR_TERM_FIELDS.join(', ')}만 지원한다. (${field})`);
    }
    if (value.length === 0) {
        throw new Error(`--set ${field}의 값이 비어 있다.`);
    }
    return { field, value };
}

function readDraftFileOrThrow() {
    if (!fs.existsSync(draftPath)) {
        throw new Error(`${relativeToRepo(draftPath)}가 존재하지 않는다.`);
    }
    const raw = fs.readFileSync(draftPath, 'utf8');
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        throw new Error(`${relativeToRepo(draftPath)} JSON parse 실패: ${err.message}`);
    }
    if (!parsed || typeof parsed !== 'object' || !parsed.terms || typeof parsed.terms !== 'object') {
        throw new Error(`${relativeToRepo(draftPath)}에 terms 객체가 없다.`);
    }
    return { raw, parsed };
}

function serializeValue(value, indent, level) {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        const items = value.map((item) => JSON.stringify(item));
        return '[' + items.join(', ') + ']';
    }
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    const childIndent = ' '.repeat((level + 1) * indent);
    const closeIndent = ' '.repeat(level * indent);
    const lines = keys.map((key) => `${childIndent}${JSON.stringify(key)}: ${serializeValue(value[key], indent, level + 1)}`);
    return '{\n' + lines.join(',\n') + '\n' + closeIndent + '}';
}

function serializeDraft(parsed) {
    return serializeValue(parsed, 4, 0) + '\n';
}

function applyDraftMutation(mutator) {
    const { raw, parsed } = readDraftFileOrThrow();
    mutator(parsed);
    fs.writeFileSync(draftPath, serializeDraft(parsed));
    const loaded = loadTerminology();
    const errors = loaded.diagnostics.filter((d) => d.severity === 'error');
    if (errors.length > 0) {
        fs.writeFileSync(draftPath, raw);
        for (const err of errors) {
            const where = err.term ? ` term=${err.term}` : '';
            const file = err.file ? ` file=${err.file}` : '';
            console.error(`  [${err.kind}]${where}${file} ${err.message}`);
        }
        throw new Error('변경 후 진단 오류가 발견되어 draft.json을 원상복구했다.');
    }
}

function ensureTermKeyNotTaken(termKey) {
    const loaded = loadTerminology();
    const existing = loaded.entries.find((e) => e.key === termKey);
    if (existing) {
        throw new Error(`${termKey}은 이미 ${existing.sourceFile}에 ${existing.status} 상태로 존재한다.`);
    }
    const blocking = loaded.diagnostics.filter((d) => d.severity === 'error');
    if (blocking.length > 0) {
        console.error('주의: 기존 용어 파일에 오류가 있다. 먼저 정리하라.');
        for (const err of blocking) {
            const where = err.term ? ` term=${err.term}` : '';
            const file = err.file ? ` file=${err.file}` : '';
            console.error(`  [${err.kind}]${where}${file} ${err.message}`);
        }
        throw new Error('terminology 로딩 진단 오류 때문에 추가를 중단한다.');
    }
}

function ensureDraftTermExists(parsed, termKey) {
    if (!parsed.terms[termKey]) {
        throw new Error(`${termKey}이 draft.json에 없다. draft 명령은 draft 상태 term에만 동작한다.`);
    }
}

const DRAFT_ADD_FLAGS = ['key', 'ko', 'en', 'meaning', 'reason', 'note', 'allow', 'ban', 'name'];
const DRAFT_UPDATE_FLAGS = ['set', 'add-allow', 'remove-allow', 'add-ban', 'remove-ban', 'add-name', 'remove-name'];
const DRAFT_DELETE_FLAGS = ['force'];

function commandDraftAdd(rest) {
    const { positional, flags } = parseFlags(rest);
    rejectPositional(positional, 0, 'draft add');
    rejectUnknownFlags(flags, DRAFT_ADD_FLAGS, 'draft add');
    const termKey = requireSingle(flags, 'key');
    if (!TERM_KEY_PATTERN.test(termKey)) {
        throw new Error(`term key 형식 위반: "${termKey}". {domain}.{concept}[.{subConcept}] 형식이어야 한다.`);
    }
    const ko = requireSingle(flags, 'ko');
    const en = requireSingle(flags, 'en');
    const meaning = requireSingle(flags, 'meaning');
    const reason = requireSingle(flags, 'reason');
    const note = optionalSingle(flags, 'note');
    const allow = multi(flags, 'allow');
    const ban = multi(flags, 'ban');
    const nameSpecs = multi(flags, 'name').map((s) => parseCategoryValue(s, 'name'));

    ensureTermKeyNotTaken(termKey);

    const term = { ko, en, meaning };
    if (allow.length > 0) term.allow = Array.from(new Set(allow));
    if (ban.length > 0) term.ban = Array.from(new Set(ban));
    if (nameSpecs.length > 0) {
        term.names = {};
        for (const { category, value } of nameSpecs) {
            if (!term.names[category]) term.names[category] = [];
            if (!term.names[category].includes(value)) term.names[category].push(value);
        }
    }
    if (note) term.note = note;
    term.reason = reason;

    applyDraftMutation((parsed) => {
        parsed.terms[termKey] = term;
    });
    console.log(`Added draft term ${termKey} to ${relativeToRepo(draftPath)}.`);
}

function commandDraftUpdate(rest) {
    const { positional, flags } = parseFlags(rest);
    rejectPositional(positional, 1, 'draft update');
    rejectUnknownFlags(flags, DRAFT_UPDATE_FLAGS, 'draft update');
    const termKey = positional[0];

    const setSpecs = multi(flags, 'set').map(parseSetSpec);
    const addAllow = multi(flags, 'add-allow');
    const removeAllow = multi(flags, 'remove-allow');
    const addBan = multi(flags, 'add-ban');
    const removeBan = multi(flags, 'remove-ban');
    const addName = multi(flags, 'add-name').map((s) => parseCategoryValue(s, 'add-name'));
    const removeName = multi(flags, 'remove-name').map((s) => parseCategoryValue(s, 'remove-name'));

    const hasAnyChange =
        setSpecs.length + addAllow.length + removeAllow.length +
        addBan.length + removeBan.length + addName.length + removeName.length > 0;
    if (!hasAnyChange) {
        throw new Error('변경 옵션이 없다. --set/--add-*/--remove-* 중 하나 이상을 지정하라.');
    }

    applyDraftMutation((parsed) => {
        ensureDraftTermExists(parsed, termKey);
        const term = parsed.terms[termKey];

        for (const { field, value } of setSpecs) {
            term[field] = value;
        }
        if (addAllow.length > 0 || removeAllow.length > 0) {
            const current = Array.isArray(term.allow) ? term.allow.slice() : [];
            for (const v of addAllow) if (!current.includes(v)) current.push(v);
            const filtered = current.filter((v) => !removeAllow.includes(v));
            if (filtered.length > 0) term.allow = filtered;
            else delete term.allow;
        }
        if (addBan.length > 0 || removeBan.length > 0) {
            const current = Array.isArray(term.ban) ? term.ban.slice() : [];
            for (const v of addBan) if (!current.includes(v)) current.push(v);
            const filtered = current.filter((v) => !removeBan.includes(v));
            if (filtered.length > 0) term.ban = filtered;
            else delete term.ban;
        }
        if (addName.length > 0 || removeName.length > 0) {
            const names = (term.names && typeof term.names === 'object') ? { ...term.names } : {};
            for (const { category, value } of addName) {
                const list = Array.isArray(names[category]) ? names[category].slice() : [];
                if (!list.includes(value)) list.push(value);
                names[category] = list;
            }
            for (const { category, value } of removeName) {
                if (!Array.isArray(names[category])) continue;
                const filtered = names[category].filter((v) => v !== value);
                if (filtered.length > 0) names[category] = filtered;
                else delete names[category];
            }
            if (Object.keys(names).length > 0) term.names = names;
            else delete term.names;
        }
    });
    console.log(`Updated draft term ${termKey} in ${relativeToRepo(draftPath)}.`);
}

function commandDraftDelete(rest) {
    const { positional, flags } = parseFlags(rest);
    rejectPositional(positional, 1, 'draft delete');
    rejectUnknownFlags(flags, DRAFT_DELETE_FLAGS, 'draft delete');
    const termKey = positional[0];
    const force = booleanFlag(flags, 'force');

    const referencing = loadRequirementCards().filter((card) => card.declaredTerms.includes(termKey));
    if (referencing.length > 0 && !force) {
        console.error(`${termKey}이 ${referencing.length}개 요건 카드의 표준 용어에 등록되어 있다.`);
        for (const card of referencing) {
            const id = card.requirementId || '(?)';
            const line = card.declaredTermLines[termKey] || '?';
            console.error(`  ${id} ${card.file}:${line}`);
        }
        console.error('카드에서 먼저 제거하거나 --force로 우회하라.');
        process.exit(1);
    }

    applyDraftMutation((parsed) => {
        ensureDraftTermExists(parsed, termKey);
        delete parsed.terms[termKey];
    });
    const refNote = referencing.length > 0 ? ` (${referencing.length}개 카드가 여전히 참조 중이다)` : '';
    console.log(`Deleted draft term ${termKey} from ${relativeToRepo(draftPath)}.${refNote}`);
}

function commandDraft(rest) {
    const sub = rest[0];
    const tail = rest.slice(1);
    try {
        switch (sub) {
            case 'add':
                commandDraftAdd(tail);
                break;
            case 'update':
                commandDraftUpdate(tail);
                break;
            case 'delete':
                commandDraftDelete(tail);
                break;
            default:
                console.error('Usage: node tools/harness/terminology.mjs draft <add|update|delete> [args]');
                console.error('  draft add     --key X --ko Y --en Z --meaning W --reason R [--note N] [--allow A]... [--ban B]... [--name cat=val]...');
                console.error('  draft update  <termKey> [--set field=value]... [--add-allow X]... [--remove-allow X]... [--add-ban X]... [--remove-ban X]... [--add-name cat=val]... [--remove-name cat=val]...');
                console.error('  draft delete  <termKey> [--force]');
                process.exit(2);
        }
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

const [, , command, ...args] = process.argv;
switch (command) {
    case 'index':
        commandIndex();
        break;
    case 'search':
        commandSearch(args.filter((a) => !a.startsWith('--')).join(' '));
        break;
    case 'validate': {
        const mode = args.includes('--strict') ? 'strict' : 'safe';
        commandValidate({ mode });
        break;
    }
    case 'draft':
        commandDraft(args);
        break;
    default:
        console.error('Usage: node tools/harness/terminology.mjs <index|search|validate|draft> [args]');
        console.error('  validate            safe (기본): 모든 finding을 warning으로 보고, 항상 exit 0');
        console.error('  validate --strict   strict: 심각 finding은 error, error가 있으면 exit 1');
        console.error('  draft <add|update|delete>  draft.json의 후보 용어 관리');
        process.exit(2);
}
