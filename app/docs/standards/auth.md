# 인증 / 행위자 식별 표준

API는 모든 요청에 대해 행위자(요청을 보낸 사용자)를 식별한다. 식별이 안 되면 401, path variable로 지목한 타깃 리소스가 부재이거나 타인 소유면 404, 본문에서 참조한 다른 도메인 리소스가 부재이거나 타인 소유면 400 `INVALID_<FIELD>`로 응답한다 ([`api-contract.md`](./api-contract.md) HTTP 상태 매핑).

## 표준

- 인증 방식: **JWT Bearer 토큰**.
- 헤더: `Authorization: Bearer <token>`.
- 토큰 발급: 별도 인증 도메인의 로그인 엔드포인트가 발급. 본 저장소의 범위 외.
- 토큰 검증: Spring Security 필터에서 서명/만료/issuer/audience를 검증.
- 행위자 주입: 컨트롤러는 `@AuthenticationPrincipal` 또는 도메인 `Actor` 타입으로 받아 `UUID userId`로 변환.
- 만료/형식 오류: 401 `UNAUTHORIZED`. 토큰 자체가 없으면 동일하게 401.
- 권한 부족: 자기 자원 내 역할/스코프 권한 부족만 403. path 타깃의 타인 자원은 404, 본문 참조의 타인 자원은 400.

### JWT 클레임 표준

- `sub`: 사용자 UUID (행위자 ID).
- `iat`, `exp`: ISO-8601 UTC 기반 epoch second.
- `iss`: 발급자 식별자 (도메인별로 결정).
- 도메인 권한이 필요하면 `scope` 또는 `roles` 클레임을 명시.

토큰 본문에 PII(이메일 등)를 박지 않는다. 사용자 정보는 `sub` UUID로 조회한다.

## 컨트롤러 / 서비스에서의 사용

```java
@PostMapping("/todos")
public ResponseEntity<CreateTodoResponse> create(
    @AuthenticationPrincipal UUID actorId,
    @Valid @RequestBody CreateTodoRequest req
) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(todoService.create(actorId, req));
}
```

서비스는 항상 `UUID actorId`를 첫 인자로 받는다. 도메인 로직은 토큰을 직접 다루지 않는다.

## 시나리오에서의 표현

`.feature` 시나리오에서는 인증 흐름을 사용자 상태로만 표현한다.

- 로그인 자체가 검증 대상(로그인 화면, 토큰 발급, 보호 라우트로의 리다이렉트 등)이 아닐 때는 시나리오에 `로그인한 사용자가 ...` 같은 상태 한 줄로 둔다. `Authorization` 헤더, JWT 토큰 문자열, 401/403 응답 자체는 본문에 적지 않는다.
- 로그인 화면, 토큰 발급, 보호 라우트 검증은 별도 인증 요건의 시나리오에서 다룬다. 다른 요건의 시나리오에서는 그 결과로 만들어진 "로그인한 사용자" 상태만 빌려 쓴다.
- 인증 실패가 본 카드의 AC인 경우(예: 헤더 누락 시 401)에는 시나리오에 명시할 수 있으나, 표현은 사용자 관점(`로그인하지 않은 사용자가 ...을 열려고 한다`)으로 유지하고 상태 코드 같은 구현 어휘는 가능하면 시나리오 밖에서 검증한다.

## 테스트

- 인증이 검증 대상이 아닌 Acceptance Test는 `ApiRequestSupport.bearer(userId)`로 인증 토큰을 부여한다. 테스트마다 `Authorization: Bearer ...` 문자열과 `TestJwt.signFor(...)`를 직접 조합하지 않는다.
- JWT 검증, Cookie/Bearer 우선순위, 만료/서명/issuer/audience 오류처럼 인증 메커니즘 자체가 AC인 테스트에서는 `TestJwt`와 헤더/Cookie를 직접 다룰 수 있다.
- 고정 UUID 리터럴을 테스트에 박지 않는다 ([`id-policy.md`](./id-policy.md)). 시드/픽스처에서 받은 ID를 그대로 사용한다.
- 보호 route redirect, allowlist, fallback 같은 보안 분기는 최소 2개의 서로 다른 신뢰 값을 검증한다. 신뢰 목록이 2개 이상인데 테스트가 기본 진입점 하나만 통과시키면 "입력을 존중함"과 "항상 기본값으로 보냄"을 구분하지 못한다.
- 로그인 redirect 성공 분기는 기본 진입점이 아닌 보호 route를 포함한다. 거절 분기는 외부 URL, protocol-relative URL, 알려지지 않은 내부 경로를 포함한다.

## 금지 사항

- 쿼리 파라미터/요청 본문/쿠키로 사용자 ID를 받지 않는다. 헤더(또는 인증 컨텍스트) 외 경로로 행위자를 식별하면 위장 공격 표면이 늘어난다.
- 자기 자원 식별 우회를 위해 path variable로 `userId`를 받지 않는다. 행위자는 항상 인증 컨텍스트에서 결정한다.
- 403을 enumeration 방지 카브아웃 없이 사용하지 않는다 ([`api-contract.md`](./api-contract.md) HTTP 상태 매핑).

## 자동 검증 항목

- (예정) `validateAuth`: 컨트롤러 메서드 시그니처가 행위자를 인증 컨텍스트에서 받는지, path variable로 받지 않는지 검사.

## 수동 리뷰 항목

- 모든 컨트롤러가 인증 컨텍스트(`@AuthenticationPrincipal` 등)에서 행위자를 받는가
- 헤더 누락/형식 오류가 401/400으로 일관되게 응답되는가
- 토큰 본문에 불필요한 PII가 박혀 있지 않은가
- path 타깃 타인 자원은 404, 본문 참조 타인 자원은 400 `INVALID_<FIELD>`로 일관되게 응답되는가
