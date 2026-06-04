@REQ-XXX
Feature: 요건 카드 제목과 동등한 업무 언어 문장

  Scenario: 업무 언어로 작성한 시나리오 검토명
    Covers:
      - 요건 카드의 수용 기준 문장 (정확히 일치)

    Given 로그인한 사용자가 자신의 데이터를 가지고 있다
    When 사용자가 해당 화면 또는 기능에 진입한다
    Then 사용자가 관찰할 수 있는 기대 결과가 보인다
    And 부수 효과나 추가 관찰 결과 (선택)

  # 작성 원칙
  # - Given: 사용자/시스템의 시작 상태 ("로그인한 사용자가 ...", "다른 사용자의 ... 도 존재한다")
  # - When : 업무 행위 또는 업무 진입점 ("할 일 목록을 연다", "정렬 기준을 바꾼다")
  # - Then : 사용자가 관찰 가능한 결과 ("자신의 할 일만 보인다")
  # - 라우트(/todos), HTTP 메서드/상태 코드, DTO 키, CSS selector 같은 구현 어휘는 시나리오에 쓰지 않는다.
  #   라우팅 자체가 AC인 경우에 한해 예외적으로 명시한다.
  # - GWT 본문은 관계자 언어, `Covers:`는 추적 메타.
  #   `null`, `응답`, `필드`, DTO/JSON 키(`title`, `dueDate`, `categoryId`, `content`, `totalElements`),
  #   오류 코드(`INVALID_REQUEST`, `INVALID_CATEGORY` 등)는 GWT에서 쓰지 말고 사용자 관찰 어휘로 옮긴다.
  #   예: `null로 보낸다` → `비운다`/`선택하지 않는다`, `응답에 카테고리 정보가 포함된다` → `카테고리 이름과 색상이 보인다`,
  #       `INVALID_CATEGORY 오류 코드가 응답된다` → `사용할 수 없는 카테고리라는 안내가 보인다`.
  # - 정상 UI 흐름이 아닌 행위는 북마크/딥링크/뒤로가기/다중 기기/외부 통합 같은 실제 사용자 경로를 Given에 명시한다.
  #   그런 경로를 설명할 수 없으면 BDD 시나리오가 아니라 API 방어 계약으로 분류한다.
  # - Cucumber 실행 도구는 도입하지 않는다. 이 파일은 공유 BDD 명세 + 하네스 추적 입력으로만 사용한다.
  # - `Covers:` 블록은 Gherkin 표준 키워드가 아니라 Scenario description(free text) 영역이며,
  #   하네스가 파싱해 Acceptance Test 또는 FE BDD 테스트의 `Covers`와 연결한다.
