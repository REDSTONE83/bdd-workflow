@REQ-010
Feature: 통합 하네스 게이트 도입

  Scenario: gate.mjs가 3종 입력을 읽어 단일 게이트 결과를 만든다
    Covers:
      - `tools/harness/gate.mjs`는 `build/harness/state/trace.state.json`, `build/harness/findings/*.findings.json`, `build/harness/findings/terminology.findings.json`을 읽어 단일 게이트 결과(exit code + 카테고리별 요약)를 만든다

    Given trace.state.json과 findings/*.findings.json과 terminology.findings.json이 모두 준비되어 있다
    When 개발자가 gate.mjs를 실행한다
    Then gate.mjs는 세 입력을 모두 읽어 단일 결과(exit code + 카테고리별 요약)를 만든다

  Scenario: 실패 사유가 8개 카테고리 라벨로 분리된다
    Covers:
      - `gate.mjs`는 실패 사유를 `TRACE`/`CARD`/`REF`/`TRC`/`BE`/`FE`/`SCN`/`TRM` 카테고리 라벨로 분리해서 보고한다

    Given 게이트 입력에 여러 종류의 위반이 섞여 있다
    When 개발자가 gate.mjs를 실행한다
    Then 실패 사유가 TRACE/CARD/REF/TRC/BE/FE/SCN/TRM 카테고리 라벨로 분리되어 보고된다

  Scenario: BE-* error finding이 BE 카테고리로 차단된다
    Covers:
      - `gate.mjs --check`는 `back-end-standards.findings.json`에 `severity: error` finding이 있으면 BE 카테고리 실패로 차단한다

    Given back-end-standards.findings.json에 severity error finding이 있다
    When 개발자가 gate.mjs --check를 실행한다
    Then 게이트가 BE 카테고리 실패로 차단된다

  Scenario: TRM strictSeverity=error finding이 TRM 카테고리로 차단된다
    Covers:
      - `gate.mjs --check`는 `terminology.findings.json`에 `strictSeverity: error` finding이 있으면 TRM 카테고리 실패로 차단한다

    Given terminology.findings.json에 strictSeverity error finding이 있다
    When 개발자가 gate.mjs --check를 실행한다
    Then 게이트가 TRM 카테고리 실패로 차단된다

  Scenario: RED/CARD/REF/FE/SCN/TRC error finding이 각 카테고리로 차단된다
    Covers:
      - `gate.mjs --check`는 RED 카드, 카드 구조 위반(CARD-*), REF-* unknown reference, FE-* error, SCN-* error, TRC-* error finding이 있으면 각 카테고리 실패로 차단한다

    Given 게이트 입력에 RED 카드 또는 CARD-* 또는 REF-* 또는 FE-* 또는 SCN-* 또는 TRC-* error finding이 있다
    When 개발자가 gate.mjs --check를 실행한다
    Then 게이트가 해당 카테고리(TRACE/CARD/REF/FE/SCN/TRC) 실패로 차단된다

  Scenario: --require-blue는 GREEN 카드도 TRACE 카테고리로 차단한다
    Covers:
      - `gate.mjs --require-blue`는 `--check` 조건에 더해 GREEN 카드가 있으면 TRACE 카테고리 실패로 차단한다

    Given 게이트 입력에 GREEN 카드가 있고 RED는 없다
    When 개발자가 gate.mjs --check --require-blue를 실행한다
    Then 게이트가 TRACE 카테고리 실패(GREEN 카드 잔존)로 차단된다

  Scenario: --requirement 단일 카드 필터는 finding.requirements[] 교집합으로만 차단한다
    Covers:
      - `gate.mjs --requirement REQ-XXX`는 `finding.requirements[]`와 선택 카드 ID의 교집합으로 finding을 거른다. `requirements: []` 전역 finding은 단일 카드 게이트에서 차단되지 않고 `validateHarness` 전체 게이트에서만 차단된다

    Given 다른 카드에 귀속된 finding과 전역 finding(requirements 비어 있음)이 있다
    When 개발자가 gate.mjs --check --requirement REQ-XXX를 실행한다
    Then 단일 카드 게이트는 그 카드에 귀속된 finding으로만 차단되고 전역/타 카드 finding으로는 차단되지 않는다

  Scenario: Gradle 게이트 태스크가 trace-requirements 경유로 gate.mjs를 호출한다
    Covers:
      - `validateHarness`/`validateRequirementCard`/`validateRequirementCardBlue` Gradle 태스크는 `trace-requirements.mjs`를 호출하고 `trace-requirements.mjs`는 최종 단계로 `gate.mjs`를 호출한다. Gradle 태스크의 `validateStandardsStrict` 직접 의존은 `validateStandards`로 교체된다

    Given validateHarness/validateRequirementCard/validateRequirementCardBlue Gradle 태스크 정의가 갱신되었다
    When 사용자가 해당 Gradle 태스크 중 하나를 실행한다
    Then 태스크가 trace-requirements.mjs를 호출하고 그 마지막 단계가 gate.mjs를 호출하며 validateStandardsStrict 직접 의존이 validateStandards로 바뀌어 있다

  Scenario: gate-trace.mjs가 삭제되고 trace-requirements.mjs가 gate.mjs를 호출한다
    Covers:
      - `tools/harness/gate-trace.mjs`는 삭제되고 `tools/harness/trace-requirements.mjs`는 evaluate → render → `gate.mjs`를 직렬 spawn한다

    Given tools/harness/gate-trace.mjs 파일이 저장소에 없다
    When 개발자가 trace-requirements.mjs 구현을 확인한다
    Then trace-requirements.mjs는 evaluate-trace-state → render-trace-report → gate.mjs 순서로 직렬 spawn한다

  Scenario: 정책 변경과 출력 계약이 표준/하네스 문서에 반영된다
    Covers:
      - 본 요건의 정책 변경(terminology strict 차단)과 출력 계약(8개 카테고리 라벨, owner/rule prefix 매핑)이 `docs/standards/terminology.md`, `docs/standards/requirement-card.md`, `AGENTS.md`, `docs/harness/data-contracts.md`에 반영된다

    Given REQ-010이 terminology strict 차단 정책과 gate.mjs 출력 계약을 도입한다
    When 검토자가 표준/하네스 문서를 확인한다
    Then docs/standards/terminology.md, docs/standards/requirement-card.md, AGENTS.md가 validateHarness의 TRM strict 차단 정책을 설명하고 docs/harness/data-contracts.md가 gate.mjs 입력 3종/8개 카테고리 enum/owner/rule prefix 매핑/exit code 정책을 명시한다
