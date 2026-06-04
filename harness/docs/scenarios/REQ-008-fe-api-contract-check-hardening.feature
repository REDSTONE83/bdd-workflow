@REQ-008
Feature: FE API 계약 오류 검사

  Scenario: OpenAPI 계약 산출물 누락을 오류로 차단한다
    Covers:
      - OpenAPI 계약 산출물이 없으면 FE API 계약 검사 결과가 오류로 보고된다

    Given 프런트엔드 소스 인덱스가 준비되어 있다
    And OpenAPI 계약 산출물이 없다
    When 개발자가 하네스 검사를 실행한다
    Then OpenAPI 계약 산출물 누락이 오류로 보고된다

  Scenario: 계약에 없는 API 호출을 오류로 차단한다
    Covers:
      - 프런트엔드 API 모듈이 OpenAPI 계약에 없는 method와 path를 호출하면 검사 결과가 오류로 보고된다

    Given 현재 OpenAPI 계약 산출물이 준비되어 있다
    And 프런트엔드 API 모듈이 계약에 없는 endpoint를 호출한다
    When 개발자가 하네스 검사를 실행한다
    Then 알려지지 않은 API 호출이 오류로 보고된다

  Scenario: API client 메타파일 누락을 오류로 차단한다
    Covers:
      - 생성된 API client의 OpenAPI 메타파일이 없으면 검사 결과가 오류로 보고된다

    Given 현재 OpenAPI 계약 산출물이 준비되어 있다
    And 생성된 API client의 계약 메타파일이 없다
    When 개발자가 하네스 검사를 실행한다
    Then API client 메타파일 누락이 오류로 보고된다

  Scenario: 오래된 API client를 오류로 차단한다
    Covers:
      - 생성된 API client가 현재 OpenAPI 계약보다 오래되면 검사 결과가 오류로 보고된다

    Given 현재 OpenAPI 계약 산출물이 준비되어 있다
    And 생성된 API client가 이전 계약 메타파일을 갖고 있다
    When 개발자가 하네스 검사를 실행한다
    Then 오래된 API client가 오류로 보고된다

  Scenario: API 경계 밖 직접 fetch 호출을 오류로 차단한다
    Covers:
      - 애플리케이션 소스가 `app/front-end/src/api` 밖에서 직접 `fetch`를 호출하면 검사 결과가 오류로 보고된다

    Given 애플리케이션 소스가 API 경계 밖에서 직접 fetch를 호출한다
    When 개발자가 하네스 검사를 실행한다
    Then 직접 fetch 호출이 오류로 보고된다
