@REQ-036
Feature: 하네스 UI 표준 용어 조회

  Scenario: AppShell 메뉴에서 표준 용어 화면으로 이동한다
    Covers:
      - AppShell 좌측 LNB에서 표준 용어 화면으로 이동할 수 있다

    Given 하네스 작업자가 하네스 UI를 열었다
    When AppShell 좌측 LNB에서 표준 용어 메뉴를 선택한다
    Then 표준 용어 화면으로 이동한다

  Scenario: 표준 용어 전체 목록을 조회한다
    Covers:
      - 표준 용어 화면은 전체 term key 목록을 승인 상태, 한국어 이름, 영어 이름, 의미, source file과 함께 표시한다

    Given 선택한 scope에 terminology.index.json 산출물이 준비되어 있다
    When 하네스 작업자가 표준 용어 화면을 연다
    Then 전체 term key 목록이 보인다
    And 각 표준 용어의 승인 상태, 한국어 이름, 영어 이름, 의미, source file이 보인다

  Scenario: 표준 용어 목록을 검색한다
    Covers:
      - term key, 한국어 이름, 영어 이름, 의미, 허용 표현, 금지 표현, 코드 이름으로 표준 용어 목록을 검색할 수 있다

    Given 하네스 작업자가 표준 용어 화면에서 전체 목록을 보고 있다
    When term key, 한국어 이름, 영어 이름, 의미, 허용 표현, 금지 표현, 코드 이름 중 하나에 포함된 검색어를 입력한다
    Then 검색어와 일치하는 표준 용어만 목록에 보인다

  Scenario: 도메인과 승인 상태로 표준 용어 목록을 좁힌다
    Covers:
      - 도메인과 승인 상태로 표준 용어 목록을 좁힐 수 있다

    Given 하네스 작업자가 표준 용어 화면에서 전체 목록을 보고 있다
    When 도메인 필터와 승인 상태 필터를 선택한다
    Then 선택한 도메인과 승인 상태에 맞는 표준 용어만 목록에 보인다

  Scenario: 표준 용어 상세를 확인한다
    Covers:
      - 표준 용어를 선택하면 의미, 허용 표현, 금지 표현, 코드 이름, note, reason을 확인할 수 있다

    Given 하네스 작업자가 표준 용어 목록을 보고 있다
    When 표준 용어 하나를 선택한다
    Then 선택한 표준 용어의 의미, 허용 표현, 금지 표현, 코드 이름, note, reason이 보인다

  Scenario: 표준 용어 DTO는 terminology index 값을 보존한다
    Covers:
      - 하네스 UI 서버가 제공하는 표준 용어 데이터는 `terminology.index.json`의 term key, status, sourceFile, meaning, allow, ban, names 값을 보존한다

    Given 선택한 scope의 terminology.index.json에 표준 용어 항목이 있다
    When 하네스 UI 서버가 표준 용어 화면 DTO를 만든다
    Then DTO의 term key, status, sourceFile, meaning, allow, ban, names 값은 terminology.index.json 항목과 일치한다
