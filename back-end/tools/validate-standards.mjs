import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const outputDir = path.join(backendRoot, 'build', 'harness');
const sourceIndexPath = path.join(outputDir, 'source-index.json');
const applicationYmlPath = path.join(backendRoot, 'src', 'main', 'resources', 'application.yml');
const bootApplicationPath = path.join(
    backendRoot,
    'src', 'main', 'java', 'com', 'example', 'bddworkflow', 'BddWorkflowApplication.java'
);

const args = new Set(process.argv.slice(2));
const checkMode = args.has('--check');

function relPath(absolute) {
    return path.relative(repoRoot, absolute);
}

if (!fs.existsSync(sourceIndexPath)) {
    console.error(
        `Missing source index: ${relPath(sourceIndexPath)}\n` +
        'Run ./gradlew generateHarnessSourceIndex first.'
    );
    process.exit(1);
}

const index = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));
const applicationYml = fs.existsSync(applicationYmlPath)
    ? fs.readFileSync(applicationYmlPath, 'utf8')
    : '';
const bootApplication = fs.existsSync(bootApplicationPath)
    ? fs.readFileSync(bootApplicationPath, 'utf8')
    : '';

const apis = index.apis ?? [];
const entities = index.entities ?? [];
const dtos = index.dtos ?? [];
const repositories = index.repositories ?? [];
const services = index.services ?? [];
const beans = index.beans ?? [];

// Raw JSON / map types that C5 rejects outright — we don't expect them to be DTOs.
const RAW_BODY_TYPES = new Set([
    'JsonNode', 'ObjectNode', 'ArrayNode', 'TreeNode',
    'Map', 'HashMap', 'LinkedHashMap', 'TreeMap',
    'String', 'Object',
]);

// PATCH DTO class names sourced from actual `@PatchMapping` body parameters.
// This is more reliable than name conventions like `Update*Request`.
const patchBodyDtoNames = new Set();
const patchBodyApiByName = new Map();
for (const api of apis) {
    if (!api.http.startsWith('PATCH ')) continue;
    for (const p of api.parameters ?? []) {
        // Only Spring's @RequestBody — Swagger's parameters.RequestBody is documentation-only
        // and must not be treated as the actual HTTP body.
        if (!p.springRequestBody) continue;
        const raw = (p.javaType ?? '').replace(/<.*$/, '').trim();
        if (!raw) continue;
        patchBodyDtoNames.add(raw);
        if (!patchBodyApiByName.has(raw)) patchBodyApiByName.set(raw, api);
    }
}

const findings = [];

function add(ruleId, severity, message, where = {}) {
    findings.push({
        ruleId,
        severity, // 'error' | 'warning'
        message,
        location: where,
    });
}

// D6: a PATCH @RequestBody type must be indexed as a DTO. Skip raw JSON / map noise
// (those are reported by C5).
for (const name of patchBodyDtoNames) {
    if (RAW_BODY_TYPES.has(name)) continue;
    if (dtos.some(d => d.className === name)) continue;
    const api = patchBodyApiByName.get(name);
    add('D6', 'error',
        `PATCH @RequestBody type "${name}" used by ${api?.controller ?? '?'} is not indexed as a DTO. ` +
        'Place the class under a `dto/` subpackage (or add @Schema) so the harness can enforce D4.',
        { file: api?.file, target: api?.controller, line: api?.line });
}

const FORBIDDEN_DATE_TYPES = new Set(['LocalDateTime', 'Date', 'Calendar', 'Timestamp']);

function isJsonNullable(typeStr) {
    return /^JsonNullable<.+>$/.test(typeStr ?? '');
}

function unwrapJsonNullable(typeStr) {
    if (typeStr == null) return typeStr;
    const m = typeStr.match(/^JsonNullable<(.+)>$/);
    return m ? m[1].trim() : typeStr;
}

// Read-name patterns: methods starting with these verbs are considered read-only operations.
const READ_METHOD_RE = /^(get|list|find|search|count|exists|has|load|fetch|view|read)([A-Z]|$)/;

// --- Entity rules ---

for (const entity of entities) {
    const file = entity.file;
    const cn = entity.className;
    const cols = entity.columns ?? [];
    const idCol = cols.find(c => c.primaryKey);

    // E1: @Id field type must be UUID
    if (idCol && idCol.javaType !== 'UUID') {
        add('E1', 'error',
            `Entity ${cn}: @Id field "${idCol.fieldName}" must be UUID (got ${idCol.javaType}).`,
            { file, target: cn });
    }

    // E2: No GenerationType.IDENTITY
    if (idCol && idCol.generation === 'IDENTITY') {
        add('E2', 'error',
            `Entity ${cn}: @Id field "${idCol.fieldName}" uses GenerationType.IDENTITY. ` +
            'UUID + @UuidGenerator(style = TIME) required (id-policy.md).',
            { file, target: cn });
    }

    // E3: createdAt present, Instant, @Column(nullable=false, updatable=false) explicit, @CreatedDate.
    const created = cols.find(c => c.fieldName === 'createdAt');
    if (!created) {
        add('E3', 'error',
            `Entity ${cn} missing audit column createdAt (Instant, @CreatedDate, @Column(nullable=false, updatable=false)).`,
            { file, target: cn });
    } else {
        if (created.javaType !== 'Instant') {
            add('E3', 'error',
                `Entity ${cn}: createdAt must be Instant (got ${created.javaType}).`,
                { file, target: cn });
        }
        if (created.nullable !== false) {
            add('E3', 'error',
                `Entity ${cn}: createdAt must declare @Column(nullable = false) explicitly (datetime.md).`,
                { file, target: cn });
        }
        if (created.updatable !== false) {
            add('E3', 'error',
                `Entity ${cn}: createdAt must declare @Column(updatable = false) so it stays immutable after insert (datetime.md).`,
                { file, target: cn });
        }
        if (!(created.annotations ?? []).includes('CreatedDate')) {
            add('E3', 'error',
                `Entity ${cn}: createdAt must be annotated with @CreatedDate so Spring Data JPA Auditing populates it (datetime.md).`,
                { file, target: cn });
        }
    }

    // E4: updatedAt present, Instant, @Column(nullable=false) explicit, @LastModifiedDate.
    const updated = cols.find(c => c.fieldName === 'updatedAt');
    if (!updated) {
        add('E4', 'error',
            `Entity ${cn} missing audit column updatedAt (Instant, @LastModifiedDate, @Column(nullable=false)).`,
            { file, target: cn });
    } else {
        if (updated.javaType !== 'Instant') {
            add('E4', 'error',
                `Entity ${cn}: updatedAt must be Instant (got ${updated.javaType}).`,
                { file, target: cn });
        }
        if (updated.nullable !== false) {
            add('E4', 'error',
                `Entity ${cn}: updatedAt must declare @Column(nullable = false) explicitly (datetime.md).`,
                { file, target: cn });
        }
        if (!(updated.annotations ?? []).includes('LastModifiedDate')) {
            add('E4', 'error',
                `Entity ${cn}: updatedAt must be annotated with @LastModifiedDate so Spring Data JPA Auditing updates it (datetime.md).`,
                { file, target: cn });
        }
    }

    // E5: @EntityListeners(AuditingEntityListener.class)
    const hasAuditingListener = (entity.listeners ?? [])
        .some(l => l === 'AuditingEntityListener');
    if (!hasAuditingListener) {
        add('E5', 'error',
            `Entity ${cn}: @EntityListeners(AuditingEntityListener.class) is required for audit columns.`,
            { file, target: cn });
    }

    // E6: Forbid legacy date types
    for (const col of cols) {
        if (FORBIDDEN_DATE_TYPES.has(col.javaType)) {
            add('E6', 'error',
                `Entity ${cn}: field "${col.fieldName}" uses forbidden type ${col.javaType}. ` +
                'Use Instant (datetime.md).',
                { file, target: `${cn}.${col.fieldName}` });
        }
    }

    // E7: Non-Id `*Id` columns must be UUID type (FK columns)
    for (const col of cols) {
        if (col.primaryKey) continue;
        if (/Id$/.test(col.fieldName) && col.javaType !== 'UUID') {
            add('E7', 'error',
                `Entity ${cn}: foreign-key field "${col.fieldName}" must be UUID (got ${col.javaType}).`,
                { file, target: `${cn}.${col.fieldName}` });
        }
    }
}

// --- DTO rules ---

const PATCH_DTO_NAME = /^Update[A-Z].*Request$/;

for (const dto of dtos) {
    const file = dto.file;
    const cn = dto.className;
    const fields = dto.fields ?? [];

    // D1: id-named fields are UUID (also enforced inside JsonNullable<T>)
    for (const f of fields) {
        if (!/Id$/.test(f.name)) continue;
        const inner = unwrapJsonNullable(f.javaType);
        // forbid raw JsonNullable without generic args (parse error or legacy)
        if (inner === 'JsonNullable') continue;
        // FORBIDDEN_DATE_TYPES handled by D3 instead
        if (FORBIDDEN_DATE_TYPES.has(inner)) continue;
        if (inner !== 'UUID') {
            add('D1', 'error',
                `DTO ${cn}: identifier field "${f.name}" must be UUID (got ${f.javaType}).`,
                { file, target: `${cn}.${f.name}` });
        }
    }

    // D2: timestamp-named fields must be Instant (also inside JsonNullable<T>)
    for (const f of fields) {
        const looksTimestamp = /At$/.test(f.name) || /Timestamp$/i.test(f.name);
        if (!looksTimestamp) continue;
        const inner = unwrapJsonNullable(f.javaType);
        if (inner === 'JsonNullable') continue;
        if (FORBIDDEN_DATE_TYPES.has(inner)) continue; // D3 reports
        if (inner !== 'Instant') {
            add('D2', 'error',
                `DTO ${cn}: timestamp field "${f.name}" must be Instant (got ${f.javaType}).`,
                { file, target: `${cn}.${f.name}` });
        }
    }

    // D3: forbid legacy date types (also inside JsonNullable<T>)
    for (const f of fields) {
        const inner = unwrapJsonNullable(f.javaType);
        if (FORBIDDEN_DATE_TYPES.has(inner)) {
            add('D3', 'error',
                `DTO ${cn}: field "${f.name}" uses forbidden type ${inner}. ` +
                'Use Instant (datetime.md).',
                { file, target: `${cn}.${f.name}` });
        }
    }

    // D5: ApiError DTO contract — code/message/status/timestamp/path/details[]
    //     details[].code mapping enforced inside ApiExceptionHandler (see textual scan F7).
    if (cn === 'ApiError') {
        const required = [
            ['code', 'String'],
            ['message', 'String'],
            ['status', 'int'],
            ['timestamp', 'Instant'],
            ['path', 'String'],
            ['details', null], // list, type checked below
        ];
        const byName = new Map((fields ?? []).map(f => [f.name, f]));
        for (const [name, expectedType] of required) {
            const found = byName.get(name);
            if (!found) {
                add('D5', 'error',
                    `ApiError DTO must declare field "${name}" (api-contract.md ApiError 본문).`,
                    { file, target: `${cn}.${name}` });
                continue;
            }
            if (expectedType && found.javaType !== expectedType) {
                add('D5', 'error',
                    `ApiError DTO field "${name}" must be ${expectedType} (got ${found.javaType}).`,
                    { file, target: `${cn}.${name}` });
            }
        }
        const detailsField = byName.get('details');
        if (detailsField && !/^List<.+>$/.test(detailsField.javaType ?? '')) {
            add('D5', 'error',
                `ApiError.details must be List<...> (got ${detailsField.javaType}).`,
                { file, target: `${cn}.details` });
        }
    }

    // D4: PATCH DTOs must be class (not record); fields must be JsonNullable<T>
    //     initialized to JsonNullable.undefined(). Detection sources:
    //     (1) name pattern `Update*Request`
    //     (2) any DTO actually used as a `@PatchMapping` `@RequestBody` body
    const isPatchDto = PATCH_DTO_NAME.test(cn) || patchBodyDtoNames.has(cn);
    if (isPatchDto) {
        if (dto.kind !== 'class') {
            add('D4', 'error',
                `PATCH DTO ${cn} must be a class (got record). ` +
                'jackson-databind-nullable cannot distinguish missing vs null on canonical constructors.',
                { file, target: cn });
        } else {
            for (const f of fields) {
                if (!isJsonNullable(f.javaType)) {
                    add('D4', 'error',
                        `PATCH DTO ${cn}: field "${f.name}" must be JsonNullable<T> (got ${f.javaType}).`,
                        { file, target: `${cn}.${f.name}` });
                    continue;
                }
                const init = (f.initializer ?? '').replace(/\s+/g, '');
                if (init !== 'JsonNullable.undefined()') {
                    add('D4', 'error',
                        `PATCH DTO ${cn}: field "${f.name}" must be initialized to JsonNullable.undefined() ` +
                        `(got ${f.initializer == null ? 'no initializer' : f.initializer}).`,
                        { file, target: `${cn}.${f.name}` });
                }
            }
        }
    }
}

// --- Controller rules ---

// Type-name predicates that survive `typeAsString` (which preserves generics).
function isPageable(typeStr) {
    return typeStr === 'Pageable';
}
function declaresPageResponse(returnTypeStr) {
    // matches `PageResponse<T>` and `ResponseEntity<PageResponse<T>>` etc.
    return /\bPageResponse</.test(returnTypeStr ?? '');
}

for (const api of apis) {
    const file = api.file;
    const ctrl = api.controller;
    const params = api.parameters ?? [];

    // C1: no @RequestHeader("X-User-Id")
    for (const p of params) {
        const annos = p.annotations ?? [];
        if (annos.includes('RequestHeader') && p.requestHeaderName === 'X-User-Id') {
            add('C1', 'error',
                `Controller ${ctrl}: parameter "${p.name}" reads X-User-Id header. ` +
                'Actor must come from authentication context (@AuthenticationPrincipal etc.) (auth.md).',
                { file, target: ctrl, line: api.line });
        }
    }

    // C2: no @PathVariable named userId
    for (const p of params) {
        const annos = p.annotations ?? [];
        if (annos.includes('PathVariable') && (p.name === 'userId' || p.name === 'actorId')) {
            add('C2', 'error',
                `Controller ${ctrl}: @PathVariable "${p.name}" identifies the actor. ` +
                'Actor must come from authentication context, not path variable.',
                { file, target: ctrl, line: api.line });
        }
    }

    // C3: list endpoints (GET that returns multiple) must accept Pageable
    const isGet = api.http.startsWith('GET ');
    const httpPath = api.http.split(' ')[1] ?? '';
    // heuristic: GET without a trailing {id} path variable is a list endpoint
    const isItemFetch = /\/\{[^}]+\}$/.test(httpPath);
    const looksLikeList = isGet && !isItemFetch;
    if (looksLikeList) {
        const hasPageable = params.some(p => isPageable(p.javaType));
        if (!hasPageable) {
            add('C3', 'error',
                `Controller ${ctrl} (${api.http}) is a list endpoint but does not accept Pageable. ` +
                'All list APIs must paginate (api-contract.md).',
                { file, target: ctrl, line: api.line });
        }
        if (!declaresPageResponse(api.returnType)) {
            add('C3', 'error',
                `Controller ${ctrl} (${api.http}) must return PageResponse<T> (got ${api.returnType}).`,
                { file, target: ctrl, line: api.line });
        }
    }

    // C4: Spring @RequestBody parameters must have @Valid
    for (const p of params) {
        if (!p.springRequestBody) continue;
        const annos = p.annotations ?? [];
        if (!annos.includes('Valid') && !annos.includes('Validated')) {
            add('C4', 'error',
                `Controller ${ctrl}: @RequestBody parameter "${p.name}" must be annotated with @Valid.`,
                { file, target: ctrl, line: api.line });
        }
    }

    // C5: PATCH @RequestBody must be a typed DTO (not raw JsonNode/ObjectNode/Map).
    if (api.http.startsWith('PATCH ')) {
        const FORBIDDEN_PATCH_BODY = new Set([
            'JsonNode', 'ObjectNode', 'ArrayNode', 'TreeNode',
            'Map', 'HashMap', 'LinkedHashMap', 'TreeMap',
            'String', 'Object',
        ]);
        for (const p of params) {
            if (!p.springRequestBody) continue;
            const raw = (p.javaType ?? '').replace(/<.*$/, '').trim();
            if (FORBIDDEN_PATCH_BODY.has(raw)) {
                add('C5', 'error',
                    `Controller ${ctrl}: PATCH @RequestBody "${p.name}" must be a typed DTO with ` +
                    `JsonNullable<T> fields (got ${p.javaType}). See api-contract.md PATCH 표준.`,
                    { file, target: ctrl, line: api.line });
            }
        }
    }
}

// --- Repository rules ---

const entityByName = new Map(entities.map(e => [e.className, e]));

// Repositories whose target entity carries an ownership FK (userId / ownerId).
// Shared between R2 (presence check) and S5 (service usage check).
const ownedRepoNames = new Set();
for (const repo of repositories) {
    if (!repo.targetEntity) continue;
    const ent = entityByName.get(repo.targetEntity);
    if (!ent) continue;
    const hasOwnerCol = (ent.columns ?? []).some(c =>
        !c.primaryKey && (c.fieldName === 'userId' || c.fieldName === 'ownerId')
    );
    if (hasOwnerCol) ownedRepoNames.add(repo.className);
}

for (const repo of repositories) {
    const file = repo.file;
    const cn = repo.className;

    // R2: if the target entity has an ownership FK (userId / ownerId), the repository
    //     must declare a `findByIdAnd<Owner>Id` lookup. Services should not fall back
    //     to inherited `findById` + manual filter.
    const target = repo.targetEntity ? entityByName.get(repo.targetEntity) : null;
    if (target) {
        const ownerCol = (target.columns ?? []).find(c => !c.primaryKey && (c.fieldName === 'userId' || c.fieldName === 'ownerId'));
        if (ownerCol) {
            const expected = 'findByIdAnd' + ownerCol.fieldName.charAt(0).toUpperCase() + ownerCol.fieldName.slice(1);
            const hasOwnershipScoped = (repo.methods ?? []).some(m =>
                m.name === expected
                || /^findByIdAnd[A-Z]\w*Id$/.test(m.name)
            );
            if (!hasOwnershipScoped) {
                add('R2', 'error',
                    `Repository ${cn} backs user-owned entity ${target.className} but does not declare ` +
                    `"${expected}(...)" (or equivalent findByIdAnd<Owner>Id) for ownership-scoped single fetch ` +
                    '(persistence-schema.md Repository 패턴).',
                    { file, target: cn });
            }
        }
    }

    for (const m of repo.methods ?? []) {
        // R1: forbid Spring Data `OrderBy` clause in method names.
        // The OrderBy keyword only appears AFTER a `By` clause (e.g.
        // `findByXOrderByY`, `findFirstByOrderByCreatedAtAsc`).
        // Substrings like `findMaxDisplayOrderByUserId` are field name `displayOrder` + keyword `By`,
        // NOT an OrderBy clause — skip those.
        if (/By.*OrderBy/.test(m.name)) {
            add('R1', 'error',
                `Repository ${cn}: method "${m.name}" embeds an OrderBy clause. ` +
                'Use Pageable for sort (persistence-schema.md Repository 패턴).',
                { file, target: `${cn}.${m.name}` });
        }
    }
}

// --- Service rules ---

for (const svc of services) {
    const file = svc.file;
    const cn = svc.className;

    // S2: class-level @Transactional is forbidden; transaction boundary belongs on each method.
    if (svc.classTransactional) {
        add('S2', 'error',
            `Service ${cn}: class-level @Transactional is forbidden. ` +
            'Annotate each service method individually (transaction.md).',
            { file, target: cn });
    }

    const FORBIDDEN_JSON_TYPES = new Set(['JsonNode', 'ObjectNode', 'ArrayNode', 'TreeNode']);

    for (const m of svc.methods ?? []) {
        if (!m.isPublic) continue;
        // S1: public service methods must declare a method-level @Transactional.
        // When the class already has one, S2 reports the placement violation and
        // we suppress S1 to avoid duplicate noise.
        if (!m.hasMethodTransactional && !svc.classTransactional) {
            add('S1', 'error',
                `Service ${cn}: public method "${m.name}" must be @Transactional (transaction.md).`,
                { file, target: `${cn}.${m.name}` });
        }
        // S3: read-name methods with method-level @Transactional must specify readOnly = true.
        if (m.hasMethodTransactional && READ_METHOD_RE.test(m.name)) {
            if (m.methodTransactionalReadOnly !== true) {
                add('S3', 'error',
                    `Service ${cn}: read method "${m.name}" must declare @Transactional(readOnly = true) (transaction.md).`,
                    { file, target: `${cn}.${m.name}` });
            }
        }
        // S4: service signatures must not expose raw JSON node types — use typed DTOs.
        for (const pt of m.parameterTypes ?? []) {
            const raw = (pt ?? '').replace(/<.*$/, '').trim();
            if (FORBIDDEN_JSON_TYPES.has(raw)) {
                add('S4', 'error',
                    `Service ${cn}: method "${m.name}" parameter uses raw JSON type ${pt}. ` +
                    'Service contracts must use typed DTOs (api-contract.md / package-structure.md).',
                    { file, target: `${cn}.${m.name}` });
            }
        }
        const rawRt = (m.returnType ?? '').replace(/<.*$/, '').trim();
        if (FORBIDDEN_JSON_TYPES.has(rawRt)) {
            add('S4', 'error',
                `Service ${cn}: method "${m.name}" returns raw JSON type ${m.returnType}. ` +
                'Service contracts must use typed DTOs.',
                { file, target: `${cn}.${m.name}` });
        }
    }

    // S5: forbid bare `<ownedRepo>.findById(...)` calls inside services. The check only
    //     fires when the repository variable points at a user-owned entity repository,
    //     and after we strip comments/string literals so docs/snippets don't false-positive.
    if (svc.file) {
        const fullPath = path.join(repoRoot, svc.file);
        if (fs.existsSync(fullPath)) {
            const raw = fs.readFileSync(fullPath, 'utf8');
            const stripped = stripCommentsAndStrings(raw);
            const ownedFieldNames = (svc.fields ?? [])
                .filter(f => ownedRepoNames.has(f.type))
                .map(f => f.name);
            for (const varName of ownedFieldNames) {
                const re = new RegExp('\\b' + varName + '\\.findById(?!And)\\s*\\(', 'g');
                let match;
                while ((match = re.exec(stripped)) !== null) {
                    const before = stripped.slice(0, match.index);
                    const lineNum = before.split('\n').length;
                    add('S5', 'error',
                        `Service ${cn} calls bare ${varName}.findById(...) at line ${lineNum}. ` +
                        'Owner-scoped lookups must use findByIdAnd<Owner>Id(...) so ownership is enforced by the query ' +
                        '(persistence-schema.md Repository 패턴).',
                        { file: svc.file, target: cn, line: lineNum });
                }
            }
        }
    }
}

function stripCommentsAndStrings(src) {
    return src
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')          // strip string literals
        // Replace block comments with same-length whitespace so newlines (and therefore line
        // numbers) are preserved for downstream rules like L1/L2/L3.
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:])\/\/.*$/gm, '$1');          // strip // line comments (preserve `://`)
}

// --- Lombok rules (L1 / L2 / L3) ---
//
// L1: globally forbidden Lombok annotations (Data, Value, Builder, ...).
// L2: additional Lombok annotations forbidden on @Entity classes (Setter, Getter, ...).
// L3: additional Lombok annotations forbidden on DTOs (Setter, Getter, ...).
//
// Detection is import-aware so Spring's @Value and Lombok's @Value don't collide.
// A simple-name use like `@Value` only counts as Lombok when the file imports it from
// `lombok.*` (single-type or on-demand). Fully-qualified references like
// `@lombok.Value` / `@lombok.experimental.Accessors` count unconditionally.

const LOMBOK_GLOBAL = {
    Data:                    { pkg: 'lombok' },
    Value:                   { pkg: 'lombok' },
    Builder:                 { pkg: 'lombok' },
    SuperBuilder:            { pkg: 'lombok.experimental' },
    AllArgsConstructor:      { pkg: 'lombok' },
    NoArgsConstructor:       { pkg: 'lombok' },
    SneakyThrows:            { pkg: 'lombok' },
    Accessors:               { pkg: 'lombok.experimental' },
    UtilityClass:            { pkg: 'lombok.experimental' },
    FieldDefaults:           { pkg: 'lombok.experimental' },
};

// Same annotation list applies to L2 (Entity) and L3 (DTO); rule code is chosen by file type.
const LOMBOK_ENTITY_DTO = {
    Setter:                  { pkg: 'lombok' },
    Getter:                  { pkg: 'lombok' },
    EqualsAndHashCode:       { pkg: 'lombok' },
    ToString:                { pkg: 'lombok' },
    RequiredArgsConstructor: { pkg: 'lombok' },
};

function collectLombokImports(strippedSrc) {
    const singles = new Set();
    const wildcards = new Set();
    const importRe = /^\s*import\s+(?:static\s+)?([\w.*]+)\s*;/gm;
    let match;
    while ((match = importRe.exec(strippedSrc)) !== null) {
        const fqn = match[1];
        if (!fqn.startsWith('lombok')) continue;
        if (fqn.endsWith('.*')) {
            wildcards.add(fqn.slice(0, -2));
        } else {
            const last = fqn.substring(fqn.lastIndexOf('.') + 1);
            singles.add(last);
        }
    }
    return { singles, wildcards };
}

function findLombokUses(strippedSrc, name, pkg, imports) {
    const hits = [];
    const isImportedAsLombok = imports.singles.has(name) || imports.wildcards.has(pkg);

    // Fully-qualified: `@lombok.Foo` / `@lombok.experimental.Foo`
    const fqnRe = new RegExp('@' + pkg.replace(/\./g, '\\.') + '\\.' + name + '\\b', 'g');
    let m;
    while ((m = fqnRe.exec(strippedSrc)) !== null) {
        hits.push(m.index);
    }

    if (isImportedAsLombok) {
        // Simple name: `@Foo` / `@Foo(...)` / `@Foo.Inner` (e.g. `@Builder.Default`).
        const simpleRe = new RegExp('@' + name + '\\b', 'g');
        while ((m = simpleRe.exec(strippedSrc)) !== null) {
            hits.push(m.index);
        }
    }

    return hits;
}

function lineNumberAt(src, index) {
    let line = 1;
    for (let i = 0; i < index && i < src.length; i++) {
        if (src.charCodeAt(i) === 10 /* \n */) line++;
    }
    return line;
}

function listJavaFilesUnder(root) {
    const files = [];
    function walk(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.isFile() && entry.name.endsWith('.java')) files.push(full);
        }
    }
    if (fs.existsSync(root)) walk(root);
    return files;
}

const mainJavaRoot = path.join(backendRoot, 'src', 'main', 'java');
const entityFiles = new Set(entities.map(e => e.file));
const dtoFiles = new Set(dtos.map(d => d.file));

for (const fullPath of listJavaFilesUnder(mainJavaRoot)) {
    const relative = relPath(fullPath);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const stripped = stripCommentsAndStrings(raw);
    const imports = collectLombokImports(stripped);

    const isEntity = entityFiles.has(relative);
    const isDto = dtoFiles.has(relative);

    for (const [name, def] of Object.entries(LOMBOK_GLOBAL)) {
        const positions = findLombokUses(stripped, name, def.pkg, imports);
        for (const idx of positions) {
            const line = lineNumberAt(stripped, idx);
            add('L1', 'error',
                `Lombok @${name} is forbidden everywhere (java-code-style.md L1).`,
                { file: relative, line });
        }
    }

    if (isEntity) {
        for (const [name, def] of Object.entries(LOMBOK_ENTITY_DTO)) {
            const positions = findLombokUses(stripped, name, def.pkg, imports);
            for (const idx of positions) {
                const line = lineNumberAt(stripped, idx);
                add('L2', 'error',
                    `Lombok @${name} is forbidden on @Entity classes. ` +
                    'Write the constructor / accessor / equality explicitly (java-code-style.md Entity 절).',
                    { file: relative, line });
            }
        }
    }

    if (isDto) {
        for (const [name, def] of Object.entries(LOMBOK_ENTITY_DTO)) {
            const positions = findLombokUses(stripped, name, def.pkg, imports);
            for (const idx of positions) {
                const line = lineNumberAt(stripped, idx);
                add('L3', 'error',
                    `Lombok @${name} is forbidden on DTOs. ` +
                    'Use record for non-PATCH DTOs and explicit setters/getters for PATCH DTOs (java-code-style.md DTO 절).',
                    { file: relative, line });
            }
        }
    }
}

// --- Configuration rules ---

if (!applicationYml) {
    add('F1', 'error',
        'application.yml not found. Required to declare spring.jpa.open-in-view=false.',
        { file: relPath(applicationYmlPath) });
} else {
    // F1: open-in-view must be set to false (transaction.md)
    const openInViewMatch = applicationYml.match(/^\s*open-in-view\s*:\s*(\S+)/m);
    if (!openInViewMatch) {
        add('F1', 'error',
            'application.yml: spring.jpa.open-in-view must be explicitly set to false (transaction.md).',
            { file: relPath(applicationYmlPath) });
    } else if (openInViewMatch[1] !== 'false') {
        add('F1', 'error',
            `application.yml: spring.jpa.open-in-view must be false (got ${openInViewMatch[1]}).`,
            { file: relPath(applicationYmlPath) });
    }

    // F2: no spring.jackson.* keys (api-contract.md Jackson 구성)
    if (/^\s*jackson\s*:/m.test(applicationYml)) {
        add('F2', 'error',
            'application.yml: spring.jackson.* keys are forbidden. ' +
            'Use Jackson2ObjectMapperBuilderCustomizer Bean instead (api-contract.md).',
            { file: relPath(applicationYmlPath) });
    }
}

// F3: BddWorkflowApplication must have @EnableJpaAuditing
if (bootApplication && !/@EnableJpaAuditing\b/.test(bootApplication)) {
    add('F3', 'error',
        'BddWorkflowApplication must declare @EnableJpaAuditing for audit columns (persistence-schema.md, datetime.md).',
        { file: relPath(bootApplicationPath) });
}

// F4 / F5 / F6 / F7: Jackson configuration rules. F4 demands the customizer bean exists.
// F5/F6/F7 enforce the three required settings — they fire independently of F4 so the
// punch list always shows every missing piece, not just the root cause.
const customizerBean = beans.find(b => b.returnType === 'Jackson2ObjectMapperBuilderCustomizer');
const customizerFileFallback = 'src/main/java/com/example/bddworkflow/common/JacksonConfig.java';
const customizerWhere = customizerBean
    ? { file: customizerBean.file ?? customizerFileFallback, target: `${customizerBean.containerClass}.${customizerBean.methodName}` }
    : { file: customizerFileFallback };
// Strip comments and string literals from the bean body so that F5/F6/F7 only
// match real code references, not Javadoc / // comments / "JsonNullableModule" literals.
const customizerBody = stripCommentsAndStrings(customizerBean?.body ?? '');

if (!customizerBean) {
    add('F4', 'error',
        'No @Bean returning Jackson2ObjectMapperBuilderCustomizer found in src/main/java. ' +
        'Jackson must be configured via the Boot-friendly customizer (api-contract.md Jackson 구성).',
        customizerWhere);
}
if (!/\bJsonNullableModule\b/.test(customizerBody)) {
    add('F5', 'error',
        'Jackson2ObjectMapperBuilderCustomizer body must register JsonNullableModule ' +
        '(api-contract.md PATCH 표준).',
        customizerWhere);
}
if (!/\bFAIL_ON_UNKNOWN_PROPERTIES\b/.test(customizerBody)) {
    add('F6', 'error',
        'Jackson2ObjectMapperBuilderCustomizer body must enable DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES ' +
        '(api-contract.md Jackson 구성).',
        customizerWhere);
}
if (!/\bNON_ABSENT\b/.test(customizerBody)) {
    add('F7', 'error',
        'Jackson2ObjectMapperBuilderCustomizer body must set JsonInclude.Include.NON_ABSENT as the serialization inclusion ' +
        'so JsonNullable.undefined() is dropped from responses (api-contract.md Jackson 구성).',
        customizerWhere);
}

// Note: jackson-databind-nullable dependency is intentionally NOT validated here.
// Gradle dependency declarations have many valid forms (implementation, version
// catalogs, convention plugins, BOMs, platform()), so regex matching is brittle.
// If the dependency is missing, JsonNullable<T> / JsonNullableModule usages will
// fail to compile or load at runtime, which is a stronger signal than this checker.

// --- Output ---

const counts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
}, { error: 0, warning: 0 });

fs.mkdirSync(outputDir, { recursive: true });
const reportJson = path.join(outputDir, 'standards-report.json');
const reportMd = path.join(outputDir, 'standards-report.md');

fs.writeFileSync(reportJson, JSON.stringify({
    summary: {
        error: counts.error,
        warning: counts.warning,
        total: findings.length,
    },
    findings,
}, null, 2));

const lines = [
    '# Standards validation report',
    '',
    `- error: ${counts.error}`,
    `- warning: ${counts.warning}`,
    `- total: ${findings.length}`,
    '',
];

if (findings.length > 0) {
    const groups = new Map();
    for (const f of findings) {
        if (!groups.has(f.ruleId)) groups.set(f.ruleId, []);
        groups.get(f.ruleId).push(f);
    }
    for (const [ruleId, group] of [...groups.entries()].sort()) {
        lines.push(`## ${ruleId} (${group.length})`);
        for (const f of group) {
            const loc = f.location ?? {};
            const where = [loc.file, loc.line ? `line ${loc.line}` : null, loc.target]
                .filter(Boolean).join(' · ');
            lines.push(`- [${f.severity}] ${f.message}`);
            if (where) lines.push(`  - ${where}`);
        }
        lines.push('');
    }
}

fs.writeFileSync(reportMd, lines.join('\n'));

console.log(`Wrote ${relPath(reportJson)}`);
console.log(`Wrote ${relPath(reportMd)}`);
console.log(`  error: ${counts.error}, warning: ${counts.warning}, total: ${findings.length}`);

if (checkMode && counts.error > 0) {
    process.exit(1);
}
