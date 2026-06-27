# Change Set: 2026-06-27 앱 할 일 검색 필터 하네스 연결 갱신

상태: 완료
요청일: 2026-06-27
변경 유형: 용어, 하네스 문서, 수정
영향 요건: REQ-040
논의 상태: 없음

## 요청 요약

- 앱 Change Set [2026-06-27 할 일 검색 및 필터 보기](../../../app/docs/change-sets/2026-06-27-todo-search-filter-view.md)에서 추가한 할 일 검색/필터 DTO와 query 필드명을 표준 용어 사전에 등록한다.
- 앱 `TodoController`/`Todo` 표면의 line number와 요구사항 연결 변경에 맞춰 하네스 UI live parity fixture를 갱신한다.

## 작업 범위

- `harness/docs/terminology/domains/todo.json`에 `todo.filter`, `todo.search`, `todo.uncategorized`, `todo.dueDateRange` 용어를 추가한다.
- 신규 용어의 `names`에 `TodoListFilter`, `search`, `uncategorized`, `dueDateFrom`, `dueDateTo` 코드/JSON 필드명을 연결한다.
- `harness/ui/src/lib/harness-data/fixtures.ts`의 앱 대표 요건 fixture가 최신 앱 backend source index와 일치하도록 API line과 `Todo` entity 요구사항 배열을 갱신한다.

## 제외 범위

- 하네스 검사 로직 변경.
- 하네스 UI 변경.
- 앱 기능 구현 변경.

## 완료 조건

- `REQ-040` trace에서 신규 검색/필터 코드명에 대한 `UNREGISTERED_CODE_NAME` 경고가 없어야 한다.
- `harness/ui` parity test에서 앱 대표 fixture가 live `REQ-022`, `REQ-023` 모델과 일치해야 한다.

## 검증 명령

- `npm run app:trace -- --requirement REQ-040`
- `cd harness/ui && npm run test -- --run src/lib/harness-data/parity.test.ts`
- `npm run harness:validate`

## 검증 결과

- 2026-06-27: `npm run app:trace -- --requirement REQ-040` 통과. REQ-040 terminology findings 0.
- 2026-06-27: `cd harness/ui && npm run test -- --run src/lib/harness-data/parity.test.ts` 통과.
- 2026-06-27: `npm run harness:validate` 통과. gate pass.

## 결정 로그

- 2026-06-27: 검색/필터 query 필드는 앱 DTO 이름이지만 용어 사전은 하네스 문서 영역에서 전역 관리하므로 앱 Change Set과 별도 하네스 Change Set으로 추적한다.
- 2026-06-27: 하네스 UI 앱 대표 fixture는 live 앱 source index와 deep equal을 강제하므로, 앱 컨트롤러 line 이동과 `Todo` entity의 REQ-040 연결 추가를 fixture에도 반영한다.

## 열린 논의

- 없음
