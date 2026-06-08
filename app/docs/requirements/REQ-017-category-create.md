# 요건 카드

요건 ID: REQ-017
제목: 카테고리 생성
우선순위: 중간
상태: 승인
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: category
품질 속성: usability
검증 수준: mixed
관련 요건: REQ-015, REQ-004
대체 요건: 없음

## 사용자/목적

로그인 사용자는 이름, 색상, 설명, 정렬 순서를 입력해 자신의 새 카테고리를 만들 수 있어야 한다.

## 범위

- 사용자는 이름, 색상, 설명, 정렬 순서를 입력해 카테고리를 생성한다.
- 이름은 앞뒤 공백을 제거한 뒤 저장하고 중복 판단에 사용한다.
- 정렬 순서를 입력하지 않으면 본인 카테고리의 최대값에 1024를 더한 값으로 자동 할당한다.
- 같은 사용자 안에서 카테고리 이름은 유일해야 한다.
- 화면에서는 새 카테고리 만들기 폼 대화상자로 생성한다.
- 생성 요청 중에는 중복 제출을 막는다.

## 표준 용어

- category.category
- category.name
- category.color
- category.description
- category.displayOrder
- category.create
- category.duplicateName

## 제외 범위

- 카테고리 목록 진입과 보호 라우트
- 카테고리 수정과 삭제
- 카테고리 수동 재정렬 UX
- 색상 사용자 정의 팔레트 관리

## 수용 기준

- (API) 유효한 정보이면 카테고리가 생성된다
- (API) 이름은 앞뒤 공백이 제거되어 저장된다
- (API) 이름이 비어 있거나 공백만 입력하면 카테고리 생성이 거절된다
- (API) 이름이 50자를 초과하면 카테고리 생성이 거절된다
- (API) 설명이 500자를 초과하면 카테고리 생성이 거절된다
- (API) 색상 형식이 잘못되면 카테고리 생성이 거절된다
- (API) 같은 사용자가 이미 등록한 이름이면 카테고리 생성이 거절된다
- (API) 정렬 순서를 정하지 않으면 본인 카테고리 목록의 가장 뒤에 추가된다
- (UI) 새 카테고리 만들기를 열면 이름, 색상, 설명을 입력하는 입력 영역과 만들기 버튼이 보인다
- (UI) 카테고리를 만들거나 수정할 때 이름을 비우거나 공백만 입력하면 이름 입력 아래에 입력이 필요하다는 안내가 보인다
- (UI) 카테고리를 만들거나 수정할 때 이름이 50자를 초과하면 이름이 너무 길다는 안내가 보인다
- (UI) 카테고리를 만들거나 수정할 때 설명이 500자를 초과하면 설명이 너무 길다는 안내가 보인다
- (UI) 카테고리를 만들거나 수정할 때 색상 형식이 올바르지 않으면 색상 입력 아래에 형식 안내가 보인다
- (UI) 유효한 정보로 카테고리를 만들면 새 카테고리가 목록에 나타난다
- (UI) 이미 사용 중인 이름으로 카테고리를 만들려고 하면 중복 이름 안내가 보인다
- (UI) 카테고리를 만드는 요청을 기다리는 동안 만들기 버튼은 다시 누를 수 없는 상태로 표시된다

## 검증 대상

- API: 필요
- DB: 필요
- UI: 필요
- Storybook: 필요
- E2E: 불필요
- STATIC: 불필요

## API Skeleton

- `POST /categories`: 인증 사용자 기준 새 카테고리를 만들고 성공 시 `201 Created`와 `CreateCategoryResponse`를 반환한다.
- `CreateCategoryRequest`: `name`, `color`, `description`, `displayOrder`를 받으며 `name`은 trim 후 필수·최대 50자, `description`은 최대 500자, `color`는 `#RRGGBB` 형식이다.
- 중복 이름은 사용자별로 판단하고 `409 Conflict`로 응답한다. 값 검증 실패는 `400 Bad Request`로 응답한다.
- FE API client는 `/categories` POST를 generated client 경유로 호출하고 `409`를 `DuplicateCategoryNameError`로 매핑한다.

## DB Skeleton

- `Category` entity/table `category`: 생성 시 `user_id`, `name`, `color`, `description`, `display_order`를 저장한다.
- 같은 사용자 안의 이름 유일성은 `user_id + name` unique constraint와 생성 서비스의 중복 검사로 보장한다.
- `displayOrder` 미입력 시 본인 카테고리의 최대 `displayOrder + 1024`를 저장하고, 기존 카테고리가 없으면 `1024`를 저장한다.

## UI Skeleton

- Dialog: `CategoryFormDialog` create mode는 이름, 색상, 설명 입력과 만들기 버튼을 제공한다.
- Validation: 이름 필수·50자 제한, 설명 500자 제한, 색상 형식 오류를 입력 아래 안내로 표시한다.
- Submission: 생성 요청 중 만들기 버튼을 비활성화하고, 중복 이름 거절은 같은 폼 대화상자 안에 안내한다.
- Page integration: `CategoriesPage`는 생성 성공 후 카테고리 목록을 갱신해 새 카테고리를 보여준다.

## Storybook 계약

- `Categories/CategoryFormDialog`: Create, NameRequiredError, NameTooLongError, DescriptionTooLongError, ColorFormatError, Submitting, DuplicateNameRejection
- `Routes/CategoriesPage`: RouteCategories

## 의사결정 로그

- 결정일: 2026-05-21
  결정: 같은 사용자 안에서 카테고리 이름은 유일하다. 다른 사용자는 동일 이름을 가질 수 있다.
  이유: 사용자별 카테고리 목록 일관성을 보장하면서 사용자 사이 격리를 유지한다.
  결정자: Product Owner
  영향: 생성 시 같은 사용자 안의 중복 이름은 거절된다.

- 결정일: 2026-05-21
  결정: 이름은 서버에서 앞뒤 공백을 trim한 뒤 저장·중복 판정한다.
  이유: `"  업무  "`와 `"업무"`가 다른 카테고리로 보이는 혼란을 막는다.
  결정자: Product Owner, Tech Lead
  영향: trim 후 빈 문자열은 생성이 거절된다.

- 결정일: 2026-05-21
  결정: displayOrder는 선택 입력이며, 미입력 시 본인 카테고리의 최대 displayOrder에 1024를 더한 값을 자동 할당한다.
  이유: 중간 삽입 여지를 남기면서 자동 재배치 정책 없이도 운영 가능하다.
  결정자: Product Owner, Tech Lead
  영향: 생성 시 정렬 순서를 생략해도 목록 맨 뒤에 추가된다.

- 결정일: 2026-05-30
  결정: 카테고리 생성은 목록 위에 뜨는 폼 대화상자 입력 영역으로 처리한다.
  이유: 목록 맥락을 유지한 채 검증 안내, 진행 중, 중복 이름 안내를 한 곳에 모을 수 있다.
  결정자: Tech Lead
  영향: 생성 폼 대화상자는 이름, 색상, 설명 입력과 만들기 버튼을 가진다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-017-category-create.feature`
- 검증 설계: API 생성 AC와 UI 생성 폼 대화상자/검증/중복 제출 방지 AC를 기존 Acceptance Test와 Playwright FE BDD 테스트로 연결한다.
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
