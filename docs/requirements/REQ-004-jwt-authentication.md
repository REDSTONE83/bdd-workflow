# 요건 카드

요건 ID: REQ-004
제목: JWT 기반 인증 전환
우선순위: 높음
상태: 승인

## 사용자/목적

API 호출자는 JWT Bearer 토큰으로 인증되어야 하며, 서버는 검증된 토큰의 사용자 식별자로 개인별 자원 접근 범위를 결정해야 한다.

## 범위

- 모든 보호 API 요청은 `Authorization: Bearer <token>` 헤더로 인증한다.
- 서버는 HS256 공유 비밀키로 JWT의 서명을 검증하고, 만료 시각, issuer, audience를 함께 검증한다.
- JWT header의 `alg`는 `HS256`이어야 하며, 다른 알고리즘으로 서명되었거나 `alg=none`인 토큰은 거절한다.
- issuer는 `bdd-workflow`, audience는 `bdd-workflow-api`를 기본값으로 사용한다.
- HS256 공유 비밀키는 `app.auth.jwt.secret` 설정 키로 받으며, 로컬/테스트 기본값은 32바이트 이상 문자열로 둔다.
- JWT 만료 시각 검증은 서버와 발급자 시계 차이를 고려해 60초 clock skew를 허용한다.
- JWT의 `iat` 클레임은 발급자가 포함하는 표준 클레임이지만, 본 카드의 보호 API 인증 성공/실패 조건으로 사용하지 않는다.
- JWT의 `sub` 클레임은 사용자 UUID이며, 서비스 계층에는 이 UUID만 행위자로 전달한다.
- 서버는 JWT 검증을 통과한 `sub`를 신뢰하며, 매 요청마다 사용자 테이블 존재 여부를 조회하지 않는다.
- 인증 정보가 없거나, 형식이 잘못되었거나, 토큰 검증에 실패하면 갱신 없이 401 `UNAUTHORIZED`로 응답한다.
- 모든 인증 실패 응답 본문은 기존 `ApiError` JSON 형식을 사용하며, 최상위 `code`는 `UNAUTHORIZED`이다.
- 기존 임시 사용자 헤더(`X-User-Id`, `X-Authenticated-User-Id`)만 전달된 요청은 `Authorization` 헤더가 없는 요청과 동일하게 401 `UNAUTHORIZED`로 거절한다.
- 본 카드는 REQ-002/REQ-003의 임시 사용자 헤더 기반 인증 정책을 JWT Bearer 인증 정책으로 대체한다.
- `POST /users/signup`, `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`은 인증 없이 호출할 수 있다.
- 공개 경로에 유효한 Bearer 토큰이 함께 전달되어도 요청은 허용된다.
- 공개 경로라도 잘못된 Bearer 토큰이 전달되면 401 `UNAUTHORIZED`로 응답한다.
- Todo와 Category API는 JWT Bearer 토큰이 있어야 호출할 수 있다.
- JWT 인증은 stateless 방식이며, 서버 세션을 생성하지 않고 CSRF 보호를 사용하지 않는다. 보호 API 응답에는 서버 세션 쿠키를 포함하지 않는다.
- Todo와 Category API는 `@AuthenticationPrincipal AuthenticatedUser`로 주입된 사용자 기준으로 본인 자원만 생성, 조회, 수정, 삭제한다.
- OpenAPI 문서에는 JWT Bearer SecurityScheme을 포함하고, 보호 API에 해당 보안 요구를 표시한다.
- Acceptance Test는 표준 테스트 유틸로 JWT Bearer 토큰을 부여한다.

## 표준 용어

- auth.jwtBearerToken
- auth.authorizationHeader
- auth.authenticatedUser
- user.id

## 제외 범위

- 로그인 API 또는 토큰 발급 API
- refresh token, 토큰 폐기, 세션 관리
- 역할/스코프 기반 권한 모델
- 사용자 정보 조회 API
- 사용자 계정 삭제, 비활성화, 잠금 상태에 따른 토큰 무효화

## 수용 기준

- 유효한 JWT Bearer 토큰이면 보호 API 요청이 인증된다
- 인증된 사용자의 식별자는 JWT sub 클레임의 UUID로 결정된다
- Authorization 헤더가 없으면 보호 API 요청이 거절된다
- Authorization 헤더가 Bearer 형식이 아니면 보호 API 요청이 거절된다
- JWT 형식이 잘못되면 보호 API 요청이 거절된다
- JWT 서명 검증에 실패하면 보호 API 요청이 거절된다
- HS256 외 알고리즘으로 서명된 JWT Bearer 토큰이면 보호 API 요청이 거절된다
- JWT exp가 현재 시각 기준 60초 이내 과거이면 보호 API 요청이 인증된다
- JWT exp가 현재 시각 기준 60초보다 더 오래전에 만료되었으면 보호 API 요청이 거절된다
- JWT issuer가 서버 설정과 다르면 보호 API 요청이 거절된다
- JWT audience가 서버 설정과 다르면 보호 API 요청이 거절된다
- JWT sub 클레임이 없거나 UUID 형식이 아니면 보호 API 요청이 거절된다
- 인증 실패 응답은 401 상태와 UNAUTHORIZED 오류 코드를 가진 ApiError 형식이다
- X-User-Id 또는 X-Authenticated-User-Id 헤더만 전달된 요청은 Authorization 헤더 없는 요청과 동일하게 거절된다
- 보호 API는 인증된 사용자의 자원만 생성, 조회, 수정, 삭제한다
- 회원 가입 API는 JWT Bearer 토큰 없이 호출할 수 있다
- OpenAPI 문서와 Swagger UI는 JWT Bearer 토큰 없이 조회할 수 있다
- 공개 경로에 유효한 JWT Bearer 토큰이 전달되어도 요청이 허용된다
- 공개 경로라도 잘못된 Bearer 토큰이 전달되면 요청이 거절된다
- 보호 API 응답에는 서버 세션 쿠키가 포함되지 않는다
- OpenAPI 문서에는 JWT Bearer SecurityScheme이 포함된다

## 의사결정 로그

- 결정일: 2026-05-22
  결정: JWT 인증 전환은 REQ-002/REQ-003에 끼워 넣지 않고 별도 요건 카드로 관리한다.
  이유: 두 카드가 정식 인증 방식을 제외 범위로 명시하고 있어, 인증 정책과 예외 응답을 독립적으로 검토해야 한다.
  결정자: Product Owner, Tech Lead
  영향: 본 카드는 REQ-002/REQ-003의 임시 사용자 헤더 기반 인증 정책을 대체한다. 기존 임시 사용자 헤더 기반 Acceptance Test는 JWT 테스트 유틸을 사용하도록 갱신한다.

- 결정일: 2026-05-22
  결정: 토큰 발급 API는 본 카드 범위에서 제외하고, 서버는 보호 API에서 전달받은 JWT만 검증한다.
  이유: `auth.md` 표준이 토큰 발급을 별도 인증 도메인의 책임으로 분리하고 있으며, 현재 목표는 API 행위자 식별 전환이다.
  결정자: Tech Lead
  영향: Acceptance Test는 발급 API를 호출하지 않고 테스트용 JWT를 생성해 요청 헤더에 넣는다.

- 결정일: 2026-05-22
  결정: JWT의 `sub` 클레임을 사용자 UUID로 사용하고, 도메인 서비스에는 토큰 객체가 아니라 `UUID actorId`만 전달한다.
  이유: 서비스 계층이 인증 기술에 의존하지 않게 하고, 기존 소유권 검증 쿼리 구조를 유지한다.
  결정자: Tech Lead
  영향: 컨트롤러는 인증 컨텍스트에서 사용자 식별자를 얻고, 서비스 메서드 시그니처는 기존 `UUID` 기반 행위자 인자를 유지한다.

- 결정일: 2026-05-22
  결정: JWT 서명 검증은 HS256 공유 비밀키 방식으로 시작한다.
  이유: 현재 하네스 예제에서는 로컬 개발과 Acceptance Test에서 토큰을 직접 생성해야 하므로, RS256/JWK Set보다 설정과 테스트 구성이 단순하다.
  결정자: Product Owner, Tech Lead
  영향: 애플리케이션은 설정값으로 받은 공유 비밀키를 사용해 JWT를 검증하고, 테스트 유틸은 같은 알고리즘으로 테스트용 토큰을 생성한다. `alg`가 `HS256`이 아닌 토큰은 거절한다.

- 결정일: 2026-05-22
  결정: JWT issuer 기본값은 `bdd-workflow`, audience 기본값은 `bdd-workflow-api`로 시작한다.
  이유: 현재 애플리케이션과 대상 API를 구분할 수 있는 안정적인 로컬 식별자가 필요하며, 운영 배포 식별자는 별도 환경 설정으로 바꿀 수 있다.
  결정자: Product Owner, Tech Lead
  영향: 토큰 검증 설정과 Acceptance Test의 테스트용 토큰 생성값은 같은 issuer/audience를 사용한다.

- 결정일: 2026-05-22
  결정: JWT의 `iat` 클레임은 표준 발급 클레임으로 두되, 본 카드의 보호 API 인증 성공/실패 조건으로 사용하지 않는다.
  이유: `auth.md`의 필수 검증 대상은 서명, 만료, issuer, audience이며, 발급 시각 신선도 정책은 토큰 발급 도메인의 책임으로 분리한다.
  결정자: Product Owner, Tech Lead
  영향: Acceptance Test는 `iat` 누락이나 미래 발급 시각을 본 카드의 인증 실패 케이스로 다루지 않는다.

- 결정일: 2026-05-22
  결정: `POST /users/signup`, `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`은 공개 경로로 두고, Todo/Category API는 보호 API로 둔다.
  이유: 회원 가입은 인증 전 진입점이고, OpenAPI 문서는 로컬 개발과 하네스 검토에서 인증 없이 접근할 수 있어야 한다.
  결정자: Product Owner, Tech Lead
  영향: Security 설정은 공개 경로를 `permitAll`로 두고, Todo/Category 컨트롤러 요청은 JWT 인증 컨텍스트를 요구한다.

- 결정일: 2026-05-22
  결정: 모든 인증 실패는 기존 `ApiError` JSON 형식으로 응답하고, HTTP 상태는 401, 최상위 `code`는 `UNAUTHORIZED`로 통일한다.
  이유: 기존 API 오류 계약과 `api-contract.md`의 인증 실패 매핑을 유지하면서 클라이언트 오류 처리를 단순하게 만든다.
  결정자: Product Owner, Tech Lead
  영향: Spring Security 인증 실패 핸들러는 기본 응답 대신 `ApiError` 본문을 작성하며, Acceptance Test는 상태 코드와 오류 코드를 함께 검증한다. 만료된 토큰은 서버가 갱신하지 않고 401로 응답한다.

- 결정일: 2026-05-22
  결정: 보호 API는 JWT 검증을 통과한 `sub`를 신뢰하고, 매 요청마다 사용자 테이블 존재 여부를 조회하지 않는다.
  이유: 토큰 발급을 외부 책임으로 분리했으므로 보호 API의 인증 책임은 서명과 표준 클레임 검증에 한정한다. 현재 자원 소유권도 `user_id` UUID 값으로 판단하므로 사용자 생명주기 정책은 별도 요건으로 다룬다.
  결정자: Product Owner, Tech Lead
  영향: JWT `sub`가 UUID 형식이면 `AuthenticatedUser`로 주입되며, 별도 `UserRepository.existsById(...)` 검사는 수행하지 않는다.

- 결정일: 2026-05-22
  결정: HS256 공유 비밀키는 `app.auth.jwt.secret` 설정 키로 받고, 로컬/테스트 기본값은 32바이트 이상 문자열로 `application.yml`에 둔다.
  이유: 설정 경로를 애플리케이션 네임스페이스 아래에 두면 Spring Security 기본 설정과 구분되고, 테스트용 토큰 생성 유틸도 같은 값을 참조할 수 있다.
  결정자: Product Owner, Tech Lead
  영향: JWT 검증 설정 클래스는 `app.auth.jwt.*` 설정을 바인딩하고, 테스트 설정은 동일 키로 테스트용 비밀키를 제공한다.

- 결정일: 2026-05-22
  결정: JWT 만료 시각 검증에는 60초 clock skew를 허용한다.
  이유: 발급자와 API 서버의 시계 차이로 인해 정상 토큰이 경계 시각에서 불안정하게 거절되는 상황을 줄인다.
  결정자: Product Owner, Tech Lead
  영향: JWT timestamp validator는 60초 허용 오차를 적용하고, 만료 토큰 Acceptance Test는 허용 오차보다 충분히 과거인 `exp`를 사용한다.

- 결정일: 2026-05-22
  결정: 공개 경로라도 잘못된 Bearer 토큰이 전달되면 401 `UNAUTHORIZED`로 거절한다.
  이유: 요청에 인증 정보를 포함한 경우에는 그 인증 정보가 유효해야 하며, 잘못된 토큰을 조용히 무시하면 클라이언트 설정 오류를 발견하기 어렵다.
  결정자: Product Owner, Tech Lead
  영향: Security 설정은 공개 경로를 허용하되, Bearer 토큰 해석 실패는 인증 실패 핸들러로 연결한다.

- 결정일: 2026-05-22
  결정: JWT 인증은 stateless 방식으로 두고, 서버 세션 생성과 CSRF 보호를 사용하지 않는다.
  이유: 보호 API는 브라우저 세션이 아니라 매 요청의 Bearer 토큰으로 인증되므로 서버 세션 상태를 유지하지 않는 편이 단순하고 일관적이다.
  결정자: Product Owner, Tech Lead
  영향: Spring Security 설정은 `SessionCreationPolicy.STATELESS`를 사용하고 CSRF를 비활성화한다. Acceptance Test는 보호 API 응답에 서버 세션 쿠키가 없는지 검증한다.

- 결정일: 2026-05-22
  결정: 컨트롤러의 사용자 주입은 기존 `@CurrentUser` placeholder를 제거하고 Spring Security 표준 `@AuthenticationPrincipal AuthenticatedUser`로 통일한다.
  이유: 행위자는 JWT 검증이 끝난 인증 컨텍스트에서 주입되어야 하며, 임시 헤더 기반 resolver를 유지하면 두 인증 경로가 공존할 위험이 있다.
  결정자: Product Owner, Tech Lead
  영향: Todo/Category 컨트롤러는 `@AuthenticationPrincipal`을 사용하고, `CurrentUserArgumentResolver`와 `WebMvcAuthConfig`는 제거한다.

- 결정일: 2026-05-22
  결정: OpenAPI 문서에는 JWT Bearer SecurityScheme을 포함하고 보호 API에 보안 요구를 표시한다.
  이유: Swagger UI에서 보호 API를 호출하려면 문서에 Bearer 인증 방식이 노출되어야 하며, API 계약에도 인증 요구가 표현되어야 한다.
  결정자: Product Owner, Tech Lead
  영향: Springdoc 설정은 Bearer JWT security scheme을 등록하고, Todo/Category API 문서에 해당 보안 요구를 연결한다.

- 결정일: 2026-05-22
  결정: 시나리오 3 이후는 시나리오별 사이클이 아니라 카드 전체 한 사이클로 Mock-up → 승인 → Test → 구현 → 검증을 진행한다.
  이유: 남은 시나리오 14개가 같은 인증 인프라(NimbusJwtDecoder validator, JwtAuthenticationConverter, EntryPoint) 위에서 토큰 변형/검증 조건만 바꾸는 구조라, 시나리오마다 Mock-up 사이클을 도는 오버헤드가 커진다. REQ-002/REQ-003 Acceptance Test 회복도 같은 묶음에서 처리해 BLUE 회귀를 한 번에 닫는다.
  결정자: Product Owner, Tech Lead
  영향: 진행 표준 `docs/harness/requirement-authoring.md` "시나리오 한 개씩" 원칙을 이 카드에 한해 한 묶음 처리로 대체한다. 시나리오 승인 이력에는 한 묶음 승인 한 줄로 기록한다.

## BDD 테스트 리뷰

- 리뷰일: 2026-05-22
  리뷰자: Product Owner, Tech Lead, QA
  확인: 21개 수용 기준이 모두 @Covers 로 연결되고 Acceptance Test 가 PASS 한다. 인증 인프라(SecurityConfig, JwtDecoder validator, AuthenticatedUserJwtConverter, JwtAuthenticationEntryPoint, OpenApiSecurityConfig) 가 REQ-004 책임으로 매핑되었고, 보호 컨트롤러는 REQ-002/REQ-003 과 REQ-004 다중 매핑이 부여되었다. REQ-002/REQ-003 Acceptance Test 는 JWT Bearer 헤더 기반으로 재작성되어 BLUE 회복되었다.
  결과: 승인

### 시나리오 승인 이력

- 시나리오: API 호출자가 유효한 JWT Bearer 토큰으로 보호 API에 접근한다 (Covers: AC #1, #2)
  승인일: 2026-05-22
  승인자: Product Owner, Tech Lead
  Mock-up: SecurityConfig 정책 골격(STATELESS + 공개 경로 permitAll + 나머지 denyAll), JwtProperties, AuthenticatedUser, OpenApiSecurityConfig, 컨트롤러 @AuthenticationPrincipal 시그니처. JwtDecoder/JwtAuthenticationConverter 본문과 oauth2ResourceServer 활성화는 구현 단계로 이월.
  영향: REQ-002/REQ-003 Acceptance Test 11개 클래스는 @Disabled로 명시적 skip, 구현 단계에서 JWT 헤더 기반으로 재작성한다.

- 시나리오: Authorization 헤더가 없으면 보호 API 요청이 401 UNAUTHORIZED ApiError 로 거절된다 (Covers: AC #3, #13)
  승인일: 2026-05-22
  승인자: Product Owner, Tech Lead
  Mock-up: JwtAuthenticationEntryPoint 클래스 시그니처(AuthenticationEntryPoint 구현, 본문 미구현). .feature 재정렬: AC #4(Bearer 형식 오류)는 별도 시나리오로 분리해 다음 사이클로 이월. 기존 line 97 응답 형식 단독 시나리오는 본 시나리오로 통합되어 삭제됨. 컨트롤러 @ApiResponses 의 401 응답 매핑은 시나리오 21(OpenAPI SecurityScheme) 사이클에서 일괄 정리.
  영향: 인증 실패 EntryPoint 가 ApiError 본문으로 고정되면 이후 부정 케이스 시나리오들은 같은 응답 계약을 공유한다.

- 시나리오: 남은 14개 시나리오 일괄 승인 (Covers: AC #4, #5, #6, #7, #8, #9, #10, #11, #12, #14, #15, #16, #17, #18, #19, #20, #21)
  승인일: 2026-05-22
  승인자: Product Owner, Tech Lead
  Mock-up: 보호 컨트롤러 클래스 레벨 @ApiResponses 에 401 ApiError 응답 매핑 추가. NimbusJwtDecoder 의 issuer/audience/clockSkew validator, AuthenticatedUserJwtConverter 의 sub UUID 형식 검증, REQ-002/REQ-003 Acceptance Test 의 JWT 헤더 회복은 본문 한 줄짜리 변경이라 Mock-up 분리 없이 구현 단계에서 일괄 처리. 시나리오 11(자원 격리, AC #15)은 REQ-002/REQ-003 회복 테스트 중 대표 케이스에 다중 @Covers 매핑으로 처리.
  영향: 진행 표준의 시나리오별 사이클 원칙을 한 묶음 처리로 대체했다 (위 의사결정 로그 참조). REQ-002/REQ-003 의 BLUE 회복도 같은 묶음에서 이루어진다.

## 열린 질문

- 없음
