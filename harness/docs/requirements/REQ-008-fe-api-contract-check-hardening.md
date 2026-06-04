# 요건 카드

요건 ID: REQ-008
제목: FE API 계약 오류 검사
우선순위: 중간
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: compatibility
검증 수준: static
관련 요건: REQ-006, REQ-007
대체 요건: 없음

## 사용자/목적

프런트엔드 개발자는 백엔드 OpenAPI 계약과 다른 API 호출, 오래되었거나 출처를 알 수 없는 생성 client, API 경계를 우회하는 직접 HTTP 호출을 빌드 단계에서 즉시 확인할 수 있어야 한다. FE API 계약 drift는 경고로만 남지 않고 `npm run app:validate`에서 차단되어야 한다.

## 범위

- `FE-API-CONTRACT-MISSING`, `FE-API-UNKNOWN-OPERATION`, `FE-API-CLIENT-STALE` severity를 `error`로 승격한다.
- 생성 client의 OpenAPI SHA-256 메타파일이 없으면 `FE-API-CLIENT-NO-METADATA` finding으로 보고한다.
- `app/front-end/src/api/**` 밖의 애플리케이션 소스에서 직접 `fetch`를 호출하면 `FE-API-DIRECT-FETCH` finding으로 보고한다.
- FE-API error finding은 기존 Layer 4 게이트 정책에 따라 `npm run app:validate`를 차단한다.

## 표준 용어

- openapi.contract
- api.client

## 제외 범위

- API client 생성 도구 변경
- OpenAPI 계약 생성 방식 변경
- 업무 화면의 API 연동 구현 또는 migration
- 테스트 코드와 도구 스크립트의 네트워크 호출 금지

## 수용 기준

- (STATIC) OpenAPI 계약 산출물이 없으면 FE API 계약 검사 결과가 오류로 보고된다
- (STATIC) 프런트엔드 API 모듈이 OpenAPI 계약에 없는 method와 path를 호출하면 검사 결과가 오류로 보고된다
- (STATIC) 생성된 API client의 OpenAPI 메타파일이 없으면 검사 결과가 오류로 보고된다
- (STATIC) 생성된 API client가 현재 OpenAPI 계약보다 오래되면 검사 결과가 오류로 보고된다
- (STATIC) 애플리케이션 소스가 `app/front-end/src/api` 밖에서 직접 `fetch`를 호출하면 검사 결과가 오류로 보고된다

## 의사결정 로그

- 결정일: 2026-05-23
  결정: FE API 계약 drift 관련 finding은 warning에서 error로 승격한다.
  이유: REQ-006/REQ-007에서 OpenAPI 계약 산출물과 generated client 생성 기준이 고정되었으므로, drift를 경고로만 남기면 실제 계약 불일치를 놓칠 수 있다.
  결정자: 사용자
  영향: `FE-API-CONTRACT-MISSING`, `FE-API-UNKNOWN-OPERATION`, `FE-API-CLIENT-STALE`는 `severity: error`가 되며 `npm run app:validate`가 실패한다.

- 결정일: 2026-05-23
  결정: generated client 메타파일 부재는 `FE-API-CLIENT-NO-METADATA`로 분리한다.
  이유: stale client와 metadata 없음은 조치가 다르다. 메타파일이 없으면 어떤 OpenAPI 계약에서 생성되었는지 알 수 없으므로 drift 검사를 통과시키면 안 된다.
  결정자: 사용자
  영향: `app/front-end/src/api/generated/.openapi-source.sha256`이 없거나 읽히지 않으면 error finding을 낸다.

- 결정일: 2026-05-23
  결정: 직접 `fetch` 금지는 애플리케이션 소스(`app/front-end/src/**`)에 적용하고, 허용 경계는 `app/front-end/src/api/**`로 둔다.
  이유: 테스트 코드와 도구 스크립트는 계약 검사 대상 애플리케이션 경계가 아니며, 화면/컴포넌트 코드가 인증·오류·정규화 경계를 우회하는 것을 막는 것이 목적이다.
  결정자: 사용자
  영향: source index가 `app/front-end/src/**`를 스캔해 `src/api/**` 밖 `fetch`, `window.fetch`, `globalThis.fetch` 호출을 issue로 만들고 FE validator가 `FE-API-DIRECT-FETCH` error finding으로 정규화한다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-008-fe-api-contract-check-hardening.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-23
  검증 설계: `.feature`의 5개 Scenario가 카드 수용 기준 5개를 1:1로 `Covers:`로 연결한다.
  API Skeleton: 해당 없음.
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음. FE API 계약 검사는 Layer 1 source index와 Layer 2 validator 영역이다.
  화면/라우팅 Skeleton: 해당 없음.
  검사기 Skeleton: `app/front-end/tools/source-index.mjs`가 직접 `fetch` 경계 위반 issue를 만들고, `harness/tools/validate-front-end-standards.mjs`가 FE-API drift와 metadata finding을 error로 낸다.
  검증: `npm run harness:self-test`, `npm run harness:validate -- --require-blue --requirement REQ-008`, `npm run app:validate`, `node harness/tools/terminology.mjs validate --strict` 통과.
  승인자: 사용자
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-23
  리뷰자: 사용자
  확인: `harness/self-test/tests/front-end-api-contract-hardening.test.ts`의 5개 `harnessTest({ requirement, covers })`가 카드 수용 기준 5개를 1:1로 검증한다. 각 테스트는 fixture 인덱스 또는 source-index 실행 결과를 사용해 해당 FE-API finding이 `severity: error`로 보고되는지 확인한다.
  결과: 승인

## 열린 질문

- 없음
