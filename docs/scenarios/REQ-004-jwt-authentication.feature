@REQ-004
Feature: JWT 기반 인증

  # ----- 정상 인증 -----

  Scenario: API 호출자가 유효한 JWT Bearer 토큰으로 보호 API에 접근한다
    Covers:
      - 유효한 JWT Bearer 토큰이면 보호 API 요청이 인증된다
      - 인증된 사용자의 식별자는 JWT sub 클레임의 UUID로 결정된다

    Given 서버가 신뢰하는 발급자가 사용자 UUID를 sub 클레임으로 담아 JWT Bearer 토큰을 발급했다
    When API 호출자가 그 토큰을 Authorization 헤더에 담아 자신의 보호 자원을 요청한다
    Then 서버는 요청을 인증된 것으로 처리한다
    And 서버는 토큰의 sub UUID를 행위자로 사용해 그 사용자의 자원만 응답한다

  # ----- Authorization 헤더 누락 또는 형식 오류 -----

  Scenario: Authorization 헤더가 없으면 보호 API 요청이 401 UNAUTHORIZED ApiError 로 거절된다
    Covers:
      - Authorization 헤더가 없으면 보호 API 요청이 거절된다
      - 인증 실패 응답은 401 상태와 UNAUTHORIZED 오류 코드를 가진 ApiError 형식이다

    Given 서버에 보호 API가 노출되어 있다
    When API 호출자가 Authorization 헤더 없이 보호 API를 요청한다
    Then 서버는 요청을 401 UNAUTHORIZED 로 거절한다
    And 응답 본문은 UNAUTHORIZED 코드를 가진 표준 ApiError 형식이다

  Scenario: API 호출자가 Bearer 가 아닌 Authorization 형식으로 보호 API에 접근하려다 거절당한다
    Covers:
      - Authorization 헤더가 Bearer 형식이 아니면 보호 API 요청이 거절된다

    Given 서버에 보호 API가 노출되어 있다
    When API 호출자가 Basic 처럼 Bearer 가 아닌 형식으로 보호 API를 요청한다
    Then 서버는 요청을 401 UNAUTHORIZED 로 거절한다

  Scenario: 이전 임시 사용자 헤더만 보낸 호출자가 더 이상 인증되지 않는다
    Covers:
      - X-User-Id 또는 X-Authenticated-User-Id 헤더만 전달된 요청은 Authorization 헤더 없는 요청과 동일하게 거절된다

    Given 서버에 보호 API가 노출되어 있다
    When API 호출자가 임시 사용자 헤더(X-User-Id 또는 X-Authenticated-User-Id)만 담아 보호 API를 요청한다
    Then 서버는 요청을 Authorization 헤더 없는 요청과 동일하게 401 UNAUTHORIZED 로 거절한다

  # ----- 잘못된 토큰: 형식 / 서명 / 알고리즘 -----

  Scenario: 형식이 깨졌거나 서명이 위조된 토큰을 보낸 호출자가 거절당한다
    Covers:
      - JWT 형식이 잘못되면 보호 API 요청이 거절된다
      - JWT 서명 검증에 실패하면 보호 API 요청이 거절된다

    Given 서버에 보호 API가 노출되어 있다
    When 호출자가 JWT 형식이 아닌 문자열을, 또는 서버 비밀키와 다른 키로 서명한 토큰을 Bearer 로 보낸다
    Then 서버는 요청을 401 UNAUTHORIZED 로 거절한다

  Scenario: 서버가 허용하지 않는 서명 알고리즘으로 만든 토큰을 보낸 호출자가 거절당한다
    Covers:
      - HS256 외 알고리즘으로 서명된 JWT Bearer 토큰이면 보호 API 요청이 거절된다

    Given 서버는 HS256 알고리즘으로 서명된 토큰만 신뢰한다
    When 호출자가 HS256 이 아닌 알고리즘(예: none, RS256)으로 서명한 JWT 토큰을 보낸다
    Then 서버는 요청을 401 UNAUTHORIZED 로 거절한다

  # ----- 만료 시각과 clock skew -----

  Scenario: 발급자 시계가 살짝 어긋난 토큰을 허용 오차 안에서 받아들인다
    Covers:
      - JWT exp가 현재 시각 기준 60초 이내 과거이면 보호 API 요청이 인증된다

    Given 서버는 만료 시각 검증에 60초 clock skew 를 허용한다
    And 호출자가 가진 토큰의 만료 시각이 서버 현재 시각보다 60초 이내로 과거다
    When 호출자가 그 토큰으로 보호 API를 요청한다
    Then 서버는 요청을 인증된 것으로 처리한다

  Scenario: 허용 오차를 넘어선 만료 토큰을 보낸 호출자가 거절당한다
    Covers:
      - JWT exp가 현재 시각 기준 60초보다 더 오래전에 만료되었으면 보호 API 요청이 거절된다

    Given 호출자가 가진 토큰의 만료 시각이 서버 현재 시각보다 60초보다 더 오래전이다
    When 호출자가 그 토큰으로 보호 API를 요청한다
    Then 서버는 요청을 401 UNAUTHORIZED 로 거절한다
    And 서버는 만료된 토큰을 자동으로 갱신하지 않는다

  # ----- issuer / audience 불일치 -----

  Scenario: 다른 발급자나 다른 대상의 토큰을 보낸 호출자가 거절당한다
    Covers:
      - JWT issuer가 서버 설정과 다르면 보호 API 요청이 거절된다
      - JWT audience가 서버 설정과 다르면 보호 API 요청이 거절된다

    Given 서버는 issuer 와 audience 가 설정값과 정확히 일치하는 토큰만 신뢰한다
    When 호출자가 issuer 또는 audience 가 서버 설정과 다른 토큰으로 보호 API를 요청한다
    Then 서버는 요청을 401 UNAUTHORIZED 로 거절한다

  # ----- sub 클레임 문제 -----

  Scenario: 사용자 식별자가 비어 있거나 UUID 가 아닌 토큰을 보낸 호출자가 거절당한다
    Covers:
      - JWT sub 클레임이 없거나 UUID 형식이 아니면 보호 API 요청이 거절된다

    Given 호출자가 가진 토큰의 sub 클레임이 비어 있거나 UUID 형식이 아니다
    When 호출자가 그 토큰으로 보호 API를 요청한다
    Then 서버는 요청을 401 UNAUTHORIZED 로 거절한다

  # ----- 자원 격리 -----

  Scenario: 인증된 사용자가 다른 사용자의 자원에 접근하거나 변경하지 못한다
    Covers:
      - 보호 API는 인증된 사용자의 자원만 생성, 조회, 수정, 삭제한다

    Given 두 사용자가 각자 본인의 할 일과 카테고리를 가지고 있다
    When 한 사용자의 토큰으로 보호 API를 호출해 자원의 조회, 생성, 수정, 삭제를 시도한다
    Then 서버는 그 토큰의 sub 사용자의 자원만 응답하거나 변경한다
    And 다른 사용자의 자원은 그대로 남고 외부에는 드러나지 않는다

  # ----- 공개 경로 -----

  Scenario: 가입 전 사용자가 토큰 없이 회원 가입과 API 문서에 접근한다
    Covers:
      - 회원 가입 API는 JWT Bearer 토큰 없이 호출할 수 있다
      - OpenAPI 문서와 Swagger UI는 JWT Bearer 토큰 없이 조회할 수 있다

    Given 가입 전 사용자에게는 아직 JWT Bearer 토큰이 없다
    When 사용자가 회원 가입 또는 OpenAPI 문서/Swagger UI 페이지를 토큰 없이 연다
    Then 서버는 그 요청을 정상적으로 처리한다

  Scenario: 공개 경로에 유효한 토큰을 함께 보내도 그대로 통과한다
    Covers:
      - 공개 경로에 유효한 JWT Bearer 토큰이 전달되어도 요청이 허용된다

    Given 인증된 사용자가 유효한 JWT Bearer 토큰을 이미 가지고 있다
    When 사용자가 그 토큰을 함께 담아 공개 경로(회원 가입, OpenAPI 문서)를 요청한다
    Then 서버는 그 요청을 정상적으로 처리한다

  Scenario: 공개 경로에 잘못된 토큰이 함께 오면 조용히 무시하지 않는다
    Covers:
      - 공개 경로라도 잘못된 Bearer 토큰이 전달되면 요청이 거절된다

    Given 호출자가 깨졌거나 만료된 Bearer 토큰을 가지고 있다
    When 호출자가 그 잘못된 토큰을 담아 공개 경로(회원 가입, OpenAPI 문서)를 요청한다
    Then 서버는 그 요청을 401 UNAUTHORIZED 로 거절한다

  # ----- stateless -----

  Scenario: 보호 API 호출이 서버 세션을 만들지 않는다
    Covers:
      - 보호 API 응답에는 서버 세션 쿠키가 포함되지 않는다

    Given 인증된 사용자가 유효한 JWT Bearer 토큰을 가지고 있다
    When 사용자가 그 토큰으로 보호 API를 요청한다
    Then 응답에는 서버 세션 쿠키(Set-Cookie JSESSIONID 등)가 포함되지 않는다

  # ----- OpenAPI SecurityScheme -----

  Scenario: API 문서가 JWT Bearer 인증 방식을 노출한다
    Covers:
      - OpenAPI 문서에는 JWT Bearer SecurityScheme이 포함된다

    Given 서버가 OpenAPI 문서를 노출하고 있다
    When API 통합자가 OpenAPI 문서(JSON 또는 Swagger UI)를 연다
    Then 문서는 JWT Bearer SecurityScheme 을 인증 방식으로 노출한다
    And 보호 API에는 그 인증 방식을 요구한다고 표시된다
