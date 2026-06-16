import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const indexer = path.join(repoRoot, 'harness', 'tools', 'index-requirements.mjs');

function fixtureCard({ id, title, specRole = '원자 요건', parent = '없음' }) {
    return [
        `# ${id} ${title}`,
        '',
        `요건 ID: ${id}`,
        `제목: ${title}`,
        '우선순위: 중간',
        '상태: 초안',
        '요건 종류: 하네스',
        `명세 역할: ${specRole}`,
        '대상 시스템: harness',
        '제품 영역: harness',
        '품질 속성: none',
        '검증 수준: static',
        `상위 요건: ${parent}`,
        '관련 요건: 없음',
        '대체 요건: 없음',
        '',
        '## 사용자/목적',
        '',
        'fixture purpose',
        '',
        '## 범위',
        '',
        '- fixture scope',
        '',
        '## 표준 용어',
        '',
        '- harness.requirementCard',
        '',
        '## 제외 범위',
        '',
        '- 없음',
        '',
        '## 수용 기준',
        '',
        '- (STATIC) indexed AC carries a source line',
        '',
        '## 의사결정 로그',
        '',
        '- 결정일: 2026-06-16',
        '  결정: fixture',
        '  이유: fixture',
        '  결정자: REDSTONE',
        '  영향: fixture',
        '',
        '## BDD 테스트 리뷰',
        '',
        '- 리뷰일: 2026-06-16',
        '  결과: 미완료',
        '',
        '## 열린 질문',
        '',
        '- 없음'
    ].join('\n');
}

describe('index-requirements — card index contract', () => {
    it('emits parentRequirementIds and AC source lines', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'req-index-'));
        const requirementsDir = path.join(dir, 'docs', 'requirements');
        const outputRoot = path.join(dir, 'build');
        fs.mkdirSync(requirementsDir, { recursive: true });
        fs.writeFileSync(path.join(requirementsDir, 'REQ-900-parent.md'), fixtureCard({
            id: 'REQ-900',
            title: 'parent',
            specRole: '상위 요건'
        }));
        fs.writeFileSync(path.join(requirementsDir, 'REQ-901-child.md'), fixtureCard({
            id: 'REQ-901',
            title: 'child',
            parent: 'REQ-900'
        }));

        execFileSync(process.execPath, [indexer], {
            cwd: repoRoot,
            env: {
                ...process.env,
                HARNESS_SCOPE: 'harness',
                HARNESS_REQUIREMENTS_DIR: requirementsDir,
                HARNESS_OUTPUT_ROOT: outputRoot
            }
        });

        const payload = JSON.parse(fs.readFileSync(path.join(outputRoot, 'indexes', 'requirements.index.json'), 'utf8'));
        const child = payload.entries.find((entry) => entry.id === 'REQ-901');

        assert.deepEqual(child.parentRequirementIds, ['REQ-900']);
        assert.deepEqual(child.acceptanceCriteria, [
            { text: 'indexed AC carries a source line', target: 'STATIC', line: 35 }
        ]);
    });
});
