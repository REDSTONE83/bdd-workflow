@REQ-006
Feature: OpenAPI 기반 FE API 계약 검증

  Scenario: 백엔드 빌드가 OpenAPI 계약 산출물을 만든다
    Covers:
      - 백엔드 빌드 한 번에 OpenAPI 계약 JSON이 `build/app/indexes/openapi.index.json`에 생성된다

    Given 백엔드 코드가 컴파일 가능한 상태다
    When 개발자가 백엔드 빌드를 한 번 돌린다
    Then 빌드 산출물에 OpenAPI 계약 JSON이 build/app/indexes/openapi.index.json 위치로 생긴다

  Scenario: 새 엔드포인트가 OpenAPI 계약에 포함된다
    Covers:
      - OpenAPI 계약에는 현재 백엔드가 노출하는 모든 HTTP 엔드포인트의 method와 path가 포함된다

    Given 백엔드에 새 HTTP 엔드포인트가 추가되어 있다
    When 빌드 산출물의 OpenAPI 계약을 연다
    Then 그 엔드포인트의 method와 path가 계약에 포함되어 있다
    And 기존 엔드포인트의 method와 path도 누락 없이 그대로 남아 있다

  Scenario: 프런트엔드가 계약에 없는 API를 호출하면 검사가 알린다
    Covers:
      - 프런트엔드 API 모듈이 호출하는 method와 path가 OpenAPI 계약에 없으면 해당 호출이 검사 결과에 보고된다

    Given OpenAPI 계약이 만들어져 있다
    And 프런트엔드의 API 모듈이 계약에 없는 method와 path를 호출하고 있다
    When 개발자가 하네스 검사를 돌린다
    Then 계약에 없는 호출이 검사 결과에 보고된다

  Scenario: 프런트엔드 생성 클라이언트가 오래되면 검사가 알린다
    Covers:
      - 프런트엔드 생성 클라이언트가 현재 OpenAPI 계약보다 오래되면 해당 클라이언트가 검사 결과에 보고된다

    Given 프런트엔드 생성 클라이언트가 이전 OpenAPI 계약으로부터 만들어져 있다
    And 백엔드 변경으로 OpenAPI 계약이 새로 만들어진 상태다
    When 개발자가 하네스 검사를 돌린다
    Then 오래된 생성 클라이언트가 검사 결과에 보고된다

  Scenario: OpenAPI 계약 산출물 자체가 없으면 검사가 알린다
    Covers:
      - OpenAPI 계약 산출물이 빌드 결과에 없으면 검사 결과에 별도로 보고된다

    Given 백엔드 빌드가 OpenAPI 계약 산출물을 만들지 못한 상태다
    When 개발자가 하네스 검사를 돌린다
    Then 계약 산출물 부재가 검사 결과에 별도로 보고된다
