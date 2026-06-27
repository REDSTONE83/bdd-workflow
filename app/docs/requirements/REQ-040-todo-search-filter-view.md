# 요건 카드

요건 ID: REQ-040
제목: 할 일 검색 및 필터 보기
우선순위: 높음
상태: 검증중
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: todo
품질 속성: accessibility, security, usability
검증 수준: mixed
상위 요건: REQ-021
관련 요건: REQ-021, REQ-004, REQ-015, REQ-023
대체 요건: 없음

## 사용자/목적

로그인 사용자는 할 일이 많아졌을 때 검색어와 필터 조건을 조합해 지금 확인할 할 일만 좁혀 볼 수 있어야 한다.

## 범위

- 사용자는 할 일 제목 또는 설명에 포함된 검색어로 본인의 할 일 목록을 좁혀 본다.
- 사용자는 완료 상태, 우선순위, 카테고리 또는 미분류, 마감일 범위를 조합해 본인의 할 일 목록을 좁혀 본다.
- 조건이 없는 목록 조회의 기본 목록, 정렬, 페이지네이션 계약은 `REQ-023`을 따른다.
- 검색/필터 결과에도 `REQ-023`의 페이지네이션과 정렬 정책을 그대로 적용한다.
- 다른 사용자의 할 일과 카테고리는 검색/필터 결과에 포함하지 않는다.
- 마감일 범위 시작일이 종료일보다 늦으면 목록 조회를 거절한다.
- `/todos` 화면의 목록 위에 검색어, 완료 상태, 우선순위, 카테고리, 마감일 시작/종료 입력 영역을 둔다.
- 사용자는 필터 적용과 초기화를 명시적으로 실행한다.
- 검색/필터 상태는 URL query에 반영하고, 같은 주소로 다시 열면 같은 조건으로 복원한다.

## 표준 용어

- todo.task
- todo.id
- todo.title
- todo.description
- todo.dueDate
- todo.priority
- todo.completed
- todo.list
- todo.filter
- todo.search
- todo.uncategorized
- todo.dueDateRange
- todo.response
- todo.categoryRef
- category.id
- category.name
- user.id
- ui.appShell
- ui.desktopViewport
- ui.accessibilityCheck

## 제외 범위

- 별도 상세 검색 문법.
- 여러 카테고리 동시 선택.
- 저장된 필터 프리셋.
- 사용자 지정 정렬 UI.
- 검색어 하이라이트.
- 모바일/태블릿 전용 레이아웃 최적화.

## 수용 기준

- (API) 검색어를 입력하면 제목이나 설명에 검색어가 포함된 본인의 할 일만 보인다
- (API) 완료 상태, 우선순위, 카테고리 또는 미분류, 마감일 범위를 조합하면 모든 조건을 만족하는 본인의 할 일만 보인다
- (API) 검색/필터 결과에도 기존 할 일 목록의 묶음 보기와 정렬 기준이 적용된다
- (API) 마감일 범위 시작일이 종료일보다 늦으면 목록 조회가 거절된다
- (UI) 할 일 화면은 검색어, 완료 상태, 우선순위, 카테고리, 마감일 시작일과 종료일 입력 영역, 필터 적용과 초기화 동작을 제공한다
- (UI) 필터를 적용하면 조건에 맞는 할 일만 목록에 남고 선택한 조건이 화면에 유지된다
- (UI) 필터 조건은 주소에 반영되며 같은 주소로 다시 열면 같은 조건으로 복원된다
- (UI) 필터 결과가 없으면 조건에 맞는 할 일이 없다는 안내와 필터 초기화 동작이 보인다
- (UI) 검색/필터 입력 영역과 목록의 주요 요소는 데스크톱 화면에서 화면 밖으로 넘치지 않고 자동 접근성 검사에서 위반이 없어야 한다

## 검증 대상

- API: 필요
- DB: 필요
- UI: 필요
- Storybook: 필요

## API 설계

- `GET /todos`는 기존 `REQ-023` 페이지네이션/정렬 query에 `search`, `completed`, `priority`, `categoryId`, `uncategorized`, `dueDateFrom`, `dueDateTo` 필터 query를 추가로 받는다.
- 응답 형식은 기존 `PageResponse<TodoResponse>`를 유지한다.
- 필터 query가 유효하지 않으면 표준 오류 응답으로 400을 반환한다.

## DB 설계

- 기존 `todos` 테이블의 `user_id`, `title`, `description`, `completed`, `priority`, `category_id`, `due_date`, `created_at` 값을 조합해 필터링한다.
- 신규 저장 컬럼이나 별도 검색 인덱스는 두지 않는다.

## UI 설계

- `/todos` 화면의 목록 위에 검색어, 완료 상태, 우선순위, 카테고리 또는 미분류, 마감일 시작일/종료일 필드를 둔다.
- 필터 적용은 URL query와 서버 조회 조건을 갱신하고, 초기화는 필터 query를 제거한다.
- 필터 결과가 없을 때는 별도 빈 결과 안내와 초기화 버튼을 제공한다.

## UI 설계 검토 표면

- Routes/TodosPage: RouteTodos, Filtered, UrlFilterRestored, FilterEmpty

## 의사결정 로그

- 결정일: 2026-06-27
  결정: 신규 앱 요건 ID는 `REQ-040`으로 발급한다.
  이유: `REQ-028`은 하네스 요건에서 이미 사용 중이며, 이 저장소의 관리 ID는 전역 유일해야 한다.
  결정자: Codex
  영향: 코드 annotation, 수용 시나리오, 테스트 metadata는 모두 `REQ-040`을 사용한다.

- 결정일: 2026-06-27
  결정: 검색/필터 상태는 URL query를 source of truth로 둔다.
  이유: 목록 화면의 page/filter/sort 상태는 딥링크와 새로고침 복원이 필요하다는 프런트엔드 상태 표준을 따른다.
  결정자: Codex
  영향: `/todos` 화면 컨테이너는 URL query를 읽어 서버 조회 조건으로 사용하고, 적용/초기화 시 URL query를 갱신한다.

- 결정일: 2026-06-27
  결정: 마감일 범위 필터는 마감일이 없는 할 일을 결과에서 제외한다.
  이유: 사용자가 날짜 범위를 선택한 경우 그 기간 안에 마감일이 있는 항목만 비교 가능하다.
  결정자: Codex
  영향: 마감일 없는 할 일은 날짜 범위 조건이 없을 때만 검색/필터 결과에 포함될 수 있다.

- 결정일: 2026-06-27
  결정: 미분류 필터는 카테고리 ID 필터와 동시에 사용하지 않는다.
  이유: 두 조건을 동시에 적용하면 항상 빈 결과가 되므로 UI에서는 단일 카테고리 선택지 안에서 전체, 미분류, 개별 카테고리 중 하나만 고르게 한다.
  결정자: Codex
  영향: API는 미분류 조건과 카테고리 ID가 함께 오면 요청을 거절한다.

## 수용 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-040-todo-search-filter-view.feature`
- 검증 설계: API 검색/필터 조건은 백엔드 Acceptance Test로 검증하고, 화면 입력/적용/초기화/URL 복원/빈 결과/접근성은 Storybook Vitest story test로 검증한다.

### 구현 검증 리뷰

- 리뷰일: 2026-06-27
  리뷰자: Codex
  확인: `npm run app:validate`가 Storybook Vitest, Storybook build, 백엔드 테스트, live Playwright smoke, trace `--check`를 통과했고 본 카드의 API/UI 수용 기준이 GREEN으로 추적된다.
  결과: 승인

## 열린 질문

- 없음
