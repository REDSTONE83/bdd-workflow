# 요건 카드

요건 ID: REQ-012
제목: AC 단위 검증 채널 마커와 하네스 게이트
우선순위: 중간
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: none
검증 수준: static
관련 요건: REQ-010
대체 요건: 없음

## 사용자/목적

요건 카드 작성자와 리뷰어는 카드를 API/화면 구현 표면으로 쪼개지 않고도 각 수용 기준이 어떤 실행 검증 채널에서 확인되는지 명확히 볼 수 있어야 한다. 하네스는 AC별 검증 채널 마커를 파싱하고, 마커가 요구하는 테스트 커버가 없으면 통합 게이트에서 차단해야 한다.

## 범위

- 카드의 수용 기준 bullet 시작 직후에 `(API)`, `(UI)`, `(E2E)`, `(STATIC)` 중 하나를 검증 채널 마커로 둔다. 예: `- (API) 어떤 결과 문장`.
- 마커는 카드 정적 검증과 추적용으로만 사용한다. 마커는 백엔드 `@Covers`와 FE BDD `Covers` 값에 포함하지 않으며, 테스트 식별자로 사용하는 AC 문장은 마커를 제외한 원문이다.
- 마커가 없는 AC는 `CARD-AC-MARKER-MISSING` 카드 구조 오류로 차단한다.
- 마커 유효값은 `API`, `UI`, `E2E`, `STATIC` 네 가지뿐이며, 다른 토큰은 `CARD-AC-MARKER-INVALID` 카드 구조 오류로 차단한다.
- 카드 파서는 각 AC에 `target` 필드를 부여해 trace 인덱스와 추적 리포트에 노출한다.
- 통합 게이트(`gate.mjs`, REQ-010)는 TRACE 카테고리에서 AC 단위 커버 요구를 적용한다. `API` AC는 백엔드 Acceptance Test 커버가 있어야 하고, `UI` AC와 `E2E` AC는 Playwright FE BDD 테스트 커버가 있어야 하며, `STATIC` AC는 백엔드 Acceptance Test 또는 FE BDD 테스트 어느 쪽이든 실행 검증 커버가 있으면 통과한다.
- 추적 리포트(`build/harness/reports/trace-report.md`)는 AC별 target 마커와 검증 상태를 함께 표시한다.
- 표준 문서 `harness/docs/standards/requirement-card.md`의 수용 기준 절에 마커 작성 규칙, 유효값, 필수 작성 규칙, 누락/오류 ruleId를 명시한다.

## 표준 용어

- harness.requirementCard
- harness.acceptanceCriteria

## 제외 범위

- AC 마커 이외의 카드 양식 변경
- 마커별 다중 가중치(예: 동일 AC를 여러 테스트가 함께 커버해야 한다는 정책)
- 시나리오(.feature) 파일에 대한 별도 마커 도입 (시나리오 `Covers:`는 같은 AC를 가리키므로 마커 없이도 AC의 target을 따라간다)
- API/UI/E2E/STATIC 외 추가 검증 채널

## 수용 기준

- (STATIC) 카드 파서는 수용 기준 bullet 시작에 위치한 `(API)`, `(UI)`, `(E2E)`, `(STATIC)` 마커를 인식해 해당 AC의 target으로 부여한다
- (STATIC) 마커가 없는 AC는 카드 구조 오류로 차단한다
- (STATIC) AC 마커가 `API`, `UI`, `E2E`, `STATIC` 외 값을 가지면 카드 정적 검증이 오류로 차단한다
- (STATIC) AC 마커는 백엔드 `@Covers`와 FE BDD `Covers` 값에 포함되지 않는다
- (STATIC) 통합 게이트는 target이 `API`인 AC에 백엔드 Acceptance Test 커버가 없으면 차단한다
- (STATIC) 통합 게이트는 target이 `UI`인 AC에 FE BDD 테스트 커버가 없으면 차단한다
- (STATIC) 통합 게이트는 target이 `E2E`인 AC에 Playwright 사용자 여정 테스트 커버가 없으면 차단한다
- (STATIC) 추적 리포트는 각 AC의 target 마커와 검증 상태를 함께 표시한다
- (STATIC) 표준 문서에는 마커 작성 규칙, 유효값, 오류 규칙이 명시된다

## 의사결정 로그

- 결정일: 2026-05-23 (2026-06-02 현행 마커로 갱신)
  결정: AC 단위 검증 채널을 카드 양식으로 표현한다. 카드를 API/UI 구현 표면으로 쪼개지 않는다.
  이유: 같은 기능 안에서 API 계약, 화면 상태, 사용자 여정, 정적 검증이 함께 검토되는 경우가 많다. 카드 분리는 cross-reference와 결정 흐름의 단절을 늘리므로, AC마다 검증 채널을 명시하는 편이 추적 의미를 유지한다.
  결정자: Product Owner, Tech Lead
  영향: 본 카드는 카드 표준과 카드 파서, 통합 게이트를 함께 갱신한다. 카드 분리는 후속 정책이 필요할 때만 다시 검토한다.

- 결정일: 2026-05-23 (2026-06-02 현행 마커로 갱신)
  결정: 마커는 bullet 시작 직후 `(API)`, `(UI)`, `(E2E)`, `(STATIC)` 한 단어 토큰으로 둔다. 마커는 `@Covers`/`Covers` 값에 포함하지 않는다.
  이유: 한 줄 단위 단순 파싱이 가능하고 카드의 시각적 흐름을 거의 바꾸지 않는다. `@Covers`에서 마커를 제외하면 테스트 식별자가 마커 변경에 영향을 받지 않는다.
  결정자: Tech Lead
  영향: 카드 파서는 `^- \((API|UI|E2E|STATIC)\) ` 패턴을 인식한다. `@Covers` 매칭은 마커를 제외한 원문으로 한다.

- 결정일: 2026-06-02
  결정: 마커가 없는 AC는 fallback하지 않고 `CARD-AC-MARKER-MISSING` 카드 구조 오류로 차단한다.
  이유: 새 카드 스키마에서는 AC가 기계 검증 기준이므로 검증 채널이 빠지면 완료 판정을 계산할 수 없다. 구 형식 호환을 유지하지 않기로 했으므로 누락 AC는 즉시 오류로 드러내야 한다.
  결정자: Product Owner, Tech Lead
  영향: 모든 요건 카드의 AC는 `(API)`, `(UI)`, `(E2E)`, `(STATIC)` 중 하나를 가져야 한다. 누락 마커는 `CARD-AC-MARKER-MISSING`, 허용 외 마커는 `CARD-AC-MARKER-INVALID`로 차단된다.

- 결정일: 2026-05-23 (2026-06-02 현행 마커로 갱신)
  결정: 통합 게이트(`gate.mjs`)의 TRACE 카테고리가 AC 단위 커버 요구를 적용한다. 기존 카드 단위 BE/FE 커버 요구는 AC target의 합으로 자연스럽게 표현된다.
  이유: REQ-010의 통합 게이트가 이미 BE/FE/SCN 카테고리를 단일 판정기에서 차단하고 있으므로, AC target도 같은 진입점에서 처리하는 편이 일관적이다.
  결정자: Tech Lead
  영향: TRACE 카테고리에 AC target × 테스트 종류 매트릭스가 추가된다. `(API)`는 백엔드 Acceptance Test, `(UI)`와 `(E2E)`는 Playwright FE BDD 테스트, `(STATIC)`은 하네스/정적 검사 실행 테스트 커버로 판정한다.

## BDD 테스트 리뷰

시나리오 문서: `harness/docs/scenarios/REQ-012-ac-target-marker.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-26
  검증 설계: `.feature` 9개 Scenario가 9개 수용 기준을 1:1로 `Covers:` 매핑한다. 카드/시나리오/용어 정적 finding 0건. AC 커버 테스트는 본 단계에서 작성하지 않으므로 TRACE-AC-MISSING(테스트 미작성 단계의 정상 RED)이 남는다.
  API Skeleton: 해당 없음 (하네스 카드).
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음.
  화면/라우팅 Skeleton: 해당 없음.
  검사기 Skeleton:
    - Layer 1 collector (`harness/tools/index-requirements.mjs`): `acceptanceCriteria` 형식을 `string[]`에서 `[{ text, target, invalidMarker? }]`로 변경. bullet 시작의 `(...)` 괄호 토큰 중 `API`/`UI`/`E2E`/`STATIC`은 stripped text와 target으로 부여, 그 외 토큰은 invalidMarker로 표시한다 (자연어 괄호 `(see foo)` 같은 공백 포함 형태는 마커 후보에서 제외).
    - Layer 2 validator (`harness/tools/validate-requirement-cards.mjs`): `CARD-AC-MARKER-MISSING`과 `CARD-AC-MARKER-INVALID`를 error로 emit한다. AC 중복 검사는 `.text` 기준으로 어댑트한다.
    - Trace evaluator (`harness/tools/evaluate-trace-state.mjs`): coverage row가 `{ criterion: text, target, ... }` 형태로 산출되고, `targetCoverageForCriterion`이 `API`/`UI`/`E2E`/`STATIC`별 requiredChecks를 계산한다.
    - Cross-artifact validator (`harness/tools/validate-cross-artifact.mjs`): TRC-COV-02 매칭이 `.text`로 비교하도록 어댑트.
    - Trace report renderer (`harness/tools/render-trace-report.mjs`): `Acceptance Criteria Coverage` 행에 `(target)` 마커를 함께 표시.
  표준 용어: `harness.requirementCard`, `harness.acceptanceCriteria` 두 후보를 `harness/docs/terminology/domains/harness.json`에 approved로 추가. 카드 정적 검증과 통합 게이트 모두 통과.
  추적 정책: 마커가 없는 AC는 카드 구조 오류다. `API`는 백엔드 Acceptance Test, `UI`와 `E2E`는 FE BDD 테스트, `STATIC`은 하네스/정적 검사 실행 테스트 커버를 요구한다.
  Gradle 실행 순서: 기존 task 그래프 그대로. `indexRequirements` → `validateRequirementCards`/`validateCrossArtifact`/`evaluateTraceState` → `renderTraceReport`/`gate` 순서 유지.
  검증: `./gradlew traceRequirementCard -Preq=REQ-012` 성공(카드/시나리오/용어 finding 0건, redReasons 1건=TRACE-AC-MISSING). `./gradlew validateRequirementCard -Preq=REQ-012`는 RED(테스트 미작성)로 차단되는 것이 정상이며, 이 카드의 통합 게이트 통과는 다음 구현 단계에서 Acceptance Test/FE BDD 테스트가 추가된 뒤로 미룬다. `./gradlew validateHarness`는 REQ-011·REQ-012 두 카드의 TRACE RED 두 건 외 finding 0건이며, 기존 REQ-001~REQ-010 카드는 회귀 없이 BLUE 유지.
  승인자: Product Owner, Tech Lead
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-26
  리뷰자: Product Owner, Tech Lead
  확인: `harness/self-test/tests/ac-target-marker.test.ts`의 9개 `harnessTest({ requirement, covers })`가 카드 수용 기준 9개를 1:1로 검증한다. AC1·AC4는 빌드된 indexes를 직접 읽어 검증(`API`/`UI`/`E2E`/`STATIC` marker 부여, `@Covers`/`Covers` 값에 marker 미포함). AC2는 마커 누락 fixture로 `CARD-AC-MARKER-MISSING` finding을 확인한다. AC3는 invalidMarker fixture를 `requirements.index.json`에 덮어쓰고 `validate-requirement-cards.mjs`를 spawn해 `CARD-AC-MARKER-INVALID` finding을 확인한다. AC5/AC6/AC7은 fixture indexes로 `evaluate-trace-state.mjs`를 spawn해 `requiredChecks`·`status`·`redReasons` 산출 자체를 직접 검증한다(차단 케이스 + PASS 케이스 양쪽). AC8은 fixture state로 `render-trace-report.mjs`를 spawn해 `(API)`/`(UI)`/`(E2E)`/`(STATIC)` 마커와 검증 상태가 함께 렌더링됨을 확인한다. AC9는 `harness/docs/standards/requirement-card.md`를 직접 검증한다. 부가로 `harness/tools/__tests__/index-requirements.parser.test.mjs`가 카드 파서 케이스를 `node --test` fixture로 항구화한다. `npm run harness:self-test` PASS, `npm run harness:validate` PASS.
  결과: 승인

## 열린 질문

- 없음
