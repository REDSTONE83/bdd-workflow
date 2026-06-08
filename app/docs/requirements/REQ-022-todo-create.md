# 요건 카드

요건 ID: REQ-022
제목: 할 일 생성
우선순위: 높음
상태: 검토중
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: todo
품질 속성: usability
검증 수준: mixed
관련 요건: REQ-021, REQ-004, REQ-015
대체 요건: 없음

## 사용자/목적

로그인 사용자는 제목과 선택 정보를 입력해 자신의 새 할 일을 만들 수 있어야 한다.

## 범위

- 제목, 설명, 마감일, 우선순위, 카테고리 ID를 입력해 할 일을 생성한다.
- 제목은 필수이며 trim 후 저장한다.
- 설명, 마감일, 카테고리는 선택 입력이며 누락 또는 명시적 `null`이면 비어 있는 상태로 저장한다.
- 우선순위는 `HIGH`, `MEDIUM`, `LOW` 중 하나이며 미입력 시 `MEDIUM`을 적용한다.
- 생성된 할 일의 완료 상태는 항상 미완료로 시작한다.
- 본인 소유 카테고리만 연결할 수 있다.
- 화면에서는 새 할 일 만들기 폼 대화상자로 생성한다.
- 생성 요청 실패 시 사용자가 같은 입력으로 다시 시도할 수 있다.

## 표준 용어

- todo.task
- todo.id
- todo.title
- todo.description
- todo.dueDate
- todo.priority
- todo.completed
- todo.create
- todo.response
- todo.categoryRef
- todo.invalidCategory
- category.id
- category.name
- category.color
- user.id

## 제외 범위

- 생성 요청의 `completed` 입력 처리.
- 할 일 목록 조회 자체, 수정, 삭제.
- 카테고리 자체 CRUD.

## 수용 기준

- (API) 유효한 정보이면 할 일이 생성된다
- (API) 제목은 앞뒤 공백이 제거되어 저장된다
- (API) 제목이 비어 있거나 공백만 입력하면 할 일 생성이 거절된다
- (API) 제목이 100자를 초과하면 할 일 생성이 거절된다
- (API) 설명이 1000자를 초과하면 할 일 생성이 거절된다
- (API) 할 일 생성 시 설명을 입력하지 않으면 설명 없이 저장된다
- (API) 할 일 생성 시 설명을 명시적으로 비우면 설명 없이 저장된다
- (API) 마감일이 날짜 형식이 아니면 할 일 생성이 거절된다
- (API) 할 일 생성 시 마감일을 입력하지 않으면 마감일 없이 저장된다
- (API) 할 일 생성 시 마감일을 명시적으로 비우면 마감일 없이 저장된다
- (API) 할 일 생성 시 과거 날짜를 마감일로 입력해도 허용된다
- (API) 우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 할 일 생성이 거절된다
- (API) 우선순위를 입력하지 않으면 기본 우선순위 MEDIUM으로 할 일이 생성된다
- (API) 할 일 생성 시 완료 상태는 미완료로 저장된다
- (API) 할 일 생성 시 카테고리를 선택하지 않으면 미분류 상태로 저장된다
- (API) 할 일 생성 시 카테고리를 명시적으로 비우면 미분류 상태로 저장된다
- (API) 할 일 생성 시 본인의 카테고리를 선택하면 해당 카테고리에 묶여 저장된다
- (API) 할 일 생성 시 본인이 사용할 수 없는 카테고리를 선택하면 거절된다
- (UI) 새 할 일 만들기를 열면 제목, 설명, 마감일, 우선순위, 카테고리를 입력하는 입력 영역과 만들기 버튼이 보인다
- (UI) 할 일을 만들거나 수정할 때 제목을 비우거나 공백만 입력하면 제목 입력 아래에 입력이 필요하다는 안내가 보인다
- (UI) 할 일을 만들거나 수정할 때 설명이 1000자를 넘으면 설명 입력 아래에 길이 제한 안내가 보인다
- (UI) 새 할 일을 만들면 목록에 미완료 할 일로 보인다
- (UI) 할 일 생성 요청이 실패하면 실패 안내가 보이고 사용자가 다시 시도할 수 있다

## Storybook 계약

- Todos/TodoFormDialog: Create, TitleRequiredError, DescriptionTooLongError, Submitting, SaveFailure

## 의사결정 로그

- 결정일: 2026-05-21
  결정: 우선순위는 HIGH/MEDIUM/LOW 세 단계, 미지정 시 MEDIUM.
  이유: 일반적인 작업 관리 도구 표현과 일치하고 정렬 규칙을 단순하게 유지한다.
  결정자: Product Owner
  영향: DTO/Entity의 priority는 enum 타입이며 기본값을 MEDIUM으로 둔다.

- 결정일: 2026-05-21
  결정: `categoryId`는 선택 입력. 미입력 시 미분류 상태로 저장한다.
  이유: 모든 할 일에 분류를 강제하지 않고 사용자 선택에 맡긴다.
  결정자: Product Owner
  영향: Todo DTO/Entity의 `categoryId`는 nullable이며, 미분류 할 일은 응답의 `category`가 `null`이다.

- 결정일: 2026-05-21
  결정: 생성 요청은 `completed` 필드를 받지 않으며 DTO에도 두지 않는다.
  이유: 생성된 할 일의 완료 상태는 항상 `false`로 고정되므로 입력 필드는 의미 중복이다.
  결정자: Product Owner, Tech Lead
  영향: `CreateTodoRequest`에 `completed` 필드를 두지 않는다.

- 결정일: 2026-06-06
  결정: 할 일 생성 UI는 별도 화면 카드가 아니라 본 생성 원자 요건이 소유한다.
  이유: 사용자가 보는 생성 폼 대화상자, 입력 검증, 성공 후 목록 반영은 생성 기능의 완료 조건이며 API 계약과 분리하면 추적과 승인 단위가 나뉜다.
  결정자: REDSTONE
  영향: 새 할 일 만들기 폼 대화상자, 생성 입력 검증, 생성 실패 재시도, 목록 반영 UI AC와 FE BDD 커버리지를 본 카드로 이동한다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-022-todo-create.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 생성 정상/선택값/검증 실패/카테고리 연결 시나리오가 모든 API AC를 커버한다.
  API Skeleton: 기존 `POST /todos`, `CreateTodoRequest`, `TodoResponse`.
  DB Skeleton: 기존 `Todo` Entity.
  화면/라우팅 Skeleton: 2026-06-06 화면 도입 후 `/todos` 화면의 새 할 일 만들기 폼 대화상자가 본 카드 UI AC를 커버한다.
  검사기 Skeleton: 해당 없음.
  추적 정책: 기존 `REQ-002` 생성 AC와 테스트를 `REQ-022`로 이동한다.
  검증: `./gradlew test`, `traceRequirements`.
  승인자: REDSTONE
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-02
  리뷰자: REDSTONE
  확인: 모든 생성 AC가 `TodoCreateApiAcceptanceTest`와 시나리오 `Covers:`로 연결된다.
  결과: 승인

- 리뷰일: 2026-06-06
  리뷰자: REDSTONE
  확인: 생성 UI AC가 Playwright FE BDD 테스트의 `Requirement: REQ-022`와 `.feature` `Covers:` 블록에 연결된다.
  결과: 검토중

## 열린 질문

- 없음
