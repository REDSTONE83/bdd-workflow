# 요건 카드

요건 ID: REQ-002
제목: 개인별 할 일 관리
우선순위: 높음
상태: 승인

## 사용자/목적

로그인 사용자는 자신의 할 일을 생성, 조회, 수정, 완료 처리, 삭제할 수 있어야 한다.

## 범위

- 사용자는 제목, 설명, 마감일, 우선순위, 카테고리 ID를 입력해 할 일을 생성한다. 제목은 필수이며, 설명·마감일·카테고리 ID는 선택 입력이다. 카테고리 ID 미입력 시 미분류 상태로 저장되고, 설명·마감일을 누락하거나 명시적 `null`로 보내면 해당 필드 없이 저장된다.
- 제목은 앞뒤 공백을 제거한 뒤 저장하며, trim 후 빈 문자열이면 거절한다. 제목은 최대 100자, 설명은 최대 1000자이다.
- 마감일은 ISO 8601 날짜(`YYYY-MM-DD`)로 입력한다. 시각은 포함하지 않으며 선택 입력이고 과거 날짜도 허용한다.
- 우선순위는 `HIGH`, `MEDIUM`, `LOW` 중 하나이며 미입력 시 `MEDIUM`이 적용된다.
- 사용자는 자신의 할 일 목록을 조회한다. 응답은 `page`, `size`, `totalElements`, `totalPages`, `content`를 가진 페이지 응답이다. 클라이언트가 `sort`를 지정하지 않으면 기본 정렬은 미완료(`completed=false`)가 먼저, 같은 상태에서는 우선순위 내림차순(HIGH→MEDIUM→LOW), 동률은 식별자 오름차순이다. 클라이언트가 `sort`를 보내면 그 정렬이 기본 정렬을 덮어쓴다. 응답 항목에는 연결된 카테고리의 ID, 이름, 색상이 함께 포함되며 카테고리가 없으면 카테고리 정보는 `null`이다.
- 목록은 `page`(0부터, 기본 0), `size`(기본 20, 최대 100) 쿼리 파라미터로 페이지 단위 조회된다. 데이터 개수를 초과한 `page`를 요청하면 빈 `content`가 반환되고 `totalElements`/`totalPages`는 데이터에 따른 값이 동일하게 유지된다.
- 사용자는 자신의 할 일 내용을 부분 수정한다(PATCH 의미). 누락된 필드는 기존 값을 유지하고, `description`/`dueDate`/`categoryId`는 명시적 `null`로 비울 수 있다. `title`, `priority`, `completed`는 명시적 `null`을 허용하지 않는다.
- 생성된 할 일의 완료 상태(`completed`)는 항상 `false`(미완료)로 시작한다. 생성 요청은 `completed`를 입력하지 않는다.
- 사용자는 PATCH의 `completed` 필드(`true`/`false`)로 완료 처리하거나 미완료로 되돌린다.
- 사용자는 자신의 할 일을 영구 삭제한다.
- 인증된 사용자는 JWT Bearer 토큰으로 식별한다 (REQ-004 JWT 인증으로 대체됨; 본 카드 작성 당시의 임시 `X-User-Id` 헤더 정책은 더 이상 적용되지 않는다).

## 표준 용어

- todo.task
- todo.id
- todo.title
- todo.description
- todo.dueDate
- todo.priority
- todo.completed
- todo.create
- todo.list
- todo.update
- todo.complete
- todo.delete
- todo.response
- todo.categoryRef
- todo.notFound
- todo.invalidCategory
- category.category
- category.id
- category.name
- category.color
- user.id

> 공통 인프라 용어(`common.*`: audit 컬럼, ApiError 부속 필드, PageResponse 부속 필드 등)는 `docs/terminology/domains/common.json`에 등록되어 있으며, [`docs/standards/terminology.md`](../standards/terminology.md) 정책에 따라 카드별 표준 용어 섹션에는 반복 명시하지 않는다.

## 제외 범위

- 카테고리 자체의 CRUD (REQ-003에서 다룬다. 본 카드는 할 일이 카테고리를 참조하는 동작만 다룬다.)
- 세션, JWT 등 정식 인증 방식
- 반복 일정, 알림, 첨부 파일
- 마감일을 과거 날짜로 입력하는 것에 대한 차단
- 검색, 필터
- 다른 사용자와의 공유 또는 위임
- 할 일 생성 요청의 `completed` 필드 입력 처리 (`CreateTodoRequest` DTO에 `completed` 필드를 두지 않는다. 클라이언트가 `completed` 키를 함께 보낸 경우의 동작은 본 카드 계약 밖이며 BDD 테스트로 검증하지 않는다.)

## 수용 기준

- 유효한 정보이면 할 일이 생성된다
- 제목은 앞뒤 공백이 제거되어 저장된다
- 제목이 비어 있거나 공백만 입력하면 할 일 생성이 거절된다
- 제목이 100자를 초과하면 할 일 생성이 거절된다
- 설명이 1000자를 초과하면 할 일 생성이 거절된다
- 할 일 생성 시 설명을 입력하지 않으면 설명 없이 저장된다
- 할 일 생성 시 설명을 명시적으로 비우면 설명 없이 저장된다
- 마감일이 날짜 형식이 아니면 할 일 생성이 거절된다
- 할 일 생성 시 마감일을 입력하지 않으면 마감일 없이 저장된다
- 할 일 생성 시 마감일을 명시적으로 비우면 마감일 없이 저장된다
- 할 일 생성 시 과거 날짜를 마감일로 입력해도 허용된다
- 우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 할 일 생성이 거절된다
- 우선순위를 입력하지 않으면 기본 우선순위 MEDIUM으로 할 일이 생성된다
- 할 일 생성 시 완료 상태는 미완료로 저장된다
- 할 일 생성 시 카테고리를 선택하지 않으면 미분류 상태로 저장된다
- 할 일 생성 시 카테고리를 명시적으로 비우면 미분류 상태로 저장된다
- 할 일 생성 시 본인의 카테고리를 선택하면 해당 카테고리에 묶여 저장된다
- 할 일 생성 시 본인이 사용할 수 없는 카테고리를 선택하면 거절된다
- 본인의 할 일 목록만 조회된다
- 정렬 기준을 따로 정하지 않으면 본인의 할 일 목록은 미완료 할 일이 먼저, 같은 상태 안에서는 우선순위 HIGH, MEDIUM, LOW 순서, 같은 우선순위면 먼저 등록한 할 일이 위로 정렬되어 보인다
- 사용자가 정렬 기준을 직접 정하면 그 정렬이 기본 정렬을 덮어쓴다
- 본인의 할 일 목록은 한 번에 보는 개수와 묶음 번호 단위로 본다
- 할 일 목록을 볼 때 현재 묶음 번호, 한 번에 보는 개수, 전체 할 일 수, 전체 묶음 수를 알 수 있다
- 한 번에 보는 개수를 정하지 않으면 기본값 20이 적용된다
- 한 번에 보는 개수가 100을 초과하면 100으로 제한된다
- 기억하고 있던 묶음이 더 이상 존재하지 않으면 그 묶음에는 할 일이 보이지 않고, 현재 남은 전체 할 일 수와 전체 묶음 수를 알 수 있다
- 할 일 목록에서 연결된 카테고리의 이름과 색상이 함께 보이며, 연결이 없으면 미분류로 보인다
- 수정 시 입력한 항목만 변경되고 입력하지 않은 항목은 기존 값을 유지한다
- 수정 시 설명을 명시적으로 비우면 설명이 지워진다
- 수정 시 마감일을 명시적으로 비우면 마감일이 지워진다
- 수정 시 카테고리를 명시적으로 비우면 카테고리 연결이 해제된다
- 수정 시 제목을 명시적으로 비우려고 하면 수정이 거절된다
- 수정 시 우선순위를 명시적으로 비우려고 하면 수정이 거절된다
- 수정 시 완료 상태를 명시적으로 비우려고 하면 수정이 거절된다
- 수정 시 제목 앞뒤 공백은 제거되어 저장된다
- 수정 시 제목이 비어 있거나 공백만 입력하면 수정이 거절된다
- 수정 시 제목이 100자를 초과하면 수정이 거절된다
- 수정 시 설명이 1000자를 초과하면 수정이 거절된다
- 수정 시 마감일이 날짜 형식이 아니면 수정이 거절된다
- 수정 시 우선순위가 HIGH, MEDIUM, LOW 중 하나가 아니면 수정이 거절된다
- 수정 시 본인의 카테고리를 선택하면 해당 카테고리로 연결이 변경된다
- 수정 시 본인이 사용할 수 없는 카테고리를 선택하면 거절된다
- 수정 시 완료로 표시하면 할 일이 완료 상태로 바뀐다
- 수정 시 미완료로 되돌리면 할 일이 미완료 상태로 되돌아간다
- 존재하지 않는 할 일을 수정하려 하면 거절된다
- 다른 사용자의 할 일을 수정하려 하면 거절된다
- 연결된 카테고리가 삭제되면 본인의 할 일은 유지되고 카테고리 연결만 해제된다
- 본인의 할 일을 영구 삭제할 수 있다
- 존재하지 않는 할 일을 삭제하려 하면 거절된다
- 다른 사용자의 할 일을 삭제하려 하면 거절된다

## 의사결정 로그

- 결정일: 2026-05-21
  결정: 카테고리 CRUD는 REQ-003에서, 할 일이 카테고리를 참조하는 동작은 본 카드에서 다룬다.
  이유: 책임이 다른 두 카드로 분리해 각 카드를 5-15분 안에 검토할 수 있는 크기로 유지한다.
  결정자: Product Owner
  영향: Todo Entity는 nullable `category_id` 외래키를 둔다. 카테고리 자원 변경 정책은 REQ-003을 따른다.

- 결정일: 2026-05-21
  결정: 인증은 임시로 `X-User-Id` 요청 헤더로 받는다. 정식 인증(세션/JWT)은 별도 요건으로 분리한다.
  이유: 본 카드의 목적은 할 일 관리 API와 BDD 테스트 연결을 보여주는 것이며, 정식 인증까지 포함하면 범위가 과도하게 커진다.
  결정자: Product Owner, Tech Lead
  영향: 헤더 누락·형식 오류는 본 카드의 검증 범위에서 제외한다.

- 결정일: 2026-05-21
  결정: 다른 사용자의 할 일 접근은 부존재와 동일하게 404로 응답한다.
  이유: 권한 부재(403)와 부존재(404)를 구분하면 다른 사용자 자원의 존재 여부가 노출된다.
  결정자: Tech Lead
  영향: BDD 테스트는 부재와 타인 자원 케이스를 동일한 404로 어셔션한다.

- 결정일: 2026-05-21
  결정: 우선순위는 HIGH/MEDIUM/LOW 세 단계, 미지정 시 MEDIUM.
  이유: 일반적인 작업 관리 도구 표현과 일치하고 정렬 규칙을 단순하게 유지한다.
  결정자: Product Owner
  영향: DTO/Entity의 priority는 enum 타입이며 기본값을 MEDIUM으로 둔다.

- 결정일: 2026-05-21
  결정: 완료 상태는 boolean `completed` 단일 필드로 표현하고 양방향 토글을 허용한다.
  이유: 상태 전이가 단순하고 "다시 미완료로 되돌린다"는 요구를 직관적으로 지원한다.
  결정자: Product Owner, Tech Lead
  영향: 별도 상태 enum을 두지 않으며, 토글은 PATCH의 `completed` 필드로 일관 처리한다.

- 결정일: 2026-05-21
  결정: 삭제는 hard delete, 마감일은 과거 날짜도 허용한다.
  이유: 본 카드 범위에서 복구·감사 추적은 불필요하고 과거 마감일도 기록 목적으로 의미가 있다.
  결정자: Product Owner
  영향: Entity는 soft delete 컬럼을 두지 않으며, 마감일은 형식 검증만 수행한다.

- 결정일: 2026-05-21
  결정: `categoryId`는 선택 입력. 미입력 시 미분류 상태로 저장한다.
  이유: 모든 할 일에 분류를 강제하지 않고 사용자 선택에 맡긴다.
  결정자: Product Owner
  영향: Todo DTO/Entity의 `categoryId`는 nullable이며, 미분류 할 일은 응답의 `category`가 `null`이다.

- 결정일: 2026-05-21
  결정: 존재하지 않거나 다른 사용자의 카테고리 ID는 400 Bad Request, `code=INVALID_CATEGORY`, `field=categoryId`로 응답한다.
  이유: 카테고리 GET이 아니라 할 일 요청의 입력 검증 실패이며, 부재와 타인 자원을 동일 응답으로 묶어 존재 여부 노출을 막는다.
  결정자: Product Owner, Tech Lead
  영향: `TodoService`는 본인 소유 카테고리 존재 여부로 유효성을 확인하고 `InvalidCategoryException`으로 400을 반환한다.

- 결정일: 2026-05-21
  결정: 할 일 응답에는 연결된 카테고리를 nested `category: {id, name, color}`로 포함하고, 연결이 없으면 `null`이다.
  이유: UI가 별도 조회 없이 카테고리를 표시할 수 있고 변경이 즉시 응답에 반영된다.
  결정자: Product Owner
  영향: `TodoResponse`는 `categoryId` 대신 `category` nested 객체를 둔다.

- 결정일: 2026-05-21
  결정: 할 일 수정은 PATCH 의미. 누락 필드는 유지, `description`/`dueDate`/`categoryId`는 명시적 `null`로 비울 수 있고 `title`/`priority`/`completed`는 `null` 거절. 완료 토글도 동일 PATCH의 `completed` 필드로 처리한다. 수정 시 모든 필드는 생성과 동일한 검증 규칙(trim, 길이, enum, ISO 날짜 형식, 카테고리 유효성)을 적용한다.
  이유: REQ-003 PATCH 정책과 통일해 API 표면을 줄이고, 수정 후에도 저장 상태가 검증 규칙을 만족하게 한다.
  결정자: Product Owner, Tech Lead
  영향: `UpdateTodoRequest`는 `JsonNullable<T>` 기반으로 "필드 미포함"과 "명시적 null"을 구분한다. 비허용 필드의 `null`은 400 `INVALID_REQUEST`.

- 결정일: 2026-05-21
  결정: 카테고리 삭제 시 연결된 본인 할 일의 `categoryId`를 `null`로 설정(SET NULL)한다. 할 일 자체는 유지된다.
  이유: 카테고리 정리만으로 할 일 데이터를 잃지 않게 하고, 거절(409)이나 cascade 손실을 모두 피한다.
  결정자: Product Owner, Tech Lead
  영향: 본 카드는 사용자 관점 동작(할 일 유지 + 분류 해제)을 수용 기준으로 검증하며, 구현 책임은 REQ-003의 카테고리 삭제 핸들러가 진다.

- 결정일: 2026-05-21
  결정: 제목은 trim 후 최대 100자, 설명은 최대 1000자. trim 후 빈 제목은 거절한다.
  이유: 한 줄 요약과 메모성 설명에 적합한 길이.
  결정자: Product Owner
  영향: DTO/Entity의 title은 length 100, description은 length 1000으로 제약하며 검증은 trim 후 기준이다.

- 결정일: 2026-05-21
  결정: 마감일은 ISO 8601 날짜(`YYYY-MM-DD`)만 사용한다. 시각은 다루지 않는다.
  이유: 할 일 관리 UX는 보통 날짜 단위이며 시각까지 다루면 스케줄 도구 영역이 된다.
  결정자: Product Owner
  영향: DTO/Entity의 `dueDate` 타입은 `LocalDate`이며, 형식 위반은 400 `INVALID_REQUEST`로 응답한다.

- 결정일: 2026-05-21 (2026-05-22 갱신)
  결정: 목록 기본 정렬은 `completed` 오름차순 → `priority` 내림차순(HIGH→MEDIUM→LOW) → `id` 오름차순. 클라이언트가 `sort`를 보내면 그 정렬이 기본 정렬을 덮어쓴다.
  이유: 미완료 우선 노출 UX와 클라이언트 정렬 자유도를 함께 확보하고, 동률 시 식별자 정렬로 결정적 순서를 보장한다.
  결정자: Product Owner, Tech Lead
  영향: 서비스는 `Pageable.getSort()`가 unsorted면 기본 정렬 JPQL을 사용한다. `priority` 정렬 키의 의미(enum 문자열 vs 비즈니스 순서)는 별도 카드에서 보강한다.

- 결정일: 2026-05-22
  결정: 본 카드 범위에 페이지네이션을 포함한다. 쿼리는 `page`(기본 0), `size`(기본 20, 최대 100), `sort`. 응답은 `PageResponse<T>`(`content`, `page`, `size`, `totalElements`, `totalPages`).
  이유: api-contract 표준은 모든 목록 API에 페이지네이션을 요구하며 컨트롤러도 이미 `Pageable`을 받고 있다.
  결정자: Product Owner, Tech Lead
  영향: `size` 100 초과는 100으로 잘리고, 초과 `page`는 빈 `content` + 정확한 `totalElements`/`totalPages`로 응답한다. 사이즈 cap은 `PageableHandlerMethodArgumentResolverCustomizer`로 전역 설정한다.

- 결정일: 2026-05-21
  결정: 생성 요청은 `completed` 필드를 받지 않으며 DTO에도 두지 않는다. 클라이언트가 키를 함께 보낸 경우의 동작은 본 카드 계약 밖이다.
  이유: 생성된 할 일의 완료 상태는 항상 `false`로 고정되므로 입력 필드는 의미 중복이며, 비공식 입력 처리 정책을 본 카드 BDD로 고정할 필요가 없다.
  결정자: Product Owner, Tech Lead
  영향: `CreateTodoRequest`에 `completed` 필드를 두지 않는다. Jackson 설정상 알 수 없는 필드의 거동은 본 카드 BDD로 검증하지 않으며, 필요 시 후속 카드에서 보강한다.

- 결정일: 2026-05-27
  결정: 할 일 목록 sort 허용 키 화이트리스트는 `title`, `dueDate`, `createdAt` 세 개로 한정한다. 그 외 키가 들어오면 `400 INVALID_REQUEST` + `details[].field=sort`, `code=INVALID_FORMAT` 로 거절한다. 사용자가 sort 를 정한 경우 동률은 `id` 오름차순으로 끊는다.
  이유: 표준 api-contract.md 의 sort key 화이트리스트 강제. 임의 컬럼 정렬을 허용하면 PII 컬럼이 정렬 키로 노출될 위험이 있다. 사용자 시점에서 의미가 있는 표시 가능 필드 세 개로 제한한다.
  결정자: REDSTONE
  영향: `TodoController.ALLOWED_SORT_KEYS` 와 `SortKeys.requireAllowed` 를 통해 정렬 키 검증을 컨트롤러 진입 단계에서 수행한다. 기본 정렬은 도메인 고정(`findAllByUserIdOrderedForListing`) 그대로다.

## BDD 테스트 리뷰

- 시나리오 문서: docs/scenarios/REQ-002-personal-todo.feature (create 11개 + list 8개 + update 11개 + delete 2개 + 카테고리 정리 영향 1개 행위 시나리오에 50개 테스트가 귀속)

- 리뷰일: 2026-05-22
  리뷰자: Product Owner, Tech Lead
  확인: 수용 기준 전체가 `@Covers`로 연결되어 있으며 `./gradlew test`에서 80/80 PASS, `validateHarness` BUILD SUCCESSFUL. 페이지네이션 정책 편입(2026-05-22)에 따라 추가된 6개 시나리오(`TodoListPaginationApiAcceptanceTest`)와 기존 19개 BDD 테스트(`Todo*ApiAcceptanceTest`)가 모두 커버한다.
  결과: 승인

## 열린 질문

- 없음
