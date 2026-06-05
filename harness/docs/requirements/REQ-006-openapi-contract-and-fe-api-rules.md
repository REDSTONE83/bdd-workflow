# 요건 카드

요건 ID: REQ-006
제목: OpenAPI 기반 FE API 계약 검증
우선순위: 중간
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: compatibility
검증 수준: static
관련 요건: REQ-007, REQ-008
대체 요건: 없음

## 사용자/목적

백엔드 개발자는 Controller/DTO 코드를 단일 source of truth로 유지하면서, FE와 하네스가 검증할 수 있는 안정적인 계약 산출물(OpenAPI JSON)을 빌드 산출물로 얻는다. 프런트엔드 개발자는 OpenAPI JSON을 기준으로 API client를 생성하고 소비해, 백엔드 변경에 대한 drift를 자동 감지한다.

## 범위

- Spring Boot 빌드 단계에서 OpenAPI JSON 산출물을 생성한다.
- 산출물을 `build/harness/` 아래 정해진 위치에 둔다.
- 하네스가 OpenAPI 산출물을 소비해 FE API 룰 검증의 기준으로 사용한다.
- FE API 검사 룰(`FE-API-UNKNOWN-OPERATION`, `FE-API-CLIENT-STALE` 등)을 `validate-front-end-standards.mjs`에 추가한다.

## 표준 용어

- openapi.contract
- api.operation
- api.client

## 제외 범위

- FE 코드가 Java Controller/DTO를 직접 import 또는 참조 (이 REQ에서 금지)
- `backend.source-index.json`을 FE 계약 검사 기준으로 사용 (trace/REQ 연결 보조로만 사용)
- OpenAPI 산출물의 외부 publish, Mock 서버 운영, 다중 OpenAPI 도구 도입
- API client 코드 자체의 생성 도구 표준화 (이 REQ는 기준 계약과 검사 룰만 정의; 클라이언트 도구 선택은 별도 REQ)

## 수용 기준

- (STATIC) 백엔드 빌드 한 번에 OpenAPI 계약 JSON이 `build/app/indexes/openapi.index.json`에 생성된다
- (STATIC) OpenAPI 계약에는 현재 백엔드가 노출하는 모든 HTTP 엔드포인트의 method와 path가 포함된다
- (STATIC) 프런트엔드 API 모듈이 호출하는 method와 path가 OpenAPI 계약에 없으면 해당 호출이 검사 결과에 보고된다
- (STATIC) 프런트엔드 생성 클라이언트가 현재 OpenAPI 계약보다 오래되면 해당 클라이언트가 검사 결과에 보고된다
- (STATIC) OpenAPI 계약 산출물이 빌드 결과에 없으면 검사 결과에 별도로 보고된다

## 의사결정 로그

- 결정일: 2026-05-23
  결정: API 계약의 source of truth는 Spring Boot Controller/DTO 코드, FE와 하네스가 검증할 계약은 Spring Boot가 생성한 OpenAPI JSON으로 고정.
  이유: DTO 직렬화, Bean Validation, Jackson 설정, enum/nullability, error response, security scheme, content type 같은 실제 HTTP 계약을 안정적으로 복원하려면 OpenAPI 산출물이 필요. FE가 Java 소스를 직접 import하면 단기 속도는 빠르지만 장기 drift 위험이 크다.
  결정자: 사용자
  영향: `backend.source-index.json`은 하네스 추적용 보조 입력으로만 사용한다. FE 계약 검사 룰(FE-API-*)은 OpenAPI 산출물을 기준으로 한다. FE는 Java 소스를 직접 참조하지 않는다.

- 결정일: 2026-05-23
  결정: OpenAPI 산출물 누락 시 초기 severity는 warning, 표준 확정 후 error로 승격한다.
  이유: REQ-006 도입 직후에는 산출물 파이프라인이 모든 환경(CI / 로컬)에서 안정적이지 않을 수 있다. drift 검사가 잘못된 RED를 유발하지 않도록 점진 도입.
  결정자: 사용자
  영향: 초기 단계의 `FE-API-MISSING-CONTRACT`(또는 동등 룰)는 warning. 표준 확정 시 strictSeverity가 error로 승격되어 `--check` 게이트를 차단한다. 승격 시점은 별도 의사결정 로그로 남긴다.

- 결정일: 2026-05-23
  결정: OpenAPI 산출물은 Spring 통합 테스트(`@SpringBootTest` 또는 MockMvc 한 개)에서 springdoc 컨텍스트를 띄워 `/v3/api-docs` JSON을 build/harness로 dump해 생성한다.
  이유: 외부 서버 의존 없이 빌드 결정성 유지, 애플리케이션 테스트와 하네스 산출물 생성을 분리, Gradle 플러그인 추가 의존 없음.
  결정자: 사용자
  영향: 빌드 시 OpenAPI 생성 비용은 Spring 컨텍스트 기동 1회. dump 전용 단일 test 클래스(예: `OpenApiContractDumpTest`)를 두고 그 안에서 `mvc.perform(get("/v3/api-docs"))` 결과를 빌드 산출물로 기록한다. 산출물 갱신은 `generateOpenApiIndex` 태스크가 트리거하고, 하네스 테스트와 통합 게이트가 이를 의존한다.

- 결정일: 2026-05-23
  결정: OpenAPI 산출물 저장 위치는 `build/app/indexes/openapi.index.json`.
  이유: 계약 산출물을 Layer 1 인덱스로 분류해 `indexes/*` 데이터 계약 일관성 유지. Layer 2 검사기(FE-API-*)는 `indexes/` 한 곳만 참조하면 된다.
  결정자: 사용자
  영향: dump 테스트가 위 경로로 JSON을 쓰도록 구현. `data-contracts.md`의 `indexes/` 트리에 `openapi.index.json` 추가. 향후 indexer 도구가 필요해도 같은 위치를 유지한다.

- 결정일: 2026-05-23
  결정: `FE-API-UNKNOWN-OPERATION` 비교 단위는 HTTP method + path 정확 일치.
  이유: OpenAPI paths 객체의 자연 키와 일치. FE 코드에서 사용하는 호출 표현(method + URL)과 직접 매칭 가능. springdoc 기본 operationId 자동 생성 의존성을 피해 메서드 이름 리팩토링에도 안정.
  결정자: 사용자
  영향: 룰은 FE 코드에서 `(method, path)` 쌍을 추출해 OpenAPI 인덱스의 paths 트리와 정확 비교. path 정규화는 OpenAPI 표기(예: `/users/{id}`)와 FE 호출 표현(템플릿 리터럴 또는 path builder) 사이의 매핑 규칙을 별도 검토 필요.

- 결정일: 2026-05-23
  결정: FE API 호출 추출 범위는 `src/api/**` 모듈에 한정한다.
  이유: `front-end-api-contract.md`가 이미 "화면 컴포넌트는 fetch/HTTP client를 직접 호출하지 않는다. 인증 토큰, 오류 매핑, 응답 정규화는 src/api/ 또는 전역 client 경계에서 처리한다"고 못박았다. 같은 경계에서만 (method, path) 쌍을 추출하면 검사기 범위가 좁고 명확. 경계 위반(화면이 직접 fetch)은 별도 FE-API-* 룰이 잡는다.
  결정자: 사용자
  영향: FE-API-UNKNOWN-OPERATION은 `app/front-end/src/api/**`만 AST 스캔. 화면 컴포넌트의 직접 호출은 본 룰의 입력이 아니라 별도 경계 위반 룰의 입력. OpenAPI 생성 client(`src/api/generated/**`)도 같은 범위에 포함되지만 generated 산출물은 변경 감지(FE-API-CLIENT-STALE)로 별도 처리.

- 결정일: 2026-05-23
  결정: `FE-API-CLIENT-STALE`는 FE generated 디렉터리에 OpenAPI hash 메타파일을 두는 방식으로 판단한다.
  이유: 빌드 결정성 유지(mtime 의존 없음). git checkout/CI 재설정에 영향 받지 않음. 해시는 `indexes/openapi.index.json`의 SHA-256과 비교. 메타파일 한 개를 두는 최소 비용.
  결정자: 사용자
  영향: FE 생성 도구는 `app/front-end/src/api/generated/.openapi-source.sha256`(또는 동등 이름)에 base OpenAPI의 SHA-256을 기록한다. 검사기는 `indexes/openapi.index.json`의 현재 SHA와 비교해 다르면 finding. 메타파일이 없으면 별도 룰(`FE-API-CLIENT-NO-METADATA` 등)이 잡거나 초기 단계에서는 warning. 메타파일 이름·위치는 Skeleton에서 확정.

- 결정일: 2026-05-23
  결정: 표준 용어 후보(`openapi.contract`, `api.operation`, `api.client` 등)는 Skeleton 단계에서 `node harness/tools/terminology.mjs draft add ...`로 등록하고 카드의 `## 표준 용어` 절에 키를 적는다.
  이유: AC가 아직 확정되지 않은 상태에서 용어를 박으면 실제 본문에 안 쓰일 수 있다. AC 문장 작성과 동시에 어떤 용어가 관계자 언어로 정착하는지 확인 가능. draft 등록은 validateHarness(safe) 통과를 유지하면서 validateTerminologyStrict 시 강제 단계로 승격된다.
  결정자: 사용자
  영향: Skeleton 단계 진입 직전에 후보 키를 정하고 draft add. 카드의 `## 표준 용어`는 Skeleton 산출 시점에 채운다.

- 결정일: 2026-06-02
  결정: REQ-006은 새 ID로 분리하지 않고 기존 ID를 유지한 채 `하네스` / `원자 요건` 카드로 전환한다.
  이유: 본 카드는 사용자-facing 제품 기능이 아니라 OpenAPI 계약 인덱스와 FE API 정적 검사 룰을 소유하는 단일 하네스 능력이다.
  결정자: Product Owner, Tech Lead
  영향: 카드 헤더를 새 스키마로 보강하고 모든 AC에 `(STATIC)` 마커를 부여한다. Scenario `Covers:`와 실행 테스트 `@Covers` 문장은 마커 없이 기존 문장을 유지한다. 기존 승인된 동작과 검증 범위는 바꾸지 않는다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-006-openapi-contract-and-fe-api-rules.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-23
  검증 설계: `.feature`의 5개 Scenario가 카드 수용 기준 5개를 1:1로 `Covers:`로 연결. `validate-cross-artifact`에서 TRC-COV-* 0건.
  API Skeleton: `app/back-end/src/openApiIndex/java/com/example/bddworkflow/harness/OpenApiContractDumpTest.java`. `@SpringBootTest` + MockMvc로 `/v3/api-docs`를 받아 `build/app/indexes/openapi.index.json`에 `entries[] {kind, method, path, operationId, requirements, location}` + `rawOpenApi` + canonical `sha256` 형태로 dump. `@Requirement("REQ-006")` 부착, `@Covers` 없음(산출물 생성 도구이므로 BDD Acceptance Test 아님).
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음 (FE-API 룰은 Layer 2 검사기 영역).
  화면/라우팅 Skeleton: 해당 없음. `app/front-end/src/api/**` 디렉터리는 본 REQ에서 생성하지 않는다(생성 클라이언트 도입은 별도 단계). source-index의 apiCalls 추출은 디렉터리가 생긴 뒤 자동 활성화.
  표준 용어: `openapi.contract`, `api.operation`, `api.client` draft 등록. 카드 `## 표준 용어` 절에 적용.
  검사기 골격: `harness/tools/validate-front-end-standards.mjs`에 `FE-API-CONTRACT-MISSING`, `FE-API-UNKNOWN-OPERATION`, `FE-API-CLIENT-STALE` 룰 ID 등록. 초기 severity는 warning. OpenAPI 인덱스 부재 시 `FE-API-CONTRACT-MISSING` warning 1건 emit 확인. 향후 표준 확정 후 strictSeverity를 error로 승격하면서 `gate-trace`가 `feStandardsErrors`로 차단.
  추적 정책: 사용자-facing API/화면이 없는 하네스·계약 파이프라인 요건이므로 `대상 시스템: harness`로 분류한다. trace는 API/FE 표면 연결을 요구하지 않고 수용 기준 커버 테스트만 본다. 표준 문서 갱신: `harness/docs/standards/requirement-card.md`, `harness/docs/overview.md`. 데이터 계약 갱신: `harness/docs/data-contracts.md`에 `openapi.index.json` 디렉터리·`api-operation`/`api-call` kind·`apiCalls[]` 명시.
  실행 순서: `OpenApiContractDumpTest`는 일반 `test`에서 제외하고, 전용 `generateOpenApiIndex` 태스크 하나만 그것을 실행한다. `npm run app:validate`는 OpenAPI export를 실행해 최신 `openapi.index.json`을 만들고, `npm run harness:validate`는 하네스 Node/TypeScript self-test와 FE 계약 검사 fixture를 검증한다. `./gradlew test`는 애플리케이션 테스트만 실행하고, 하네스 테스트 결과는 `build/harness/test-results/nodeSelfTest` 아래에 분리된다.
  검증: `./gradlew compileJava`, `./gradlew compileTestJava`, `./gradlew generateHarnessSourceIndex`, `./gradlew generateFrontEndSourceIndex`, `./gradlew generateOpenApiIndex`, `./gradlew traceRequirementCard -Preq=REQ-006` 통과. `./gradlew validateRequirementCardBlue -Preq=REQ-001`로 다른 BLUE 카드 회귀 확인.
  승인자: 사용자
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-23
  리뷰자: 사용자
  확인: `harness/self-test/tests/openapi-contract.test.ts`의 5개 `harnessTest({ requirement, covers })`가 카드 수용 기준 5개를 1:1로 검증한다. AC1/AC2는 OpenAPI fixture를 읽어 구조와 operation 포함 여부를 확인하고, AC3/AC4/AC5는 `validate-front-end-standards.mjs`에 fixture를 CLI로 주입해 `FE-API-UNKNOWN-OPERATION`/`FE-API-CLIENT-STALE`/`FE-API-CONTRACT-MISSING` finding 발생을 확인한다. `npm run harness:self-test` PASS, `npm run harness:validate` PASS.
  결과: 승인

## 열린 질문

- 없음
