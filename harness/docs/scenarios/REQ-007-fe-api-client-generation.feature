@REQ-007
Feature: OpenAPI 기반 FE API 클라이언트 생성

  Scenario: 개발자가 한 명령으로 API client를 생성한다
    Covers:
      - 프런트엔드 개발자는 한 명령으로 현재 OpenAPI 계약 기준의 API client를 생성할 수 있다

    Given 현재 OpenAPI 계약이 빌드 산출물로 준비되어 있다
    When 프런트엔드 개발자가 API client 생성 명령을 실행한다
    Then 현재 계약 기준의 API client가 생성된다

  Scenario: 생성 결과가 정해진 경계 안에만 남는다
    Covers:
      - 생성된 API client는 `app/front-end/src/api/generated` 아래에만 기록된다

    Given 현재 OpenAPI 계약이 빌드 산출물로 준비되어 있다
    When 프런트엔드 개발자가 API client 생성 명령을 실행한다
    Then 생성된 API client 파일은 app/front-end/src/api/generated 아래에만 남는다
    And 다른 프런트엔드 소스 영역은 생성 과정에서 바뀌지 않는다

  Scenario: 생성 시 계약 메타파일이 함께 갱신된다
    Covers:
      - API client를 생성하면 현재 OpenAPI 계약을 가리키는 메타파일이 함께 갱신된다

    Given 현재 OpenAPI 계약이 빌드 산출물로 준비되어 있다
    When 프런트엔드 개발자가 API client 생성 명령을 실행한다
    Then 생성 client가 어떤 OpenAPI 계약에서 만들어졌는지 알 수 있는 메타파일이 함께 갱신된다

  Scenario: 오래된 API client를 검사 결과에서 확인한다
    Covers:
      - OpenAPI 계약이 바뀐 뒤 API client를 다시 생성하지 않으면 검사 결과에 오래된 client로 보고된다

    Given API client가 이전 OpenAPI 계약으로부터 생성되어 있다
    And 현재 OpenAPI 계약이 새 기준으로 바뀌어 있다
    When 개발자가 하네스 검사를 실행한다
    Then 오래된 API client가 검사 결과에 보고된다

  Scenario: 프런트엔드 전체 검증이 생성 결과와 계약 검사를 함께 본다
    Covers:
      - 프런트엔드 전체 검증 명령은 API client 생성 결과와 계약 검사를 함께 확인한다

    Given 현재 OpenAPI 계약과 API client 생성 결과가 준비되어 있다
    When 개발자가 프런트엔드 전체 검증 명령을 실행한다
    Then 생성 client와 현재 계약의 일치 여부가 함께 확인된다
