# 요건 카드

요건 ID: REQ-001
제목: 이메일 회원 가입
우선순위: 높음
상태: 승인
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: auth
품질 속성: accessibility, usability, security
검증 수준: mixed
관련 요건: REQ-011
대체 요건: 없음

## 사용자/목적

신규 사용자는 브라우저에서 이름, 이메일, 비밀번호를 입력해 계정을 만들고, 가입 성공 또는 실패 결과를 이해할 수 있어야 한다.

## 범위

- 이름, 이메일, 비밀번호를 입력해 계정을 생성한다.
- 이미 등록된 이메일은 다시 사용할 수 없다.
- 비밀번호는 8자 이상 72자 이하 ASCII 출력 가능 문자만 허용한다.
- `/signup` 경로는 이메일 회원 가입 화면을 표시한다.
- 회원 가입 화면은 로그인 화면과 같은 비인증 단일 카드 레이아웃을 사용하고, 전역 헤더나 보호 화면 사이드바를 표시하지 않는다.
- 화면은 사용자 이름, 이메일, 비밀번호 입력, 회원 가입 버튼, 로그인 화면으로 돌아가는 링크를 제공한다.
- 화면은 이름 빈 값, 이름 100자 초과, 이메일 빈 값, 이메일 형식 오류, 비밀번호 빈 값, 비밀번호 길이, 비밀번호 허용 문자 오류를 제출 전에 안내한다.
- 서버가 중복 이메일로 가입을 거절하면 사용자는 같은 화면에서 중복 이메일 안내를 확인할 수 있다.
- 가입 제출 중에는 중복 제출을 막고 진행 중 상태를 표시한다.
- 가입에 성공하면 사용자를 `/login` 화면으로 이동시키고 가입 완료 안내를 표시한다.
- 이미 인증된 사용자가 `/signup` 경로에 접근하면 자신의 할 일 목록 화면(`/todos`)으로 이동시킨다.

## 표준 용어

- account.signup
- account.duplicateEmail
- user.account
- user.id
- user.name
- user.email
- user.password
- user.passwordHash
- auth.login
- ui.desktopViewport
- ui.accessibilityCheck

## 제외 범위

- 소셜 로그인
- 이메일 인증
- 초대 코드 기반 가입
- 비밀번호 복잡도 강화 정책
- 비밀번호 재설정, 비밀번호 변경, 계정 탈퇴
- 자동 로그인 또는 로그인 세션 발급 정책 변경
- 모바일/태블릿 전용 레이아웃 최적화

## 수용 기준

- (API) 유효한 정보이면 계정이 생성된다
- (API) 중복 이메일이면 가입이 거절된다
- (API) 비밀번호가 8자 미만이면 가입이 거절된다
- (UI) `/signup` 경로에 접근하면 사용자 이름, 이메일, 비밀번호를 입력하고 회원 가입을 제출할 수 있는 화면이 보인다
- (UI) 회원 가입 화면은 화면 가운데에 하나의 회원 가입 카드를 표시하고, 카드는 제목, 사용자 이름 입력, 이메일 입력, 비밀번호 입력, 회원 가입 버튼, 로그인 화면으로 돌아가는 링크로 구성된다
- (UI) 회원 가입 화면에는 로그인 화면으로 돌아갈 수 있는 링크가 있다
- (UI) 사용자 이름, 이메일 또는 비밀번호를 비워 둔 채 회원 가입을 시도하면 해당 입력 아래에 입력이 필요하다는 안내가 보인다
- (UI) 사용자 이름이 100자를 초과하면 사용자 이름이 너무 길다는 안내가 보인다
- (UI) 이메일 형식이 아닌 값을 입력하고 회원 가입을 시도하면 이메일 입력 아래에 형식 안내가 보인다
- (UI) 비밀번호가 8자 미만이면 비밀번호가 너무 짧다는 안내가 보인다
- (UI) 비밀번호가 72자를 초과하거나 허용되지 않는 문자를 포함하면 사용할 수 없는 비밀번호라는 안내가 보인다
- (UI) 회원 가입 버튼을 누른 뒤 응답을 기다리는 동안 회원 가입 버튼은 다시 누를 수 없는 상태로 표시된다
- (UI) 회원 가입 응답을 기다리는 동안 같은 폼을 다시 제출해도 추가 회원 가입 요청이 서버로 전송되지 않는다
- (UI) 이미 등록된 이메일로 회원 가입이 거절되면 중복 이메일 안내가 보이고 입력했던 사용자 이름과 이메일은 유지된다
- (UI) 서버 응답으로 회원 가입이 거절되면 비밀번호 입력은 비워진다
- (E2E) 회원 가입에 성공하면 사용자는 `/login` 화면으로 이동한다
- (E2E) 회원 가입에 성공해 `/login`으로 이동하면 가입이 완료되었다는 안내가 보인다
- (E2E) 이미 인증된 사용자가 회원 가입 화면에 접근하면 자신의 할 일 목록 화면으로 이동한다
- (UI) 데스크톱 화면에서 회원 가입 카드의 주요 입력과 버튼이 화면 밖으로 넘치지 않는다
- (UI) 회원 가입 화면은 자동 접근성 검사에서 위반이 없어야 한다

## 의사결정 로그

- 결정일: 2026-05-20
  결정: 이번 범위에서는 이메일 인증을 제외한다.
  이유: 예제 하네스에서는 가입 API와 BDD 테스트 연결 구조를 설명하는 것이 목적이다.
  결정자: Product Owner, Tech Lead
  영향: 가입 성공 시 계정은 즉시 생성된 것으로 본다.

- 결정일: 2026-05-20
  결정: 비밀번호 정책은 최소 8자 검증만 적용한다.
  이유: 예제 하네스에서는 수용 기준과 Acceptance Test 연결을 단순하게 보여주는 것이 목적이다.
  결정자: Product Owner, Tech Lead
  영향: 특수문자, 숫자, 대소문자 조합은 검증하지 않는다.

- 결정일: 2026-05-27
  결정: 비밀번호는 8자 이상 72자 이하 ASCII 출력 가능 문자(U+0020 ~ U+007E)만 허용한다. 한글/이모지 등 멀티바이트 문자는 가입 시 거절한다.
  이유: BCrypt 해시 알고리즘은 72바이트까지만 의미 있게 사용한다. 입력 자체를 ASCII printable 로 좁히면 글자 수와 바이트 수가 일치해 BCrypt 한계와 검증 한계가 정확히 같아진다.
  결정자: REDSTONE
  영향: `SignupRequest.password` 검증과 회원 가입 화면의 사전 안내가 같은 정책을 따른다.

- 결정일: 2026-05-27
  결정: 회원 가입 화면은 로그인 화면과 같은 비인증 단일 카드 레이아웃을 사용한다.
  이유: 회원 가입은 인증 전 진입점이고, REQ-011 로그인 화면과 같은 화면 문법을 쓰면 비인증 사용자 흐름이 일관된다.
  결정자: Tech Lead
  영향: `/signup` 화면은 전역 헤더와 보호 화면 사이드바 없이 중앙 카드로 구성하고, 로그인 화면으로 돌아가는 링크를 둔다.

- 결정일: 2026-05-27
  결정: 회원 가입 성공 후에는 `/login` 화면으로 이동하고 가입 완료 안내를 표시한다.
  이유: 가입 API는 토큰/세션을 발급하지 않으므로 자동 로그인은 추가 API와 백엔드 정책 변경이 필요하다. `/login`으로 이동하면서 안내를 띄우는 흐름이 현재 계약과 가장 잘 맞다.
  결정자: Tech Lead
  영향: 회원 가입 성공 흐름은 `navigate("/login?signupCompleted=1", { replace: true })` 패턴을 사용한다.

- 결정일: 2026-05-27
  결정: 회원 가입 화면은 비인증 사용자 전용 화면으로 두고, 이미 인증된 사용자가 접근하면 자신의 할 일 목록 화면으로 이동시킨다.
  이유: 로그인 화면과 같은 비인증 전용 화면 정책으로 맞추고, 로그인된 상태에서 다른 계정을 실수로 만드는 흐름을 막는다.
  결정자: Product Owner
  영향: `/signup` route에는 인증 상태 확인 또는 인증 사용자 redirect 처리가 필요하다.

- 결정일: 2026-05-27
  결정: 회원 가입 화면의 카드 구성은 수용 기준에 명시하지만 입력 UX 세부는 본 카드 AC에 포함하지 않고 FE 공통 표준과 REQ-011 패턴을 따른다.
  이유: 입력 UX 세부를 카드마다 AC로 복제하면 비인증 화면 간 일관성 책임이 카드별로 흩어진다.
  결정자: Tech Lead
  영향: 자동 포커스, autocomplete, show/hide 토글, 키보드 제출 같은 입력 UX는 `docs/standards/front-end-ui.md`와 REQ-011 구현 패턴을 따른다.

- 결정일: 2026-05-27
  결정: 가입 성공 후 `/login` 화면에 가입 완료 안내를 띄우는 메커니즘은 `signupCompleted=1` 쿼리 파라미터로 전달한다. `/login` 화면은 이 쿼리를 감지해 안내를 표시한 뒤 history를 `replace`해 쿼리를 제거한다.
  이유: REQ-011이 이미 `loginRedirect` 쿼리를 쓰고 있어 일관성이 좋고, /login URL이 그대로 보존되므로 새로고침이나 북마크에서도 안내 표시 의도가 깨지지 않는다.
  결정자: Tech Lead
  영향: 회원 가입 성공 흐름과 로그인 화면 안내 표시 진입점이 연결된다.

- 결정일: 2026-05-30
  결정: form-level 서버 오류 Alert는 `docs/standards/front-end-ui.md`의 "Form-level 서버 오류 Alert" 표준을 따라 `AlertCircle` 아이콘 + `AlertTitle` + `AlertDescription` 묶음으로 표시한다. 중복 이메일 본문에는 `/login` 화면 진입 링크를 둔다.
  이유: form-level 서버 오류의 구조와 행동 안내를 통일하면 카드 간 일관성이 회복된다.
  결정자: Tech Lead
  영향: 중복 이메일 분기는 `AlertTitle "이미 등록된 이메일입니다"`와 로그인 화면 링크를 함께 표시한다.

- 결정일: 2026-06-02
  결정: 구현 순서 때문에 분리됐던 `REQ-013 이메일 회원 가입 화면`을 본 canonical 요건으로 병합한다.
  이유: 회원 가입 API와 회원 가입 화면은 같은 사용자 목표를 만족하는 구현 표면이므로 독립 REQ로 유지하지 않는다.
  결정자: Product Owner, Tech Lead
  영향: REQ-013은 `상태: 대체됨`, `대체 요건: REQ-001`로 닫고, FE 화면/시나리오/테스트/story metadata는 본 카드로 이동한다. 범위와 AC가 바뀌었으므로 본 카드는 `검토중`으로 되돌린다.

## 수용 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-001-email-signup.feature`
- 시나리오 문서: `docs/scenarios/REQ-001-email-signup-screen.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-20
  검증 설계: `docs/scenarios/REQ-001-email-signup.feature`의 3개 Scenario가 API 수용 기준 3개를 `Covers:`로 다룬다.
  API Skeleton: `POST /users/signup`, `SignupRequest`, `SignupResponse`, 중복 이메일과 비밀번호 길이 검증 계약.
  DB Skeleton: `UserAccount` Entity와 사용자 식별자/이름/이메일/비밀번호 해시/생성·수정 시각.
  화면/라우팅 Skeleton: 당시 해당 없음.
  검사기 Skeleton: 해당 없음.
  추적 정책: API AC는 백엔드 Acceptance Test `@Covers`로 검증한다.
  검증: 초기 BDD 하네스 검증 통과.
  승인자: Product Owner, Tech Lead
  Skeleton 결과: 승인

- 승인일: 2026-05-30
  검증 설계: 기존 `REQ-013-email-signup-screen.feature`의 화면 Scenario가 회원 가입 화면 AC를 모두 `Covers:`로 다룬다.
  API Skeleton: 기존 `POST /users/signup` 계약을 사용한다.
  DB Skeleton: 해당 없음.
  화면/라우팅 Skeleton: `SignupPage`, `SignupPageContainer`, `/signup` route, 상태별 Storybook story.
  검사기 Skeleton: 해당 없음.
  추적 정책: 화면 AC는 Playwright FE BDD 테스트 `Requirement` + `Covers`로 검증한다.
  검증: FE typecheck/lint/test/e2e/build-storybook 및 단일 카드 trace 통과 이력.
  승인자: REDSTONE
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-20
  리뷰자: Product Owner, Tech Lead
  확인: API 수용 기준 3개가 각각 `@Covers`와 `.feature` `Covers:` 블록으로 표현되었다.
  결과: 승인

- 리뷰일: 2026-05-30
  리뷰자: Product Owner, Tech Lead
  확인: 화면 수용 기준 17개가 모두 Playwright FE BDD 테스트의 `Requirement` + `Covers`와 `.feature` `Covers:` 블록에 매핑되었다.
  결과: 승인

- 리뷰일: 2026-06-02
  리뷰자: Product Owner, Tech Lead
  확인: `REQ-013` 병합으로 API/화면 수용 기준과 Scenario/Test/metadata를 `REQ-001` 기준으로 재연결할 대상이 식별되었다.
  결과: 2026-06-08 후속 리뷰에서 해소

- 리뷰일: 2026-06-08
  리뷰자: REDSTONE
  확인: `REQ-001` API/화면 수용 기준과 Scenario/Test/Storybook metadata가 본 카드 기준으로 연결된 상태를 Skeleton 검토 표면으로 정리한다.
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
