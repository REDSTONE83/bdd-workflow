@REQ-012
Feature: AC 단위 테스트 대상 마커와 하네스 게이트 적용

  Scenario: 카드 파서가 (BE)/(FE)/(FS) 마커를 인식해 AC에 target을 부여한다
    Covers:
      - 카드 파서는 수용 기준 bullet 시작에 위치한 `(BE)`, `(FE)`, `(FS)` 마커를 인식해 해당 AC의 target으로 부여한다

    Given 카드의 수용 기준 bullet이 "- (BE) 어떤 결과 문장" 형태로 작성되어 있다
    When 하네스가 카드를 파싱한다
    Then 각 AC 엔트리에 target 필드가 BE/FE/FS 중 하나로 부여되고, text 필드는 마커가 제거된 원문으로 저장된다

  Scenario: 마커가 없는 AC는 카드 구현 대상에 따라 fallback된다
    Covers:
      - 마커가 없는 AC는 카드 `구현 대상` 값에 따라 BE/FE/FS로 결정된다

    Given 카드의 수용 기준 bullet 앞에 마커가 없다
    When 하네스가 카드를 파싱하고 게이트가 target을 결정한다
    Then 마커 없는 AC의 target은 `back-end`→BE, `front-end`→FE, `full-stack`→FS, `harness`→어느 한쪽이라도 커버로 fallback된다

  Scenario: 유효 마커 외 토큰은 카드 정적 검증이 차단한다
    Covers:
      - AC 마커가 `BE`, `FE`, `FS` 외 값을 가지면 카드 정적 검증이 오류로 차단한다

    Given 카드의 수용 기준 bullet에 `(API)`처럼 허용 목록 외 토큰이 마커로 들어 있다
    When 개발자가 validateRequirementCard를 실행한다
    Then 카드 정적 검증이 CARD-AC-TARGET-INVALID finding으로 실패한다

  Scenario: AC 마커는 @Covers와 Covers 값에 포함되지 않는다
    Covers:
      - AC 마커는 백엔드 `@Covers`와 FE BDD `Covers` 값에 포함되지 않는다

    Given 카드의 AC가 "- (BE) 어떤 결과 문장"으로 작성되어 있다
    When 백엔드 Acceptance Test와 FE BDD 테스트가 같은 AC를 커버한다
    Then 각 테스트의 @Covers와 Covers 값은 마커를 제외한 "어떤 결과 문장"과 정확히 일치한다

  Scenario: BE target AC는 백엔드 Acceptance Test 커버가 없으면 차단된다
    Covers:
      - 통합 게이트는 target이 `BE`인 AC에 백엔드 Acceptance Test 커버가 없으면 차단한다

    Given target이 BE인 AC가 있고 같은 카드 ID를 가진 백엔드 Acceptance Test가 그 AC를 커버하지 않는다
    When 개발자가 validateHarness 또는 gate.mjs --check를 실행한다
    Then 통합 게이트가 TRACE 카테고리 실패로 차단한다

  Scenario: FE target AC는 FE BDD 테스트 커버가 없으면 차단된다
    Covers:
      - 통합 게이트는 target이 `FE`인 AC에 FE BDD 테스트 커버가 없으면 차단한다

    Given target이 FE인 AC가 있고 같은 카드 ID를 가진 FE BDD 테스트가 그 AC를 커버하지 않는다
    When 개발자가 validateHarness 또는 gate.mjs --check를 실행한다
    Then 통합 게이트가 TRACE 카테고리 실패로 차단한다

  Scenario: FS target AC는 양쪽 어느 한쪽이라도 커버가 없으면 차단된다
    Covers:
      - 통합 게이트는 target이 `FS`인 AC에 백엔드와 FE 어느 한쪽이라도 커버가 없으면 차단한다

    Given target이 FS인 AC가 있고 백엔드 Acceptance Test 또는 FE BDD 테스트 중 어느 한쪽이 그 AC를 커버하지 않는다
    When 개발자가 validateHarness 또는 gate.mjs --check를 실행한다
    Then 통합 게이트가 TRACE 카테고리 실패로 차단한다

  Scenario: 추적 리포트가 AC별 target과 양쪽 커버 상태를 함께 표시한다
    Covers:
      - 추적 리포트는 각 AC의 target 마커와 백엔드/FE 커버 상태를 함께 표시한다

    Given 같은 카드에 BE/FE/FS target AC가 섞여 있다
    When 개발자가 traceRequirementCard를 실행해 trace-report.md를 생성한다
    Then 각 AC 행에 (BE)/(FE)/(FS) 마커와 백엔드·FE 별 커버 상태가 함께 표시된다

  Scenario: 표준 문서에 마커 작성 규칙과 fallback이 명시된다
    Covers:
      - 표준 문서에는 마커 작성 규칙, 유효값, fallback 규칙이 명시된다

    Given 개발자가 마커 사용법을 확인하려고 한다
    When `docs/standards/requirement-card.md`를 연다
    Then 수용 기준 절에 마커 토큰(BE/FE/FS), bullet 위치, 마커가 없을 때의 fallback 규칙, 유효값 외 토큰 차단 정책이 명시되어 있다
