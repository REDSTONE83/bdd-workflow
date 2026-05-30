# 요건 카드

요건 ID: REQ-011
제목: 이메일·비밀번호 로그인과 로그아웃
우선순위: 높음
상태: 승인
구현 대상: full-stack

## 사용자/목적

가입된 사용자는 이메일과 비밀번호로 로그인해 자신의 보호 자원에 접근할 수 있어야 하며, 로그아웃으로 그 접근 권한을 종료할 수 있어야 한다. 로그인 결과로 발급된 인증 정보는 브라우저 JS가 직접 읽을 수 없도록 HttpOnly Cookie에 담아 전달한다.

## 범위

- `POST /auth/login`: 이메일과 비밀번호를 전달받아 검증한 뒤, 검증에 성공하면 사용자 UUID를 `sub`로 하는 JWT access token을 HttpOnly Cookie로 발급한다. 성공 응답은 `204 No Content`이며 본문은 비어 있다.
- 로그인 요청 본문의 이메일이 비어 있거나 `@`을 포함하지 않거나 비밀번호가 비어 있는 경우, BE는 인증을 시도하지 않고 `400` Bean Validation 오류(`ApiError`)로 응답한다. 인증 단계까지 도달한 자격 증명 검증 실패만 `401 INVALID_CREDENTIALS`로 응답한다. FE는 같은 입력을 제출 전에 막지만, 우회 경로로 도달한 요청에도 BE 단독 정책이 유지된다.
- 이메일은 REQ-001과 동일한 정규화(trim + ASCII lowercase) 후 비교하고, 비밀번호는 REQ-001에서 저장한 BCrypt 해시와 비교한다.
- 로그인 응답 본문은 비어 있고, 인증 정보는 응답의 `Set-Cookie` 헤더로만 전달한다.
- 발급되는 access token은 HS256으로 서명하며, issuer는 `bdd-workflow`, audience는 `bdd-workflow-api`, 만료 시각은 발급 시점 + 60분으로 둔다. JWT 서명 키와 issuer/audience 설정은 REQ-004와 같은 `app.auth.jwt.*`를 사용한다.
- access token Cookie의 이름은 `ACCESS_TOKEN`이며, 속성은 `HttpOnly`, `SameSite=Strict`, `Path=/`, `Max-Age=3600`이다. `Secure` 속성은 운영(`prod`) 프로파일에서만 켠다. 로컬·테스트(`local`, `test`) 프로파일에서는 Playwright가 `http://127.0.0.1` 위에서 동작해야 하므로 `Secure`를 끄고 나머지 속성은 동일하게 유지한다.
- 보호 API는 access token Cookie를 우선 인식하고, Cookie가 없으면 REQ-004의 `Authorization: Bearer <token>` 헤더를 fallback으로 인정한다. Cookie와 Bearer 헤더가 동시에 있으면 Cookie의 토큰을 사용한다.
- `POST /auth/logout`: 인증 여부와 무관하게 호출 가능하며, 로그인 시 발급한 Cookie와 동일한 속성(`Path=/`, `HttpOnly`, `SameSite=Strict`, 운영에서는 `Secure` 포함)으로 `Set-Cookie ACCESS_TOKEN=; Max-Age=0`을 응답해 브라우저가 기존 Cookie를 확실히 제거하도록 한다. 서버 측 토큰 blacklist는 두지 않는다.
- `GET /auth/me`: 인증된 사용자의 `id`와 `email`을 반환한다. HttpOnly Cookie 환경에서 FE가 자신의 로그인 상태와 사용자 표시 정보를 얻기 위한 단일 진입점이다.
- FE는 BE와 동일 origin으로 호출해 Cookie의 `SameSite=Strict`가 깨지지 않게 한다. 로컬 개발과 Playwright E2E는 Vite dev server의 path-prefix proxy(`/auth`, `/users`, `/todos`, `/categories`, `/v3/api-docs`, `/swagger-ui`)로 BE에 전달해 동일 origin을 유지한다. FE OpenAPI 클라이언트는 모든 요청에 `credentials: 'include'`를 둬 Cookie가 함께 전송되게 한다. 운영 배포는 동일 origin 전제로 reverse proxy 뒤에 둔다.
- 로그인 실패는 모든 사유(가입되지 않은 이메일, 비밀번호 불일치)에 대해 같은 401 응답을 보낸다. 응답은 REQ-004와 같은 `ApiError` JSON 형식이며 최상위 `code`는 `INVALID_CREDENTIALS`이다.
- 로그인/로그아웃/현재 사용자 조회 API는 OpenAPI 문서에 포함한다. SecurityScheme로 Cookie 방식(`type: apiKey`, `in: cookie`, `name: ACCESS_TOKEN`)과 REQ-004의 Bearer 방식을 모두 등록하고, 보호 API에는 두 방식 중 하나로 인증할 수 있다고 표시한다. 전역 default Security Requirement는 사용하지 않고, 보호 컨트롤러에 두 SecurityScheme을 명시적으로 표시한다. `/auth/login`과 `/auth/logout`은 인증 요구를 표시하지 않으며, `/auth/me`에는 보호 API와 동일하게 두 SecurityScheme을 모두 표시한다.
- FE는 `/login` 경로에 로그인 화면을 둔다. 화면은 전역 헤더/사이드바 없이 중앙에 단일 카드를 표시하며, 카드는 제목, 이메일 입력 필드, 비밀번호 입력 필드, 로그인 버튼, 그리고 카드 하단의 회원 가입 화면(`/signup`)으로 이동하는 텍스트 링크로 구성한다.
- 로그인 화면을 열면 이메일 입력 필드에 자동으로 입력 포커스가 가고, 이메일에는 `autocomplete="username"`, 비밀번호에는 `autocomplete="current-password"`를 둔다. 비밀번호 입력은 처음에는 마스킹된 상태로 두고, 입력 우측에 눈 모양 아이콘 형태의 show/hide 토글 버튼을 둔다. 토글이 보이기 상태이면 비밀번호 입력값이 그대로 보이고, 가리기 상태이면 다시 마스킹된다. 토글 버튼은 키보드로 접근할 수 있고 현재 상태가 보조 기술에 안내된다.
- 로그인 폼은 이메일 빈 값, 비밀번호 빈 값, 이메일 형식 오류를 클라이언트에서 검사해 각 필드 아래에 안내를 표시한다. 키보드 Enter로 폼을 제출할 수 있다.
- 로그인 제출 중에는 로그인 버튼이 비활성화되고 진행 중 표시가 노출되며, 같은 폼을 중복으로 제출할 수 없다.
- 서버 인증 실패 응답을 받으면 폼 상단의 통합 안내 영역에 이메일과 비밀번호 중 어느 쪽이 잘못됐는지 구분하지 않는 공통 메시지를 표시하고, 입력했던 이메일은 유지하되 비밀번호 입력은 비운다.
- 로그인 성공 시 `loginRedirect` query parameter가 있고 그 값이 보호 라우트 경로이면 그 경로로, 없으면 `/todos`로 이동한다.
- FE는 인증 상태를 `GET /auth/me` 응답으로 판정한다. 보호 라우트는 인증이 확인된 사용자만 접근할 수 있고, 비인증 상태로 접근하면 원래 경로를 `loginRedirect`에 담아 `/login`으로 이동시킨다.
- 보호 화면을 처음 열거나 새로고침해 인증 확인이 진행되는 동안에는 상단 헤더 골격과 본문 자리만 보이는 스켈레톤을 표시한다.
- 이미 인증된 사용자가 `/login`에 접근하면 `/todos`로 이동시킨다.
- 모든 보호 화면은 공통 상단 헤더를 가진다. 헤더 우측에는 현재 사용자의 이메일이 표시되고, 이를 선택하면 사용자 메뉴(dropdown)가 펼쳐지며, 그 안에 로그아웃 항목이 있다.
- 로그아웃 항목 선택 시 별도의 확인 다이얼로그 없이 즉시 `POST /auth/logout`을 호출한다. 성공 응답을 받았을 때에만 캐시된 사용자 정보를 비우고 `/login`으로 이동시킨다.
- `POST /auth/logout` 호출이 실패하면 사용자는 현재 화면에 그대로 머무르고, 화면 상단에 dismiss 가능한 알림(`role="alert"`) 한 줄로 재시도를 안내한다. 알림은 헤더 바로 아래에 표시되며, 사용자가 닫거나 다음 성공 응답을 받으면 사라진다.
- 본 카드는 다른 요건 카드가 본문을 채울 때까지 `/todos` 보호 route의 placeholder 화면을 둔다. `/todos`는 인증된 사용자의 이메일과 빈 본문 영역만 표시하고, REQ-002 FE 후속이 실제 본문을 채운다. `/signup` route는 본 카드가 가입 진입 링크용으로 처음 placeholder를 두었으나, REQ-013(이메일 회원 가입 화면)이 실제 화면으로 구현하면서 placeholder 책임을 이관했다. 로그인 카드의 `/signup` 진입 링크는 그대로 유지되며 이제 실제 회원 가입 화면으로 이동한다.
- `/` 경로는 REQ-005가 정의한 공개 앱 셸 화면을 그대로 유지하며, 본 카드의 보호 라우팅 대상이 아니다. 인증 여부와 무관하게 같은 화면이 표시된다. 본 카드는 `/` 자체의 표시 동작과 REQ-005의 BLUE 회복 상태를 변경하지 않는다.

## 표준 용어

- user.id
- user.email
- auth.authenticatedUser
- auth.jwtBearerToken
- auth.accessTokenCookie
- auth.loginCredentials
- auth.login
- auth.logout
- auth.currentUser

## 제외 범위

- Refresh token, 토큰 회전, 서버 측 토큰 폐기 blacklist
- 비밀번호 재설정, 비밀번호 변경 화면, 이메일 인증, 소셜 로그인
- 로그인 실패 횟수 기반 율제어, IP 율제어, 계정 잠금/해제 정책
- "로그인 유지" 옵션, 멀티 디바이스 세션 목록과 원격 로그아웃
- 사용자 정보 수정, 탈퇴, 비활성화
- REQ-004의 Bearer 헤더 검증 동작 자체 변경(본 카드는 인증 채널에 Cookie를 추가할 뿐, 기존 Bearer 검증 규칙을 변경하지 않는다)
- 로그아웃 확인 다이얼로그
- 가입 화면(`/signup`) 본문 구현 (REQ-013 이메일 회원 가입 화면이 구현한다; 본 카드는 가입 진입 링크만 유지한다)
- 할 일 목록 화면(`/todos`) 본문 구현 (본 카드는 인증 확인용 placeholder만 둔다; REQ-002 FE 후속 카드가 채운다)

## 수용 기준

각 AC bullet 앞에 `(BE)`, `(FE)`, `(FS)` 마커를 둔다. `BE`는 백엔드 Acceptance Test만, `FE`는 FE BDD 테스트만 커버를 요구하고, `FS`는 양쪽 모두 커버를 요구한다. 마커는 REQ-012가 표준화했고 현재 하네스 게이트(`gate.mjs`)가 마커별 `requiredChecks`를 강제한다.

- (BE) 등록된 이메일과 비밀번호로 로그인하면 인증 세션이 시작된다
- (BE) 가입할 때 사용한 이메일과 대소문자와 앞뒤 공백만 다른 값으로 로그인해도 같은 계정으로 인증된다
- (BE) 등록되지 않은 이메일로 로그인하면 이메일 존재 여부를 알 수 없는 동일한 인증 실패 응답을 받는다
- (BE) 등록된 이메일이지만 비밀번호가 일치하지 않으면 동일한 인증 실패 응답을 받는다
- (BE) 이메일 또는 비밀번호가 비어 있거나 이메일 형식이 아닌 로그인 요청은 인증을 시도하기 전에 형식 검증 오류 응답으로 거절되고, 자격 증명 인증 실패 응답과 구분된다
- (BE) 운영 프로파일에서 로그인 성공 시 발급되는 인증 정보는 브라우저 JS가 직접 읽을 수 없고, HTTPS에서만 전송되며, 다른 사이트로부터의 자동 전송이 차단된다
- (BE) 로컬과 테스트 프로파일에서 로그인 성공 시 발급되는 인증 정보는 브라우저 JS가 직접 읽을 수 없고 다른 사이트로부터의 자동 전송이 차단되며, HTTPS 강제 전송만 적용되지 않는다
- (BE) 로그인 성공 응답의 본문은 비어 있다
- (BE) 로그인 인증 정보의 유효 기간은 발급 시점부터 60분이다
- (BE) 발급된 인증 정보가 있는 보호 API 요청은 인증된다
- (BE) 인증 정보가 Cookie와 Authorization 헤더에 모두 있으면 Cookie의 인증 정보로 인증된다
- (BE) 인증 정보가 Cookie에 없고 유효한 Authorization Bearer 헤더만 있으면 보호 API 요청이 인증된다
- (BE) 인증 정보가 없으면 보호 API 요청이 거절된다
- (BE) 로그아웃 호출이 성공하면 인증 세션이 종료되어 같은 클라이언트의 이후 보호 API 요청이 거절된다
- (BE) 인증되지 않은 상태에서 로그아웃을 호출해도 인증 세션 종료와 동일한 응답을 받는다
- (BE) 인증된 상태에서 현재 사용자 조회를 호출하면 자신의 식별자와 이메일이 반환된다
- (BE) 인증되지 않은 상태에서 현재 사용자 조회를 호출하면 거절된다
- (BE) OpenAPI 문서에는 Cookie 인증 방식과 Bearer 인증 방식이 모두 등록된다
- (BE) 보호 API는 Cookie 인증 방식과 Bearer 인증 방식 중 하나로 호출할 수 있다고 OpenAPI 문서에 표시된다
- (BE) 로그인과 로그아웃 API는 OpenAPI 문서에 인증 요구 없이 호출할 수 있다고 표시된다
- (FE) 로그인 화면은 화면 가운데에 하나의 로그인 카드를 표시하고, 카드는 이메일 입력, 비밀번호 입력, 로그인 버튼으로 구성된다
- (FE) 로그인 카드 하단에는 가입 화면으로 이동하는 텍스트 링크가 있다
- (FE) 로그인 화면을 열면 이메일 입력에 자동으로 입력 포커스가 간다
- (FE) 로그인 화면의 비밀번호 입력은 처음에는 입력값이 화면에 그대로 보이지 않게 가려진다
- (FE) 로그인 화면의 비밀번호 입력 옆에는 입력값을 보이거나 다시 가릴 수 있는 토글 버튼이 있다
- (FE) 비밀번호 토글을 보이기로 바꾸면 입력값이 화면에 그대로 보이고, 다시 가리기로 바꾸면 다시 가려진다
- (FE) 비밀번호 토글은 키보드로 조작할 수 있고, 현재 보이기와 가리기 상태가 보조 기술에 안내된다
- (FE) 이메일을 비워둔 채 로그인을 시도하면 이메일 입력 아래에 입력이 필요하다는 안내가 보인다
- (FE) 비밀번호를 비워둔 채 로그인을 시도하면 비밀번호 입력 아래에 입력이 필요하다는 안내가 보인다
- (FE) 이메일 형식이 아닌 값을 입력하고 로그인을 시도하면 이메일 입력 아래에 형식 안내가 보인다
- (FE) 키보드 Enter 입력으로 로그인을 제출할 수 있다
- (FE) 로그인 버튼을 누른 뒤 응답을 기다리는 동안 로그인 버튼은 다시 누를 수 없는 상태로 표시된다
- (FE) 로그인 응답을 기다리는 동안 같은 폼을 다시 제출해도 추가 로그인 요청이 서버로 전송되지 않는다
- (FE) 로그인 화면에서 인증에 실패하면 폼 상단에 어느 쪽이 잘못됐는지 구분하지 않는 공통 안내가 보이고, 입력했던 이메일은 그대로 유지되며 비밀번호 입력은 비워진다
- (FS) 로그인 화면에서 인증에 성공하면 원래 가려고 했던 보호 화면이 있으면 그 화면으로, 없으면 자신의 할 일 목록 화면으로 이동한다
- (FE) 로그인 성공 후 이동 대상이 본 애플리케이션의 보호 라우트 경로가 아니거나 외부 사이트로 가는 값이면 그 값은 무시되고 할 일 목록 화면으로 이동한다
- (FE) 이미 인증된 사용자가 로그인 화면에 접근하면 할 일 목록 화면으로 이동한다
- (FE) 비인증 사용자가 보호 화면에 접근하면 로그인 화면으로 이동한다
- (FS) 비인증 사용자가 보호 화면에 접근했다가 로그인에 성공하면 원래 가려고 했던 보호 화면으로 돌아온다
- (FE) 보호 화면을 처음 열거나 새로고침했을 때 인증 확인이 끝나기 전에는 헤더 골격과 본문 자리만 보이는 스켈레톤이 표시된다
- (FE) 보호 화면에는 공통 상단 헤더가 있고, 헤더 우측에 현재 사용자의 이메일이 표시된다
- (FE) 보호 화면 상단 헤더의 사용자 이메일을 선택하면 사용자 메뉴가 펼쳐지고, 그 안에 로그아웃 항목이 있다
- (FS) 사용자 메뉴에서 로그아웃 항목을 선택해 로그아웃 호출이 성공하면 화면에서 사용자 정보가 사라지고 로그인 화면으로 이동한다
- (FE) 사용자 메뉴에서 로그아웃 항목을 선택해 로그아웃 호출이 실패하면 현재 화면에 그대로 머무르고 상단에 재시도를 안내하는 오류 표시가 노출된다
- (FE) 인증된 사용자가 `/todos` 경로에 접근하면 자신의 이메일이 표시되는 빈 보호 화면이 보인다

## 의사결정 로그

- 결정일: 2026-05-23
  결정: 로그인 성공 시 access token만 발급하고 refresh token이나 서버 측 토큰 폐기 blacklist는 두지 않는다.
  이유: REQ-004가 refresh token과 토큰 폐기를 제외 범위로 명시했고, 그 stateless 정책을 그대로 이어받는 편이 인증 인프라가 단일하다. 로그아웃은 클라이언트 측 Cookie 만료로 충분하다.
  결정자: Product Owner, Tech Lead
  영향: 로그인은 단일 access token JWT만 발급한다. 로그아웃은 서버에서 Cookie 만료만 수행하고 토큰 무효화 저장소를 추가하지 않는다.

- 결정일: 2026-05-23
  결정: 발급된 access token은 `HttpOnly`, `Secure`, `SameSite=Strict` 속성의 Cookie로 전달한다.
  이유: HttpOnly로 XSS에 의한 토큰 탈취 위험을 차단하고, SameSite=Strict로 cross-site 요청에서 Cookie가 자동 전송되는 것을 차단해 CSRF를 막는다. 이렇게 하면 REQ-004의 "CSRF 보호 비활성, 세션 미생성" 결정을 그대로 유지할 수 있다.
  결정자: Product Owner, Tech Lead
  영향: Cookie 이름은 `ACCESS_TOKEN`, Path=`/`, Max-Age=3600으로 고정한다. FE는 토큰 값을 JS에서 읽지 않고, 보안 결정은 브라우저 Cookie 정책에 위임한다.

- 결정일: 2026-05-23
  결정: 보호 API는 Cookie의 access token을 우선 인식하고, Cookie가 없을 때만 REQ-004의 Authorization Bearer 헤더를 fallback으로 인정한다.
  이유: FE는 Cookie 채널을, Swagger UI와 외부 도구는 Bearer 채널을 사용해야 한다. 두 채널이 동시에 들어왔을 때의 동작을 정해두지 않으면 인증 컨텍스트가 두 개 만들어진다.
  결정자: Product Owner, Tech Lead
  영향: 보안 필터의 Bearer Token Resolver는 Cookie를 먼저 보고, Cookie가 없으면 헤더에서 토큰을 꺼낸다. REQ-004의 Bearer 검증 동작 자체는 변경하지 않는다.

- 결정일: 2026-05-23
  결정: OpenAPI 문서에는 Cookie 인증 방식과 Bearer 인증 방식을 모두 SecurityScheme로 등록한다.
  이유: 두 채널이 모두 유효한 인증 경로이므로 API 계약에도 두 방식이 함께 노출되어야 한다. Swagger UI에서는 Bearer 입력으로 Try-it-out이 가능하고, FE 클라이언트는 Cookie 방식 계약을 참조한다.
  결정자: Product Owner, Tech Lead
  영향: Springdoc 설정은 Bearer SecurityScheme(REQ-004 도입분)에 더해 `cookieAuth`(`type: apiKey`, `in: cookie`, `name: ACCESS_TOKEN`)를 추가하고, 보호 API의 `security`에 두 방식을 모두 표시한다.

- 결정일: 2026-05-23
  결정: 로그인 실패는 가입되지 않은 이메일이든 비밀번호 불일치이든 동일한 401 `INVALID_CREDENTIALS` `ApiError`로 응답하며, 율제어와 계정 잠금 정책은 두지 않는다.
  이유: MVP 단계에서 user enumeration을 막는 가장 단순한 방법이며, 운영 정책(율제어, 잠금)을 추가하기 전까지 보안과 단순성의 균형을 잡는다. REQ-004의 `ApiError` 계약과 동일한 응답 형식을 유지한다.
  결정자: Product Owner, Tech Lead
  영향: 인증 서비스는 이메일과 비밀번호의 어떤 조합이 실패했는지 응답에 노출하지 않는다. 율제어/잠금은 별도 카드로 다룬다.

- 결정일: 2026-05-23
  결정: 로그인 응답 본문은 비우고, FE는 사용자 정보를 `GET /auth/me`로 조회한다.
  이유: 인증 정보를 Set-Cookie로만 전달하면 응답 본문에 토큰을 노출하지 않는다. HttpOnly Cookie 환경에서 FE가 로그인 상태와 표시 정보를 얻을 단일 진입점이 필요하므로 `/auth/me`를 별도 endpoint로 둔다.
  결정자: Product Owner, Tech Lead
  영향: 로그인은 인증 정보를 응답에 노출하지 않는다. FE 라우팅 가드는 `GET /auth/me` 응답으로 로그인 여부를 판정한다.

- 결정일: 2026-05-23
  결정: 로그아웃은 `POST /auth/logout` 단일 endpoint로 처리하며, 인증 여부와 무관하게 `204 No Content` 응답과 `Set-Cookie Max-Age=0`을 반환한다.
  이유: 로그아웃은 멱등이어야 하고, 비인증 상태에서 호출해도 클라이언트 측 Cookie를 정리할 수 있어야 한다. HttpOnly Cookie라 FE에서 Cookie를 직접 제거할 수 없기 때문에 서버 응답으로 만료시켜야 한다.
  결정자: Product Owner, Tech Lead
  영향: 로그아웃 API는 인증 컨텍스트를 요구하지 않고, 응답 본문은 비운다.

- 결정일: 2026-05-23
  결정: 로그인 성공 후 FE 진입점은 `loginRedirect` query parameter 우선, 없으면 `/todos`로 둔다.
  이유: 비인증 상태에서 보호 화면 진입을 시도한 사용자는 로그인 후 원래 화면으로 돌아가야 자연스럽다. 그런 흐름이 없는 사용자는 가장 일상적인 업무 화면(`/todos`)으로 이동시킨다.
  결정자: Product Owner, Tech Lead
  영향: FE 라우팅 가드는 비인증 보호 화면 접근 시 현재 경로를 `loginRedirect`에 담아 `/login`으로 이동시키고, 로그인 화면은 성공 콜백에서 그 값을 우선 확인한다.

- 결정일: 2026-05-23
  결정: 비밀번호 검증은 REQ-001에서 저장한 BCrypt 해시 비교를 그대로 사용한다.
  이유: 가입 흐름이 이미 BCrypt 해시로 비밀번호를 저장하고 있으므로, 로그인도 같은 알고리즘으로 검증하는 편이 보관·검증 책임을 단일 도메인에 둔다.
  결정자: Tech Lead
  영향: 인증 서비스는 새로운 비밀번호 인코딩 정책을 도입하지 않고 REQ-001의 PasswordEncoder를 재사용한다.

- 결정일: 2026-05-23
  결정: 로그인 화면은 전역 헤더/사이드바 없이 중앙에 단일 로그인 카드를 표시하고, 카드 하단에 회원 가입 화면 진입 링크를 둔다.
  이유: 비인증 진입 화면이라 보호 화면의 chrome이 필요 없고, 카드 중앙 배치가 shadcn/REQ-005 foundation의 단일 task 화면 패턴과 잘 맞는다. 회원 가입 진입을 카드 하단 텍스트 링크로 두면 primary action(로그인)의 강조를 흐리지 않는다.
  결정자: Product Owner, Tech Lead
  영향: `/login`은 보호 화면과 다른 layout을 사용하고, REQ-001의 회원 가입 화면으로 이동할 수 있는 진입점을 갖는다. 회원 가입 화면의 구현은 REQ-011 범위에 포함하지 않는다.

- 결정일: 2026-05-23
  결정: 로그인 폼은 클라이언트에서 빈 값과 이메일 형식을 검사하고, 서버 인증 실패는 폼 상단 통합 안내로 보여주며, 제출 중에는 로그인 버튼을 비활성화한다.
  이유: 빈 값/형식 오류는 서버 호출 없이 즉시 알려주는 편이 사용자 경험에 좋고, 서버 인증 실패는 user enumeration 방지를 위해 어느 필드가 잘못됐는지 구분하지 않는 단일 안내로 통일한다. 제출 중 비활성화는 중복 제출을 막는다.
  결정자: Product Owner, Tech Lead
  영향: FE 폼은 이메일/비밀번호 빈 값과 이메일 형식 오류를 필드 단위 안내로, 서버 401은 폼 상단 공통 안내로 보여준다. 비밀번호 입력은 인증 실패 시 비우고, 이메일 입력은 유지한다.

- 결정일: 2026-05-23
  결정: 모든 보호 화면은 공통 상단 헤더를 가지고, 사용자 메뉴는 헤더 우측의 사용자 이메일 dropdown 안에 둔다. 로그아웃 항목 클릭은 별도 확인 다이얼로그 없이 즉시 실행한다.
  이유: 사용자 메뉴 dropdown은 shadcn 표준 패턴이며, 메뉴 항목이 늘어나도 같은 진입점에 확장할 수 있다. 로그아웃은 되돌릴 수 있는 동작(다시 로그인)이라 확인 단계를 추가하지 않는 편이 단순하다.
  결정자: Product Owner, Tech Lead
  영향: 보호 화면 layout은 단일 상단 헤더 컴포넌트를 공유하고, 사용자 메뉴는 사용자 이메일 trigger + dropdown 항목 구조로 둔다. 로그아웃 항목 클릭 즉시 `POST /auth/logout`을 호출하고 `/login`으로 이동한다.

- 결정일: 2026-05-23
  결정: 로그인 화면의 비밀번호 입력에는 입력값을 보이거나 다시 가릴 수 있는 토글 버튼을 둔다. 입력은 기본 마스킹 상태로 시작한다.
  이유: 사용자가 입력한 비밀번호를 확인할 수 있어야 오타로 인한 인증 실패를 줄일 수 있고, 모바일 환경에서 특히 효과가 크다. 기본은 가린 상태로 두어 어깨너머 노출 위험을 최소화하고, 사용자가 명시적으로 토글했을 때만 평문이 보인다.
  결정자: Product Owner, Tech Lead
  영향: 비밀번호 입력은 우측에 눈 모양 아이콘 형태의 토글 버튼을 가지며, 토글 상태에 따라 input type을 password/text로 전환한다. 버튼은 키보드로 접근 가능하고 현재 상태가 보조 기술에 안내된다.

- 결정일: 2026-05-23
  결정: 보호 화면 최초 로드와 새로고침 시 인증 확인이 끝나기 전까지 헤더 골격과 본문 자리 placeholder만 보이는 스켈레톤을 표시한다.
  이유: HttpOnly Cookie 환경에서는 FE가 토큰을 직접 읽을 수 없어 인증 여부를 `GET /auth/me`로 확인해야 하고, 그 동안 빈 화면을 보이면 깜빡임이 크다. 스켈레톤은 layout shift를 최소화하고 FE testing 표준의 loading 상태 표현과도 정합한다.
  결정자: Product Owner, Tech Lead
  영향: 보호 라우트 가드는 인증 확인 중 상태(`pending`)를 별도 상태로 두고, 그 동안 스켈레톤을 렌더한다. 인증 확인 완료 후에만 실제 본문이 렌더된다.

- 결정일: 2026-05-23
  결정: AC 단위 테스트 대상을 카드에 명시한다. 수용 기준 bullet 앞에 `(BE)`, `(FE)`, `(FS)` 마커를 두고, 각각 백엔드 Acceptance Test, FE BDD 테스트, 양쪽 테스트 커버를 요구한다.
  이유: 본 카드는 full-stack 카드지만 AC가 API 전용과 UI 전용으로 섞여 있어, 모든 AC에 BE와 FE 양쪽 커버를 요구하면 UI AC에 백엔드 테스트가 생기는 식으로 추적이 꼬인다. AC 단위로 테스트 대상을 한정하면 카드를 분리하지 않고도 정확한 커버 요구를 표현할 수 있다.
  결정자: Product Owner, Tech Lead
  영향: 본 카드의 모든 AC는 마커를 갖는다. 마커 파싱과 게이트는 REQ-012가 표준화했고 현재 BLUE 상태이므로 본 카드 시점에는 마커가 게이트 입력으로 활성화되어 있다. `evaluate-trace-state.mjs`의 `effectiveCoveragePolicy`가 (BE)는 백엔드 Acceptance Test, (FE)는 FE BDD 테스트, (FS)는 양쪽 모두를 `requiredChecks`로 강제하며, 어느 한쪽이 빠지면 해당 AC는 RED로 잡힌다. 본 카드의 RED/GREEN/BLUE 판정은 AC 마커별 커버 요구를 그대로 따른다.

- 결정일: 2026-05-23
  결정: `Secure` Cookie 속성은 운영 프로파일에서만 켜고, 로컬과 테스트 프로파일에서는 끈다. `HttpOnly`와 `SameSite=Strict`는 모든 프로파일에서 유지한다.
  이유: Vite dev 서버와 Playwright는 `http://127.0.0.1` 위에서 동작하므로 `Secure` 속성이 켜지면 Cookie가 전송되지 않아 인증 흐름 자체가 검증되지 않는다. 운영은 HTTPS 전제이므로 `Secure`를 켜는 편이 안전하다. mkcert 같은 로컬 HTTPS 인프라를 도입하지 않아도 같은 인증 흐름을 검증할 수 있다.
  결정자: Product Owner, Tech Lead
  영향: 인증 서비스는 active profile에 따라 `Secure` 플래그만 분기한다. AC도 운영 프로파일과 로컬·테스트 프로파일을 별도 문장으로 두어 양쪽을 검증한다.

- 결정일: 2026-05-23
  결정: `POST /auth/logout` 호출이 성공한 경우에만 클라이언트 사용자 정보를 비우고 `/login`으로 이동한다. 호출이 실패하면 현재 화면에 머무르고 재시도를 안내하는 오류 표시를 노출한다.
  이유: HttpOnly Cookie는 서버 응답으로만 만료시킬 수 있으므로, 호출 결과와 무관하게 화면을 이동시키면 "로그아웃 완료"와 "실제 세션 종료"가 어긋난다. 사용자가 다시 로그인된 상태로 돌아갈 수 있다.
  결정자: Product Owner, Tech Lead
  영향: FE 로그아웃 핸들러는 응답 상태에 따라 분기하며, 실패 시 오류 알림 컴포넌트를 통해 재시도를 유도한다.

- 결정일: 2026-05-23
  결정: 본 카드는 `/signup`과 `/todos` 두 route의 placeholder 화면을 함께 포함한다. 실제 화면 본문은 각각 REQ-001 FE 후속과 REQ-002 FE 후속 카드가 채운다.
  이유: 로그인 카드의 가입 진입 링크와 로그인 성공 후 기본 진입점은 두 route가 존재한다는 전제 위에서 동작한다. route가 없는 상태에서는 카드의 UX AC를 검증할 수 없고 깨진 이동이 발생한다. placeholder만 두어도 본 카드의 AC를 BLUE까지 끌어올릴 수 있다.
  결정자: Product Owner, Tech Lead
  영향: `/signup`은 가입 안내 placeholder, `/todos`는 인증된 사용자 이메일과 빈 본문 placeholder로 시작한다. 후속 FE 카드가 이들을 대체할 때 본 카드의 AC는 변경되지 않는다.

- 결정일: 2026-05-26
  결정: `/` 경로는 REQ-005가 정의한 공개 앱 셸 화면을 그대로 유지하고, 본 카드의 보호 라우팅 대상에서 제외한다.
  이유: REQ-005가 `/`에 둔 앱 셸은 이미 BLUE이며 별도 BDD 테스트가 그 화면을 검증한다. `/`를 인증 상태에 따라 redirect하는 entry router로 바꾸면 REQ-005의 BDD 테스트가 깨지고 BLUE 회복이 어긋난다. 본 카드의 진입점은 `/login`과 `/todos`로 충분하며, `/`의 운명은 REQ-005 후속 카드가 다시 정의할 때 본 카드와 함께 갱신한다.
  결정자: Product Owner, Tech Lead
  영향: 본 카드의 라우팅 가드는 `/login`, `/signup`, `/todos`만 다룬다. `/`는 비인증/인증 모두 같은 REQ-005 앱 셸을 표시하고, 본 카드는 `/`의 표시 동작을 변경하거나 새 AC를 두지 않는다.

- 결정일: 2026-05-26
  결정: BCrypt PasswordEncoder는 공유 Spring Bean으로 분리해 가입(REQ-001)과 로그인(REQ-011) 양쪽에서 같은 인스턴스를 주입받는다.
  이유: 현재 `UserService`의 `private static final` PasswordEncoder는 외부에서 재사용할 수 없다. 결정 #9의 "REQ-001 PasswordEncoder 재사용"을 실제로 실현하려면 Bean으로 승격해 단일 정의를 공유해야 한다. Bean으로 두면 향후 인코더 정책 변경도 한 곳에서 끝난다.
  결정자: Tech Lead
  영향: `common/auth/PasswordEncoderConfig`(또는 동등한 위치) 또는 기존 `SecurityConfig`에서 `BCryptPasswordEncoder` Bean을 정의하고, `UserService`와 새 `AuthService` 모두 주입 사용한다. `UserService`의 `PASSWORD_ENCODER` static 필드는 제거한다.

- 결정일: 2026-05-26 (도입 v7로 정정: 2026-05-27)
  결정: 프런트엔드 라우팅은 `react-router-dom` v7(`^7.15.1`)을 도입한다. (2026-05-27 정정 — 초안의 v6 결정은 BrowserRouter/Routes/Route/useNavigate API가 v6와 동일하게 동작하는 최신 안정판 v7로 갱신.)
  이유: 본 카드가 `/login`, `/signup`, `/todos` 경로, route guard, `loginRedirect` query, programmatic navigation을 모두 요구하는데 현재 FE에는 라우터가 없다. React 19와 Vite 7 환경에서 가장 보편적이고 shadcn/REQ-005 표준과 충돌하지 않는 선택이 `react-router-dom`이며, v7은 v6의 API(BrowserRouter/Routes/Route/useNavigate/useSearchParams)를 그대로 유지하면서 React 19 공식 지원과 long-term 유지 채널을 제공한다. 본 카드가 쓰는 라우팅 표면은 v6/v7에서 동일하므로 v7로 시작해 향후 마이그레이션 부담을 피한다.
  결정자: Tech Lead
  영향: `front-end/package.json`에 `react-router-dom@^7.15.1` 의존성을 추가하고, `src/app/AppRouter.tsx`에 BrowserRouter 기반 route 정의를, `src/features/auth/AuthProvider.tsx`에 인증 상태를 두며, `src/features/auth/`에 로그인 화면과 가드를 둔다. v7의 future flag 대상 API(예: `v7_startTransition`)는 본 카드 범위에서 별도로 활성화하지 않는다.

- 결정일: 2026-05-26
  결정: Spring profile별 설정은 `application.yml`을 base로 두고 `application-local.yml`, `application-test.yml`, `application-prod.yml`로 override한다. Cookie `Secure` 플래그처럼 profile에 따라 달라지는 값은 profile yml에서 분기한다.
  이유: 결정 #16(`Secure`는 prod에서만)을 코드 분기보다 설정 분기로 표현하면 환경 차이가 yml 한 곳에서 보인다. Spring Boot의 기본 profile 우선순위와 잘 맞고, 운영 배포는 외부 설정으로 다시 override 가능하다.
  결정자: Tech Lead
  영향: `back-end/src/main/resources/`에 profile yml 세 개를 추가하고, `app.auth.cookie.secure` 같은 새 설정 키를 두어 `AuthService`/Cookie 빌더에서 주입받는다. 기존 `app.auth.jwt.*` 키는 변경하지 않는다.

- 결정일: 2026-05-26
  결정: 보호 API의 Bearer 토큰 추출은 커스텀 `BearerTokenResolver`로 교체해 Cookie `ACCESS_TOKEN`을 먼저 보고, 없으면 `Authorization` 헤더를 본다.
  이유: REQ-004가 사용한 기본 `DefaultBearerTokenResolver`는 헤더만 본다. 결정 #3("Cookie 우선, 헤더 fallback, 동시 존재 시 Cookie")을 구현하려면 토큰 추출 지점을 하나로 묶어야 한다. resolver를 교체하면 `oauth2ResourceServer`의 나머지 검증 파이프라인(NimbusJwtDecoder validator, AuthenticatedUserJwtConverter)은 그대로 둘 수 있다.
  결정자: Tech Lead
  영향: `common/auth`에 `CookieFirstBearerTokenResolver`(또는 동등) 를 추가하고 `SecurityConfig.securityFilterChain`의 `oauth2ResourceServer`에 등록한다. REQ-004의 토큰 검증 규칙은 변경하지 않는다.

- 결정일: 2026-05-26
  결정: 본 카드의 모든 (FE)/(FS) AC는 Playwright BDD 테스트(`tests/e2e/**/*.spec.ts`)가 `Covers` 메타데이터로 직접 커버한다. Vitest 단위/컴포넌트 테스트는 `Covers`를 두지 않는 보조 TDD로만 사용한다.
  이유: FE BDD 표준은 Playwright이며 게이트(`gate.mjs`)도 `front-end/test-results/e2e-results.json`만 AC 커버 입력으로 본다. Vitest는 form validation, password 토글 상태 같은 상세 단위 검증으로 두면 회귀를 빠르게 잡지만 AC 커버로는 인정되지 않는다. 어느 layer에 어떤 검증이 들어갈지 미리 정해야 마커별 RED 회피가 가능하다.
  결정자: Tech Lead
  영향: Skeleton 단계에서는 `Covers`가 붙은 Playwright spec 또는 Vitest 테스트를 작성하지 않는다(요건 작성 절차 7단계 금지 항목). 구현/GREEN 단계에 들어가면 본 카드의 (FE)/(FS) AC 텍스트와 정확 일치하는 `Covers` annotation을 가진 Playwright spec 파일을 채운다. Vitest 테스트는 같은 AC 텍스트를 `Covers`로 사용하지 않는다.

- 결정일: 2026-05-26
  결정: FE와 BE는 동일 origin으로 통신한다. 로컬 개발과 Playwright E2E는 Vite dev server의 path-prefix proxy로 BE에 전달해 동일 origin을 유지하고, 운영도 reverse proxy 뒤에서 동일 origin을 둔다. FE OpenAPI 클라이언트는 모든 요청에 `credentials: 'include'`를 둔다.
  이유: 결정 #2의 `SameSite=Strict`는 cross-site 요청에서 Cookie가 자동 전송되지 않게 한다. FE가 다른 origin이면 Cookie 인증 흐름 자체가 동작하지 않으므로 동일 origin이 필수다. Vite proxy는 mkcert 같은 추가 인프라 없이 로컬·E2E·운영을 같은 origin 모델로 통일하고, `credentials: 'include'`로 brower의 cross-origin 안전 기본값을 우회하지 않은 채 Cookie를 함께 전송할 수 있다.
  결정자: Product Owner, Tech Lead
  영향: `front-end/vite.config.ts`에 `/auth`, `/users`, `/todos`, `/categories`, `/v3/api-docs`, `/swagger-ui` proxy를 추가한다. `front-end/src/api/generated/client.ts` 또는 그 wrapper에 `credentials: 'include'`를 기본값으로 둔다. BE에는 별도 CORS 설정을 추가하지 않는다.

- 결정일: 2026-05-26
  결정: 로그인 성공 응답은 `204 No Content`로 두고, 로그인 요청 본문의 빈 값/형식 오류는 인증 단계 진입 전에 `400` Bean Validation 오류(`ApiError`)로 응답한다. 자격 증명 인증 실패만 결정 #5의 `401 INVALID_CREDENTIALS`로 유지한다.
  이유: 응답 본문이 없으므로 의미상 `204`가 적절하고, FE는 `Set-Cookie`와 상태만 보고 후속 동작을 정한다. 빈 값/형식 오류는 user enumeration과 무관(이메일 존재 여부를 노출하지 않음)하고 REQ-001 가입 API와 같은 Bean Validation 응답을 그대로 쓰면 일관성이 유지된다. FE 사전 검증이 정상 흐름을 막지만, 직접 호출이나 우회 경로에 대비해 BE도 단독으로 같은 정책을 갖는다.
  결정자: Product Owner, Tech Lead
  영향: `AuthController.login`은 `ResponseEntity<Void>`로 204를 반환하고, `LoginRequest` DTO에 `@NotBlank`, `@Email` Bean Validation을 둔다. 인증 단계에서만 `InvalidCredentialsException`이 던져져 전역 핸들러가 401 `INVALID_CREDENTIALS`로 응답한다.

- 결정일: 2026-05-26
  결정: `loginRedirect` query parameter는 본 애플리케이션의 보호 라우트 경로 화이트리스트(현재 `/todos` 한 개, 후속 카드 도입 시 확장)에 정확히 일치하는 값만 사용한다. 그 외 값(외부 URL, 프로토콜 상대 URL, 공개 라우트, 인코딩된 우회값, 길이 초과 값)은 모두 무시되고 기본 진입점 `/todos`로 이동한다.
  이유: redirect 파라미터를 검증 없이 사용하면 open redirect로 피싱 페이지에 사용자를 보낼 수 있다. 신뢰 가능 경로 목록을 코드로 정의하고 그 외 값은 모두 기본 진입점으로 fall back하면 open redirect를 닫을 수 있다.
  결정자: Product Owner, Tech Lead
  영향: FE 로그인 콜백은 `loginRedirect` 값을 신뢰 경로 목록과 비교하는 헬퍼(`resolveLoginRedirect`)를 거치고, 매칭되지 않으면 `/todos`로 이동한다. 신뢰 경로 목록은 본 카드에서는 `/todos`만 포함하며, 후속 보호 화면을 추가하는 카드에서 함께 갱신한다.

- 결정일: 2026-05-30
  결정: 로그인 인증 실패 안내를 `docs/standards/front-end-ui.md` 의 "Form-level 서버 오류 Alert" 표준에 맞춰 `AlertCircle` 아이콘 + `AlertTitle "로그인 정보를 확인해 주세요"` + `AlertDescription` 구조로 갱신하고, 본문에 `/signup` 화면 진입 링크를 둔다.
  이유: 기존 단일 `AlertDescription` 평서문은 시각 위계가 약하고 다음 행동 안내가 없다. REQ-013 회귀 적용과 함께 새 표준이 도입돼 모든 form-level 서버 오류 Alert 구조를 통일한다. 인증 실패 본문은 어느 쪽 자격 증명이 잘못됐는지 노출하지 않는다는 본 카드 결정 #5 (user enumeration 보호)를 그대로 따른다.
  결정자: Tech Lead
  영향: `LoginPage.tsx` formError Alert 가 새 구조로 변경된다. AC "폼 상단에 어느 쪽이 잘못됐는지 구분하지 않는 공통 안내가 보이고, 입력했던 이메일은 그대로 유지되며 비밀번호 입력은 비워진다" 의도는 그대로 유지(`AlertTitle` + `AlertDescription` 본문이 모두 양쪽 자격 증명 가능성을 동등하게 다룸). 기존 Playwright spec (`auth-login-form.spec.ts`) 의 `getByText("이메일 또는 비밀번호가 올바르지 않습니다.")` 검증은 본문 substring 매치로 계속 PASS 하며, 새 `AlertTitle`/`/signup` 링크에 대한 명시 검증 추가는 본 카드의 후속 작업(REQ-001 FE 후속 카드와 함께 정리)으로 둔다.

- 결정일: 2026-05-30
  결정: `/signup` placeholder 책임을 REQ-013(이메일 회원 가입 화면)으로 이관한다. 본 카드의 `/signup` placeholder 수용 기준("`/signup` 경로에 접근하면 가입 화면이 아직 준비 중이라는 안내가 표시된다"), 해당 시나리오, Playwright placeholder 테스트, `SignupPlaceholderPage`/그 story 를 제거한다. 함께, REQ-013 가입 성공 흐름을 위해 `LoginPage` 에 `signupCompleted` 쿼리 감지 진입점을 추가한다.
  이유: REQ-013 이 `/signup` 을 실제 회원 가입 화면으로 구현하면서, placeholder 기대가 그대로 남으면 새 화면 테스트와 REQ-011 placeholder 테스트가 같은 route 에 대해 상충한다. REQ-013 의사결정 로그(2026-05-27 "REQ-011 placeholder 기대 이관")가 이 정리를 본 카드 구현 단계 또는 REQ-013 구현 단계에서 수행하도록 예고했고, REQ-013 구현 단계에서 함께 정리한다.
  결정자: Tech Lead
  영향: 본 카드의 (FE) 수용 기준이 23개 → 22개로 줄어 BE 20 + FE 22 + FS 3 = 45개가 된다(시나리오 37개). 로그인 카드의 `/signup` 진입 링크는 그대로 유지되며 이제 실제 회원 가입 화면으로 이동한다. `LoginPage` 의 `signupCompleted` 안내 표시는 본 카드 파일에 구현되지만, 그 동작("`/login`으로 이동하면 가입이 완료되었다는 안내가 보인다")은 REQ-013 의 수용 기준이며 REQ-013 의 성공 흐름 Playwright 테스트가 커버한다. 본 카드는 새 AC 를 추가하지 않는다. 이관 후에도 본 카드의 나머지 45개 AC 는 모두 커버되어 BLUE 를 유지한다.

## BDD 테스트 리뷰

시나리오 문서: [`docs/scenarios/REQ-011-login-logout.feature`](../scenarios/REQ-011-login-logout.feature) (37개 Scenario로 BE 20 + FE 22 + FS 3 = 45개 AC 모두 `Covers:` 매핑). `/signup` placeholder AC/시나리오/테스트는 2026-05-30 결정으로 REQ-013 에 이관해 제거했다.

### 요건 Skeleton 승인 이력

- 2026-05-27 BE Skeleton 승인 (REDSTONE).
  - 범위: 시나리오 문서, 인증 인프라(`AuthCookieProperties`/`CookieFirstBearerTokenResolver`/`PasswordEncoder` Bean 승격), `AuthController`(login/logout/me) + DTO + `AuthService` 시그니처(UnsupportedOperationException), `OpenApiSecurityConfig` cookieAuth 등록 + per-path SecurityRequirement, `ApiExceptionHandler`에 `InvalidCredentialsException → 401 INVALID_CREDENTIALS` 매핑, profile 분기(`application-{local,test,prod}.yml`)로 Cookie Secure 통제, `JwtProperties`에 `accessTokenTtlSeconds` 추가.
  - 표준 게이트 보완: `AuthService` 공개 메서드 3개에 `@Transactional`/`@Transactional(readOnly = true)` 부여. 하네스 BE-C3 list 휴리스틱을 `/me`·`/current`·`/self` singleton fetch 예외로 확장(`tools/harness/validate-back-end-standards.mjs`).
  - 결정 로그 정합: 결정 #6 로그아웃 응답 코드 `200 → 204 No Content`로 수정해 시나리오·컨트롤러와 정렬.
  - 검증: `./gradlew compileJava compileTestJava` PASS, `validateRequirementCard -Preq=REQ-011`에서 BE-STD/FE-STD/SCN/CARD/TRM finding 0건, RED는 Skeleton 의도대로 유지(`TRACE red=1`). `npm run harness:test` 12/12 PASS.
  - 후속: FE Skeleton(라우터 도입, /login·/signup·/todos placeholder, AuthProvider/가드 시그니처, vite dev proxy, API client `credentials: 'include'`) 진행.

- 2026-05-27 FE Skeleton 작성 (승인 대기).
  - 라우팅: `react-router-dom@^7.15.1` 도입, `src/app/AppRouter.tsx`에 BrowserRouter + 4개 route 정의 — `/`(REQ-005 그대로), `/login`(공개, RedirectIfAuthenticated 가드), `/signup`(공개 placeholder), `/todos`(보호, RequireAuth 가드). `main.tsx`가 `AppRouter`를 마운트.
  - 인증 상태: `src/features/auth/`에 `AuthContext.ts`, `AuthProvider.tsx`(상태 `checking`, login/logout/refresh 시그니처 모두 `throw new Error("REQ-011 GREEN 단계에서 ... 구현한다.")`), `useAuth.ts` hook, `hooks/useCurrentUser.ts`, `types.ts`(`AuthenticatedUser`, `LoginInput`, `AuthState`), `loginRedirect.ts`(`TRUSTED_LOGIN_REDIRECTS = ["/todos"]`, `DEFAULT_LOGIN_REDIRECT = "/todos"`, `resolveLoginRedirect` 시그니처만).
  - 라우트 가드: `components/RequireAuth.tsx`, `components/RedirectIfAuthenticated.tsx` 시그니처만 (실제 navigate/스켈레톤 표시는 GREEN).
  - Page placeholder: `features/auth/pages/LoginPage.tsx`, `features/signup/pages/SignupPlaceholderPage.tsx`, `features/todos/pages/TodosPlaceholderPage.tsx`, 보호 헤더 `components/ProtectedHeader.tsx`. 모두 본문은 안내 문구만, harness 메타데이터는 별도 `*.harness.ts`(기존 컨벤션 일치).
  - API client: `src/api/client.ts`에서 openapi-fetch에 `credentials: "include"` 강제하는 fetch wrapper를 주입(HttpOnly Cookie 자동 전달). 생성 파일 `src/api/generated/`는 손대지 않음.
  - Dev proxy: `vite.config.ts`에 `/auth /users /todos /categories /v3/api-docs /swagger-ui` → `http://127.0.0.1:8080` (env `VITE_BACKEND_ORIGIN` override 가능). 같은 origin 정책으로 SameSite=Strict Cookie 보전.
  - Storybook 상태 목록 초안(승인 후 별도 Story 파일로 구현): LoginPage(empty/email-invalid/server-error/loading), ProtectedHeader(default/menu-open/logout-error-alert), TodosPlaceholderPage(authenticated/skeleton-loading), SignupPlaceholderPage(default).
  - 금지 항목 회피: `Covers`가 붙은 FE BDD 테스트, 실제 폼/DOM 구조, CSS selector, visual snapshot baseline, 실제 Story 구현, 라우트 가드의 실제 navigate 동작은 모두 보류.
  - 검증: `cd front-end && npm run typecheck && npm run lint && npm run test && npm run source-index` PASS (lint 0건, vitest 1/1, FE source-index = 4 route / 6 story / 3 BDD test). 백엔드 측 `./gradlew generateFrontEndSourceIndex traceRequirementCard -Preq=REQ-011` `gate: pass`, BE-STD/FE-STD/SCN/CARD/TRM 모두 finding 0건. REQ-011은 의도된 RED 유지(46개 AC 모두 MISSING — 구현 단계에서 채워질 영역).

### 테스트 리뷰

- 2026-05-27 GREEN 구현 + BLUE 전환 (승인 대기).
  - BE GREEN: `JwtAccessTokenIssuer` HS256 발급, `AuthService.login/buildLogoutCookie/loadCurrentUser` 실구현(이메일 정규화 위해 `LoginRequest` compact constructor 에서 trim), `Cookie` 헬퍼는 `AuthCookieProperties` 의 path/sameSite/secure/maxAge 와 HttpOnly 를 일관 적용.
  - BE Acceptance Test 7개 파일 작성: `AuthLoginAcceptanceTest`(BE-1..5 + BE-8/9 + FS-1·FS-2 BE 측), `AuthCookieProdProfileAcceptanceTest`(BE-6), `AuthCookieLocalTestProfileAcceptanceTest`(BE-7), `AuthProtectedApiAcceptanceTest`(BE-10..13), `AuthLogoutAcceptanceTest`(BE-14·15 + FS-3 BE 측), `AuthMeAcceptanceTest`(BE-16·17), `AuthOpenApiAcceptanceTest`(BE-18..20). 모든 메서드 `@Covers` 는 카드 AC 텍스트와 정확 일치.
  - FE GREEN: `AuthProvider` 가 부팅 시 `/auth/me` 로 상태 결정 + login/logout/refresh mutation, `RequireAuth` 가 checking 단계 스켈레톤·unauthenticated 시 `loginRedirect` query 와 함께 `/login` redirect, `RedirectIfAuthenticated` 가 인증 시 `/todos` redirect. `resolveLoginRedirect` 가 화이트리스트 `["/todos"]` 정확 일치 + 길이 200 초과/외부 URL/protocol-relative/인코딩 우회값 모두 fallback. LoginPage 폼(이메일·비밀번호·자동 포커스·password 토글·키보드 조작·`aria-pressed`·클라이언트 검증·Enter 제출·대기 중 disabled·중복 제출 차단·실패 시 공통 안내+비밀번호 비움), `ProtectedHeader`(shadcn DropdownMenu + 사용자 메뉴 로그아웃 + 실패 시 dismiss 가능 알림), `TodosPlaceholderPage`/`SignupPlaceholderPage` placeholder 본문.
  - 추가 UI primitives: `components/ui/{input,label,card,alert,dropdown-menu}.tsx`(shadcn 컨벤션 준수, 현재는 Base UI variant인 `@base-ui/react` 기반).
  - Vite proxy 수정: `/todos` 처럼 FE 페이지 경로와 BE API 경로가 충돌하는 prefix 는 `bypass(req)` 에서 HTML 네비게이션을 감지해 `/index.html` 로 fallback. XHR/fetch 만 BE 로 proxy.
  - FE Playwright BDD spec 3개 파일: `auth-login-form.spec.ts`(폼 7개 test), `auth-redirect.spec.ts`(redirect 5개), `auth-protected-surfaces.spec.ts`(헤더/로그아웃/placeholder 6개). 헬퍼 `_helpers/auth-mocks.ts` 가 `/auth/me`·`/auth/login`·`/auth/logout` 을 page.route 로 모킹.
  - 검증: `./gradlew test` PASS(23 BE Acceptance Test 모두 PASS), `npm run e2e` 22/22 PASS, `npm run validate` PASS, `npm run validate`(루트 통합 게이트) `gate: exit=0 / red=0 / green=1 / blue=11`. REQ-011 카드 status `초안 → 승인` 전환 후 통합 게이트 BLUE 전환 확인 예정.
  - 보완 메모: BE `AuthService.login` 의 이메일 정규화가 DTO compact constructor 의 trim 에 의존한다. 차후 카드 결정 로그(`이메일 정규화 책임 경로`) 에 명시할 가치 있음. 본 카드 범위에서는 결정 #(이메일 정규화) 내용에 부합한다고 본다.

- 리뷰일: 2026-05-27
  리뷰자: Product Owner, Tech Lead
  확인: BE 20 + FE 23 + FS 3 = 46개 수용 기준이 모두 `@Covers`(BE) 또는 Playwright `testInfo.annotations Covers`(FE) 와 `.feature` `Covers:` 블록에 정확 일치로 매핑되었고, `traceRequirementCard -Preq=REQ-011`/`validateRequirementCard -Preq=REQ-011`/`npm run validate` 모두 PASS. BE Acceptance Test 23/23, Playwright BDD 22/22, 게이트 `red=0 green=0 blue=12`. 카드/표준/시나리오/용어 finding 0건. open redirect 화이트리스트, profile 분기 Cookie Secure, Cookie/Bearer 우선순위, FS 3개의 BE+FE 양방향 커버까지 확인했다.
  결과: 승인

## 열린 질문

- 없음
