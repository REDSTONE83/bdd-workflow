# Acceptance Test 표준

BDD 시나리오는 별도 `.feature` 파일이 아니라 Acceptance Test 코드로 표현한다. 수용 기준 커버리지는 테스트 메서드의 `@Covers` 값으로 판단한다.

## 테스트 클래스

테스트 클래스는 사용자 목적 또는 API 행위 단위로 작성한다.

```java
@AcceptanceTest
@Requirement("REQ-001")
class SignupApiAcceptanceTest {

    @Test
    @Covers("유효한 정보이면 계정이 생성된다")
    @DisplayName("유효한 정보이면 계정이 생성된다")
    void signupWithValidRequestReturnsCreated() {
        // Given
        // When
        // Then
    }
}
```

시나리오 식별자는 별도로 만들지 않는다. 테스트 식별자는 `TestClass.testMethod`로 본다.

파일명은 다음 형식을 따른다.

```text
{Feature}ApiAcceptanceTest.java
```

## 리뷰 체크리스트

- 모든 수용 기준이 하나 이상의 `@Covers`로 연결되어 있다.
- `@Covers` 문장이 요건 카드의 수용 기준 문장과 정확히 일치한다.
- 테스트명과 `@DisplayName`이 사용자가 이해할 수 있는 결과 중심 문장이다.
- Given/When/Then 구역이 드러난다.
- 정상, 예외, 경계 조건이 빠지지 않았다.
- HTTP 상태, 응답 본문, 저장 상태나 부수 효과를 필요한 만큼 검증한다.
- 목록 조회 API는 페이징 수용 기준을 반드시 테스트한다. `page`/`size` 요청에 따른 `content` 슬라이스와 `page`, `size`, `totalElements`, `totalPages` 메타데이터를 함께 검증한다.
- 테스트가 구현 세부사항보다 API 계약과 업무 결과를 검증한다.

## 자동 검증 항목

- `test`: JUnit 테스트 실행, PASS/FAIL 수집.
- `generateHarnessSourceIndex`: 테스트 클래스의 `@Requirement`와 메서드의 `@Covers`를 source index로 수집.
- `validateHarness`: 카드의 수용 기준이 `@Covers`로 모두 커버되는지, 테스트가 모두 PASS인지 검사.

## 수동 리뷰 항목

- 같은 수용 기준에 대해 어떤 분기/경계까지 케이스를 더 만들지
- 부수 효과(저장 상태, 외부 호출, 로그) 검증 범위
- 목록 조회에서 첫 페이지, 다음 페이지, 범위 초과 페이지 중 어떤 페이징 경계까지 필요한지
- 테스트 데이터가 의도를 가린 채 “돌게만” 만들어졌는지
