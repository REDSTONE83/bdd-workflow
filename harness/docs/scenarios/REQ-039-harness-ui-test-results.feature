@REQ-039
Feature: 하네스 UI 테스트 결과 조회

  Scenario: AppShell 메뉴에서 테스트 결과 화면으로 이동한다
    Covers:
      - AppShell 좌측 LNB에서 테스트 결과 화면으로 이동할 수 있다

    Given 하네스 작업자가 하네스 UI를 열었다
    When AppShell 좌측 LNB에서 테스트 결과 메뉴를 선택한다
    Then 테스트 결과 화면으로 이동한다

  Scenario: 테스트 결과 요약과 목록을 조회한다
    Covers:
      - 테스트 결과 화면은 선택한 scope의 테스트 총수와 PASS, FAIL, SKIP, NOT_RUN 수를 요약하고 테스트 목록을 표시한다

    Given 선택한 scope에 test source index와 test-results index 산출물이 준비되어 있다
    When 하네스 작업자가 테스트 결과 화면을 연다
    Then 전체 테스트 수와 PASS, FAIL, SKIP, NOT_RUN 수가 보인다
    And 테스트 목록이 보인다

  Scenario: 테스트 행의 수행 정보와 위치를 조회한다
    Covers:
      - 각 테스트 행은 테스트 구분, 런타임, 수행 상태, 연결 요건 ID와 제목, 구현 위치, Cover 문구와 연결된 요건 ID와 제목을 표시한다

    Given 테스트 결과 화면에 수행 결과가 연결된 테스트가 보인다
    When 하네스 작업자가 테스트 행을 확인한다
    Then 테스트 행에 테스트 구분과 런타임과 수행 상태가 보인다
    And 연결 요건 ID와 제목, 구현 위치가 보인다
    And 결과 위치는 보이지 않는다
    And Cover 문구와 연결된 요건 ID와 제목이 보인다

  Scenario: 테스트 목록을 검색어와 필터로 좁힌다
    Covers:
      - 검색어, 테스트 구분, 런타임, 수행 상태로 테스트 목록을 좁힐 수 있다

    Given 테스트 결과 화면에 서로 다른 런타임과 수행 상태의 테스트가 보인다
    When 하네스 작업자가 검색어, 테스트 구분, 런타임, 수행 상태를 선택한다
    Then 테스트 목록에는 네 조건에 맞는 테스트만 남는다

  Scenario: 테스트 결과 freshness 이슈를 확인한다
    Covers:
      - 테스트 결과 인덱스에 freshness 이슈가 있으면 화면에 이슈 목록을 표시한다

    Given test-results index에 freshness 이슈가 있다
    When 하네스 작업자가 테스트 결과 화면을 연다
    Then 이슈 종류, 런타임, 사유가 목록 위에 보인다

  Scenario: 테스트 결과 DTO는 source index와 result index 값을 보존한다
    Covers:
      - 하네스 UI 서버가 제공하는 테스트 결과 DTO는 test source index와 test-results index의 식별자, 테스트 구분, 런타임, 상태, 요건 ID와 제목, 구현 위치 값을 보존한다

    Given 선택한 scope의 test source index와 test-results index에 테스트 정의와 수행 결과가 있다
    When 하네스 UI 서버가 테스트 결과 DTO를 만든다
    Then DTO의 식별자, 테스트 구분, 런타임, 상태, 요건 ID와 제목, 구현 위치 값은 산출물 항목과 일치한다
    And API 테스트의 구현 위치와 요건 ID와 제목은 백엔드 테스트 source index와 일치한다
