@REQ-028
Feature: 단계 인식 TDD 요건 워크플로우

  Scenario: 요건 카드 상태가 TDD 워크플로우 단계를 표현한다
    Covers:
      - 요건 카드 상태는 `초안`, `Skeleton 검토중`, `Skeleton 승인`, `테스트 작성중`, `테스트 승인`, `구현중`, `검증중`, `승인`, `대체됨`을 지원한다

    Given 요건 카드가 TDD 워크플로우 상태를 가진다
    When 하네스가 요건 카드를 검사한다
    Then 하네스는 단계 상태를 허용된 상태로 인식한다

  Scenario: Skeleton 승인 이후 검증 대상 계약이 필요하다
    Covers:
      - `Skeleton 승인` 이후 단계의 요건은 선언한 검증 대상에 맞는 API/DB/UI/Storybook 계약을 카드에 가져야 한다

    Given 요건 카드가 Skeleton 승인 이후 단계이다
    When 하네스가 요건 카드의 검증 대상을 검사한다
    Then 선언된 검증 대상에 맞는 계약 항목이 있어야 한다

  Scenario: Storybook 계약이 실제 Storybook 상태와 연결된다
    Covers:
      - UI Storybook 계약이 있는 요건은 선언한 Storybook surface와 named export 상태가 실제 Storybook source index에 있고 해당 요건 metadata와 연결되어야 한다

    Given 요건 카드에 UI Storybook 계약이 있다
    When 하네스가 FE source index의 Storybook 항목을 비교한다
    Then 선언된 surface와 상태가 존재하고 해당 요건 metadata와 연결되어야 한다

  Scenario: app validate가 Storybook build를 실행한다
    Covers:
      - `npm run app:validate`는 Storybook build를 실행해 Skeleton UI 검토 표면이 빌드 가능한지 확인한다

    Given 애플리케이션 검증이 실행된다
    When 하네스 러너가 app validate 단계를 수행한다
    Then Storybook build가 검증 과정에 포함된다

  Scenario: 테스트 승인 단계는 테스트 연결을 우선 확인한다
    Covers:
      - 테스트 승인 단계는 AC별 실행 테스트 연결을 요구하지만 구현 전 테스트 실패 자체는 통합 게이트 차단 사유로 보지 않는다

    Given 요건 카드가 테스트 승인 단계이다
    When 하네스가 AC와 실행 테스트 연결을 검사한다
    Then 테스트 연결은 필요하지만 구현 전 실패는 통합 게이트 차단 사유가 아니다

  Scenario: 검증중 이후 RED만 통합 게이트에서 차단된다
    Covers:
      - `gate.mjs --check`는 `검증중` 또는 `승인` 카드의 RED를 TRACE 실패로 차단한다

    Given Skeleton 승인 카드와 검증중 카드가 각각 RED 상태이다
    When 개발자가 gate.mjs --check를 실행한다
    Then Skeleton 단계의 RED는 통과하고 검증중 카드의 RED는 TRACE 실패로 차단된다
