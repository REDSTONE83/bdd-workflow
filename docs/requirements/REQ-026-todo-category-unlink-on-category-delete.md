# 요건 카드

요건 ID: REQ-026
제목: 카테고리 삭제 시 할 일 연결 해제
우선순위: 중간
상태: 검토중
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: todo
품질 속성: none
검증 수준: acceptance
관련 요건: REQ-021, REQ-019
대체 요건: 없음

## 사용자/목적

로그인 사용자는 카테고리를 삭제해도 그 카테고리에 묶여 있던 자신의 할 일을 잃지 않아야 한다.

## 범위

- 카테고리가 삭제되면 연결된 할 일의 카테고리 연결만 해제한다.
- 할 일 자체와 다른 필드는 유지한다.
- 카테고리 삭제 API의 삭제 가능 조건은 `REQ-019`가 소유한다.

## 표준 용어

- todo.task
- todo.id
- todo.categoryRef
- category.category
- category.id
- user.id

## 제외 범위

- 카테고리 삭제 자체의 권한, 부재, 타인 자원 검증.
- 할 일 삭제.

## 수용 기준

- (API) 연결된 카테고리가 삭제되면 본인의 할 일은 유지되고 카테고리 연결만 해제된다

## 의사결정 로그

- 결정일: 2026-05-21
  결정: 카테고리 삭제 시 연결된 본인 할 일의 `categoryId`를 `null`로 설정한다.
  이유: 카테고리 정리만으로 할 일 데이터를 잃지 않게 하고, 삭제 거절이나 cascade 손실을 피한다.
  결정자: Product Owner, Tech Lead
  영향: 사용자 관점 동작은 본 카드가 검증하고, 카테고리 삭제 핸들러의 삭제 조건은 `REQ-019`가 소유한다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-026-todo-category-unlink-on-category-delete.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 카테고리 삭제 후 할 일 유지와 연결 해제 시나리오가 AC를 커버한다.
  API Skeleton: 기존 `DELETE /categories/{categoryId}`와 `TodoService.detachCategoryFromAllTodos`.
  DB Skeleton: 기존 `Todo.categoryId`.
  화면/라우팅 Skeleton: 해당 없음.
  검사기 Skeleton: 해당 없음.
  추적 정책: 기존 `REQ-002` 카테고리 삭제 영향 AC와 테스트를 `REQ-026`으로 이동하고 `REQ-019`와 관련 요건으로 연결한다.
  검증: `./gradlew test`, `traceRequirements`.
  승인자: REDSTONE
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-02
  리뷰자: REDSTONE
  확인: 카테고리 삭제 영향 AC가 `TodoCategoryCascadeApiAcceptanceTest`와 시나리오 `Covers:`로 연결된다.
  결과: 승인

## 열린 질문

- 없음
