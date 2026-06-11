@REQ-029
Feature: 하네스 UI 검증 채널

  Scenario: 하네스 UI FE BDD 결과가 하네스 scope 수용 기준 판정에 들어간다
    Covers:
      - harness/ui Playwright FE BDD 테스트의 요건·수용 기준 메타데이터가 하네스 scope 테스트 인덱스로 수집된다
      - harness/ui Playwright 실행 결과가 하네스 scope 테스트 결과 인덱스에 병합되어 수용 기준 판정에 사용된다
      - 하네스 scope에서 (UI) 마커 수용 기준은 front-end 테스트의 커버와 결과로 PASS/FAIL이 판정된다

    Given harness/ui Playwright FE BDD 테스트가 요건과 수용 기준을 Covers로 연결한다
    And 해당 테스트 실행 결과가 준비되어 있다
    When 하네스가 하네스 scope 추적을 생성한다
    Then 테스트 인덱스에 요건과 수용 기준 연결이 수집된다
    And 실행 결과가 하네스 scope 테스트 결과에 포함된다
    And (UI) 수용 기준은 연결된 front-end 테스트 결과로 PASS 또는 FAIL이 판정된다

  Scenario: 하네스 검증은 최신 harness/ui FE BDD 결과를 사용한다
    Covers:
      - `npm run harness:validate`는 harness/ui FE BDD 테스트를 실행해 최신 결과로 판정한다

    Given harness/ui FE BDD 테스트가 실행 가능한 상태다
    When 개발자가 npm run harness:validate를 실행한다
    Then 하네스 검증 과정에 harness/ui FE BDD 테스트 실행이 포함된다
    And 추적 판정은 그 실행에서 나온 최신 결과를 사용한다

  Scenario: harness/ui 검증 결과가 없으면 UI 수용 기준이 RED로 남는다
    Covers:
      - harness/ui 테스트나 결과가 없는 (UI) 마커 수용 기준은 RED로 보고된다

    Given 하네스 scope 요건에 (UI) 수용 기준이 있다
    And 그 수용 기준을 커버하는 harness/ui 테스트 또는 실행 결과가 없다
    When 하네스가 하네스 scope 추적을 생성한다
    Then 해당 수용 기준은 RED로 보고된다

  Scenario: 하네스 UI Storybook 계약이 수집된 story와 빌드로 검증된다
    Covers:
      - Storybook 계약을 선언한 하네스 scope 요건은 harness/ui에서 수집한 story 인덱스와 대조되어, 선언한 표면이나 상태가 없으면 위반으로 보고된다
      - `npm run harness:validate`는 harness/ui Storybook build를 실행해 Skeleton 검토 표면이 빌드 가능한지 확인한다

    Given 하네스 scope 요건이 Storybook 계약을 선언한다
    When 개발자가 npm run harness:validate를 실행한다
    Then 하네스는 harness/ui에서 수집한 story 인덱스와 계약을 대조한다
    And 선언한 표면이나 상태가 없으면 위반으로 보고된다
    And harness/ui Storybook build가 검증 과정에 포함된다
