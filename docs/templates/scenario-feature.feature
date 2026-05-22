@REQ-XXX
Feature: 요건 카드 제목과 동등한 업무 언어 문장

  Scenario: 업무 언어로 작성한 시나리오 검토명
    Covers:
      - 요건 카드의 수용 기준 문장 (정확히 일치)

    Given 시나리오 시작 전에 성립하는 사용자/데이터/시스템 상태
    When 사용자가 수행하는 핵심 행위
    Then 사용자가 관찰할 수 있는 기대 결과
    And 부수 효과나 추가 관찰 결과 (선택)

  # 추가 시나리오는 위 형식을 그대로 반복한다.
  # Cucumber 실행 도구는 도입하지 않는다. 이 파일은 공유 BDD 명세 + 하네스 추적 입력으로만 사용한다.
  # `Covers:` 블록은 Gherkin 표준 키워드가 아니라 Scenario description(free text) 영역이며,
  # 하네스가 파싱해 Acceptance Test의 `@Covers`와 연결한다.
