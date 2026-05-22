@REQ-001
Feature: 이메일 회원 가입

  Scenario: 처음 가입하는 사용자가 정상적으로 계정을 만든다
    Covers:
      - 유효한 정보이면 계정이 생성된다

    Given 이메일 hong@example.com 은 아직 가입되어 있지 않다
    When 사용자가 이름, 이메일, 8자 이상 비밀번호로 가입을 요청한다
    Then 계정이 생성된다
    And 응답으로 사용자 식별자와 이메일, 이름이 반환된다

  Scenario: 이미 가입된 이메일로 다시 가입을 시도해 실패한다
    Covers:
      - 중복 이메일이면 가입이 거절된다

    Given 이메일 hong@example.com 으로 가입된 사용자가 이미 존재한다
    When 다른 사용자가 같은 이메일과 유효한 비밀번호로 가입을 요청한다
    Then 가입이 거절되고 중복 이메일 오류 코드가 반환된다
    And 오류 응답의 details 에 email 필드가 표시된다

  Scenario: 비밀번호가 짧아 가입을 거절당한다
    Covers:
      - 비밀번호가 8자 미만이면 가입이 거절된다

    Given 이메일 hong@example.com 은 아직 가입되어 있지 않다
    When 사용자가 8자 미만 비밀번호로 가입을 요청한다
    Then 가입이 거절되고 입력 검증 실패 오류 코드가 반환된다
    And 계정이 저장되지 않는다
