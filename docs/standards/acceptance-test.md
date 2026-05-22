# Acceptance Test 표준

BDD 시나리오는 `docs/scenarios/`의 Gherkin `.feature` 문서로 작성하고 리뷰한다. Acceptance Test는 승인된 시나리오를 실행 가능한 검증 코드로 옮긴다. Cucumber 실행 도구는 도입하지 않으며, `.feature`는 "공유 BDD 명세 + 하네스 추적 입력"으로만 사용한다.

- `docs/scenarios/REQ-XXX-*.feature`: PO/QA/기획자/프론트엔드/백엔드가 함께 검토하는 BDD 시나리오 원본 (Gherkin).
- `@Covers`: 요건 카드의 수용 기준 문장. 카드의 완료 여부를 판정하는 기계 친화 신호. `.feature`의 `Covers:` 블록과 같은 의미.
- `@DisplayName`: 승인된 시나리오 제목. JUnit 실행 결과에서 어떤 시나리오가 실행됐는지 읽기 위한 보조 신호. `.feature`의 `Scenario:` 제목과 일치해야 한다.

`@Covers`가 있는 테스트는 BDD 테스트로 본다. BDD 테스트는 승인된 시나리오 문서의 제목을 `@DisplayName`으로 사용한다. `@Covers`가 없는 테스트는 TDD/일반 보조 테스트로 분류하며 AC 커버리지에는 포함하지 않는다.

테스트 작성 자체는 사용자가 시나리오 문서와 API/DB Mock-up을 승인한 뒤에 진행한다. 작성 절차는 [`requirement-authoring.md`](../harness/requirement-authoring.md)를 참조한다.

## 테스트 클래스

테스트 클래스는 사용자 목적 또는 API 행위 단위로 작성한다.

```java
@AcceptanceTest
@Requirement("REQ-001")
class SignupApiAcceptanceTest {

    @Test
    @Covers("유효한 정보이면 계정이 생성된다")
    @DisplayName("처음 가입하는 사용자가 정상적으로 계정을 만든다")
    void signupWithValidRequestReturnsCreated() {
        // 테스트 본문은 승인된 시나리오의 Given/When/Then을 실행 가능한 준비/행위/검증으로 옮긴다.
    }
}
```

별도 시나리오 ID는 만들지 않는다. 사람이 검토하는 시나리오 단위는 시나리오 문서의 제목이며, 실행 식별자는 `TestClass.testMethod`다. 시나리오 제목은 추적 ID가 아니므로 검토 과정에서 자유롭게 다듬을 수 있다.

파일명은 다음 형식을 따른다.

```text
{Feature}ApiAcceptanceTest.java
```

## 시나리오 문서와의 관계

Acceptance Test는 시나리오의 원본이 아니다. 원본은 `docs/scenarios/REQ-XXX-*.feature`에 둔다.

- 테스트 클래스의 `@Requirement`는 `.feature` 파일의 `@REQ-XXX` 태그와 같은 요건을 가리킨다.
- 테스트 메서드의 `@DisplayName`은 승인된 `.feature`의 `Scenario:` 제목과 정확히 일치해야 한다.
- 테스트 메서드의 `@Covers`는 해당 시나리오의 `Covers:` 블록에 적힌 AC 문장 중 하나 이상과 일치해야 한다.
- 한 시나리오가 여러 AC를 검증하면 `@Covers({...})` 배열을 사용한다.
- 한 AC를 여러 시나리오가 검증할 수 있다.
- 테스트 본문에는 필요한 경우 `// Given`, `// When`, `// Then` 주석을 둘 수 있지만, 하네스가 검토하는 시나리오 본문은 `.feature`의 Given/When/Then이다.

```gherkin
@REQ-001
Feature: 이메일 가입

  Scenario: 처음 가입하는 사용자가 정상적으로 계정을 만든다
    Covers:
      - 유효한 정보이면 계정이 생성된다

    Given 이메일 redstone@example.com 은 아직 가입되어 있지 않다
    When 사용자가 redstone@example.com 과 유효한 비밀번호로 가입을 요청한다
    Then 계정이 생성된다
    And 응답으로 사용자 식별자와 가입 시각이 반환된다
```

Gherkin 키워드는 영어(`Feature`/`Scenario`/`Given`/`When`/`Then`/`And`)로 적고 본문은 한국어로 둔다. `# language: ko` 지시자는 사용하지 않는다.

대응 Acceptance Test:

```java
@Test
@Covers("유효한 정보이면 계정이 생성된다")
@DisplayName("처음 가입하는 사용자가 정상적으로 계정을 만든다")
void signupWithValidRequestReturnsCreated() {
    // 승인된 시나리오의 Given/When/Then을 실행 가능한 준비/행위/검증으로 옮긴다.
}
```

## 시나리오 제목 작성 규칙

시나리오 제목은 사용자가 읽을 수 있는 업무 언어 문장으로 적는다. AC 문장을 그대로 복사하지 않는다. AC는 "검증 가능한 결과"이고 시나리오는 "그 결과를 사용자가 경험하는 흐름"이다.

좋은 예:

```text
- 처음 가입하는 사용자가 정상적으로 계정을 만든다
- 이미 가입된 이메일로 다시 가입을 시도해 실패한다
- 할 일이 많은 사용자가 두 번째 목록 묶음을 이어서 확인한다
```

피해야 할 예:

```text
- @Covers와 동일한 AC 문장을 그대로 복사
- "happy path", "case 1" 같은 코드 표현
- "POST /todos 가 201을 반환한다" 같은 HTTP 계약 표현
```

API 자체가 외부 개발자를 위한 제품이면 요청/응답/상태 코드가 업무 언어가 될 수 있다. 그래도 `jsonPath`, DTO 클래스명, repository 메서드명 같은 테스트 구현 표현은 시나리오 제목에 쓰지 않는다.

## 자동 검증 항목

현재 동작:

- `test`: JUnit 테스트 실행, PASS/FAIL/SKIP 수집.
- `generateHarnessSourceIndex`: 테스트 클래스의 `@Requirement`와 메서드의 `@Covers`를 source index로 수집.
- `validateHarness`: 카드의 수용 기준이 `@Covers`로 모두 커버되는지, 연결 테스트가 모두 PASS인지 검사.

시나리오 문서 도입 후 추가할 동작 (현재 미구현):

- `generateHarnessSourceIndex`: 테스트 메서드의 `@DisplayName`을 승인된 시나리오 제목 후보로 수집한다.
- 시나리오 인덱서: `docs/scenarios/REQ-XXX-*.feature`를 Gherkin 파서로 읽어 `@REQ-XXX` 태그, Feature/Scenario 제목, `Covers:` 블록, Given/When/Then을 수집한다. Cucumber 런타임은 사용하지 않고 파서만 사용한다.
- `validateHarness` WARNING (마이그레이션 완료 후 ERROR로 승격):
  - `@Covers`가 있는데 연결되는 `.feature` 시나리오가 없는 테스트
  - `@DisplayName`이 어떤 `.feature`의 `Scenario:` 제목과도 일치하지 않는 BDD 테스트
  - `.feature`의 `Covers:` 항목이 요건 카드의 수용 기준 문장과 정확히 일치하지 않는 경우
  - `.feature`의 `@REQ-XXX` 태그가 카드에 없는 요건을 가리키는 경우

## 수동 리뷰 항목

- 같은 수용 기준에 대해 어떤 분기/경계까지 시나리오를 더 만들지
- 시나리오 제목과 Given/When/Then이 업무 언어로 작성되었고 AC 문장의 단순 복사가 아닌지
- 프론트엔드와 백엔드가 같은 시나리오 문서를 보고 구현해도 모순이 없는지
- 한 시나리오에 핵심 When이 여러 개로 묶여 흐름이 과도하게 큰지
- 부수 효과(저장 상태, 외부 호출, 로그) 검증 범위
- 목록 조회에서 첫 페이지, 다음 페이지, 범위 초과 페이지 중 어떤 페이징 경계까지 필요한지
- 테스트 데이터가 의도를 가린 채 "돌게만" 만들어졌는지
