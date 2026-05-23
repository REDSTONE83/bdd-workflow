# 요건 카드

요건 ID: REQ-010
제목: 통합 하네스 게이트 도입
우선순위: 높음
상태: 승인
구현 대상: harness

## 사용자/목적

하네스 작업자와 CI는 BE/FE/SCN/CARD/REF/TRC/TRACE/TRM 전 영역에 걸친 검증 실패를 한 곳에서 카테고리별로 확인하고 차단할 수 있어야 한다. 현재는 게이트 판정이 `gate-trace.mjs`(trace state 한정), Gradle `validateStandardsStrict`(BE-* 한정), `validateTerminologyStrict`(TRM 한정)에 분산되어 있고, BE-* finding 자체는 어떤 게이트도 직접 차단에 쓰지 않는 대신 별도 Gradle 태스크가 이중 경로로 차단한다. 단일 판정기를 도입해 "이 한 결과가 OK면 모두 OK"가 성립하도록 정리한다.

## 범위

- `tools/harness/gate.mjs`를 신규 도입한다.
- 입력은 최소 3종:
  - `build/harness/state/trace.state.json` (TRACE 카테고리, 카드 필터/모드 플래그)
  - `build/harness/findings/{back-end-standards,front-end-standards,scenarios,requirement-cards,cross-artifact}.findings.json` (BE/FE/SCN/CARD/REF/TRC 카테고리)
  - `build/harness/findings/terminology.findings.json` (TRM 카테고리)
- 출력은 카테고리별 실패 요약을 stdout으로, exit code로 게이트 결과를 emit한다. 카테고리 라벨은 `TRACE`, `CARD`, `REF`, `TRC`, `BE`, `FE`, `SCN`, `TRM` 8개로 고정한다.
- BE-* finding(`back-end-standards.findings.json`)의 `severity: error`를 처음으로 게이트에 흡수한다.
- TRM finding(`terminology.findings.json`)의 `strictSeverity: error`까지 차단한다. `validateHarness`가 사실상 `validateTerminologyStrict`와 동등해진다.
- Gradle 태스크는 직접 `gate.mjs`를 호출하지 않는다. `validateHarness`/`validateRequirementCard`/`validateRequirementCardBlue`는 종전처럼 `trace-requirements.mjs`를 호출하고, `trace-requirements.mjs`가 evaluate → render → `gate.mjs`를 직렬 spawn한다. `validateStandardsStrict` 직접 의존은 `validateStandards`(non-strict, findings emit만)로 교체한다.
- `tools/harness/gate-trace.mjs`는 삭제하고 `trace-requirements.mjs`는 최종 단계로 `gate.mjs`를 호출하도록 갱신한다.
- 다음 문서를 본 요건 범위에서 함께 갱신한다.
  - `docs/standards/terminology.md`: "`validateHarness`는 safe 모드"라는 기존 설명을 "validateHarness는 TRM strict까지 차단"으로 갱신. `validateTerminologyStrict`는 단독 진단 도구로 남음을 명시.
  - `docs/standards/requirement-card.md`: 일상 검증이 더 이상 draft 용어를 통과시키지 않음을 반영.
  - `AGENTS.md`: 자주 쓰는 검증 명령 표의 `validateHarness` 설명과 11단계 절차의 terminology 설명을 갱신.
  - `docs/harness/data-contracts.md`: "게이트 (Layer 4)" 섹션에 `gate.mjs` 입력 3종, 출력 8개 카테고리 라벨 enum(`TRACE`/`CARD`/`REF`/`TRC`/`BE`/`FE`/`SCN`/`TRM`), 카테고리 → finding owner / rule prefix 매핑, exit code 정책을 명시. 기존 "gate-trace.mjs는 후속 단계에서 도입한다" 문구는 제거.

## 표준 용어

본 요건은 도구 파이프라인 변경이라 카드에 등록할 표준 용어가 없다.

## 제외 범위

- 새 검사 룰 추가 (BE-*/FE-*/SCN-*/CARD-*/REF-*/TRC-*/TRM 룰셋은 그대로)
- Layer 2 validator 자체의 동작 변경 (각 validator가 emit하는 finding 모양은 유지)
- `evaluate-trace-state.mjs`가 계산하는 RED/GREEN/BLUE 알고리즘 변경
- 카테고리별 실패를 머신 가독성 JSON으로 별도 파일에 emit하는 기능 (stdout 요약 + exit code로 충분)
- `harnessReport`/`traceRequirements` 같은 보고 전용 태스크의 동작 변경

## 수용 기준

- `tools/harness/gate.mjs`는 `build/harness/state/trace.state.json`, `build/harness/findings/*.findings.json`, `build/harness/findings/terminology.findings.json`을 읽어 단일 게이트 결과(exit code + 카테고리별 요약)를 만든다
- `gate.mjs`는 실패 사유를 `TRACE`/`CARD`/`REF`/`TRC`/`BE`/`FE`/`SCN`/`TRM` 카테고리 라벨로 분리해서 보고한다
- `gate.mjs --check`는 `back-end-standards.findings.json`에 `severity: error` finding이 있으면 BE 카테고리 실패로 차단한다
- `gate.mjs --check`는 `terminology.findings.json`에 `strictSeverity: error` finding이 있으면 TRM 카테고리 실패로 차단한다
- `gate.mjs --check`는 RED 카드, 카드 구조 위반(CARD-*), REF-* unknown reference, FE-* error, SCN-* error, TRC-* error finding이 있으면 각 카테고리 실패로 차단한다
- `gate.mjs --require-blue`는 `--check` 조건에 더해 GREEN 카드가 있으면 TRACE 카테고리 실패로 차단한다
- `gate.mjs --requirement REQ-XXX`는 `finding.requirements[]`와 선택 카드 ID의 교집합으로 finding을 거른다. `requirements: []` 전역 finding은 단일 카드 게이트에서 차단되지 않고 `validateHarness` 전체 게이트에서만 차단된다
- `validateHarness`/`validateRequirementCard`/`validateRequirementCardBlue` Gradle 태스크는 `trace-requirements.mjs`를 호출하고 `trace-requirements.mjs`는 최종 단계로 `gate.mjs`를 호출한다. Gradle 태스크의 `validateStandardsStrict` 직접 의존은 `validateStandards`로 교체된다
- `tools/harness/gate-trace.mjs`는 삭제되고 `tools/harness/trace-requirements.mjs`는 evaluate → render → `gate.mjs`를 직렬 spawn한다
- 본 요건의 정책 변경(terminology strict 차단)과 출력 계약(8개 카테고리 라벨, owner/rule prefix 매핑)이 `docs/standards/terminology.md`, `docs/standards/requirement-card.md`, `AGENTS.md`, `docs/harness/data-contracts.md`에 반영된다

## 의사결정 로그

- 결정일: 2026-05-23
  결정: `gate.mjs`는 `gate-trace.mjs`의 래퍼가 아니라 최종 판정기다. `gate-trace.mjs`는 삭제하고 `trace-requirements.mjs`가 evaluate → render → `gate.mjs`를 직렬 spawn한다. Gradle 태스크는 직접 `gate.mjs`를 호출하지 않는다.
  이유: 현재 BE-* finding은 어떤 게이트도 직접 보지 않고 별도 `validateStandardsStrict` Gradle 태스크가 이중 경로로 차단한다. 게이트 판정 책임이 `gate-trace.mjs`/`validateStandardsStrict`/`validateTerminologyStrict` 3곳에 흩어져 있어 "게이트가 OK면 모두 OK"라는 단순한 의미를 잃었다. Layer 4 단일 판정기를 도입하면 이후 REQ가 늘어나도 실패 신호가 한 곳에 모인다. 호출 경로는 evaluate/render와 gate를 한 wrapper(`trace-requirements.mjs`)에 묶어 두는 편이 Gradle 태스크 구조를 흔들지 않고 마지막 spawn 대상만 `gate.mjs`로 교체된다.
  결정자: 사용자
  영향: `tools/harness/gate-trace.mjs` 파일이 삭제된다. `trace-requirements.mjs`는 마지막 spawn 대상을 `gate-trace.mjs` → `gate.mjs`로 교체한다. `back-end/build.gradle`의 `validateHarness`/`validateRequirementCard`/`validateRequirementCardBlue`는 호출 진입점(`trace-requirements.mjs`)을 그대로 유지하고 `validateStandardsStrict` 의존만 `validateStandards`로 바꾼다. `docs/harness/overview.md`의 "마이그레이션 중" 문장을 게이트 단일 진입점 설명으로 갱신한다.

- 결정일: 2026-05-23
  결정: BE-* finding은 `gate.mjs`가 `back-end-standards.findings.json`을 직접 읽어 차단한다. `validateStandardsStrict`는 `validateHarness`의 직접 의존에서 제거하고 `validateStandards`(non-strict, findings emit만 하는 always-exit-0 태스크)로 교체한다.
  이유: 단일 판정기 원칙에 부합한다. 이중 경로(BE 게이트가 별도 Gradle 태스크 + gate.mjs 양쪽)로 두면 어디서 실패했는지 사용자가 두 곳을 봐야 한다. `validateStandardsStrict` 자체는 단독 strict 진단 도구로 남기되 `validateHarness` 체인에서는 빠진다.
  결정자: 사용자
  영향: `validateHarness`/`validateRequirementCard`/`validateRequirementCardBlue` Gradle 태스크의 `dependsOn`에서 `validateStandardsStrict`가 빠지고 `validateStandards`가 들어간다. BE-* error가 있을 때 `validateHarness`가 BE 카테고리로 실패한다.

- 결정일: 2026-05-23
  결정: TRM 카테고리는 `terminology.findings.json`의 `strictSeverity: error`까지 `gate.mjs --check`가 차단한다. `validateHarness`가 사실상 `validateTerminologyStrict`와 동등해진다.
  이유: 사용자 스펙 문구가 "TRM: terminology strict error"이므로 strict가 정상 기본 정책이다. 표준 용어 위반은 코드 식별자/카드/시나리오 텍스트 채널 모두에 영향을 주는 cross-cutting 위반이라 릴리스 전까지 미루는 것보다 매 게이트에서 차단하는 편이 안전하다.
  결정자: 사용자
  영향: `validateHarness`/`validateRequirementCard`/`validateRequirementCardBlue`가 사실상 strict terminology 기준으로 동작한다. `validateTerminologyStrict`는 단독 진단 도구로 남는다. 현재 `terminology.findings.json`이 비어 있으므로 기존 카드(REQ-001~009)에 회귀 영향 없음.

- 결정일: 2026-05-23
  결정: 카테고리 라벨은 `TRACE`/`CARD`/`REF`/`TRC`/`BE`/`FE`/`SCN`/`TRM` 8개로 고정한다. 카테고리 → finding owner 매핑은 다음과 같다.
  이유: `docs/harness/data-contracts.md`의 finding `owner` enum과 1:1로 떨어진다. `TRACE`는 `state.requirements[]`를 selectedIds로 다시 카운트한 RED/GREEN/total, `CARD`는 `requirement-cards.findings.json`(CARD-*), `REF`는 `cross-artifact.findings.json`의 REF-* 룰, `TRC`는 같은 파일의 TRC-* 룰(error severity 한정), `BE`는 `back-end-standards.findings.json`, `FE`는 `front-end-standards.findings.json`, `SCN`은 `scenarios.findings.json`, `TRM`은 `terminology.findings.json`.
  결정자: 사용자
  영향: `gate.mjs`의 출력 라벨은 명세된 8개만 사용한다. 새 owner가 추가되면 카드 신규 결정으로 카테고리를 늘린다. TRC 경고(TRC-COV-01/02)는 차단하지 않고 정보 출력만 한다(현 `gate-trace.mjs` 정책과 동일).

- 결정일: 2026-05-23
  결정: 단일 카드 필터(`gate.mjs --requirement REQ-XXX`)에서 finding은 `evaluate-trace-state.mjs`의 FE-*/SCN-* 정책과 동일하게 `finding.requirements[]` 교집합으로 거른다. `requirements: []` 전역 finding은 단일 카드 게이트에서 차단되지 않는다.
  이유: REQ-009에서 SCN-* 단일 카드 필터 정책을 명문화했고 FE-*도 같은 규칙으로 떨어져 있다. BE/CARD/REF/TRC/TRM도 같은 규칙으로 통일하면 사용자가 한 가지 정책만 기억하면 된다. 글로벌 위반은 `validateHarness` 전체 게이트에서만 차단된다.
  결정자: 사용자
  영향: `gate.mjs`는 CLI `--requirement` 인자(우선) 또는 `trace.state.json`의 `filter` 배열로 selectedIds를 정해, 그 카드에 귀속된 finding만 카테고리별 카운트에 합산한다. TRACE 카운트도 같은 selectedIds로 `state.requirements[]`를 다시 카운트한다(`state.summary`의 미리 계산된 값은 신뢰하지 않음). 단일 카드 작업자는 다른 카드 또는 글로벌에 귀속된 BE/TRM 위반에 가로막히지 않는다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-010-unified-harness-gate.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-23
  검증 설계: `docs/scenarios/REQ-010-unified-harness-gate.feature`의 10개 Scenario가 카드 수용 기준 10개를 1:1 `Covers:`로 연결한다.
  도구 Skeleton: `tools/harness/gate.mjs` 신규. 입력은 `build/harness/state/trace.state.json` + `build/harness/findings/{requirement-cards,cross-artifact,back-end-standards,front-end-standards,scenarios,terminology}.findings.json` 6종. 누락 입력은 누락 경로와 안내 메시지를 출력하고 exit 2. CLI 인자 `--check`, `--require-blue`, `--requirement REQ-XXX`(반복 가능), `--quiet` 지원. CATEGORY_ORDER 상수로 8개 카테고리 라벨(`TRACE`/`CARD`/`REF`/`TRC`/`BE`/`FE`/`SCN`/`TRM`) 고정. TRC는 ruleId `TRC-*` error severity만 차단(TRC-COV-* warning은 정보 출력). TRM은 `strictSeverity: error` 차단. TRACE 카운트는 `state.requirements[]`에서 selectedIds로 다시 카운트(`state.summary` 신뢰 안 함). `gate-trace.mjs` 삭제, `trace-requirements.mjs` 최종 spawn 대상을 `gate.mjs`로 교체.
  데이터 계약: Skeleton 단계에서 `docs/harness/data-contracts.md` "게이트 (Layer 4)" 섹션에 입력 3종 + 8개 카테고리 매핑 표 + exit code 정책 + TRACE selectedIds 재카운트 정책 명시. `docs/harness/rule-namespaces.md` Layer 4 섹션에 8개 카테고리 분기 갱신.
  추적 정책: `구현 대상: harness`. 사용자-facing API/화면 연결 요구 없음. 10개 Scenario `Covers:`가 10개 AC를 1:1 커버하면 GREEN.
  Gradle 실행 순서: `validateHarness`/`validateRequirementCard`/`validateRequirementCardBlue`가 `validateStandardsStrict` 직접 의존을 `validateStandards`(non-strict, findings emit only)로 교체. 호출 진입점(`trace-requirements.mjs`)은 유지. test 태스크의 `mustRunAfter`도 `validateStandards`만 남김.
  게이트 정책: TRM strict 차단 정책 도입(`gate.mjs`가 `terminology.findings.json`의 `strictSeverity: error`까지 차단). BE-* error 차단 신규 흡수. `validateTerminologyStrict`/`validateStandardsStrict`는 단독 진단 도구로 남고 통합 게이트 체인에서는 빠짐.
  표준 용어: 추가 등록 없음.
  표준/문서 갱신: `docs/standards/terminology.md`(TRM strict 차단 반영), `docs/standards/requirement-card.md`(validateHarness/validateRequirementCard 설명 갱신), `AGENTS.md`(검증 명령 표 + 11단계 절차 갱신), `docs/harness/overview.md`(마이그레이션 중 문장 + 도구 리스트 갱신).
  검증: `./gradlew compileJava generateHarnessSourceIndex` BUILD SUCCESSFUL. `./gradlew test` BUILD SUCCESSFUL. `node tools/harness/gate.mjs --check` (global) → exit=1 TRACE=red=1 (REQ-010 RED 차단). `node tools/harness/gate.mjs --check --requirement REQ-001` (global state 위) → exit=0 (filter narrow 동작). `node tools/harness/gate.mjs --check --requirement REQ-010` → exit=1 TRACE=red=1. 필수 finding 파일 누락 → exit=2 + 누락 경로 출력. `./gradlew traceRequirementCard -Preq=REQ-010` Card structure issues=0, State=RED(Acceptance Test 부재). 전체 trace에서 total=10 red=1 blue=9.
  승인자: 사용자
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-23
  리뷰자: 사용자
  확인: `back-end/src/test/java/com/example/bddworkflow/harness/UnifiedHarnessGateAcceptanceTest.java`의 10개 `@Test × @Covers`가 카드 수용 기준 10개를 1:1로 검증한다. fixture는 production 경로(`build/harness/state/`, `build/harness/findings/`)의 파일을 임시 백업한 뒤 in-memory ObjectNode로 만든 JSON으로 덮어쓰고, gate.mjs를 ProcessBuilder로 호출해 exit code와 stdout 카테고리 라벨로 검증한 후 원본을 복구한다. AC1은 정상 fixture로 exit=0 + "gate: pass" 확인 + back-end-standards.findings.json 누락 시 exit=2 + 누락 경로 출력 확인. AC2는 7개 owner에 error finding을 동시에 주입하고 RED state까지 더해 8개 카테고리 라벨이 stdout에 분리되어 출력됨을 확인. AC3/AC4는 단독 finding으로 BE/TRM 카테고리만 차단. AC5는 RED/CARD/REF/TRC/FE/SCN 6개 카테고리를 각각 단독 fixture로 차단 확인. AC6은 GREEN 카드로 --check 통과/--require-blue 차단 분기 확인. AC7은 REQ-A/REQ-B 2개 카드 + REQ-B 귀속 + 전역 finding fixture로 단일 카드 필터 교집합 정책과 전역 finding 단일 카드 게이트 제외 정책 확인. AC8/AC9/AC10은 build.gradle, trace-requirements.mjs, 4개 표준/하네스 문서 텍스트를 직접 grep으로 검증. `./gradlew test --tests UnifiedHarnessGateAcceptanceTest` 10/10 PASSED, `traceRequirementCard -Preq=REQ-010` State=GREEN.
  결과: 승인

## 열린 질문

- 없음
