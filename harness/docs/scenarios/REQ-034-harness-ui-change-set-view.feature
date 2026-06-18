@REQ-034
Feature: 하네스 UI Change Set 진행 조회

  Scenario: Change Set 목록은 작업 단위 요약을 보여준다
    Covers:
      - Change Set 목록은 제목, 상태, 요청일, 영향 요건 수, 열린 논의 수를 표시한다

    Given 선택한 scope에 Change Set 리포트가 준비되어 있다
    When 하네스 작업자가 Change Set 화면을 연다
    Then Change Set 목록에 제목, 상태, 요청일, 영향 요건 수, 열린 논의 수가 보인다

  Scenario: Change Set 상세에서 요청과 검증 정보를 확인한다
    Covers:
      - Change Set 카드를 펼치면 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의, 영향 요건과 영향 요건의 추적 상태를 확인할 수 있다

    Given 하네스 작업자가 Change Set 목록을 보고 있다
    When 하나의 Change Set 카드를 펼친다
    Then 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의, 영향 요건과 영향 요건의 추적 상태를 확인할 수 있다

  Scenario: Change Set 목록은 제목, 상태, 선택한 영향 요건으로 필터링된다
    Covers:
      - Change Set 목록은 제목, 상태, 선택한 영향 요건으로 필터링할 수 있고 선택된 영향 요건 필터는 요건 ID만 표시하며 돋보기 아이콘으로 검색/선택 대화상자를 연다

    Given 선택한 scope에 여러 Change Set 리포트가 준비되어 있다
    When 하네스 작업자가 제목과 상태를 입력하고 돋보기 아이콘으로 영향 요건 하나를 선택한다
    Then 조건에 맞는 Change Set 카드만 목록에 남는다
    And 영향 요건 필터에는 선택한 요건 ID만 보인다

  Scenario: 영향 요건에서 요건 상세로 이동한다
    Covers:
      - 영향 요건에서 해당 요건의 상세 화면으로 이동할 수 있다

    Given 하네스 작업자가 펼쳐진 Change Set 카드에서 영향 요건을 보고 있다
    When 영향 요건 중 하나를 선택한다
    Then 해당 요건의 상세 화면으로 이동한다
