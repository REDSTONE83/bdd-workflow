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

## 테스트

- Acceptance Test는 표준 헤더 유틸(`MockMvc` 인터셉터 등)로 인증 토큰을 자동 부여한다.
- 고정 UUID 리터럴을 테스트에 박지 않는다 ([`id-policy.md`](./id-policy.md)). 시드/픽스처에서 받은 ID를 그대로 사용한다.

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
