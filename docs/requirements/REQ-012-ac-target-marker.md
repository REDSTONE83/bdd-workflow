# 요건 카드

요건 ID: REQ-012
제목: AC 단위 테스트 대상 마커와 하네스 게이트 적용
우선순위: 중간
상태: 승인
구현 대상: harness

## 사용자/목적

full-stack 요건 카드의 수용 기준은 API 전용과 UI 전용이 한 카드 안에 섞일 수밖에 없다. 현재 하네스는 full-stack 카드의 모든 AC에 백엔드 Acceptance Test와 FE BDD 테스트 양쪽 커버를 요구하므로, API 전용 AC에 FE 테스트가 따라붙거나 UI 전용 AC에 백엔드 테스트가 따라붙는다. 카드를 BE/FE로 쪼개지 않고도 AC 단위로 테스트 대상을 한정해 추적의 의미가 살아 있도록 표기 규칙과 게이트를 도입한다.

## 범위

- 카드의 수용 기준 bullet 시작 직후에 `(BE)`, `(FE)`, `(FS)` 세 토큰 중 하나를 마커로 둔다. 예: `- (BE) 어떤 결과 문장`.
- 마커는 카드 정적 검증과 추적용으로만 사용한다. 마커는 백엔드 `@Covers`와 FE BDD `Covers` 값에 포함하지 않으며, 테스트 식별자로 사용하는 AC 문장은 마커를 제외한 원문이다.
- 마커가 없는 AC는 카드 헤더의 `구현 대상`에 따라 다음과 같이 해석한다: `back-end` → BE, `front-end` → FE, `full-stack` → FS, `harness` → 어느 한쪽이라도 커버. `harness` fallback은 기존 REQ-006~REQ-010 카드가 모두 백엔드 Acceptance Test만으로 커버되는 현행 동작과 일치해야 한다.
- 마커 유효값은 `BE`, `FE`, `FS` 세 가지뿐이며, 다른 토큰은 카드 정적 검증에서 오류로 차단한다.
- 카드 파서는 각 AC에 `target` 필드를 부여해 trace 인덱스와 추적 리포트에 노출한다.
- 통합 게이트(`gate.mjs`, REQ-010)는 TRACE 카테고리에서 AC 단위 커버 요구를 적용한다. `BE` AC는 백엔드 Acceptance Test 커버가 있어야 하고, `FE` AC는 FE BDD 테스트 커버가 있어야 하며, `FS` AC는 양쪽 모두 커버가 있어야 한다.
- 추적 리포트(`build/harness/reports/trace-report.md`)는 AC 별로 target 마커와 백엔드/FE 커버 상태를 함께 표시한다.
- 표준 문서 `docs/standards/requirement-card.md`의 수용 기준 절에 마커 작성 규칙, 유효값, fallback 규칙을 추가한다.
- 기존 카드는 카드별 검토를 거쳐 사람이 마커를 부여한다. 자동 마이그레이션은 두지 않는다.

## 표준 용어

- harness.requirementCard
- harness.acceptanceCriteria

## 제외 범위

- AC 마커 이외의 카드 양식 변경
- 마커별 다중 가중치(예: 동일 AC를 여러 백엔드 테스트가 함께 커버해야 한다는 정책)
- 기존 카드의 자동 마이그레이션 도구
- 시나리오(.feature) 파일에 대한 별도 마커 도입 (시나리오 `Covers:`는 같은 AC를 가리키므로 마커 없이도 AC의 target을 따라간다)
- harness 카드 외 카드의 `구현 대상` 분류 변경

## 수용 기준

- 카드 파서는 수용 기준 bullet 시작에 위치한 `(BE)`, `(FE)`, `(FS)` 마커를 인식해 해당 AC의 target으로 부여한다
- 마커가 없는 AC는 카드 `구현 대상` 값에 따라 BE/FE/FS로 결정된다
- AC 마커가 `BE`, `FE`, `FS` 외 값을 가지면 카드 정적 검증이 오류로 차단한다
- AC 마커는 백엔드 `@Covers`와 FE BDD `Covers` 값에 포함되지 않는다
- 통합 게이트는 target이 `BE`인 AC에 백엔드 Acceptance Test 커버가 없으면 차단한다
- 통합 게이트는 target이 `FE`인 AC에 FE BDD 테스트 커버가 없으면 차단한다
- 통합 게이트는 target이 `FS`인 AC에 백엔드와 FE 어느 한쪽이라도 커버가 없으면 차단한다
- 추적 리포트는 각 AC의 target 마커와 백엔드/FE 커버 상태를 함께 표시한다
- 표준 문서에는 마커 작성 규칙, 유효값, fallback 규칙이 명시된다

## 의사결정 로그

- 결정일: 2026-05-23
  결정: AC 단위 테스트 대상을 카드 양식 변경으로 표현한다. 카드를 BE/FE로 쪼개지 않는다.
  이유: 같은 흐름의 AC가 BE와 FE에 걸쳐 있는 경우가 많고, 한 카드로 검토하는 편이 의도와 의사결정 로그를 한 곳에서 다룰 수 있다. 카드 분리는 cross-reference와 결정 흐름의 단절을 늘린다.
  결정자: Product Owner, Tech Lead
  영향: 본 카드는 카드 표준과 카드 파서, 통합 게이트를 함께 갱신한다. 카드 분리는 후속 정책이 필요할 때만 다시 검토한다.

- 결정일: 2026-05-23
  결정: 마커는 bullet 시작 직후 `(BE)`, `(FE)`, `(FS)` 한 단어 토큰으로 둔다. 마커는 `@Covers`/`Covers` 값에 포함하지 않는다.
  이유: 한 줄 단위 단순 파싱이 가능하고 카드의 시각적 흐름을 거의 바꾸지 않는다. `@Covers`에서 마커를 제외하면 테스트 식별자가 마커 변경(예: BE→FS)에 영향을 받지 않는다.
  결정자: Tech Lead
  영향: 카드 파서는 `^- \((BE|FE|FS)\) ` 패턴을 인식한다. `@Covers` 매칭은 마커를 제외한 원문으로 한다.

- 결정일: 2026-05-23
  결정: 마커가 없는 AC는 카드 `구현 대상`에 따라 fallback한다. `back-end`→BE, `front-end`→FE, `full-stack`→FS, `harness`→어느 한쪽이라도 커버.
  이유: 마커 도입 직후 기존 카드들이 일괄 갱신되지 않아도 의미를 잃지 않게 한다. `back-end`/`front-end` 카드는 모든 AC가 단일 대상이므로 마커가 없는 편이 더 단순할 수 있다. `harness` fallback을 FS로 두면 기존 REQ-006~REQ-010(백엔드 Acceptance Test만으로 BLUE인 카드)이 모두 회귀하므로, 표준 문서 [`docs/standards/requirement-card.md`](../standards/requirement-card.md)의 `구현 대상: harness` 정의("수용 기준 커버는 백엔드 Acceptance Test 또는 FE BDD 테스트 어느 쪽이든 무방하다")와 맞춰 "어느 한쪽이라도 커버"로 고정한다.
  결정자: Product Owner, Tech Lead
  영향: 기존 카드의 BE/FE 커버 요구는 변하지 않는다. full-stack 카드는 모든 AC에 양쪽 커버를 요구하는 현행 동작을 유지하고, harness 카드는 카드 표준의 정의 그대로 단일 면 커버로도 GREEN/BLUE 진입이 가능하다. 마커가 추가되면 AC 단위로 정확히 줄어든다.

- 결정일: 2026-05-23
  결정: 통합 게이트(`gate.mjs`)의 TRACE 카테고리가 AC 단위 커버 요구를 적용한다. 기존 카드 단위 BE/FE 커버 요구는 AC target의 합으로 자연스럽게 표현된다.
  이유: REQ-010의 통합 게이트가 이미 BE/FE/SCN 카테고리를 단일 판정기에서 차단하고 있으므로, AC target도 같은 진입점에서 처리하는 편이 일관적이다.
  결정자: Tech Lead
  영향: TRACE 카테고리에 AC target × 테스트 종류 매트릭스가 추가된다. 기존 카테고리 코드와 출력 형식은 가능한 범위에서 유지한다.

## BDD 테스트 리뷰

시나리오 문서: `docs/scenarios/REQ-012-ac-target-marker.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-26
  검증 설계: `.feature` 9개 Scenario가 9개 수용 기준을 1:1로 `Covers:` 매핑한다. 카드/시나리오/용어 정적 finding 0건. AC 커버 테스트는 본 단계에서 작성하지 않으므로 TRACE-AC-MISSING(테스트 미작성 단계의 정상 RED)이 남는다.
  API Skeleton: 해당 없음 (하네스 카드).
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음.
  화면/라우팅 Skeleton: 해당 없음.
  검사기 Skeleton:
    - Layer 1 collector (`tools/harness/index-requirements.mjs`): `acceptanceCriteria` 형식을 `string[]`에서 `[{ text, target, invalidMarker? }]`로 변경. bullet 시작의 `(...)` 괄호 토큰 중 `BE`/`FE`/`FS`는 stripped text와 target으로 부여, 그 외 토큰은 invalidMarker로 표시한다 (자연어 괄호 `(see foo)` 같은 공백 포함 형태는 마커 후보에서 제외).
    - Layer 2 validator (`tools/harness/validate-requirement-cards.mjs`): 새 룰 `CARD-AC-TARGET-INVALID` 추가. `invalidMarker`가 있는 AC를 error로 emit한다. AC 중복 검사는 `.text` 기준으로 어댑트.
    - Trace evaluator (`tools/harness/evaluate-trace-state.mjs`): coverage row가 `{ criterion: text, target, ... }` 형태로 산출되도록 어댑트. `targetCoverageForCriterion`은 여전히 카드 `구현 대상` 기준으로 동작(per-AC enforcement는 다음 구현 단계).
    - Cross-artifact validator (`tools/harness/validate-cross-artifact.mjs`): TRC-COV-02 매칭이 `.text`로 비교하도록 어댑트.
    - Trace report renderer (`tools/harness/render-trace-report.mjs`): `Acceptance Criteria Coverage` 행에 `(target)` 마커를 함께 표시.
  표준 용어: `harness.requirementCard`, `harness.acceptanceCriteria` 두 후보를 `docs/terminology/domains/harness.json`에 approved로 추가. 카드 정적 검증과 통합 게이트 모두 통과.
  추적 정책: 마커 fallback 규칙은 카드 `구현 대상`을 따른다(`back-end`→BE, `front-end`→FE, `full-stack`→FS, `harness`→어느 한쪽이라도 커버). Per-AC enforcement(target에 따른 BE/FE 커버 요구 분기)는 본 카드의 구현 단계에서 `targetCoverageForCriterion`을 확장한다.
  Gradle 실행 순서: 기존 task 그래프 그대로. `indexRequirements` → `validateRequirementCards`/`validateCrossArtifact`/`evaluateTraceState` → `renderTraceReport`/`gate` 순서 유지.
  검증: `./gradlew traceRequirementCard -Preq=REQ-012` 성공(카드/시나리오/용어 finding 0건, redReasons 1건=TRACE-AC-MISSING). `./gradlew validateRequirementCard -Preq=REQ-012`는 RED(테스트 미작성)로 차단되는 것이 정상이며, 이 카드의 통합 게이트 통과는 다음 구현 단계에서 Acceptance Test/FE BDD 테스트가 추가된 뒤로 미룬다. `./gradlew validateHarness`는 REQ-011·REQ-012 두 카드의 TRACE RED 두 건 외 finding 0건이며, 기존 REQ-001~REQ-010 카드는 회귀 없이 BLUE 유지.
  승인자: Product Owner, Tech Lead
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-26
  리뷰자: Product Owner, Tech Lead
  확인: `back-end/src/test/java/com/example/bddworkflow/harness/AcTargetMarkerAcceptanceTest.java`의 9개 `@Test × @Covers`가 카드 수용 기준 9개를 1:1로 검증한다. AC1·AC4는 빌드된 indexes를 직접 읽어 검증(REQ-011 (BE)/(FE)/(FS) marker 부여, `@Covers`/`Covers` 값에 marker 미포함). AC2는 4종 `구현 대상`(back-end/front-end/full-stack/harness) fixture로 evaluator를 spawn해 fallback `requiredChecks`를 직접 확인. AC3는 invalidMarker fixture를 `requirements.index.json`에 덮어쓰고 `validate-requirement-cards.mjs`를 spawn해 `CARD-AC-TARGET-INVALID` finding을 확인. AC5/AC6/AC7은 fixture indexes로 `evaluate-trace-state.mjs`를 spawn해 `requiredChecks`·`status`·`redReasons` 산출 자체를 직접 검증한다(차단 케이스 + PASS 케이스 양쪽). AC8은 fixture state로 `render-trace-report.mjs`를 spawn해 `(BE)/(FE)/(FS)` 마커와 per-side 상태 라인이 함께 렌더링됨을 확인. AC9는 `docs/standards/requirement-card.md`를 직접 검증. 부가로 `tools/harness/__tests__/index-requirements.parser.test.mjs`가 카드 파서 11+1개 케이스를 `node --test` fixture로 항구화하며 `npm run validate`가 `harness:test`를 선행 실행한다. `./gradlew test --tests AcTargetMarkerAcceptanceTest` 9/9 PASSED, `node tools/harness/gate.mjs --check` 결과 REQ-001~010 BLUE 유지·REQ-012 GREEN, `npm run harness:test` 12/12 PASSED.
  결과: 승인

## 열린 질문

- 없음
