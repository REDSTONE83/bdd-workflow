@REQ-012
Feature: AC 단위 검증 채널 마커와 하네스 게이트

  Scenario: 카드 파서가 검증 채널 마커를 인식해 AC에 target을 부여한다
    Covers:
      - 카드 파서는 수용 기준 bullet 시작에 위치한 `(API)`, `(UI)`, `(E2E)`, `(STATIC)` 마커를 인식해 해당 AC의 target으로 부여한다

    Given 카드의 수용 기준 bullet이 "- (API) 어떤 결과 문장" 형태로 작성되어 있다
    When 하네스가 카드를 파싱한다
    Then 각 AC 엔트리에 target 필드가 API/UI/E2E/STATIC 중 하나로 부여되고, text 필드는 마커가 제거된 원문으로 저장된다

  Scenario: 마커가 없는 AC는 카드 구조 오류로 차단된다
    Covers:
      - 마커가 없는 AC는 카드 구조 오류로 차단한다

    Given 카드의 수용 기준 bullet 앞에 마커가 없다
    When 개발자가 카드 정적 검증을 실행한다
    Then 카드 정적 검증이 CARD-AC-MARKER-MISSING finding으로 실패한다

  Scenario: 유효 마커 외 토큰은 카드 정적 검증이 차단한다
    Covers:
      - AC 마커가 `API`, `UI`, `E2E`, `STATIC` 외 값을 가지면 카드 정적 검증이 오류로 차단한다

    Given 카드의 수용 기준 bullet에 `(BE)`처럼 허용 목록 외 토큰이 마커로 들어 있다
    When 개발자가 카드 정적 검증을 실행한다
    Then 카드 정적 검증이 CARD-AC-MARKER-INVALID finding으로 실패한다

  Scenario: AC 마커는 @Covers와 Covers 값에 포함되지 않는다
    Covers:
      - AC 마커는 백엔드 `@Covers`와 FE BDD `Covers` 값에 포함되지 않는다

    Given 카드의 AC가 "- (API) 어떤 결과 문장"으로 작성되어 있다
    When 백엔드 Acceptance Test와 FE BDD 테스트가 같은 AC를 커버한다
    Then 각 테스트의 @Covers와 Covers 값은 마커를 제외한 "어떤 결과 문장"과 정확히 일치한다

  Scenario: API target AC는 백엔드 Acceptance Test 커버가 없으면 차단된다
    Covers:
      - 통합 게이트는 target이 `API`인 AC에 백엔드 Acceptance Test 커버가 없으면 차단한다

    Given target이 API인 AC가 있고 같은 카드 ID를 가진 백엔드 Acceptance Test가 그 AC를 커버하지 않는다
    When 개발자가 scope별 validate 또는 gate.mjs --check를 실행한다
    Then 통합 게이트가 TRACE 카테고리 실패로 차단한다

  Scenario: UI target AC는 FE BDD 테스트 커버가 없으면 차단된다
    Covers:
      - 통합 게이트는 target이 `UI`인 AC에 FE BDD 테스트 커버가 없으면 차단한다

    Given target이 UI인 AC가 있고 같은 카드 ID를 가진 FE BDD 테스트가 그 AC를 커버하지 않는다
    When 개발자가 scope별 validate 또는 gate.mjs --check를 실행한다
    Then 통합 게이트가 TRACE 카테고리 실패로 차단한다

  Scenario: E2E target AC는 사용자 여정 테스트 커버가 없으면 차단된다
    Covers:
      - 통합 게이트는 target이 `E2E`인 AC에 Playwright 사용자 여정 테스트 커버가 없으면 차단한다

    Given target이 E2E인 AC가 있고 같은 카드 ID를 가진 Playwright 사용자 여정 테스트가 그 AC를 커버하지 않는다
    When 개발자가 scope별 validate 또는 gate.mjs --check를 실행한다
    Then 통합 게이트가 TRACE 카테고리 실패로 차단한다

  Scenario: 추적 리포트가 AC별 target과 검증 상태를 함께 표시한다
    Covers:
      - 추적 리포트는 각 AC의 target 마커와 검증 상태를 함께 표시한다

    Given 같은 카드에 API/UI/E2E/STATIC target AC가 섞여 있다
    When 개발자가 npm run harness:trace -- --requirement REQ-012를 실행해 trace-report.md를 생성한다
    Then 각 AC 행에 (API)/(UI)/(E2E)/(STATIC) 마커와 검증 상태가 함께 표시된다

  Scenario: 표준 문서에 마커 작성 규칙과 오류 규칙이 명시된다
    Covers:
      - 표준 문서에는 마커 작성 규칙, 유효값, 오류 규칙이 명시된다

    Given 개발자가 마커 사용법을 확인하려고 한다
    When `harness/docs/standards/requirement-card.md`를 연다
    Then 수용 기준 절에 마커 토큰(API/UI/E2E/STATIC), bullet 위치, 마커 누락 차단 정책, 유효값 외 토큰 차단 정책이 명시되어 있다
