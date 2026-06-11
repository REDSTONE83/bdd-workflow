@REQ-034
Feature: 하네스 UI Change Set 진행 조회

  Scenario: Change Set 목록은 작업 단위와 영향 요건 상태를 보여준다
    Covers:
      - Change Set 목록은 제목, 상태, 요청일, 영향 요건과 영향 요건의 추적 상태를 표시한다

    Given 선택한 scope에 Change Set 리포트가 준비되어 있다
    When 하네스 작업자가 Change Set 화면을 연다
    Then Change Set 목록에 제목, 상태, 요청일, 영향 요건과 영향 요건의 추적 상태가 보인다

  Scenario: Change Set 상세에서 요청과 검증 정보를 확인한다
    Covers:
      - Change Set을 선택하면 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의를 확인할 수 있다

    Given 하네스 작업자가 Change Set 목록을 보고 있다
    When 하나의 Change Set을 선택한다
    Then 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의를 확인할 수 있다

  Scenario: 영향 요건에서 요건 상세로 이동한다
    Covers:
      - 영향 요건에서 해당 요건의 상세 화면으로 이동할 수 있다

    Given 하네스 작업자가 Change Set 상세에서 영향 요건을 보고 있다
    When 영향 요건 중 하나를 선택한다
    Then 해당 요건의 상세 화면으로 이동한다
