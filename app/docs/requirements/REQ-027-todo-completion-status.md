# 요건 카드

요건 ID: REQ-027
제목: 할 일 완료 상태 변경
우선순위: 높음
상태: 승인
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: todo
품질 속성: usability
검증 수준: mixed
상위 요건: REQ-021
관련 요건: REQ-021, REQ-024, REQ-004
대체 요건: 없음

## 사용자/목적

로그인 사용자는 자신의 할 일을 완료로 표시하거나 다시 미완료로 되돌릴 수 있어야 한다.

## 범위

- `PATCH /todos/{todoId}`의 `completed` 필드로 완료 처리와 미완료 되돌리기를 수행한다.
- `completed`는 명시적 `null`을 허용하지 않는다.
- 자원 존재 여부, 소유자 격리, 누락 필드 유지 판단은 같은 PATCH 경로의 공통 수정 정책인 `REQ-024`를 따른다.
- 별도 완료 전용 endpoint는 두지 않는다.
- 화면에서는 목록 항목의 체크박스로 완료 상태를 즉시 바꾼다.

## 표준 용어

- todo.task
- todo.id
- todo.completed
- todo.complete
- todo.update
- todo.notFound
- user.id

## 제외 범위

- 제목, 설명, 마감일, 우선순위, 카테고리 수정.
- `completed`를 보내지 않았을 때 기존 값을 유지하는 일반 부분 수정 검증.
- 할 일 생성, 목록, 삭제.
- 완료 전용 endpoint.
- 완료 이력, 완료 시각, 반복 할 일 상태 전이.

## 수용 기준

- (API) 수정 시 완료 상태를 명시적으로 비우려고 하면 수정이 거절된다
- (API) 수정 시 완료로 표시하면 할 일이 완료 상태로 바뀐다
- (API) 수정 시 미완료로 되돌리면 할 일이 미완료 상태로 되돌아간다
- (UI) 할 일 목록의 완료 체크를 바꾸면 목록의 완료 상태 표시가 바뀐다

## 의사결정 로그

- 결정일: 2026-05-21
  결정: 완료 상태는 boolean `completed` 단일 필드로 표현하고 양방향 토글을 허용한다.
  이유: 상태 전이가 단순하고 다시 미완료로 되돌리는 요구를 직관적으로 지원한다.
  결정자: Product Owner, Tech Lead
  영향: 별도 상태 enum을 두지 않으며 PATCH의 `completed` 필드로 처리한다.

- 결정일: 2026-06-02
  결정: 기존 `REQ-024`의 완료 상태 변경 AC를 `REQ-027`로 분리한다.
  이유: 완료 상태 변경은 단순 필드 수정이 아니라 할 일 생명주기의 독립 업무 상태 전이다.
  결정자: REDSTONE
  영향: `REQ-024`는 일반 부분 수정 AC만 소유하고, `REQ-027`은 `completed` 상태 변경 AC와 테스트를 소유한다.

- 결정일: 2026-06-06
  결정: 완료 상태 변경 UI는 별도 화면 카드가 아니라 본 완료 상태 원자 요건이 소유한다.
  이유: 사용자가 목록에서 체크박스로 완료 상태를 바꾸는 흐름은 완료 상태 변경 기능의 사용자 완료 조건이다.
  결정자: REDSTONE
  영향: 목록 체크박스 토글 UI AC와 FE BDD 커버리지를 본 카드로 이동한다.

## 수용 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-027-todo-completion-status.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 완료 상태 null 거절, 완료 처리, 완료 해제 시나리오가 모든 API AC를 커버한다.
  API Skeleton: 기존 `PATCH /todos/{todoId}`, `UpdateTodoRequest`, `TodoResponse`.
  DB Skeleton: 기존 `Todo` Entity.
  화면/라우팅 Skeleton: 2026-06-06 화면 도입 후 `/todos` 목록 항목의 체크박스가 본 카드 UI AC를 커버한다.
  검사기 Skeleton: 해당 없음.
  추적 정책: 기존 `REQ-024` 완료 상태 변경 AC와 테스트를 `REQ-027`로 이동한다.
  검증: `./gradlew test`, `traceRequirements`.
  승인자: REDSTONE
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-02
  리뷰자: REDSTONE
  확인: 모든 완료 상태 변경 AC가 `TodoCompletionStatusApiAcceptanceTest`와 시나리오 `Covers:`로 연결된다.
  결과: 승인

- 리뷰일: 2026-06-06
  리뷰자: REDSTONE
  확인: 완료 상태 변경 UI AC가 Playwright FE BDD 테스트의 `Requirement: REQ-027`와 `.feature` `Covers:` 블록에 연결된다.
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
