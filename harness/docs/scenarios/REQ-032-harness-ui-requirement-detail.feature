@REQ-032
Feature: 하네스 UI 요건 상세 추적

  Scenario: 요건 상세 머리 영역은 카드와 추적 상태를 보여준다
    Covers:
      - 요건 상세는 요건 ID, 제목, 카드 상태, 우선순위, 대상 시스템, 제품 영역, 검증 수준과 추적 상태를 표시한다

    Given 하네스 작업자가 요건 하나를 선택했다
    When 요건 상세 화면이 열린다
    Then 요건 ID, 제목, 카드 상태, 우선순위, 대상 시스템, 제품 영역, 검증 수준과 추적 상태가 보인다

  Scenario: 요건 상세에서 필터가 유지된 목록으로 돌아간다
    Covers:
      - 요건 상세의 메타데이터 카드 바깥 상단 좌측에 있는 테두리 없는 요건 목록 버튼을 선택하면 기존 필터 query를 유지한 요건 보드 route로 이동한다

    Given 하네스 작업자가 필터 query가 있는 요건 상세 화면을 보고 있다
    And 요건 목록 버튼이 메타데이터 카드 바깥 상단 좌측에 테두리 없는 내비게이션 스타일로 보인다
    When 하네스 작업자가 요건 목록 버튼을 선택한다
    Then 요건 보드 route로 이동한다
    And 기존 필터 query가 유지된다

  Scenario: 주요 정보군은 탭으로 구분된다
    Covers:
      - 요건 상세의 주요 정보군은 개요, AC, 시나리오, UI, API 계약, Entity, 산출물/소스 탭으로 구분된다

    Given 선택한 요건에 메타데이터, 수용 기준, 시나리오, UI 표면, API 계약, Entity, 산출물이 있다
    When 하네스 작업자가 요건 상세 화면을 본다
    Then 개요, AC, 시나리오, UI, API 계약, Entity, 산출물/소스 탭이 보인다
    And 각 탭을 선택하면 해당 정보군만 본문에 보인다

  Scenario: 개요 탭은 요건 카드 주요 섹션을 보여준다
    Covers:
      - 개요 탭은 요건 카드의 사용자/목적, 범위, 표준 용어 key와 한국어/영어 이름, 제외 범위, 의사결정 로그를 표시한다

    Given 선택한 요건 카드에 사용자/목적, 범위, 표준 용어, 제외 범위, 의사결정 로그가 있다
    When 하네스 작업자가 개요 탭을 확인한다
    Then 사용자/목적 본문이 보인다
    And 범위와 제외 범위가 항목 목록으로 보인다
    And 표준 용어 key와 한국어/영어 이름이 목록으로 보인다
    And 의사결정 로그의 결정일, 결정, 이유, 결정자와 영향이 보인다

  Scenario: 수용 기준 항목은 커버리지와 테스트를 보여준다
    Covers:
      - AC 목록 카드에서 AC ID는 한 단계 큰 글꼴로 표시되고 검증 채널은 ID 옆 유형별 색상 뱃지로 표시되며 판정 상태는 카드 우측에 표시된다
      - AC 목록 카드에서 연결 테스트와 연결 시나리오는 바로가기 링크로 제공되고 연결 테스트 라벨과 목록 컨텐츠는 상단 정렬된다

    Given 선택한 요건에 여러 수용 기준이 있다
    And 각 수용 기준의 coverage row에 검증 채널, 판정 상태, 연결 테스트 정보가 있다
    And 각 수용 기준과 연결된 시나리오의 feature 파일 위치가 있다
    When 하네스 작업자가 AC 탭을 확인한다
    Then 각 수용 기준의 AC ID는 한 단계 큰 글꼴로 보인다
    And 검증 채널은 AC ID 옆 유형별 색상 뱃지로 보인다
    And 판정 상태는 카드 우측에 보인다
    And 연결 테스트와 연결 시나리오는 바로가기 링크로 보인다
    And 연결 테스트 라벨과 목록 컨텐츠는 상단 정렬된다

  Scenario: AC 목록과 시나리오 목록을 확인한다
    Covers:
      - 수용 기준 원문 목록은 카드로 표시되고 BDD 시나리오 목록은 번호 없는 Given/When/Then, 파일 위치, Covers 관계를 확인할 수 있다
      - BDD 시나리오마다 Covers 기준으로 연결된 커버리지 판정과 테스트가 항목 안에 표시된다

    Given 선택한 요건에 수용 기준과 BDD 시나리오가 있다
    And BDD 시나리오의 Covers가 coverage row와 연결되어 있다
    When 하네스 작업자가 AC 탭과 시나리오 탭을 확인한다
    Then 수용 기준 원문, 검증 채널 뱃지, 판정과 연결 테스트 바로가기가 카드 목록으로 보인다
    And 시나리오 제목, Covers 관계, 커버리지 판정, 연결 테스트, 번호 없는 Given/When/Then, feature 파일 위치가 보인다

  Scenario: RED와 BLUE 차단 사유가 추적 산출물 그대로 보인다
    Covers:
      - 추적 산출물에 RED 사유가 있으면 규칙과 메시지가 표시된다
      - 추적 산출물에 BLUE 차단 사유가 있으면 그대로 표시된다

    Given 선택한 요건의 추적 산출물에 RED 사유와 BLUE 차단 사유가 기록되어 있다
    When 하네스 작업자가 AC 탭을 확인한다
    Then RED 사유의 규칙과 메시지가 보인다
    And BLUE 차단 사유가 추적 산출물 내용 그대로 보인다

  Scenario: 연결 산출물과 원본 위치는 작업자가 열 수 있는 링크로 제공된다
    Covers:
      - 연결 산출물은 요건 카드와 BDD 시나리오 종류 뱃지와 파일 위치가 있는 목록형 카드로 표시된다
      - 소스코드 위치는 연결 산출물 파일을 제외하고 API, Request, Response, Entity, UI Page, UI Story 종류 뱃지와 파일 위치가 있는 목록형 카드로 표시된다
      - 카드 원본 문서와 연결 항목의 파일 경로/라인 위치 자체는 로컬 에디터 바로가기 링크로 제공되고 별도 열기 버튼은 표시되지 않는다

    Given 선택한 요건에 요건 카드와 BDD 시나리오 산출물이 있다
    And 선택한 요건에 API, Request, Response, Entity, UI Page, UI Story 소스코드 위치가 있다
    When 하네스 작업자가 산출물/소스 탭을 확인한다
    Then 연결 산출물은 요건 카드와 시나리오 종류 뱃지만 보인다
    And 소스코드 위치에는 연결 산출물 파일이 보이지 않는다
    And 소스코드 위치의 UI Page와 UI Story는 UI 접두 뱃지로 보인다
    And 카드 원본 문서와 연결 항목의 파일 경로/라인 위치 자체가 로컬 에디터 바로가기 링크로 보인다
    And 별도 열기 버튼은 보이지 않는다

  Scenario: API와 데이터 계약 Skeleton 연결을 확인한다
    Covers:
      - 연결된 API 작업은 세로 목록형 카드로 표시되고 Request, Response 구성과 그 안의 중첩 객체 필드는 펼침으로 확인된다
      - 연결된 Entity 구성은 Entity 탭에서 세로 목록형 카드로 표시되고 table과 컬럼 메타데이터는 펼침으로 확인된다

    Given 선택한 요건에 연결된 API 작업과 Request, Response, Entity 구성이 있다
    And Response 필드 중 하나가 다른 객체 타입을 참조한다
    When 하네스 작업자가 API 계약 탭과 Entity 탭을 확인한다
    Then API 계약 탭에서 API method, path, operationId와 구현 위치가 세로 목록형 카드로 보인다
    And API 계약 탭에서 Request와 Response 이름과 필드 구성은 펼침 영역에서 보인다
    And Response의 중첩 객체 필드는 참조 객체 펼침 영역에서 보인다
    And Entity 탭에서 DB table이 카드의 주 정보로 보이고 JPA className, listener와 구현 위치는 보조 정보로 보인다
    And Entity 컬럼의 columnName, PK 여부, nullable, unique, updatable, length가 먼저 보이고 fieldName, javaType, annotation, 연결 요건은 보조 정보로 컬럼 목록 펼침 영역에서 보인다

  Scenario: UI 표면은 Storybook 링크로 검토한다
    Covers:
      - 연결된 UI 표면은 UI 탭에서 세로 목록형 카드로 표시되고 카드별 설명과 Storybook 검토 링크와 구현 파일 위치가 제공된다

    Given 선택한 요건에 연결된 UI Storybook story가 있다
    And 연결된 UI 표면에 카드별 설명이 있다
    When 하네스 작업자가 UI 탭을 확인한다
    Then UI 표면이 세로 목록형 카드로 보인다
    And 카드별 설명과 화면 Skeleton 검토 링크가 Storybook 링크로 보인다
    And 구현 파일 위치 링크도 제공된다
