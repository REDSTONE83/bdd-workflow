# 요건 카드

요건 ID: REQ-024
제목: 할 일 수정
우선순위: 높음
상태: 승인
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: todo
품질 속성: usability
검증 수준: mixed
상위 요건: REQ-021
관련 요건: REQ-021, REQ-004, REQ-015, REQ-027
대체 요건: 없음

## 사용자/목적

로그인 사용자는 자신의 할 일 내용을 부분 수정할 수 있어야 한다.

## 범위

- PATCH 의미로 누락된 필드는 기존 값을 유지한다.
- `description`, `dueDate`, `categoryId`는 명시적 `null`로 비울 수 있다.
- `title`, `priority`는 명시적 `null`을 허용하지 않는다.
- 제목, 설명, 마감일, 우선순위, 카테고리 검증은 생성과 같은 규칙을 따른다.
- 존재하지 않거나 다른 사용자의 할 일 수정은 거절한다.
- 화면에서는 수정 입력 대화상자로 제목, 설명, 마감일, 우선순위, 카테고리를 수정한다.
- 수정 요청 실패 시 사용자가 같은 입력으로 다시 시도할 수 있다.

## 표준 용어

- todo.task
- todo.id
- todo.title
- todo.description
- todo.dueDate
- todo.priority
- todo.update
- todo.response
- todo.categoryRef
- todo.notFound
- todo.invalidCategory
- category.id
- category.name
- user.id

## 제외 범위

- 할 일 생성, 목록, 삭제.
- 완료 상태 변경.
- 카테고리 자체 CRUD.

## 수용 기준

- (API) 수정 시 입력한 항목만 변경되고 입력하지 않은 항목은 기존 값을 유지한다
- (API) 수정 시 설명을 명시적으로 비우면 설명이 지워진다
- (API) 수정 시 마감일을 명시적으로 비우면 마감일이 지워진다
- (API) 수정 시 카테고리를 명시적으로 비우면 카테고리 연결이 해제된다
- (API) 수정 시 제목을 명시적으로 비우려고 하면 수정이 거절된다
- (API) 수정 시 우선순위를 명시적으로 비우려고 하면 수정이 거절된다
- (API) 수정 시 제목 앞뒤 공백은 제거되어 저장된다
- (API) 수정 시 제목이 비어 있거나 공백만 입력하면 수정이 거절된다
- (API) 수정 시 제목이 100자를 초과하면 수정이 거절된다
- (API) 수정 시 설명이 1000자를 초과하면 수정이 거절된다
- (API) 수정 시 마감일이 날짜 형식이 아니면 수정이 거절된다
- (API) 수정 시 우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 수정이 거절된다
- (API) 수정 시 본인의 카테고리를 선택하면 해당 카테고리로 연결이 변경된다
- (API) 수정 시 본인이 사용할 수 없는 카테고리를 선택하면 거절된다
- (API) 존재하지 않는 할 일을 수정하려 하면 거절된다
- (API) 다른 사용자의 할 일을 수정하려 하면 거절된다
- (UI) 할 일 수정을 열면 기존 제목, 설명, 마감일, 우선순위, 카테고리가 입력 영역에 채워져 보인다
- (UI) 할 일을 만들거나 수정할 때 제목을 비우거나 공백만 입력하면 제목 입력 아래에 입력이 필요하다는 안내가 보인다
- (UI) 할 일을 만들거나 수정할 때 설명이 1000자를 넘으면 설명 입력 아래에 길이 제한 안내가 보인다
- (UI) 할 일을 수정하면 목록에 바뀐 제목, 설명, 마감일, 우선순위, 카테고리가 보인다
- (UI) 할 일의 선택 정보를 비우고 저장하면 목록에서 설명과 마감일은 보이지 않고 카테고리는 미분류로 보인다
- (UI) 할 일 수정 요청이 실패하면 실패 안내가 보이고 사용자가 다시 시도할 수 있다

## 의사결정 로그

- 결정일: 2026-05-21
  결정: 할 일 수정은 PATCH 의미로 처리한다.
  이유: 사용자가 일부 항목만 바꿀 수 있어야 하며, 누락과 명시적 비움의 의미가 다르다.
  결정자: Product Owner, Tech Lead
  영향: `UpdateTodoRequest`는 `JsonNullable<T>`로 필드 미포함과 명시적 `null`을 구분한다.

- 결정일: 2026-06-06
  결정: 할 일 수정 UI는 별도 화면 카드가 아니라 본 수정 원자 요건이 소유한다.
  이유: 수정 입력 대화상자의 기존값 표시, 선택 정보 비우기, 저장 실패 재시도는 수정 기능의 사용자 완료 조건이며 API PATCH 계약과 함께 추적되어야 한다.
  결정자: REDSTONE
  영향: 수정 입력 대화상자, 수정 입력 검증, 수정 실패 재시도, 목록 반영 UI AC와 FE BDD 커버리지를 본 카드로 이동한다.

## 수용 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-024-todo-update.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 부분 수정, 명시적 비움, 검증 실패, 카테고리 변경, 부재/타인 자원 시나리오가 모든 API AC를 커버한다.
  API Skeleton: 기존 `PATCH /todos/{todoId}`, `UpdateTodoRequest`, `TodoResponse`.
  DB Skeleton: 기존 `Todo` Entity.
  화면/라우팅 Skeleton: 2026-06-06 화면 도입 후 `/todos` 화면의 할 일 수정 입력 대화상자가 본 카드 UI AC를 커버한다.
  검사기 Skeleton: 해당 없음.
  추적 정책: 기존 `REQ-002` 수정 AC와 테스트를 `REQ-024`로 이동한다.
  검증: `./gradlew test`, `traceRequirements`.
  승인자: REDSTONE
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-02
  리뷰자: REDSTONE
  확인: 모든 수정 AC가 `TodoUpdateApiAcceptanceTest`와 시나리오 `Covers:`로 연결된다.
  결과: 승인

- 리뷰일: 2026-06-06
  리뷰자: REDSTONE
  확인: 수정 UI AC가 Playwright FE BDD 테스트의 `Requirement: REQ-024`와 `.feature` `Covers:` 블록에 연결된다.
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
