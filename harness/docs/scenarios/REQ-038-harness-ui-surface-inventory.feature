@REQ-038
Feature: 하네스 UI 표면 조회

  Scenario: AppShell 메뉴에서 표면 조회 화면으로 이동한다
    Covers:
      - AppShell 좌측 LNB에서 API/Entity/UI 표면 조회 화면으로 이동할 수 있다

    Given 하네스 작업자가 하네스 UI를 열었다
    When AppShell 좌측 LNB에서 API/Entity/UI 메뉴를 선택한다
    Then 표면 조회 화면으로 이동한다

  Scenario: 표면 종류별 수와 탭을 조회한다
    Covers:
      - 표면 조회 화면은 API, Entity, UI 표면 수를 요약하고 세 표면을 탭별 목록형 카드로 조회할 수 있다

    Given 선택한 scope에 표면 source index 산출물이 준비되어 있다
    When 하네스 작업자가 표면 조회 화면을 연다
    Then API, Entity, UI 표면 수가 보인다
    And API, Entity, UI 탭으로 목록형 카드를 전환할 수 있다

  Scenario: API 목록형 카드를 조회한다
    Covers:
      - API 탭은 method, path, operationId, 연결 요건, 구현 위치, 응답 코드와 Request/Response 구성을 카드 펼침으로 표시한다

    Given 선택한 scope에 API source index가 있다
    When 하네스 작업자가 API 탭을 연다
    Then API 카드에 method, path, operationId, 연결 요건, 구현 위치가 보인다
    And API 카드에서 Request/Response 구성과 중첩 참조 객체를 펼쳐 확인할 수 있다
    And API 카드에 응답 코드가 보인다

  Scenario: Entity 목록형 카드를 조회한다
    Covers:
      - Entity 탭은 className, table, 연결 요건, 구현 위치, listener, 컬럼 정보를 카드에 표시한다

    Given 선택한 scope에 Entity source index가 있다
    When 하네스 작업자가 Entity 탭을 연다
    Then Entity 카드에 className, table, 연결 요건, 구현 위치가 보인다
    And Entity 카드에 listener와 컬럼 정보가 보인다

  Scenario: UI 표면 목록형 카드를 조회한다
    Covers:
      - UI 탭은 Page, Route, Story, route 또는 Storybook 식별자, 연결 요건, 구현 위치, Storybook 검토 링크, play/assertion 여부를 카드에 표시한다

    Given 선택한 scope에 UI source index가 있다
    When 하네스 작업자가 UI 탭을 연다
    Then UI 카드에 Page, Route, Story와 route 또는 Storybook 식별자가 보인다
    And UI 카드에 연결 요건, 구현 위치, Storybook 검토 링크, play/assertion 여부가 보인다

  Scenario: 현재 탭의 표면 목록을 검색한다
    Covers:
      - 검색어로 현재 탭의 표면 목록을 이름, 경로, 파일, 연결 요건, 주요 식별자 기준으로 좁힐 수 있다

    Given 하네스 작업자가 표면 조회 화면에서 표면 목록을 보고 있다
    When 이름, 경로, 파일, 연결 요건, 주요 식별자 중 하나에 포함된 검색어를 입력한다
    Then 현재 탭 목록에는 검색어와 일치하는 표면만 남는다

  Scenario: 표면 조회 DTO는 source index 값을 보존한다
    Covers:
      - 하네스 UI 서버가 제공하는 표면 조회 DTO는 source index의 API, Entity, UI 표면 주요 값을 보존한다

    Given 선택한 scope의 source index에 API, Entity, UI 표면 항목이 있다
    When 하네스 UI 서버가 표면 조회 DTO를 만든다
    Then DTO의 method, path, operationId, className, table, UI kind, route, Storybook 식별자, 연결 요건, 구현 위치 값은 source index 항목과 일치한다
