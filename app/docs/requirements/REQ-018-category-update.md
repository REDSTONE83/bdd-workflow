# 요건 카드

요건 ID: REQ-018
제목: 카테고리 수정
우선순위: 중간
상태: 승인
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: category
품질 속성: usability
검증 수준: mixed
상위 요건: REQ-015
관련 요건: REQ-015, REQ-004
대체 요건: 없음

## 사용자/목적

로그인 사용자는 자신의 카테고리 이름, 색상, 설명, 정렬 순서를 필요한 항목만 부분 수정할 수 있어야 한다.

## 범위

- 사용자는 자신의 카테고리 내용을 부분 수정한다.
- 요청에 포함된 필드만 변경하고 누락된 필드는 기존 값을 유지한다.
- `color` 또는 `description`을 명시적으로 비우면 값을 지운다.
- 수정 시 포함된 필드는 생성과 동일한 검증 규칙을 통과해야 한다.
- 다른 사용자의 카테고리 접근은 부존재와 동일하게 거절한다.
- 화면에서는 수정 입력 대화상자로 이름, 색상, 설명을 수정한다.
- 수정 요청 중에는 중복 제출을 막는다.

## 표준 용어

- category.category
- category.name
- category.color
- category.description
- category.displayOrder
- category.update
- category.notFound
- category.duplicateName

## 제외 범위

- 카테고리 생성과 삭제
- 카테고리 수동 재정렬 UX
- 다른 사용자와의 카테고리 공유

## 수용 기준

- (API) 수정 시 입력한 항목만 변경되고 입력하지 않은 항목은 기존 값을 유지한다
- (API) 수정 시 색상을 명시적으로 비우면 색상이 지워진다
- (API) 수정 시 설명을 명시적으로 비우면 설명이 지워진다
- (API) 수정 시 이름이 비어 있거나 공백만 입력하면 수정이 거절된다
- (API) 수정 시 이름이 50자를 초과하면 수정이 거절된다
- (API) 수정 시 설명이 500자를 초과하면 수정이 거절된다
- (API) 수정 시 색상 형식이 잘못되면 수정이 거절된다
- (API) 수정 시 같은 사용자 안에서 이미 사용 중인 이름으로 바꾸려 하면 수정이 거절된다
- (API) 존재하지 않는 카테고리를 수정하려 하면 거절된다
- (API) 다른 사용자의 카테고리를 수정하려 하면 거절된다
- (UI) 카테고리를 만들거나 수정할 때 이름을 비우거나 공백만 입력하면 이름 입력 아래에 입력이 필요하다는 안내가 보인다
- (UI) 카테고리를 만들거나 수정할 때 이름이 50자를 초과하면 이름이 너무 길다는 안내가 보인다
- (UI) 카테고리를 만들거나 수정할 때 설명이 500자를 초과하면 설명이 너무 길다는 안내가 보인다
- (UI) 카테고리를 만들거나 수정할 때 색상 형식이 올바르지 않으면 색상 입력 아래에 형식 안내가 보인다
- (UI) 카테고리를 수정해 이름이나 색상을 바꾸면 변경된 이름과 색상이 목록에 반영된다
- (UI) 카테고리를 수정해 설명을 바꾼 뒤 수정 화면을 다시 열면 변경된 설명이 보인다
- (UI) 카테고리를 수정할 때 색상을 비우면 목록에서 그 카테고리의 색상 표시가 사라진다
- (UI) 카테고리를 수정할 때 설명을 비운 뒤 수정 화면을 다시 열면 설명이 비어 있다
- (UI) 카테고리를 수정할 때 이미 사용 중인 다른 이름으로 바꾸려고 하면 중복 이름 안내가 보인다
- (UI) 카테고리를 수정하는 요청을 기다리는 동안 저장 버튼은 다시 누를 수 없는 상태로 표시된다

## 검증 대상

- API: 필요
- DB: 필요
- UI: 필요
- Storybook: 필요
- E2E: 불필요
- STATIC: 불필요

## API Skeleton

- `PATCH /categories/{categoryId}`: 인증 사용자 기준 자신의 카테고리를 부분 수정하고 성공 시 `200 OK`와 `CategoryResponse`를 반환한다.
- `UpdateCategoryRequest`: `name`, `color`, `description`, `displayOrder`를 `JsonNullable` 필드로 받으며 누락 필드는 기존 값을 유지한다.
- `color`와 `description`은 명시적 `null`로 값을 지울 수 있고, `displayOrder`의 명시적 `null`은 거절한다.
- 값 검증 실패는 `400 Bad Request`, 부재 또는 타인 자원은 `404 Not Found`, 중복 이름은 `409 Conflict`로 응답한다.
- FE API client는 `/categories/{categoryId}` PATCH를 generated client 경유로 호출하고 `nullablePatchBody`로 값·null·누락을 구분한다.

## DB Skeleton

- `Category` entity/table `category`: 수정 시 같은 `id`와 `user_id`를 유지하고 입력된 `name`, `color`, `description`, `display_order`만 갱신한다.
- `findByIdAndUserId`로 사용자 소유 카테고리만 조회해 타인 자원 존재 여부를 노출하지 않는다.
- 같은 사용자 안의 이름 유일성은 `user_id + name` unique constraint와 수정 서비스의 중복 검사로 보장한다.

## UI Skeleton

- Dialog: `CategoryFormDialog` edit mode는 현재 이름, 색상, 설명을 초기값으로 채우고 저장 버튼을 제공한다.
- Validation: 이름 필수·50자 제한, 설명 500자 제한, 색상 형식 오류를 입력 아래 안내로 표시한다.
- Submission: 수정 요청 중 저장 버튼을 비활성화하고, 중복 이름 거절은 같은 입력 대화상자 안에 안내한다.
- Page integration: `CategoriesPage`는 수정 성공 후 카테고리 목록을 갱신하고, 색상·설명 명시적 비우기를 화면에 반영한다.

## Storybook 계약

- `Categories/CategoryFormDialog`: Edit, EditNameRequiredError, EditNameTooLongError, EditDescriptionTooLongError, EditColorFormatError, EditSubmitting, EditDuplicateNameRejection
- `Routes/CategoriesPage`: RouteCategories

## 의사결정 로그

- 결정일: 2026-05-21
  결정: 카테고리 수정은 PATCH 의미다. 누락 필드는 유지하고, `color`/`description`은 명시적 비우기를 허용한다.
  이유: 이름만 또는 색상만 바꾸는 흐름이 자연스럽고, 부분 수정이라도 저장 상태가 검증 규칙을 만족해야 한다.
  결정자: Product Owner, Tech Lead
  영향: 수정 요청 본문의 모든 필드는 생성과 동일한 검증 규칙을 적용한다.

- 결정일: 2026-05-21
  결정: 다른 사용자의 카테고리 접근은 부존재와 동일하게 거절한다.
  이유: 다른 사용자 자원의 존재 여부 노출을 막는다.
  결정자: Tech Lead
  영향: 부재와 타인 자원 수정은 동일한 거절 분기로 검증한다.

- 결정일: 2026-05-30
  결정: 카테고리 수정은 목록 위에 뜨는 입력 대화상자로 처리한다.
  이유: 목록 맥락을 유지한 채 검증 안내, 진행 중, 중복 이름 안내를 한 곳에 모을 수 있다.
  결정자: Tech Lead
  영향: 수정 입력 대화상자는 이름, 색상, 설명 입력과 저장 버튼을 가진다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-018-category-update.feature`
- 검증 설계: API 수정 AC와 UI 수정 입력 대화상자/검증/중복 제출 방지 AC를 기존 Acceptance Test와 Playwright FE BDD 테스트로 연결한다.
- 결과: 승인

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
