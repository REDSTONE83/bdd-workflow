import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { parseChangeSet, requirementRefs, splitList } from '../index-change-sets.mjs';

function fixtureFile(markdown) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'change-set-parser-'));
    const file = path.join(dir, '2026-06-01-sample.md');
    fs.writeFileSync(file, markdown);
    return file;
}

describe('index-change-sets parser', () => {
    it('extracts headers, affected requirements, and section bullets', () => {
        const file = fixtureFile(`# Change Set: 샘플 작업

상태: 진행중
요청일: 2026-06-01
변경 유형: 하네스 개선, 마이그레이션, 표준 개정
영향 요건: REQ-001, REQ-002
논의 상태: REQ 단위 논의 필요

## 요청 요약

- 사용자 요청을 작업 묶음으로 본다.

## 작업 범위

- 리포트를 생성한다.

## 제외 범위

- REQ 본문 수정은 제외한다.

## 완료 조건

- Change Set 리포트가 생성된다.

## 검증 명령

- \`npm run harness:test\`

## 결정 로그

- 2026-06-01: 파일 경로를 identity로 쓴다.

## 열린 논의

- REQ 적정 단위
`);

        const parsed = parseChangeSet(file);

        assert.equal(parsed.kind, 'change-set');
        assert.equal(parsed.title, '샘플 작업');
        assert.equal(parsed.status, '진행중');
        assert.equal(parsed.requestedDate, '2026-06-01');
        assert.deepEqual(parsed.changeTypes, ['하네스 개선', '마이그레이션', '표준 개정']);
        assert.deepEqual(parsed.affectedRequirementIds, ['REQ-001', 'REQ-002']);
        assert.deepEqual(parsed.requirements, ['REQ-001', 'REQ-002']);
        assert.equal(parsed.discussionStatus, 'REQ 단위 논의 필요');
        assert.deepEqual(parsed.requestSummary, ['사용자 요청을 작업 묶음으로 본다.']);
        assert.deepEqual(parsed.verificationCommands, ['`npm run harness:test`']);
        assert.deepEqual(parsed.openDiscussions, ['REQ 적정 단위']);
        assert.equal(parsed.sectionPresent['완료 조건'], true);
        assert.deepEqual(parsed.issues, []);
    });

    it('treats 없음 as an empty affected requirement list', () => {
        assert.deepEqual(requirementRefs('없음'), []);
    });

    it('splits comma-separated metadata and drops 없음', () => {
        assert.deepEqual(splitList('하네스 개선, 마이그레이션'), ['하네스 개선', '마이그레이션']);
        assert.deepEqual(splitList('없음'), []);
    });

    it('allows standard revision as a recurring change type', () => {
        const file = fixtureFile(`# Change Set: 표준 변경

상태: 완료
요청일: 2026-06-08
변경 유형: 표준 개정
영향 요건: REQ-028
논의 상태: 없음

## 요청 요약
- 표준을 개정한다.

## 작업 범위
- 표준 문서를 바꾼다.

## 제외 범위
- 없음

## 완료 조건
- 완료

## 검증 명령
- \`npm run harness:tool-test\`

## 결정 로그
- 2026-06-08: 표준 개정 유형을 사용한다.

## 열린 논의
- 없음
`);

        const parsed = parseChangeSet(file);

        assert.deepEqual(parsed.changeTypes, ['표준 개정']);
        assert.deepEqual(parsed.issues, []);
    });

    it('emits report-only warnings for invalid metadata and discussion mismatch', () => {
        const file = fixtureFile(`# Change Set: 잘못된 작업

상태: 진행중
요청일: 2026-06-01
변경 유형: 하네스 개선, REQ 정리
영향 요건: REQ-999
논의 상태: 진행중

## 요청 요약
- 요청

## 작업 범위
- 작업

## 제외 범위
- 제외

## 완료 조건
- 완료

## 검증 명령
- \`npm test\`

## 결정 로그
- 결정

## 열린 논의
- 없음
`);

        const parsed = parseChangeSet(file);

        assert.deepEqual(parsed.issues.map((issue) => issue.ruleId), [
            'CHANGE-SET-TYPE-INVALID',
            'CHANGE-SET-DISCUSSION-MISMATCH'
        ]);
        assert.equal(parsed.issues[0].severity, 'warning');
        assert.equal(parsed.issues[0].strictSeverity, 'warning');
    });
});
