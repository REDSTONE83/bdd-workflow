# 요건 카드

요건 ID: REQ-007
제목: OpenAPI 기반 FE API 클라이언트 생성
우선순위: 중간
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: compatibility
검증 수준: static
관련 요건: REQ-006, REQ-008
대체 요건: 없음

## 사용자/목적

프런트엔드 개발자는 백엔드 OpenAPI 계약을 다시 정의하지 않고, 한 명령으로 타입이 맞는 API client를 생성해 사용할 수 있어야 한다. 백엔드 계약이 바뀌었는데 FE 생성 client가 갱신되지 않은 상태는 하네스가 자동으로 감지해야 한다.

## 범위

- Spring Boot가 생성한 OpenAPI 계약을 FE API client 생성의 입력으로 사용한다.
- FE API client 생성 명령을 `app/front-end/package.json`에 표준 script로 둔다.
- 생성 결과는 `app/front-end/src/api/generated/` 경계 안에 둔다.
- 생성 시 `app/front-end/src/api/generated/.openapi-source.sha256` 메타파일을 현재 OpenAPI 계약 기준으로 갱신한다.
- 생성 client 갱신 여부를 기존 FE-API 검사 룰과 연결한다.

## 표준 용어

- openapi.contract
- api.client

## 제외 범위

- 실제 업무 화면 또는 도메인 API 모듈 구현
- 백엔드 API 계약 자체 변경
- FE-API 검사 룰의 warning/error severity 승격
- 화면 컴포넌트의 직접 HTTP 호출 금지 룰 추가
- Mock 서버 운영 또는 외부 OpenAPI publish

## 수용 기준

- (STATIC) 프런트엔드 개발자는 한 명령으로 현재 OpenAPI 계약 기준의 API client를 생성할 수 있다
- (STATIC) 생성된 API client는 `app/front-end/src/api/generated` 아래에만 기록된다
- (STATIC) API client를 생성하면 현재 OpenAPI 계약을 가리키는 메타파일이 함께 갱신된다
- (STATIC) OpenAPI 계약이 바뀐 뒤 API client를 다시 생성하지 않으면 검사 결과에 오래된 client로 보고된다
- (STATIC) 프런트엔드 전체 검증 명령은 API client 생성 결과와 계약 검사를 함께 확인한다

## 의사결정 로그

- 결정일: 2026-05-23
  결정: FE API client 생성 표준화는 REQ-006의 후속 요건으로 분리한다.
  이유: REQ-006은 OpenAPI 계약 산출물과 검사 룰의 기준을 고정했고, 생성 도구 선택과 FE script 구성은 별도 변경 단위다.
  결정자: 사용자
  영향: 이 요건은 OpenAPI 계약을 새로 정의하지 않고, `build/app/indexes/openapi.index.json`과 그 `sha256`을 FE 생성 파이프라인의 기준으로 사용한다.

- 결정일: 2026-05-23
  결정: 이 요건은 FE 화면이 아니라 도구 파이프라인 요건으로 추적한다.
  이유: 생성 client와 메타파일은 사용자-facing 화면/route/story가 아니며, 화면 표면 연결을 요구하면 추적 의미가 어긋난다.
  결정자: Tech Lead
  영향: `대상 시스템: harness`로 두고, Acceptance Test 또는 FE BDD 테스트가 수용 기준을 커버하면 GREEN 판정이 가능하다.

- 결정일: 2026-05-23
  결정: FE API client 생성 도구는 `openapi-typescript`와 `openapi-fetch` 조합으로 시작한다.
  이유: 생성물이 작고 `src/api` 경계를 직접 통제하기 쉽다. 타입 생성과 HTTP client 책임이 분리되어 도메인 API 모듈을 후속 요건에서 얇게 붙일 수 있다.
  결정자: 사용자
  영향: `app/front-end/package.json`에는 API 생성 script를 두고, 생성 타입과 얇은 client wrapper는 `app/front-end/src/api/generated/` 아래에 둔다. 도메인별 API 함수와 화면 연동은 후속 업무 요건에서 작성한다.

- 결정일: 2026-05-23
  결정: 생성 입력은 `build/app/indexes/openapi.index.json`의 `rawOpenApi`를 사용하고, 메타파일은 같은 인덱스의 `sha256` 값을 기록한다.
  이유: REQ-006에서 OpenAPI 계약 인덱스 위치와 canonical `sha256` 기준을 이미 고정했다. FE 생성 파이프라인이 같은 기준을 쓰면 생성물과 하네스 검사의 drift 판단이 일치한다.
  결정자: 사용자
  영향: 생성 script는 순수 OpenAPI 파일을 사람이 따로 관리하지 않는다. 도구가 인덱스에서 `rawOpenApi`를 임시 입력으로 추출해 `openapi-typescript`에 전달하고, 성공 후 `.openapi-source.sha256`을 갱신한다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-007-fe-api-client-generation.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-23
  검증 설계: `.feature`의 5개 Scenario가 카드 수용 기준 5개를 1:1로 `Covers:`로 연결. `validate-cross-artifact`에서 TRC-COV-* 0건.
  API Skeleton: 해당 없음.
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음. 도구 파이프라인은 `app/front-end/tools/generate-api-client.mjs`로 구현. `build/app/indexes/openapi.index.json`의 `rawOpenApi`를 `openapi-typescript` 입력으로 쓰고, 생성 타입은 `schema.d.ts`로 두며, canonical `sha256`을 `.openapi-source.sha256`에 기록한다.
  화면/라우팅 Skeleton: 해당 없음.
  검증: `cd app/front-end && npm run api:generate`, `cd app/front-end && npm run api:check`, `cd app/front-end && npm run typecheck`, `cd app/front-end && npm run lint`, `cd app/back-end && ./gradlew compileTestJava`, `npm run harness:self-test`, `npm run harness:validate` 통과. 카드 구조 위반 0건, scenario index issue 0건, terminology finding 0건. 실행 테스트 5개가 수용 기준을 커버해 REQ-007은 GREEN.
  승인자: 사용자
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-23
  리뷰자: 사용자
  확인: `harness/self-test/tests/front-end-api-client-generation.test.ts`의 5개 `harnessTest({ requirement, covers })`가 카드 수용 기준 5개를 1:1로 검증한다. AC1/AC2/AC3은 fixture front-end root에 대한 `api:generate` 결과와 `app/front-end/src/api/generated` 경계, `schema.d.ts` 타입 산출물, OpenAPI sha256 메타파일을 확인한다. AC4는 stale 메타파일 fixture로 `FE-API-CLIENT-STALE` finding 발생을 확인한다. AC5는 `api:check`와 `validate`/`validate:full` script 배선을 확인한다. `npm run harness:self-test` 통과, `npm run harness:validate` 결과 RED 0 유지.
  결과: 승인

## 열린 질문

- 없음
