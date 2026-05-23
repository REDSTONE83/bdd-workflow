# Front-end API 연동 표준

프런트엔드는 백엔드 Spring Boot API 계약을 소비한다. API source of truth는 백엔드 컨트롤러/DTO/OpenAPI 애너테이션이 들어 있는 API 코드이며, 프런트엔드는 그 계약을 재정의하지 않는다. 가능하면 Spring Boot가 제공하는 OpenAPI JSON(`/v3/api-docs`)을 참조 산출물로 사용한다.

## 원칙

- 백엔드 API 계약은 `back-end`의 Spring Boot 컨트롤러/DTO/API 애너테이션 코드를 기준으로 한다.
- 프런트엔드 API 타입은 Spring Boot가 제공하는 OpenAPI JSON에서 생성한다.
- 사람이 관리하는 별도 OpenAPI yaml/json을 프런트엔드 계약 source of truth로 두지 않는다.
- 화면 컴포넌트는 `fetch`나 HTTP client를 직접 호출하지 않는다.
- 인증 토큰, 오류 매핑, 응답 정규화는 `src/api/` 또는 전역 client 경계에서 처리한다.
- DTO 필드명, HTTP 상태 코드, 오류 코드는 `.feature` Given/When/Then에 쓰지 않는다. 시나리오 본문은 사용자 관찰 언어로 유지한다.

## 표준 구조

```text
src/api/
  client.ts
  generated/
  errors.ts
  auth.ts
  todo.ts
```

### `client.ts`

공통 HTTP client를 둔다.

- `baseUrl`은 환경 변수로 주입한다.
- 모든 요청은 같은 client 경계를 통과한다.
- JSON 직렬화/역직렬화, 인증 헤더, 공통 오류 변환을 처리한다.
- 화면 컴포넌트가 직접 `window.fetch`를 호출하지 않는다.

### `generated/`

Spring Boot OpenAPI JSON 기반 생성 타입과 클라이언트를 둔다.

- 사람이 직접 수정하지 않는다.
- 생성 명령은 `npm run api:generate`, 검증 명령은 `npm run api:check`로 고정한다.
- 입력은 백엔드 빌드가 생성한 `build/harness/indexes/openapi.index.json`의 `rawOpenApi`를 사용한다.
- 생성 시 같은 인덱스의 canonical `sha256` 값을 `src/api/generated/.openapi-source.sha256`에 기록한다.
- `.openapi-source.sha256`이 없거나 현재 `openapi.index.json`의 `sha256`과 다르면 FE API 계약 drift로 본다.
- 생성 타입이 아직 없으면 임시 타입을 쓸 수 있지만, 해당 요건 카드의 Skeleton 승인 이력에 전환 필요성을 남긴다.

### 도메인 API 모듈

도메인별 API 호출 함수를 둔다.

```text
src/api/todo.ts
```

- 함수명은 사용자 행위나 유스케이스를 표현한다.
- DTO shape를 화면 컴포넌트에 흘리지 않고 필요한 view model로 변환한다.
- 빈 값, 날짜, 페이지네이션 기본값은 백엔드 계약과 충돌하지 않게 한 곳에서 처리한다.

## 인증

인증 방식은 [`auth.md`](./auth.md)의 JWT Bearer 정책을 따른다.

- 토큰은 `Authorization: Bearer <token>`으로 전송한다.
- 사용자 ID를 query, body, path, 임의 헤더로 보내지 않는다.
- 로그인 자체가 검증 대상이 아니면 BDD 시나리오에는 `로그인한 사용자` 상태만 둔다.
- 보호 라우트, 로그인 화면, 토큰 발급/만료 UX는 별도 인증 요건에서 다룬다.

## 오류 처리

백엔드 오류 응답은 전역 client에서 표준 UI 오류 모델로 변환한다.

```text
ApiError(code, message, field)
  -> FieldError | FormError | ToastError | NotFoundState
```

- 필드 검증 오류는 해당 입력과 연결한다.
- 사용자 조치가 필요한 전역 오류는 form alert 또는 toast로 노출한다.
- `404` 타인 자원/부재 정책처럼 보안 의미가 있는 오류는 사용자에게 과도한 정보를 주지 않는다.
- 원시 오류 코드 문자열을 화면 문구로 그대로 노출하지 않는다. 단, 운영자/외부 개발자가 직접 의존하는 코드라면 요건 AC에 명시된 경우에만 허용한다.

## 페이지네이션 / 정렬 / 필터

목록 화면은 백엔드의 페이징 표준과 맞춘다.

- `page`, `size`, `totalElements`, `totalPages`에 해당하는 정보를 사용자가 알 수 있어야 하는 경우, 카드 AC와 `.feature` 시나리오에 사용자 관찰 언어로 표현한다.
- URL query state와 화면 state를 분리하지 않는다. 딥링크가 필요한 목록은 query string을 source of truth로 둔다.
- 정렬/필터/페이지 크기 변경은 현재 요건 범위에 포함될 때만 고정한다.

## 날짜 / 시간 / ID

- API에서 받은 시각은 UTC `Instant`로 보고 화면에서 지역 표시 정책에 맞게 포맷한다.
- 날짜 전용 값은 `LocalDate` 의미를 유지한다.
- UUID는 화면에서 생성하지 않는다. 클라이언트 임시 ID가 필요하면 `clientId`처럼 API ID와 다른 이름을 쓴다.

## 테스트 기준

### TDD / Component Test

- API 호출은 MSW 또는 주입 가능한 fake client로 대체한다.
- 오류 응답, 로딩, 빈 목록, 성공 상태를 빠르게 검증한다.
- `@Covers` 없는 테스트는 보조 테스트로 보고 AC 커버리지에는 포함하지 않는다.

### BDD / E2E Test

- 승인된 `.feature`의 Given/When/Then을 실제 화면 행위로 옮긴다.
- 네트워크 mock을 쓸 때도 Spring Boot OpenAPI JSON과 같은 shape를 사용한다.
- full-stack 검증이 필요한 요건은 실제 백엔드 또는 계약 검증된 테스트 서버를 사용한다.

## 금지 사항

- 화면 컴포넌트에서 직접 `fetch` 호출
- 백엔드 DTO 타입을 손으로 장기 유지
- API 오류 코드를 사용자 문구로 그대로 노출
- `.feature` 시나리오에 JSON key, HTTP method/status, CSS selector를 고정
- 인증된 사용자 식별자를 API 요청 body/query/path로 전달

## 자동 검증 항목

- `npm run typecheck`: 생성 타입과 화면 코드 타입 정합성 확인.
- `npm run api:check`: 생성 API client와 현재 OpenAPI 계약의 일치 여부 확인.
- `npm run test`: API 상태별 UI 렌더링 단위 검증.
- `npm run e2e`: 주요 사용자 흐름의 API 연동 화면 검증.
- `validateHarness`: FE-API-* finding을 trace/gate에 반영한다. 다음 finding은 `severity: error`라서 게이트를 차단한다.
  - `FE-API-CONTRACT-MISSING`: OpenAPI 계약 산출물이 없음.
  - `FE-API-UNKNOWN-OPERATION`: `src/api/**` 호출의 method + path가 OpenAPI 계약에 없음.
  - `FE-API-CLIENT-NO-METADATA`: generated client의 OpenAPI SHA-256 메타파일이 없음.
  - `FE-API-CLIENT-STALE`: generated client 메타파일이 현재 OpenAPI 계약 SHA-256과 다름.
  - `FE-API-DIRECT-FETCH`: `src/api/**` 밖 애플리케이션 소스가 직접 `fetch`를 호출함.

## 수동 리뷰 항목

- 백엔드 API 계약과 FE view model 변환이 분리되어 있는가
- 오류/빈 상태/로딩 상태가 사용자 관찰 결과로 드러나는가
- 목록 화면의 URL state와 페이지네이션 정책이 요건 AC와 맞는가
