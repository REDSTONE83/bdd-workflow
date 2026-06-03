# 요건 카드

요건 ID: REQ-009
제목: Gherkin 시나리오 SCN-* 구조 검사
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

시나리오 작성자와 검토자는 `.feature` 파일의 구조 위반을 다른 검사(`BE-*`/`FE-*`/`CARD-*`)와 같은 finding 모양과 같은 게이트 정책으로 확인할 수 있어야 한다. 현재는 `scenario-index.mjs`가 Layer 1 collector이면서 issue를 직접 보고하는 구조라 SCN-* ruleId가 비어 있고 `validateHarness` 게이트가 시나리오 위반을 차단하지 않는다.

## 범위

- `tools/harness/validate-scenarios.mjs`를 신규 Layer 2 validator로 도입한다.
- `scenarios.index.json`의 `issues[]`(전역 `issues[]`와 `features[].issues[]`)를 SCN-* finding으로 정규화한다.
- 결과를 `build/harness/findings/scenarios.findings.json`에 emit한다.
- `validateHarness`/`traceRequirementCard`/`validateRequirementCard*` 체인이 새 validator에 dependsOn 으로 묶이게 한다.
- 게이트가 SCN-* error finding을 차단한다.

## 표준 용어

이 요건은 도구 파이프라인 변경이라 카드에 등록할 표준 용어가 없다.

## 제외 범위

- Gherkin 파서 확장 (`Background`, `Scenario Outline` 지원 등)
- `Feature` / `Scenario` / `Covers` / `Given|When|Then|And|But` 외 새 키워드 지원
- `scenario-index.mjs`의 Layer 1 책임 변경 (issue 수집 자체는 그대로)
- 시나리오 텍스트 채널 표준 용어 검사 변경

## 수용 기준

- (STATIC) Gherkin `.feature` 파일의 구조 위반은 `build/harness/findings/scenarios.findings.json`에 SCN-* finding으로 정규화되어 보고된다
- (STATIC) Feature 헤더가 없는 `.feature` 파일은 검사 결과에 오류로 보고된다
- (STATIC) `@REQ-XXX` 태그가 없는 Feature는 검사 결과에 오류로 보고된다
- (STATIC) 지원하지 않는 Gherkin 키워드(`Background`, `Scenario Outline` 등)를 사용한 `.feature`는 검사 결과에 오류로 보고된다
- (STATIC) `validateHarness` 게이트는 SCN-* error finding을 발견하면 실패한다

## 의사결정 로그

- 결정일: 2026-05-23
  결정: 시나리오 구조 위반은 Layer 2 validator(`validate-scenarios.mjs`)가 SCN-* finding으로 정규화하고, `scenario-index.mjs`는 Layer 1 책임(issue 수집)만 유지한다.
  이유: 다른 룰셋(`BE-*`/`FE-*`/`CARD-*`/`REF-*`/`TRC-*`)이 모두 Layer 1 → Layer 2 → Layer 4 게이트 정합으로 떨어졌는데, SCN-*만 Layer 1 collector가 직접 보고하는 비대칭이 남아 있다. 게이트 차단도 SCN-* 측은 빠져 있어 시나리오 위반이 무방비 상태다.
  결정자: 사용자
  영향: `validate-scenarios.mjs`가 신규로 추가되고 `rule-namespaces.md`의 SCN-* prefix가 채워진다. `gate-trace.mjs`가 SCN-* error를 게이트 실패 사유에 포함한다.

- 결정일: 2026-05-23
  결정: SCN-* ruleId 7개를 등록한다. 모두 초기 `severity: error`로 두어 첫 적용부터 `validateHarness`가 차단한다.
  이유: 모든 위반은 시나리오 추적 또는 파서 신뢰성을 직접 무너뜨린다(헤더 없음/태그 없음은 추적 불가, 미지원 키워드는 무시되므로 의도와 어긋남, dialect 지시자는 표준 위반, Scenario 밖 step/Covers는 매핑 오류). 점진 도입이 필요할 만큼 약한 위반이 없으므로 warning 단계를 두지 않는다.
  결정자: 사용자
  영향: `SCN-DIALECT-FORBIDDEN`, `SCN-FEATURE-HEADER-MISSING`, `SCN-REQ-TAG-MISSING`, `SCN-UNSUPPORTED-KEYWORD`, `SCN-STRAY-LINE`, `SCN-COVERS-OUTSIDE-SCENARIO`, `SCN-STEP-OUTSIDE-SCENARIO`. 현재 `.feature` 본문은 모두 깨끗하므로 회귀 영향 없음.

- 결정일: 2026-05-23
  결정: `scenario-index.mjs`의 `issue` 객체에 `kind` 필드를 추가해 Layer 2 매핑 키로 쓴다.
  이유: 현재 issue는 `{line, message}`만 갖고 있어 자연어 message로 분류해야 한다. 그러면 메시지 문구가 바뀌면 매핑이 깨진다. Layer 2가 안정적으로 매핑하려면 collector가 의도된 종류를 명시적으로 박아야 한다.
  결정자: 사용자
  영향: scenario-index 출력의 issue 모양이 `{line, message, kind}`로 확장된다. 이는 Layer 1 ↔ Layer 2 사이의 계약이므로 Skeleton 단계에서 `docs/harness/data-contracts.md`의 인덱스 엔트리 절에 `scenarios.index.json`의 `issues[]` 스키마와 7개 `kind` enum(`SCN-*` 룰 매핑 키)을 명시한다.

- 결정일: 2026-05-23
  결정: 본 REQ 도입과 함께 `evaluate-trace-state.mjs` / `render-trace-report.mjs`에서 raw `scenarioIndex.issues[]` 직접 소비를 끊는다. trace/report는 `scenarios.findings.json`(SCN-* 정규화 결과)만 본다.
  이유: FE 쪽은 이미 `frontEndIndex.issues[]` 직접 소비를 끊어 같은 위반이 raw와 정규화 양쪽에 중복 노출되지 않도록 정리했다. SCN-*도 같은 패턴을 적용해야 "Scenario standards findings(Layer 2 정규화)"과 "Scenario index issues(Layer 1 raw)"가 한 위반을 두 번 보고하는 모양이 사라진다.
  결정자: 사용자
  영향: `summary.scenarioIssues` 필드 제거. trace state JSON의 `scenarioIndex.globalIssues` / `featureIssues` 노출 제거. trace report에서 "Scenario index issues" summary 줄과 "## Scenario Index Issues" 섹션 제거, "## Scenario Standards Findings (SCN-*)" 섹션 신설. `scenarioWarnings`(TRC-COV-* 출처)는 SCN과 무관한 cross-artifact 채널이라 그대로 유지.

- 결정일: 2026-05-23
  결정: SCN-* finding의 단일 카드 게이트 필터링은 현 FE-* 정책과 동일하게 `finding.requirements[]` 유무로 분기한다.
  이유: `evaluate-trace-state.mjs`가 이미 FE 표준 finding에 대해 "전역 finding(`requirements: []`)은 전체 게이트만 차단, 카드 귀속 finding은 단일 카드 게이트도 차단"으로 떨어트려 두었다. SCN-*도 같은 패턴을 쓰면 규칙이 단순해지고, `@REQ-XXX` 태그 부재처럼 어느 카드에도 귀속되지 않는 finding이 다른 카드 작업자를 막지 않는다.
  결정자: 사용자
  영향: `validate-scenarios.mjs`는 feature 파일의 `@REQ-XXX` 태그를 그대로 finding의 `requirements`로 옮긴다(태그가 있는 경우). `SCN-REQ-TAG-MISSING` 같이 태그 자체가 없는 finding은 `requirements: []`로 emit한다. `validateHarness`는 모든 SCN-* error를 차단하고, `validateRequirementCard*`는 선택 카드에 귀속된 SCN-* error만 차단한다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-009-scenario-validator-layer-2.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-23
  검증 설계: `.feature`의 5개 Scenario가 카드 수용 기준 5개를 1:1로 `Covers:`로 연결한다.
  검사기 Skeleton: `tools/harness/validate-scenarios.mjs` 신규. 입력은 `build/harness/indexes/scenarios.index.json`, 출력은 `build/harness/findings/scenarios.findings.json`. CLI 인자 `--scenarios-index=PATH`, `--out=PATH`를 받아 fixture 테스트 가능 구조 유지. `scenario-index.mjs`는 issue에 `kind` 필드 추가만.
  데이터 계약: Skeleton 단계에서 `docs/harness/data-contracts.md`에 `scenarios.index.json` `issues[]` 스키마(`{line, message, kind}`)와 7개 `kind` enum, `scenarios.findings.json` owner 한 줄을 명시한다. `rule-namespaces.md`에 SCN-* 7개 룰 등록.
  추적 정책: `대상 시스템: harness`. 사용자-facing API/화면 연결 요구 없음. 5개 Scenario `Covers:`가 5개 AC를 1:1 커버하면 GREEN.
  Gradle 실행 순서: `tasks.register('validateScenarios', Exec)` 신규. `generateScenarioIndex`에 dependsOn. `traceRequirements`, `validateHarness`, `traceRequirementCard`, `validateRequirementCard`, `validateRequirementCardBlue`에 dependsOn 추가.
  게이트 정책: `gate-trace.mjs`의 `--check`/`--require-blue`가 SCN-* error finding을 게이트 실패 사유에 추가한다. `summary.scenarioStandardsErrors`로 noun 도입.
  표준 용어: 추가 등록 없음.
  검증: `./gradlew compileJava`, `./gradlew compileTestJava`, `./gradlew generateHarnessSourceIndex`, `./gradlew generateFrontEndSourceIndex` BUILD SUCCESSFUL. `./gradlew validateScenarios`는 `scenarios.findings.json: 0 finding(s)` (현재 `.feature`는 모두 깨끗). `./gradlew traceRequirementCard -Preq=REQ-009`는 State=RED, Card structure issues=0, Scenario standards findings error=0. RED는 Acceptance Test 부재로 인한 정상 Skeleton 단계 상태. 전체 trace에서 total=9 red=1 (REQ-009) blue=8 (REQ-001~008 유지).
  승인자: 사용자
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-23
  리뷰자: 사용자
  확인: `back-end/src/test/java/com/example/bddworkflow/harness/ScenarioValidatorLayer2AcceptanceTest.java`의 5개 `@Test` × `@Covers`가 카드 수용 기준 5개를 1:1로 검증한다. AC1~AC4는 fixture `scenarios.index.json`을 `validate-scenarios.mjs`에 주입해 각 SCN-* finding이 `severity: error`로 정규화되는지 확인한다. AC3은 `SCN-REQ-TAG-MISSING`이 `requirements: []` 전역 finding인 것까지 확인해 단일 카드 게이트 필터 정책과 정합. AC5는 fixture `trace.state.json`을 임시로 production state 위치에 두고 `gate-trace.mjs --check`를 호출해 `scenarioStandardsErrors > 0`일 때 exit=1이 됨을 확인 후 원본 state를 복구한다. `./gradlew test` 5/5 PASSED, `traceRequirementCard -Preq=REQ-009` GREEN, `validateRequirementCardBlue -Preq=REQ-009` BUILD SUCCESSFUL.
  결과: 승인

## 열린 질문

- 없음
