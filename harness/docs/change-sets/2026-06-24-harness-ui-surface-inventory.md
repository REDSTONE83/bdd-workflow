# Change Set: 2026-06-24 하네스 UI 표면 조회

상태: 완료
요청일: 2026-06-24
변경 유형: 신규, 하네스 개선
영향 요건: REQ-038
논의 상태: 없음

## 요청 요약

- 하네스 UI에서 선택한 범위 안에 존재하는 API, Entity, UI 표면 목록과 상세 정보를 각각 조회할 수 있는 메뉴 화면을 추가한다.

## 작업 범위

- REQ-038 요건 카드와 수용 시나리오를 추가한다.
- 하네스 UI 서버가 source index와 trace state에서 API, Entity, UI 표면 조회 DTO를 만든다.
- AppShell 좌측 LNB에 API/Entity/UI 조회 메뉴와 `/surfaces` route를 추가한다.
- API, Entity, UI 탭별 목록형 카드 화면과 검색을 구현한다.
- Storybook 상태, 단위 테스트, 하네스 self-test로 화면과 서버 DTO 계약을 검증한다.

## 제외 범위

- API, Entity, UI 표면의 생성·수정·삭제.
- 추적 상태나 게이트 판정 재계산.
- 소스 인덱서가 아직 수집하지 않는 새로운 표면 종류 추가.

## 완료 조건

- `/surfaces` 화면에서 API, Entity, UI 표면을 탭별로 조회할 수 있다. ✓
- 각 목록형 카드에서 요구사항 연결, 구현 위치, 요청/응답 또는 컬럼/Storybook 정보를 확인할 수 있다. ✓
- 검색어로 각 표면 목록을 좁힐 수 있다. ✓
- UI 서버 DTO가 source index의 주요 값을 보존한다. ✓
- `cd harness/ui && npm run typecheck && npm run test`와 `npm run harness:self-test`를 통과한다. ✓

## 검증 명령

- `cd harness/ui && npm run typecheck`
- `cd harness/ui && npm run test`
- `cd harness/ui && npm run test:storybook`
- `npm run harness:self-test`
- `npm run harness:trace -- --requirement REQ-038`
- `npm run harness:validate`

## 검증 결과

- 2026-06-24: `cd harness/ui && npm run typecheck` 통과.
- 2026-06-24: `cd harness/ui && npm run test` 통과(19 files, 47 tests).
- 2026-06-24: `cd harness/ui && npm run test:storybook` 통과(10 files, 78 tests). sandbox 포트 바인딩 제한으로 권한 상승 후 실행했다.
- 2026-06-24: `npm run harness:self-test` 통과(66 tests).
- 2026-06-24: `npm run harness:trace -- --requirement REQ-038` 통과. REQ-038 상태 BLUE, 카드 구조 오류 0.
- 2026-06-24: `npm run harness:validate` 통과. gate pass.

## 결정 로그

- 2026-06-24: 전역 표면 조회 화면의 원천은 `build/{scope}/indexes/backend.source-index.json`, `front-end.source-index.json`, `state/trace.state.json`으로 정한다. 화면은 build JSON 원형을 직접 읽지 않고 UI 서버 DTO만 소비한다.
- 2026-06-24: 한 메뉴 안에 API, Entity, UI 탭을 둔다. 세 표면은 같은 탐색 목적을 공유하지만 세부 정보 필드가 달라 탭별 목록형 카드가 가장 단순하다.

## 열린 논의

- 없음
