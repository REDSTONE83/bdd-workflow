# 요건 카드

요건 ID: REQ-013
제목: 이메일 회원 가입 화면
우선순위: 높음
상태: 승인
구현 대상: front-end

## 사용자/목적

신규 사용자는 브라우저에서 이름, 이메일, 비밀번호를 입력해 계정을 만들고, 가입 성공 또는 실패 결과를 이해할 수 있어야 한다.

## 범위

- `/signup` 경로의 REQ-011 placeholder를 실제 이메일 회원 가입 화면으로 대체한다.
- 회원 가입 화면은 로그인 화면과 같은 비인증 단일 카드 레이아웃을 사용하고, 전역 헤더나 보호 화면 사이드바를 표시하지 않는다.
- 화면은 사용자 이름, 이메일, 비밀번호 입력, 회원 가입 버튼, 로그인 화면으로 돌아가는 링크를 제공한다.
- 가입 제출은 기존 REQ-001의 `POST /users/signup` 계약을 사용한다. 이 카드는 가입 API, 저장 정책, 비밀번호 해시 정책을 변경하지 않는다.
- 화면은 이름 빈 값, 이름 100자 초과, 이메일 빈 값, 이메일 형식 오류, 비밀번호 빈 값, 비밀번호 길이, 비밀번호 허용 문자 오류를 제출 전에 안내한다.
- 서버가 중복 이메일로 가입을 거절하면 사용자는 같은 화면에서 중복 이메일 안내를 확인할 수 있다.
- 가입 제출 중에는 중복 제출을 막고 진행 중 상태를 표시한다.
- route 기준 page mock Storybook story와 Playwright FE BDD 테스트로 화면 상태와 사용자 흐름을 검증한다.
- 구현 단계에서는 REQ-011의 `/signup` placeholder 수용 기준, 시나리오, FE BDD 테스트, page/story 메타데이터를 실제 회원 가입 화면 기대값으로 함께 갱신해 상충하는 기대를 제거한다.
- 가입에 성공하면 사용자를 `/login` 화면으로 이동시키고 가입 완료 안내를 표시한다. 자동 로그인이나 별도 완료 페이지는 도입하지 않는다.
- 이미 인증된 사용자가 `/signup` 경로에 접근하면 자신의 할 일 목록 화면(`/todos`)으로 이동시킨다.

## 표준 용어

- account.signup
- account.duplicateEmail
- user.account
- user.name
- user.email
- user.password
- auth.login
- ui.desktopViewport
- ui.accessibilityCheck

## 제외 범위

- 회원 가입 API, DB 스키마, 비밀번호 해시 정책 변경
- 이메일 인증, 소셜 로그인, 초대 코드 기반 가입
- 비밀번호 복잡도 강화 정책
- 비밀번호 재설정, 비밀번호 변경, 계정 탈퇴
- 자동 로그인 또는 로그인 세션 발급 정책 변경
- 모바일/태블릿 전용 레이아웃 최적화

## 수용 기준

- (FE) `/signup` 경로에 접근하면 사용자 이름, 이메일, 비밀번호를 입력하고 회원 가입을 제출할 수 있는 화면이 보인다
- (FE) 회원 가입 화면은 화면 가운데에 하나의 회원 가입 카드를 표시하고, 카드는 제목, 사용자 이름 입력, 이메일 입력, 비밀번호 입력, 회원 가입 버튼, 로그인 화면으로 돌아가는 링크로 구성된다
- (FE) 회원 가입 화면에는 로그인 화면으로 돌아갈 수 있는 링크가 있다
- (FE) 사용자 이름, 이메일 또는 비밀번호를 비워 둔 채 회원 가입을 시도하면 해당 입력 아래에 입력이 필요하다는 안내가 보인다
- (FE) 사용자 이름이 100자를 초과하면 사용자 이름이 너무 길다는 안내가 보인다
- (FE) 이메일 형식이 아닌 값을 입력하고 회원 가입을 시도하면 이메일 입력 아래에 형식 안내가 보인다
- (FE) 비밀번호가 8자 미만이면 비밀번호가 너무 짧다는 안내가 보인다
- (FE) 비밀번호가 72자를 초과하거나 허용되지 않는 문자를 포함하면 사용할 수 없는 비밀번호라는 안내가 보인다
- (FE) 회원 가입 버튼을 누른 뒤 응답을 기다리는 동안 회원 가입 버튼은 다시 누를 수 없는 상태로 표시된다
- (FE) 회원 가입 응답을 기다리는 동안 같은 폼을 다시 제출해도 추가 회원 가입 요청이 서버로 전송되지 않는다
- (FE) 이미 등록된 이메일로 회원 가입이 거절되면 중복 이메일 안내가 보이고 입력했던 사용자 이름과 이메일은 유지된다
- (FE) 서버 응답으로 회원 가입이 거절되면 비밀번호 입력은 비워진다
- (FE) 회원 가입에 성공하면 사용자는 `/login` 화면으로 이동한다
- (FE) 회원 가입에 성공해 `/login`으로 이동하면 가입이 완료되었다는 안내가 보인다
- (FE) 이미 인증된 사용자가 회원 가입 화면에 접근하면 자신의 할 일 목록 화면으로 이동한다
- (FE) 데스크톱 화면에서 회원 가입 카드의 주요 입력과 버튼이 화면 밖으로 넘치지 않는다
- (FE) 회원 가입 화면은 자동 접근성 검사에서 위반이 없어야 한다

## 의사결정 로그

- 결정일: 2026-05-27
  결정: 회원 가입 화면은 REQ-001을 수정하지 않고 새 front-end 요건 카드 REQ-013으로 분리한다.
  이유: REQ-001은 이미 승인된 백엔드 가입 API 카드이고, 화면 구현을 섞으면 기존 BE 완료 판정과 후속 FE 판정이 한 카드 안에서 불필요하게 얽힌다. REQ-011도 `/signup` 본문을 후속 카드가 채우도록 placeholder로 분리해 두었다.
  결정자: Tech Lead
  영향: 본 카드는 `/signup` route와 FE 화면, Storybook, Playwright FE BDD 테스트만 추적한다. 가입 API 자체의 정상/중복/비밀번호 정책은 REQ-001을 따른다.

- 결정일: 2026-05-27
  결정: 회원 가입 화면은 로그인 화면과 같은 비인증 단일 카드 레이아웃을 사용한다.
  이유: 회원 가입은 인증 전 진입점이고, REQ-011 로그인 화면과 같은 화면 문법을 쓰면 비인증 사용자 흐름이 일관된다.
  결정자: Tech Lead
  영향: `/signup` 화면은 전역 헤더와 보호 화면 사이드바 없이 중앙 카드로 구성하고, 로그인 화면으로 돌아가는 링크를 둔다.

- 결정일: 2026-05-27
  결정: REQ-011의 `/signup` placeholder 기대는 본 카드 구현 시 실제 회원 가입 화면 기대로 함께 갱신한다.
  이유: placeholder가 계속 승인된 기대값으로 남아 있으면 실제 회원 가입 화면 구현 후 REQ-011 FE BDD 테스트와 새 화면 테스트가 서로 충돌한다.
  결정자: Tech Lead
  영향: Skeleton 또는 구현 단계에서 REQ-011 카드, 시나리오, Playwright 테스트의 placeholder AC를 제거하거나 새 카드 책임으로 이관했다는 리뷰 기록을 남긴다.

- 결정일: 2026-05-27
  결정: 회원 가입 성공 후에는 `/login` 화면으로 이동하고 가입 완료 안내를 표시한다.
  이유: REQ-001 `POST /users/signup`은 토큰/세션을 발급하지 않으므로 자동 로그인은 추가 API와 BE 정책 변경이 필요하다. 별도 완료 페이지를 두는 안은 시나리오/스토리/테스트 표면이 늘어나는 데 비해 사용자 가치 차이가 작다. `/login`으로 이동하면서 안내를 띄우는 흐름이 현재 BE 계약과 가장 잘 맞고 추가 API 없이 BLUE까지 갈 수 있다.
  결정자: Tech Lead
  영향: 본 카드는 `front-end` 분류를 유지한다. `/login` 화면에 가입 완료 안내를 띄울 수 있는 표시 진입점이 필요하므로 REQ-011 로그인 화면 구현 또는 본 카드 Skeleton 단계에서 안내 표시 메커니즘(예: 라우팅 state 또는 쿼리 플래그)을 함께 정의한다.

- 결정일: 2026-05-27
  결정: 회원 가입 화면은 비인증 사용자 전용 화면으로 두고, 이미 인증된 사용자가 접근하면 자신의 할 일 목록 화면으로 이동시킨다.
  이유: 로그인 화면과 같은 비인증 전용 화면 정책으로 맞추고, 로그인된 상태에서 다른 계정을 실수로 만드는 흐름을 막는다.
  결정자: Product Owner
  영향: `/signup` route에는 인증 상태 확인 또는 인증 사용자 redirect 처리가 필요하다. Playwright FE BDD 테스트는 인증된 사용자의 회원 가입 화면 접근이 할 일 목록 화면으로 이동하는지 검증한다.

- 결정일: 2026-05-27
  결정: 회원 가입 화면의 카드 구성은 수용 기준에 명시하지만 입력 UX 세부(자동 포커스, autocomplete 속성, 비밀번호 show/hide 토글)는 본 카드 AC에 포함하지 않고 FE 공통 표준과 REQ-011 패턴을 따른다.
  이유: 입력 UX 세부를 카드마다 AC로 복제하면 비인증 화면 간 일관성 책임이 카드별로 흩어지고 테스트 표면도 불필요하게 늘어난다. 구조(카드 구성 요소)는 화면별로 다르므로 AC로 두지만, 입력 UX는 화면 공통 규칙으로 본다.
  결정자: Tech Lead
  영향: 본 카드는 카드 구성 AC 한 줄만 둔다. 자동 포커스, autocomplete, show/hide 토글, 키보드 제출 같은 입력 UX는 `docs/standards/front-end-ui.md`와 REQ-011 구현 패턴을 그대로 따른다. 단, 가입 폼의 비밀번호 입력 `autocomplete` 값은 새 비밀번호 의미에 맞춰 `new-password`를 사용한다 (REQ-011 로그인의 `current-password`와 다르다).

- 결정일: 2026-05-27
  결정: 가입 성공 후 `/login` 화면에 가입 완료 안내를 띄우는 메커니즘은 `signupCompleted=1` 쿼리 파라미터로 전달한다. `/login` 화면은 이 쿼리를 감지해 안내를 표시한 뒤 history를 `replace`해 쿼리를 제거한다.
  이유: REQ-011이 이미 `loginRedirect` 쿼리를 쓰고 있어 일관성이 좋고, /login URL이 그대로 보존되므로 새로고침이나 북마크에서도 안내 표시 의도가 깨지지 않는다. React Router navigation state는 새로고침이나 직접 링크 공유 시 안내가 사라져 검증과 사용자 인지가 흔들리고, AuthContext에 단기 플래그를 두는 안은 /login이 아닌 화면으로 이동할 때 소실 의미론이 복잡해진다. 표시 후 history replace로 쿼리를 제거해 새로고침 시 안내가 반복 노출되는 부작용도 막는다.
  결정자: Tech Lead
  영향: 회원 가입 성공 흐름은 `navigate("/login?signupCompleted=1", { replace: true })` 패턴을 사용한다. `/login` 화면은 `signupCompleted` 쿼리를 읽어 안내를 표시하고, 표시 후 `navigate("/login", { replace: true })`로 쿼리를 정리한다. REQ-011 로그인 화면 구현에 안내 표시 진입점이 추가되며, REQ-013 구현 단계에서 REQ-011 카드/시나리오/테스트에도 이 진입점을 반영한다.

- 결정일: 2026-05-30
  결정: form-level 서버 오류 Alert (중복 이메일, 일반 오류)는 `docs/standards/front-end-ui.md` 의 "Form-level 서버 오류 Alert" 표준을 따라 `AlertCircle` 아이콘 + `AlertTitle` + `AlertDescription` 묶음으로 표시한다. 중복 이메일 본문에는 `/login` 화면 진입 링크를 둔다.
  이유: 기존 단일 `AlertDescription` 평서문은 시각 위계가 약하고 사용자가 다음에 무엇을 해야 할지 안내가 없어 "이미 등록된 이메일" 메시지가 밋밋하다는 사용자 피드백이 있었다. 표준이 form-level 서버 오류의 구조와 행동 안내를 강제하면 카드 간 일관성도 같이 회복된다.
  결정자: Tech Lead
  영향: `SignupPage` 의 `formError` 가 `{ kind: "duplicate-email" } | { kind: "other", message }` 타입으로 갈라지고, 중복 이메일 분기는 `AlertTitle "이미 등록된 이메일입니다"` + `AlertDescription` 본문에 `<Link to="/login">` 을 둔다. 다른 서버 오류 분기는 `AlertTitle "회원 가입에 실패했습니다"` + 본문 메시지를 표시한다. AC "중복 이메일 안내가 보이고 입력했던 사용자 이름과 이메일은 유지된다", "서버 응답으로 회원 가입이 거절되면 비밀번호 입력은 비워진다" 의도는 그대로 유지된다. Storybook `ServerRejection — Duplicate Email` story 는 자동으로 새 구조를 반영한다. 구현 단계 FE BDD 테스트는 새 `AlertTitle` 텍스트와 `/login` 링크 존재를 함께 검증한다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-013-email-signup-screen.feature`

- 승인일: 2026-05-30
  검증 설계: `docs/scenarios/REQ-013-email-signup-screen.feature` 작성 완료. 10개 Scenario가 17개 수용 기준을 모두 `Covers:`로 덮는다. `traceRequirementCard -Preq=REQ-013` 추적 리포트에서 모든 AC가 Scenario 매핑됨을 확인했다. AC 커버 테스트는 아직 없으므로 RED는 정상이다.
  API Skeleton: 해당 없음. 기존 REQ-001 `POST /users/signup` 계약을 사용한다.
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음.
  화면/라우팅 Skeleton:
    - 컴포넌트: `front-end/src/features/signup/pages/SignupPage.tsx`. 인터랙션 mockup 으로 실제 DOM/Tailwind 스타일, 폼 입력 반응, 클라이언트 측 검증 안내, submitting/serverRejection/success 상태 전환이 동작한다. 외부 API 호출과 가입 성공 후 라우팅 이동은 `onSubmit` / `onNavigateAfterSuccess` 콜백 props 로 받는다.
    - 카드 레이아웃: REQ-011 LoginPage 와 같은 `main flex min-h-svh items-center justify-center` + `Card max-w-md` 패턴. 카드 구성은 제목 "회원 가입", 사용자 이름 입력, 이메일 입력, 비밀번호 입력(show/hide 토글), 회원 가입 버튼, 로그인 화면으로 돌아가는 링크.
    - 사용자가 관찰할 상태: initial / fieldErrors(이름 빈 값/100자 초과, 이메일 빈 값/형식 오류, 비밀번호 빈 값/8자 미만/72자 초과/허용 외 문자) / submitting / serverRejection(중복 이메일) / success.
    - Storybook story: `front-end/src/features/signup/pages/SignupPage.stories.tsx` 에 `Routes/SignupPage` page mock story 1종(`Route /signup`) 과 상태별 story 5종(Initial / FieldErrors / Submitting / ServerRejection — Duplicate Email / Success) 작성. `parameters.harness.requirements = ["REQ-013"]` 로 본 카드에 연결.
    - 입력 UX: 자동 포커스, 비밀번호 show/hide 토글, 키보드 Enter 제출 같은 입력 UX 세부는 본 카드 AC 가 아니며 REQ-011 LoginPage 패턴과 `docs/standards/front-end-ui.md` 를 따른다. 비밀번호 입력은 `autocomplete=new-password` 사용.
    - 안내 진입점: 가입 성공 시 호출되는 `onNavigateAfterSuccess` 는 구현 단계에서 `navigate("/login?signupCompleted=1", { replace: true })` 와 결합한다. `LoginPage` 는 `signupCompleted` 쿼리를 감지해 안내를 표시한 뒤 `navigate("/login", { replace: true })` 로 쿼리를 정리한다.
    - 구현 단계 작업 목록 (Skeleton 에서는 작성하지 않는다):
      1. SignupPage 를 감싸는 컨테이너 컴포넌트를 추가해 실제 API client 호출과 `useNavigate` 를 `onSubmit` / `onNavigateAfterSuccess` 에 결합한다.
      2. `front-end/src/features/signup/routes.tsx` 의 `/signup` 라우트를 컨테이너로 교체하고 `RedirectIfAuthenticated` 가드로 감싼다.
      3. `SignupPlaceholderPage` 와 그 story 를 제거하고 REQ-011 의 `/signup` placeholder 수용 기준/시나리오/FE BDD 테스트/page mock story 메타데이터를 본 카드 기대값으로 갱신한다.
      4. `LoginPage` 에 `signupCompleted` 쿼리 감지 진입점을 추가한다 (안내 표시 후 쿼리 정리).
      5. `@Covers` Playwright FE BDD 테스트 작성과 visual snapshot baseline.
  검증: `./gradlew generateScenarioIndex generateFrontEndSourceIndex traceRequirementCard -Preq=REQ-013` PASS, findings 0. FE 명령 (`npm run typecheck`, `npm run lint`, `npm run source-index`, `npm run build-storybook`) 모두 PASS, 0 issue. `validateRequirementCard -Preq=REQ-013` 는 AC 커버 FE BDD 테스트 부재로 RED 차단 (Skeleton 단계 정상).
  승인자: 2026-05-30 REDSTONE ("이제 구현 진행하라" 로 Skeleton 승인 및 구현 착수 지시).
  Skeleton 결과: 승인

- 2026-05-30 GREEN 구현 (REDSTONE).
  - API 경계: `front-end/src/features/signup/types.ts` 에 `SignupInput` / `SignupResult` view model 을 두고, `front-end/src/api/signup.ts` 의 `signup()` 이 REQ-001 `POST /users/signup` 계약(201 성공 / 409 중복 / 그 외 오류)을 `SignupResult` 로 정규화한다. `SignupPage.tsx` 는 두 타입을 `../types` 에서 가져와 재노출하고, 표현(props-callback) 구조는 그대로 유지한다.
  - 컨테이너/라우팅: `front-end/src/features/signup/pages/SignupPageContainer.tsx` 가 `signup()` 과 `useNavigate` 를 `onSubmit` / `onNavigateAfterSuccess` 에 결합한다(`@UsesApi POST /users/signup`). `routes.tsx` 의 `/signup` 라우트를 컨테이너로 교체하고 `RedirectIfAuthenticated` 가드로 감쌌다. `SignupPlaceholderPage` 와 그 story 는 제거했다.
  - 가입 완료 안내: `LoginPage.tsx` 가 `signupCompleted=1` 쿼리를 감지해 가입 완료 Alert(`AlertTitle "회원 가입이 완료되었습니다"`)를 표시한 뒤 `navigate("/login", { replace: true })` 로 쿼리를 정리한다. `LoginPage.stories.tsx` 에 REQ-013 로 태깅한 `Signup Completed Notice` story 를 추가했다.
  - REQ-011 정리: `/signup` placeholder 수용 기준/시나리오/Playwright 테스트를 REQ-011 카드와 `REQ-011-login-logout.feature`, `auth-protected-surfaces.spec.ts` 에서 제거하고, 이관 사실을 REQ-011 의사결정 로그(2026-05-30)에 남겼다. REQ-011 은 BE 20 + FE 22 + FS 3 = 45개 AC 로 BLUE 유지.
  - FE BDD 테스트: `front-end/tests/e2e/signup-form.spec.ts`(구조/검증/제출중/중복 이메일/데스크톱 레이아웃/접근성 11개), `front-end/tests/e2e/signup-flow.spec.ts`(성공→/login 안내, 인증 가드 2개), mock 헬퍼 `tests/e2e/_helpers/signup-mocks.ts`. 모든 `Covers` annotation 은 본 카드 AC 텍스트와 정확 일치한다. 비밀번호 AC("72자를 초과하거나 허용되지 않는 문자")는 허용 외 문자 분기와 73자 초과 분기를 각각 단독 테스트로 직접 커버한다(FE 회귀 방지).
  - 검증: `npm run typecheck` / `npm run lint` / `npm run test`(vitest 11/11) / `npm run e2e`(33/33, 신규 signup 11개 포함) / `npm run build` / `npm run build-storybook` 모두 PASS. `./gradlew traceRequirementCard -Preq=REQ-013` 17개 AC 모두 PASS, findings 0. `./gradlew validateHarness` `gate: exit=0 / red=0 / green=1 / blue=12`.

### 테스트 리뷰

- 리뷰일: 2026-05-30
  리뷰자: Product Owner, Tech Lead
  확인: 17개 (FE) 수용 기준이 모두 Playwright FE BDD 테스트의 `Requirement REQ-013` + `Covers`(AC 텍스트 정확 일치)와 `REQ-013-email-signup-screen.feature` 의 `Covers:` 블록에 매핑됨을 `traceRequirementCard -Preq=REQ-013` 로 확인했다. 중복 이메일 분기는 새 `AlertTitle "이미 등록된 이메일입니다"` 텍스트와 `/login` 진입 링크 존재를 함께 검증한다(2026-05-30 form-level Alert 결정 충족). 가입 성공 흐름은 `/login` 이동과 가입 완료 안내 노출을 검증한다. REQ-011 placeholder 이관 후에도 REQ-011 은 BLUE 를 유지한다.
  결과: 승인

## 열린 질문

- 없음
