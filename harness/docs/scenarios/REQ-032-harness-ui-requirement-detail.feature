@REQ-032
Feature: 하네스 UI 요건 상세 추적

  Scenario: 요건 상세 머리 영역은 카드와 추적 상태를 보여준다
    Covers:
      - 요건 상세는 요건 ID, 제목, 카드 상태, 우선순위, 대상 시스템, 제품 영역, 검증 수준과 추적 상태를 표시한다

    Given 하네스 작업자가 요건 하나를 선택했다
    When 요건 상세 화면이 열린다
    Then 요건 ID, 제목, 카드 상태, 우선순위, 대상 시스템, 제품 영역, 검증 수준과 추적 상태가 보인다

  Scenario: 주요 정보군은 탭으로 구분된다
    Covers:
      - 요건 상세의 주요 정보군은 개요, AC, 시나리오, UI, API 계약, Entity, 산출물/소스 탭으로 구분된다

    Given 선택한 요건에 메타데이터, 수용 기준, 시나리오, UI 표면, API 계약, Entity, 산출물이 있다
    When 하네스 작업자가 요건 상세 화면을 본다
    Then 개요, AC, 시나리오, UI, API 계약, Entity, 산출물/소스 탭이 보인다
    And 각 탭을 선택하면 해당 정보군만 본문에 보인다

  Scenario: 수용 기준 항목은 커버리지와 테스트를 보여준다
    Covers:
      - 수용 기준마다 검증 채널, 판정 상태, 연결된 테스트와 시나리오가 항목 카드 안에 표시된다

    Given 선택한 요건에 여러 수용 기준이 있다
    And 각 수용 기준의 coverage row에 판정 상태와 연결 테스트 정보가 있다
    When 하네스 작업자가 AC 탭을 확인한다
    Then 각 수용 기준의 검증 채널, 판정 상태, 연결 테스트와 시나리오가 항목 카드 안에 보인다

  Scenario: AC 목록과 시나리오 목록을 확인한다
    Covers:
      - 수용 기준 원문 목록은 카드로 표시되고 BDD 시나리오 목록은 번호 없는 Given/When/Then, 파일 위치, Covers 관계를 확인할 수 있다
      - BDD 시나리오마다 Covers 기준으로 연결된 커버리지 판정과 테스트가 항목 안에 표시된다

    Given 선택한 요건에 수용 기준과 BDD 시나리오가 있다
    And BDD 시나리오의 Covers가 coverage row와 연결되어 있다
    When 하네스 작업자가 AC 탭과 시나리오 탭을 확인한다
    Then 수용 기준 원문, 검증 채널, 판정과 연결 테스트가 카드 목록으로 보인다
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
      - 카드 원본 문서와 연결 항목의 파일 위치는 로컬 에디터로 여는 연결로 제공된다

    Given 선택한 요건에 요건 카드와 BDD 시나리오 산출물이 있다
    And 선택한 요건에 API, Request, Response, Entity, UI Page, UI Story 소스코드 위치가 있다
    When 하네스 작업자가 산출물/소스 탭을 확인한다
    Then 연결 산출물은 요건 카드와 시나리오 종류 뱃지만 보인다
    And 소스코드 위치에는 연결 산출물 파일이 보이지 않는다
    And 소스코드 위치의 UI Page와 UI Story는 UI 접두 뱃지로 보인다
    And 카드 원본 문서와 연결 항목의 파일 위치를 로컬 에디터로 열 수 있다

  Scenario: API와 데이터 계약 Skeleton 연결을 확인한다
    Covers:
      - 연결된 API 작업은 세로 목록형 카드로 표시되고 Request, Response 구성과 그 안의 중첩 객체 필드는 펼침으로 확인된다
      - 연결된 Entity 구성은 Entity 탭에서 세로 목록형 카드로 표시되고 속성 목록은 펼침으로 확인된다

    Given 선택한 요건에 연결된 API 작업과 Request, Response, Entity 구성이 있다
    And Response 필드 중 하나가 다른 객체 타입을 참조한다
    When 하네스 작업자가 API 계약 탭과 Entity 탭을 확인한다
    Then API 계약 탭에서 API method, path, operationId와 Skeleton 상태가 세로 목록형 카드로 보인다
    And API 계약 탭에서 Request와 Response 이름과 필드 구성은 펼침 영역에서 보인다
    And Response의 중첩 객체 필드는 참조 객체 펼침 영역에서 보인다
    And Entity 탭에서 Entity 이름, Skeleton 상태와 구현 위치가 세로 목록형 카드로 보인다
    And Entity 속성 이름, 타입, 필수 여부와 설명은 속성 목록 펼침 영역에서 보인다

  Scenario: UI 표면은 Storybook 링크로 검토한다
    Covers:
      - 연결된 UI 표면은 UI 탭에서 세로 목록형 카드로 표시되고 카드별 설명과 Storybook 검토 링크와 구현 파일 위치가 제공된다

    Given 선택한 요건에 연결된 UI Storybook story가 있다
    And 연결된 UI 표면에 카드별 설명이 있다
    When 하네스 작업자가 UI 탭을 확인한다
    Then UI 표면이 세로 목록형 카드로 보인다
    And 카드별 설명과 화면 Skeleton 검토 링크가 Storybook 링크로 보인다
    And 구현 파일 위치 링크도 제공된다
