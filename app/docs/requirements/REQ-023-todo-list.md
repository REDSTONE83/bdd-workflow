# 요건 카드

요건 ID: REQ-023
제목: 할 일 목록 조회
우선순위: 높음
상태: 승인
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: todo
품질 속성: accessibility, security, usability
검증 수준: mixed
상위 요건: REQ-021
관련 요건: REQ-021, REQ-004, REQ-011, REQ-015
대체 요건: 없음

## 사용자/목적

로그인 사용자는 자신의 할 일 목록을 페이지 단위로 보고, 기본 정렬 또는 허용된 직접 정렬로 확인할 수 있어야 한다.

## 범위

- 본인의 할 일만 조회한다.
- 응답은 `content`, `page`, `size`, `totalElements`, `totalPages`를 가진다.
- 기본 정렬은 미완료 먼저, 같은 상태 안에서는 HIGH/MEDIUM/LOW, 동률은 먼저 등록한 할 일 순서다.
- 허용된 sort key를 사용자가 지정하면 기본 정렬을 덮어쓴다.
- `size` 기본값은 20이고 최대값은 100이다.
- 연결된 카테고리의 이름과 색상을 목록 응답에 포함한다.
- 보호 영역에 `/todos` 경로의 할 일 관리 화면을 둔다.
- 화면은 보호 앱 셸 안에서 동작하며, 할 일 화면과 카테고리 화면 사이를 오갈 수 있는 내비를 보여준다.
- 화면 목록은 한 묶음 20개 기반 무한 로드로 다음 묶음을 이어 보여준다.
- 비인증 사용자가 할 일 화면에 접근하면 로그인 화면으로 이동한다.
- 할 일 화면 경로로 진입했다가 로그인하면 할 일 화면으로 돌아온다.

## 표준 용어

- todo.task
- todo.id
- todo.title
- todo.dueDate
- todo.priority
- todo.completed
- todo.list
- todo.response
- todo.categoryRef
- category.id
- category.name
- category.color
- user.id
- ui.appShell
- ui.desktopViewport
- ui.accessibilityCheck

## 제외 범위

- 검색, 필터.
- 할 일 생성, 수정, 삭제.
- 사용자에게 보이는 페이지 이동 컨트롤과 전체 개수 표시.
- 모바일/태블릿 전용 레이아웃 최적화.

## 수용 기준

- (API) 본인의 할 일 목록만 조회된다
- (API) 정렬 기준을 따로 정하지 않으면 본인의 할 일 목록은 미완료 할 일이 먼저, 같은 상태 안에서는 우선순위 HIGH, MEDIUM, LOW 순서, 같은 우선순위면 먼저 등록한 할 일이 위로 정렬되어 보인다
- (API) 사용자가 정렬 기준을 직접 정하면 그 정렬이 기본 정렬을 덮어쓴다
- (API) 본인의 할 일 목록은 한 번에 보는 개수와 묶음 번호 단위로 본다
- (API) 할 일 목록을 볼 때 현재 묶음 번호, 한 번에 보는 개수, 전체 할 일 수, 전체 묶음 수를 알 수 있다
- (API) 한 번에 보는 개수를 정하지 않으면 기본값 20이 적용된다
- (API) 한 번에 보는 개수가 100을 초과하면 100으로 제한된다
- (API) 기억하고 있던 묶음이 더 이상 존재하지 않으면 그 묶음에는 할 일이 보이지 않고, 현재 남은 전체 할 일 수와 전체 묶음 수를 알 수 있다
- (API) 할 일 목록에서 연결된 카테고리의 이름과 색상이 함께 보이며, 연결이 없으면 미분류로 보인다
- (UI) `/todos` 경로에 접근하면 자신의 할 일 목록이 보인다
- (UI) 할 일 목록은 서버가 반환한 순서대로 보인다
- (UI) 할 일 목록의 각 항목은 제목, 설명, 마감일, 우선순위, 완료 상태, 카테고리 이름과 색상을 함께 표시한다
- (UI) 카테고리 연결이 없는 할 일은 미분류로 보인다
- (UI) 할 일이 한 묶음(20개)보다 많으면, 처음에는 첫 묶음의 할 일까지만 보여주고 목록을 아래로 스크롤하면 다음 묶음의 할 일을 이어서 보여준다
- (UI) 할 일이 하나도 없으면 할 일이 비어 있다는 안내가 보인다
- (UI) 할 일 목록을 불러오지 못하면 다시 시도하라는 안내가 보인다
- (UI) 할 일 화면은 보호 앱 셸 안에 보이고, 할 일 화면과 카테고리 화면을 오갈 수 있는 내비가 보인다
- (UI) 비인증 사용자가 할 일 화면 경로에 접근하면 로그인 화면으로 이동한다
- (UI) 할 일 화면 경로로 진입했다가 로그인하면 할 일 화면으로 돌아온다
- (UI) 데스크톱 화면에서 할 일 목록과 입력 영역의 주요 요소가 화면 밖으로 넘치지 않는다
- (UI) 할 일 화면은 자동 접근성 검사에서 위반이 없어야 한다

## 검증 대상

- API: 필요
- DB: 필요
- UI: 필요
- Storybook: 필요
- E2E: 필요
- STATIC: 불필요

## API Skeleton

- `GET /todos`: 인증 사용자 기준 `PageResponse<TodoResponse>`를 반환하고 기본 `page=0`, `size=20`을 사용한다.
- 목록 응답 DTO는 할 일 기본 필드와 연결된 카테고리의 이름/색상 정보를 포함한다.
- sort query는 허용된 sort key만 받고, 지정하지 않으면 미완료, 우선순위, 생성 순서 기준 기본 정렬을 적용한다.
- FE API client는 `/todos` GET을 할 일 화면 mount와 추가 묶음 로드 시 generated client 경유로 호출한다.

## DB Skeleton

- `Todo` entity/table은 사용자 소유권 격리를 위해 `user_id`를 가진다.
- 목록 조회는 `user_id`로 격리하고 기본 정렬과 페이지 크기 제한을 적용한다.
- 카테고리 표시를 위해 nullable `category_id`와 카테고리 표시 정보를 응답 모델로 조합한다.

## UI Skeleton

- Page: `TodosPage`, route `/todos`, 보호 화면 앱 셸 안에서 렌더링한다.
- Component: `TodoList`, 제목, 설명, 마감일, 우선순위, 완료 상태, 카테고리 표시, 빈 상태, 로딩, 오류, 추가 묶음 로드를 제공한다.
- Route guard: 비인증 사용자는 로그인 화면으로 이동하고 로그인 후 `/todos`로 돌아온다.
- Accessibility: 데스크톱 viewport overflow와 자동 접근성 검사를 FE BDD 테스트로 확인한다.

## Storybook 계약

- Routes/TodosPage: RouteTodos, Empty, ManyItems
- Todos/TodoList: Default, Empty, Loading, ManyItemsLoadingMore

## 의사결정 로그

- 결정일: 2026-05-22
  결정: 본 카드 범위에 페이지네이션을 포함한다. 쿼리는 `page`, `size`, `sort`. 응답은 `PageResponse<T>`.
  이유: api-contract 표준은 모든 목록 API에 페이지네이션을 요구한다.
  결정자: Product Owner, Tech Lead
  영향: `size` 100 초과는 100으로 잘리고, 초과 `page`는 빈 `content`와 정확한 total 메타데이터로 응답한다.

- 결정일: 2026-05-27
  결정: sort 허용 키는 `title`, `dueDate`, `createdAt` 세 개로 한정한다.
  이유: 임의 컬럼 정렬을 허용하면 내부 컬럼이나 PII 컬럼이 정렬 키로 노출될 위험이 있다.
  결정자: REDSTONE
  영향: `TodoController.ALLOWED_SORT_KEYS`와 `SortKeys.requireAllowed`로 검증한다.

- 결정일: 2026-06-06
  결정: 할 일 목록 조회 카드는 `/todos` 화면 진입, 목록 표시, 보호 라우트, 데스크톱/접근성 AC도 함께 소유한다.
  이유: 목록 조회는 사용자가 할 일 관리 기능에 들어와 자신의 할 일을 보는 첫 화면 능력이며, 카테고리 목록 조회(`REQ-016`)와 같은 구조로 API와 UI 계약을 한 카드에서 추적한다.
  결정자: REDSTONE
  영향: 기존 화면 전용 카드의 목록/route/품질 UI AC와 FE BDD 커버리지를 본 카드로 이동한다.

- 결정일: 2026-06-06
  결정: 화면 목록은 기존 `GET /todos` 페이지 API를 한 묶음 20개 무한 로드로 소비한다.
  이유: 할 일 목록 API의 기본 묶음 크기와 카테고리 화면의 목록 UX를 맞춘다.
  결정자: REDSTONE
  영향: 사용자에게 페이지 이동 컨트롤은 보여주지 않고 스크롤로 다음 묶음을 이어 받는다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-023-todo-list.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 목록, 정렬, 페이지네이션, 카테고리 표시 시나리오가 모든 API AC를 커버한다.
  API Skeleton: 기존 `GET /todos`, `PageResponse<TodoResponse>`.
  DB Skeleton: 기존 `Todo` Entity.
  화면/라우팅 Skeleton: 2026-06-06 화면 도입 후 `/todos` 보호 route의 할 일 목록 화면이 본 카드 UI AC를 커버한다.
  검사기 Skeleton: 해당 없음.
  추적 정책: 기존 `REQ-002` 목록 AC와 테스트를 `REQ-023`으로 이동한다.
  검증: `./gradlew test`, `traceRequirements`.
  승인자: REDSTONE
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-02
  리뷰자: REDSTONE
  확인: 모든 목록 AC가 `TodoListApiAcceptanceTest`/`TodoListPaginationApiAcceptanceTest`와 시나리오 `Covers:`로 연결된다.
  결과: 승인

- 리뷰일: 2026-06-06
  리뷰자: REDSTONE
  확인: 목록 화면, 보호 라우트, 데스크톱/접근성 UI AC가 Playwright FE BDD 테스트의 `Requirement: REQ-023`와 `.feature` `Covers:` 블록에 연결된다.
  결과: 승인

### 구현 검증 리뷰

- 리뷰일: 2026-06-08
  리뷰자: REDSTONE
  확인: `npm run app:validate`가 Storybook build, back-end test, FE mock E2E, FE live E2E, trace `--check`를 모두 통과했고 본 카드의 구현 연결, AC Covers, 검증 대상 계약이 GREEN으로 유지된다.
  결과: 승인

### 최종 승인 리뷰

- 승인일: 2026-06-08
  승인자: REDSTONE
  확인: 열린 질문이 없고 `npm run app:validate` 기준 RED가 없으며 API/DB/UI/Storybook/E2E 검증 대상이 모두 PASS 상태로 추적된다.
  결과: 승인

## 열린 질문

- 없음
