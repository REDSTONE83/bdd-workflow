import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const outputDir = path.join(repoRoot, 'build', 'harness');
const sourceIndexPath = path.join(outputDir, 'source-index.backend.json');

if (!fs.existsSync(sourceIndexPath)) {
    console.error(
        `Missing source index: ${sourceIndexPath}\n` +
        'Run ./gradlew generateHarnessSourceIndex first.'
    );
    process.exit(1);
}

const sourceIndex = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));
const entities = sourceIndex.entities ?? [];

function sqlType(javaType, length) {
    const t = javaType.toLowerCase();
    if (t === 'string') return `VARCHAR(${length ?? 255})`;
    if (t === 'long') return 'BIGINT';
    if (t === 'integer' || t === 'int') return 'INTEGER';
    if (t === 'short') return 'SMALLINT';
    if (t === 'boolean') return 'BOOLEAN';
    if (t === 'double') return 'DOUBLE';
    if (t === 'float') return 'REAL';
    if (t === 'bigdecimal') return 'DECIMAL';
    if (t === 'localdatetime' || t === 'instant' || t === 'offsetdatetime' || t === 'zoneddatetime') return 'TIMESTAMP';
    if (t === 'localdate') return 'DATE';
    if (t === 'localtime') return 'TIME';
    if (t === 'uuid') return 'UUID';
    if (t === 'byte[]') return 'BLOB';
    return javaType.toUpperCase();
}

function formatRequirements(requirements) {
    if (!requirements || requirements.length === 0) {
        return '(no @Requirement)';
    }
    return requirements.join(', ');
}

const lines = [
    '-- Schema preview generated from JPA @Entity classes via source-index.backend.json',
    '-- Java type → SQL type is a best-effort mapping for human review.',
    '-- Each table/column lists associated requirement IDs as comments.',
    ''
];

if (entities.length === 0) {
    lines.push('-- No JPA @Entity classes found. Add @Entity to a class to populate this preview.');
} else {
    for (const entity of entities) {
        lines.push(`-- requirements: ${formatRequirements(entity.requirements)}`);
        lines.push(`-- source: ${entity.className} (${entity.file})`);
        lines.push(`CREATE TABLE ${entity.table} (`);

        const columnRows = entity.columns.map((column) => {
            const constraints = [];
            if (column.primaryKey) {
                constraints.push('PRIMARY KEY');
            }
            if (column.generation === 'IDENTITY' || column.generation === 'AUTO') {
                constraints.push('AUTO_INCREMENT');
            }
            if (column.nullable === false) {
                constraints.push('NOT NULL');
            }
            if (column.unique === true) {
                constraints.push('UNIQUE');
            }
            const type = sqlType(column.javaType, column.length);
            const constraintPart = constraints.length > 0 ? ' ' + constraints.join(' ') : '';
            const generationNote = column.generation && column.generation !== 'IDENTITY' && column.generation !== 'AUTO'
                ? ` (generation: ${column.generation})`
                : '';
            const requirementComment = `  -- ${formatRequirements(column.requirements)}${generationNote}`;
            return {
                definition: `  ${column.columnName} ${type}${constraintPart}`,
                comment: requirementComment
            };
        });

        for (let i = 0; i < columnRows.length; i++) {
            const row = columnRows[i];
            const isLast = i === columnRows.length - 1;
            const terminator = isLast ? '' : ',';
            lines.push(`${row.definition}${terminator}${row.comment}`);
        }

        lines.push(');', '');
    }
}

fs.mkdirSync(outputDir, { recursive: true });
const output = lines.join('\n');
fs.writeFileSync(path.join(outputDir, 'schema-preview.sql'), output + '\n');
console.log(output);
