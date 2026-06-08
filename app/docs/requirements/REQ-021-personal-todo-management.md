# 요건 카드

요건 ID: REQ-021
제목: 개인별 할 일 관리
우선순위: 높음
상태: 승인
요건 종류: 기능
명세 역할: 상위 요건
대상 시스템: application
제품 영역: todo
품질 속성: none
검증 수준: e2e
관련 요건: REQ-022, REQ-023, REQ-024, REQ-027, REQ-025, REQ-026, REQ-004, REQ-011
대체 요건: 없음

## 사용자/목적

로그인 사용자는 자신의 할 일을 만들고, 목록에서 확인하고, 수정하거나 완료 상태를 바꾸고, 더 이상 필요 없는 할 일을 삭제할 수 있어야 한다.

## 범위

- 개인별 할 일 관리 기능 전체의 사용자 목표와 화면 기반 전체 사용자 여정을 소유한다.
- 상세 생성, 목록/페이지/정렬, 수정, 완료 상태 변경, 삭제, 카테고리 삭제 영향 정책과 화면별 세부 AC는 하위 원자 요건이 소유한다.
- 인증된 사용자의 자원 격리는 `REQ-004` 정책을 전제로 한다.

## 표준 용어

- todo.task
- todo.create
- todo.list
- todo.update
- todo.delete
- user.id

## 제외 범위

- 하위 원자 요건의 세부 입력 검증과 예외 조건 복제.
- 카테고리 자체 CRUD.
- 하위 원자 요건의 화면별 세부 상태와 입력 검증.

## 수용 기준

- (E2E) 로그인 사용자는 할 일 화면에서 자신의 할 일을 확인하고 새 할 일을 만든 뒤 수정하고 완료 상태를 바꾸고 삭제할 수 있다

## 검증 대상

- API: 불필요
- DB: 불필요
- UI: 불필요
- Storybook: 불필요
- E2E: 필요
- STATIC: 불필요

## 의사결정 로그

- 결정일: 2026-06-02
  결정: 기존 `REQ-002`는 상위 요건으로 재사용하지 않고, 신규 `REQ-021`을 상위 요건으로 발급한다.
  이유: 기존 ID에 상세 원자 요건 컨텍스트가 과도하게 포함되어 있어 새 의미로 재사용하면 추적 혼선이 생긴다.
  결정자: REDSTONE
  영향: `REQ-002`는 `대체됨`으로 닫고, 상세 AC는 `REQ-022`~`REQ-026`으로 이동한다.

- 결정일: 2026-06-05
  결정: 상위 요건의 전체 할 일 생명주기 AC는 실 백엔드와 실 프런트엔드 dev server를 함께 띄운 Playwright 통합 스모크 테스트가 커버한다.
  이유: 현재 할 일 관리 화면 본문은 범위 밖이지만, 브라우저 세션에서 로그인 Cookie를 받은 뒤 FE origin의 proxy를 통해 `/todos` API를 호출하면 인증 Cookie, Vite proxy, 백엔드 API 결합을 검증할 수 있다.
  결정자: REDSTONE
  영향: `REQ-021`의 검증 수준은 `e2e`로 전환한다. 기존 `TodoLifecycleApiAcceptanceTest`는 `@Requirement`/`@Covers`를 제거해 trace에 연결하지 않는 API 생명주기 회귀 테스트로만 유지한다. 생성/목록/수정/삭제의 게이트 기여는 `REQ-022`~`REQ-026` 원자 Acceptance Test와 live Playwright smoke가 소유한다.

- 결정일: 2026-06-06
  결정: 할 일 관리 화면이 실제 `/todos` route로 구현되면서 상위 요건의 전체 생명주기 AC와 live smoke를 화면 조작 여정으로 승격한다.
  이유: 상위 요건은 API 호출 자체보다 사용자가 보호 앱 셸 안에서 목록, 생성, 수정, 완료 상태 변경, 삭제를 이어서 성공하는 결과를 확인해야 한다.
  결정자: REDSTONE
  영향: `REQ-021` AC와 시나리오는 화면 여정 문장으로 바뀌며, 세부 API/UI AC는 `REQ-022`, `REQ-023`, `REQ-024`, `REQ-025`, `REQ-027`이 각각 소유한다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-021-personal-todo-management.feature`
- 검증 설계: 개인별 할 일 관리 전체 여정 AC를 실 백엔드 + 실 프런트엔드 Playwright 통합 스모크 테스트 한 개와 연결한다.
- Skeleton 계약: 본 카드는 하위 원자 요건 `REQ-022`~`REQ-027`의 API/DB/UI/Storybook 계약을 직접 복사하지 않고, `/todos` 화면에서 생성, 조회, 수정, 완료 상태 변경, 삭제가 결합되는 E2E 사용자 성과만 검토한다.

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 기능 전체 성과 AC 1개를 브라우저 세션 기반 통합 스모크 시나리오와 Playwright live test로 검증한다.
  API Skeleton: 기존 `/todos` 생성/목록/수정/삭제 API 사용.
  DB Skeleton: 기존 `Todo` Entity 사용.
  화면/라우팅 Skeleton: 2026-06-06 화면 도입 후 `/todos` 보호 route의 실제 할 일 관리 화면 여정으로 승격한다.
  검사기 Skeleton: 해당 없음.
  추적 정책: 상위 요건은 하위 AC를 복사하지 않고 전체 기능 성과 AC만 소유한다.
  검증: `npm run e2e:live`, `traceRequirements`.
  승인자: REDSTONE
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-02
  리뷰자: REDSTONE
  확인: 전체 lifecycle AC가 실행 테스트와 시나리오 `Covers:`로 연결된다.
  결과: 승인

- 리뷰일: 2026-06-06
  리뷰자: REDSTONE
  확인: 화면 도입 후 전체 lifecycle AC가 실 백엔드 + 실 프런트엔드 Playwright live smoke의 화면 조작 여정으로 연결된다.
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
