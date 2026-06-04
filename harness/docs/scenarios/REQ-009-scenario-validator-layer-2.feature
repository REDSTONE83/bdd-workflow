@REQ-009
Feature: Gherkin 시나리오 SCN-* 구조 검사

  Scenario: 시나리오 구조 위반이 SCN-* finding으로 정규화된다
    Covers:
      - Gherkin `.feature` 파일의 구조 위반은 `build/harness/findings/scenarios.findings.json`에 SCN-* finding으로 정규화되어 보고된다

    Given 시나리오 인덱스에 구조 위반 issue가 들어 있다
    When 개발자가 시나리오 검사를 실행한다
    Then 위반은 build/harness/findings/scenarios.findings.json에 SCN-* finding으로 보고된다

  Scenario: Feature 헤더가 없는 파일은 오류로 보고된다
    Covers:
      - Feature 헤더가 없는 `.feature` 파일은 검사 결과에 오류로 보고된다

    Given .feature 파일에 Feature 헤더가 없다
    When 개발자가 시나리오 검사를 실행한다
    Then Feature 헤더 부재가 오류로 보고된다

  Scenario: @REQ-XXX 태그가 없는 Feature는 오류로 보고된다
    Covers:
      - `@REQ-XXX` 태그가 없는 Feature는 검사 결과에 오류로 보고된다

    Given Feature 헤더에 @REQ-XXX 태그가 없다
    When 개발자가 시나리오 검사를 실행한다
    Then 요건 태그 부재가 오류로 보고된다

  Scenario: 지원하지 않는 Gherkin 키워드 사용은 오류로 보고된다
    Covers:
      - 지원하지 않는 Gherkin 키워드(`Background`, `Scenario Outline` 등)를 사용한 `.feature`는 검사 결과에 오류로 보고된다

    Given .feature 파일이 Background 또는 Scenario Outline 같은 미지원 키워드를 사용한다
    When 개발자가 시나리오 검사를 실행한다
    Then 미지원 키워드 사용이 오류로 보고된다

  Scenario: SCN-* error finding이 있으면 npm run harness:validate가 차단된다
    Covers:
      - `npm run harness:validate` 게이트는 SCN-* error finding을 발견하면 실패한다

    Given 시나리오 검사가 SCN-* error finding을 보고했다
    When 개발자가 npm run harness:validate 게이트를 실행한다
    Then 게이트가 SCN-* error 사유로 실패한다
