# 요건 카드

요건 ID: REQ-023
제목: 할 일 목록 조회
우선순위: 높음
상태: 검토중
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: todo
품질 속성: none
검증 수준: acceptance
관련 요건: REQ-021, REQ-004, REQ-015
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

## 제외 범위

- 검색, 필터.
- 화면 목록 UI.
- 할 일 생성, 수정, 삭제.

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

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-023-todo-list.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 목록, 정렬, 페이지네이션, 카테고리 표시 시나리오가 모든 AC를 커버한다.
  API Skeleton: 기존 `GET /todos`, `PageResponse<TodoResponse>`.
  DB Skeleton: 기존 `Todo` Entity.
  화면/라우팅 Skeleton: `TodosPlaceholderPage`는 아직 본문 미구현이며 본 카드의 UI 범위가 아니다.
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

## 열린 질문

- 없음
