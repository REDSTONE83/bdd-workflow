# 요건 카드

요건 ID: REQ-025
제목: 할 일 삭제
우선순위: 높음
상태: 승인
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: todo
품질 속성: usability
검증 수준: mixed
상위 요건: REQ-021
관련 요건: REQ-021, REQ-004
대체 요건: 없음

## 사용자/목적

로그인 사용자는 더 이상 필요 없는 자신의 할 일을 영구 삭제할 수 있어야 한다.

## 범위

- 본인의 할 일을 hard delete로 삭제한다.
- 존재하지 않거나 다른 사용자의 할 일 삭제는 거절한다.
- 다른 사용자의 할 일 존재 여부는 노출하지 않는다.
- 화면에서는 삭제 전 확인 대화상자를 보여준다.
- 삭제 요청 실패 시 사용자가 다시 시도할 수 있다.

## 표준 용어

- todo.task
- todo.id
- todo.delete
- todo.notFound
- user.id

## 제외 범위

- soft delete, 복구, 감사 추적.
- 카테고리 삭제 시 연결 해제 정책.

## 수용 기준

- (API) 본인의 할 일을 영구 삭제할 수 있다
- (API) 존재하지 않는 할 일을 삭제하려 하면 거절된다
- (API) 다른 사용자의 할 일을 삭제하려 하면 거절된다
- (UI) 할 일을 삭제하려고 하면 삭제 확인 안내가 보인다
- (UI) 삭제를 확인하면 그 할 일은 목록에서 사라진다
- (UI) 할 일 삭제 요청이 실패하면 실패 안내가 보이고 사용자가 다시 시도할 수 있다

## 의사결정 로그

- 결정일: 2026-05-21
  결정: 삭제는 hard delete로 처리한다.
  이유: 본 카드 범위에서 복구와 감사 추적은 불필요하다.
  결정자: Product Owner
  영향: Entity는 soft delete 컬럼을 두지 않는다.

- 결정일: 2026-05-21
  결정: 다른 사용자의 할 일 접근은 부존재와 동일하게 응답한다.
  이유: 권한 부재와 부존재를 구분하면 다른 사용자 자원의 존재 여부가 노출된다.
  결정자: Tech Lead
  영향: BDD 테스트는 부재와 타인 자원 케이스를 동일한 거절로 검증한다.

- 결정일: 2026-06-06
  결정: 할 일 삭제 UI는 별도 화면 카드가 아니라 본 삭제 원자 요건이 소유한다.
  이유: 삭제 확인, 삭제 성공 후 목록 제거, 삭제 실패 재시도는 삭제 기능의 사용자 완료 조건이며 API 삭제 계약과 함께 추적되어야 한다.
  결정자: REDSTONE
  영향: 삭제 확인 대화상자, 삭제 실패 재시도, 목록 제거 UI AC와 FE BDD 커버리지를 본 카드로 이동한다.

## 수용 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-025-todo-delete.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 삭제 정상, 부재, 타인 자원 시나리오가 모든 API AC를 커버한다.
  API Skeleton: 기존 `DELETE /todos/{todoId}`.
  DB Skeleton: 기존 `Todo` Entity.
  화면/라우팅 Skeleton: 2026-06-06 화면 도입 후 `/todos` 화면의 삭제 확인 대화상자가 본 카드 UI AC를 커버한다.
  검사기 Skeleton: 해당 없음.
  추적 정책: 기존 `REQ-002` 삭제 AC와 테스트를 `REQ-025`로 이동한다.
  검증: `./gradlew test`, `traceRequirements`.
  승인자: REDSTONE
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-02
  리뷰자: REDSTONE
  확인: 모든 삭제 AC가 `TodoDeleteApiAcceptanceTest`와 시나리오 `Covers:`로 연결된다.
  결과: 승인

- 리뷰일: 2026-06-06
  리뷰자: REDSTONE
  확인: 삭제 UI AC가 Playwright FE BDD 테스트의 `Requirement: REQ-025`와 `.feature` `Covers:` 블록에 연결된다.
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
