# Change Set: 2026-06-27 할 일 검색 및 필터 보기

상태: 완료
요청일: 2026-06-27
변경 유형: 신규, 수정
영향 요건: REQ-021, REQ-023, REQ-040
논의 상태: 없음

## 요청 요약

- 현재 할 일 관리 앱이 더 큰 규모의 애플리케이션 작업공간으로 확장될 수 있는지 확인하기 위해 검색 및 필터 보기 기능을 추가한다.
- 기존 `REQ-023` 할 일 목록 조회의 기본 목록/정렬/페이지네이션 책임은 유지하고, 조건 기반 목록 보기는 신규 원자 요건 `REQ-040`이 소유한다.
- 검색/필터 코드명 표준 용어 등록과 하네스 UI fixture 연결 갱신은 하네스 Change Set [2026-06-27 앱 할 일 검색 필터 하네스 연결 갱신](../../../harness/docs/change-sets/2026-06-27-app-todo-search-filter-harness-links.md)에서 분리 추적한다.

## 작업 범위

- 신규 앱 요건 카드 `REQ-040`과 수용 시나리오를 추가한다.
- `GET /todos`에 검색어, 완료 상태, 우선순위, 카테고리/미분류, 마감일 범위 조건을 추가한다.
- 검색/필터 결과에도 기존 목록 페이지네이션과 정렬 정책이 적용되도록 한다.
- `/todos` 화면에 검색/필터 입력 영역, 적용, 초기화, 빈 결과 상태를 추가한다.
- 검색/필터 상태를 URL query로 보존하고 새로고침 또는 공유 링크 진입 시 같은 보기로 복원한다.
- Storybook Vitest와 백엔드 Acceptance Test로 `REQ-040` 수용 기준을 연결한다.
- `REQ-021` 상위 카드의 하위 요건 설명에 검색/필터 원자 요건을 반영한다.

## 제외 범위

- 별도 할 일 상세 화면.
- 저장된 사용자별 기본 필터 프리셋.
- 전체 텍스트 검색 엔진 또는 색인 서버 도입.
- 모바일/태블릿 전용 레이아웃 최적화.
- 사용자 지정 정렬 UI. 기존 API의 허용 sort key 정책은 유지한다.

## 완료 조건

- `REQ-040`의 모든 API/UI 수용 기준이 수용 시나리오와 실행 테스트에 연결된다.
- 검색/필터 조건을 적용한 목록이 본인 자원 격리, 기존 페이지네이션, 기존 정렬 정책을 유지한다.
- `/todos` 화면에서 조건 입력, 적용, 초기화, 빈 결과, URL query 복원이 동작한다.
- `npm run app:validate`가 통과한다.

## 검증 명령

- `npm run app:test`
- `npm run app:e2e`
- `npm run app:trace -- --requirement REQ-040`
- `npm run app:validate`

## 검증 결과

- 2026-06-27: `cd app/front-end && npm run typecheck` 통과.
- 2026-06-27: `cd app/front-end && npm run lint` 통과.
- 2026-06-27: `cd app/front-end && npm run test` 통과.
- 2026-06-27: `cd app/front-end && npm run test:storybook` 통과.
- 2026-06-27: `cd app/back-end && ./gradlew test` 통과.
- 2026-06-27: `npm run app:e2e` 통과.
- 2026-06-27: `npm run app:trace -- --requirement REQ-040` 통과, REQ-040 GREEN.
- 2026-06-27: `npm run app:validate` 통과.

## 결정 로그

- 2026-06-27: `REQ-028`은 이미 하네스 요건에서 사용 중이므로 전역 유일 ID 원칙에 따라 신규 앱 요건 ID는 `REQ-040`으로 발급한다.
- 2026-06-27: 검색/필터 보기는 기본 할 일 목록 조회(`REQ-023`)의 조건 확장이지만 독립적으로 승인 가능한 사용자 능력이므로 `REQ-021`의 하위 원자 요건으로 둔다.
- 2026-06-27: 검색/필터 상태는 `app/docs/standards/front-end-state.md`의 목록 URL query state 원칙에 따라 URL query를 source of truth로 둔다.
- 2026-06-27: 다른 사용자의 카테고리 ID를 필터로 전달해도 자원 존재 여부를 드러내지 않고 본인 할 일 결과만 반환한다.
- 2026-06-27: `TodoListFilter`와 검색/필터 query 필드명은 용어 사전이 하네스 문서 영역에서 전역 관리되고, 하네스 UI 앱 fixture도 live 앱 source index와 동기화해야 하므로 별도 하네스 Change Set으로 분리한다.

## 열린 논의

- 없음
