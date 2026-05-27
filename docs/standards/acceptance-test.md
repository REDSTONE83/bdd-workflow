# Acceptance Test 표준

BDD 시나리오는 `docs/scenarios/`의 Gherkin `.feature` 문서로 작성하고 리뷰한다. Acceptance Test는 승인된 시나리오가 다루는 AC를 실행 가능한 검증 코드로 옮긴다. Cucumber 실행 도구는 도입하지 않으며, `.feature`는 "공유 BDD 명세 + 하네스 추적 입력"으로만 사용한다.

- `Scenario:`는 **사용자 행위/업무 흐름 단위**다. 한 시나리오가 여러 AC를 한 흐름 안에서 다룰 수 있다.
- Acceptance Test는 **AC 검증 단위**다. 같은 AC를 입력 변형/경계값 별로 여러 테스트가 나눠 검증할 수 있다.
- 시나리오와 테스트의 연결은 **AC 교집합**으로 판단한다: `Scenario.Covers ∩ Test.@Covers ≠ ∅` 이면 같은 시나리오에 속한다.
- 한 시나리오에 여러 테스트가 귀속될 수 있고(N:1), 한 테스트가 여러 AC를 통해 여러 시나리오에 귀속될 수도 있다.

핵심 식별 신호:

- `docs/scenarios/REQ-XXX-*.feature`: PO/QA/기획자/프론트엔드/백엔드가 함께 검토하는 BDD 시나리오 원본 (Gherkin).
- `@Covers`: 요건 카드의 수용 기준 문장. 카드의 완료 여부를 판정하는 기계 친화 신호. `.feature`의 `Covers:` 블록과 같은 의미.
- `@DisplayName`: JUnit 실행 결과에서 사람이 읽는 케이스 레이블. **자유 작성**이며 `.feature`의 `Scenario:` 제목과 일치할 필요는 없다.

`@Covers`가 있는 테스트는 BDD 테스트로 본다. `@Covers`가 없는 테스트는 TDD/일반 보조 테스트로 분류하며 AC 커버리지에는 포함하지 않는다. 프런트엔드도 같은 원칙을 따른다. FE BDD 테스트는 Playwright에서 `Requirement`와 `Covers` 메타데이터를 남기고, Vitest/Testing Library 테스트는 기본적으로 TDD/보조 테스트로 둔다 ([`front-end-testing.md`](./front-end-testing.md)).

실행 테스트 작성은 사용자가 검증 설계와 요건 Skeleton을 승인한 뒤에 진행한다. 작성 절차는 [`requirement-authoring.md`](../harness/requirement-authoring.md)를 참조한다.

## 테스트 클래스

테스트 클래스는 사용자 목적 또는 API 행위 단위로 작성한다. 백엔드 HTTP API를 검증하는 Acceptance Test는 테스트 전용 합성 애너테이션 `@ApiAcceptanceTest`를 사용한다. `@ApiAcceptanceTest`는 `@AcceptanceTest`, `@SpringBootTest`, `@AutoConfigureMockMvc`를 포함한다.

```java
@ApiAcceptanceTest
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

HTTP API를 직접 호출하지 않는 하네스/문서/정적 분석 Acceptance Test는 `@AcceptanceTest`를 직접 사용한다. OpenAPI dump처럼 산출물 생성만 담당하고 AC를 검증하지 않는 테스트에는 `@AcceptanceTest`와 `@Covers`를 붙이지 않는다.

별도 시나리오 ID는 만들지 않는다. 사람이 검토하는 시나리오 단위는 `.feature`의 `Scenario:` 제목이며, 테스트 실행 식별자는 `TestClass.testMethod`다. 시나리오 제목은 추적 ID가 아니므로 검토 과정에서 자유롭게 다듬을 수 있다.

프런트엔드에서도 별도 시나리오 ID, 화면 ID, 컴포넌트 ID를 만들지 않는다. 테스트 실행 식별자는 Playwright 파일명과 test 제목이며, 추적은 `Requirement` 값(`REQ-XXX`)과 `Covers` 문장으로만 한다.

파일명은 다음 형식을 따른다.

```text
{Feature}ApiAcceptanceTest.java
```

## API 테스트 작성 방식

API Acceptance Test는 `MockMvc`로 실제 HTTP 경계, Spring MVC binding, Bean Validation, Security filter, 전역 예외 응답을 함께 검증한다. 컨트롤러를 직접 호출하지 않는다.

- 인증이 검증 대상이 아닌 업무 테스트는 `ApiRequestSupport.bearer(userId)`를 사용해 "로그인한 사용자" 상태를 만든다. `Authorization` 헤더 값과 `TestJwt.signFor(...)` 조합을 각 테스트에 직접 반복하지 않는다.
- JWT, Cookie 우선순위, 잘못된 토큰, 인증 실패 자체가 검증 대상인 테스트에서는 `TestJwt`와 헤더/Cookie를 직접 다룰 수 있다.
- JSON 요청은 작은 케이스에서는 text block을 사용할 수 있다. 같은 요청 형태가 세 번 이상 반복되거나 필드 조합이 복잡하면 테스트 전용 helper나 fixture method로 옮긴다.
- 응답 검증은 상태 코드, 핵심 응답 필드, 오류 코드/field, 필요한 저장 부수효과를 함께 본다. 실패 케이스가 저장 방지를 보장해야 하면 repository 상태도 검증한다.
- Repository 직접 호출은 Given 데이터 준비와 Then 저장 상태 확인에만 사용한다. 업무 행위 자체는 API 호출로 수행한다.
- 테스트 데이터는 케이스 의도가 드러나는 이름으로 만든다. 고정 UUID 리터럴은 테스트 본문에 직접 두지 않고, 시드/fixture/명명된 actor constant에서 가져온다.

권장 형태:

```java
@Test
@Covers("본인의 할 일 목록만 조회된다")
@DisplayName("다른 사용자의 할 일이 섞여 있어도 본인 목록만 보인다")
void listReturnsOnlyOwnTodos() throws Exception {
    // Given
    todoRepository.save(USER_ID, "내 할 일", null, null, Priority.MEDIUM, false, null);
    todoRepository.save(OTHER_USER_ID, "타인 할 일", null, null, Priority.MEDIUM, false, null);

    // When / Then
    mockMvc.perform(get("/todos").header(HttpHeaders.AUTHORIZATION, bearer(USER_ID)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].title").value("내 할 일"));
}
```

## 테스트 계층 분리

`@Covers`가 붙은 Acceptance Test는 AC 완료 여부를 판정하는 계약 테스트다. 빠른 피드백이나 복잡한 분기 검증이 필요하면 별도 보조 테스트를 추가하되, 보조 테스트에는 `@Covers`를 붙이지 않는다.

- Acceptance Test: 카드 AC, API 계약, 인증/권한, persistence 부수효과, 사용자 관찰 결과를 검증한다.
- Service/domain 보조 테스트: 순수 계산, 복잡한 분기, 경계값 조합을 빠르게 검증한다. AC 커버리지에는 포함하지 않는다.
- Repository 보조 테스트: 쿼리 정렬/필터링이 복잡해 API 테스트만으로 원인 파악이 어려울 때 추가한다. AC 커버리지에는 포함하지 않는다.
- 같은 AC의 입력 변형이나 경계값이 많으면 `@ParameterizedTest`를 사용할 수 있다. 이때 `@Covers`는 메서드에 한 번만 두고, display name 또는 argument label로 케이스 차이를 드러낸다.

## 시나리오 문서와의 관계

Acceptance Test는 시나리오의 원본이 아니다. 원본은 `docs/scenarios/REQ-XXX-*.feature`에 둔다.

- 테스트 클래스의 `@Requirement`는 `.feature` 파일의 `@REQ-XXX` 태그와 같은 요건을 가리킨다.
- 테스트 메서드의 `@Covers`는 카드의 수용 기준 문장과 정확히 일치해야 한다. 한 메서드가 여러 AC를 함께 검증하면 `@Covers({...})` 배열을 사용한다.
- 한 `.feature` 시나리오의 `Covers:` 블록에 여러 AC를 묶을 수 있다. 같은 AC가 여러 시나리오의 `Covers:`에 등장해도 된다.
- 시나리오와 테스트는 **AC 교집합**(`Scenario.Covers ∩ Test.@Covers`)으로 연결된다. 한 시나리오에 입력 변형/경계값별 테스트 여러 개가 묶이는 것이 일반적이다.
- `@DisplayName`은 JUnit 표시용 자유 작성 레이블이다. 시나리오 제목과 같아도, 달라도 무방하다. 케이스 단위의 짧은 설명을 두는 것이 권장된다.
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
    And 사용자는 가입된 계정을 확인할 수 있다
```

Gherkin 키워드는 영어(`Feature`/`Scenario`/`Given`/`When`/`Then`/`And`)로 적고 본문은 한국어로 둔다. `# language: ko` 지시자는 사용하지 않는다.

대응 Acceptance Test (`@DisplayName`은 자유):

```java
@Test
@Covers("유효한 정보이면 계정이 생성된다")
@DisplayName("처음 가입하는 사용자가 정상적으로 계정을 만든다")
void signupWithValidRequestReturnsCreated() {
    // 시나리오 흐름을 실행 가능한 준비/행위/검증으로 옮긴다.
}
```

같은 시나리오에 여러 테스트가 귀속되는 예시(`Covers:`에 2개 AC, 입력 변형 테스트 여러 개):

```gherkin
  Scenario: 사용자가 잘못된 제목으로 할 일을 만들려다 거절당한다
    Covers:
      - 제목이 비어 있거나 공백만 입력하면 할 일 생성이 거절된다
      - 제목이 100자를 초과하면 할 일 생성이 거절된다

    Given 로그인한 사용자가 새 할 일을 만들 준비가 되어 있다
    When 사용자가 제목을 비운 채로 두거나 100자를 넘는 길이로 입력한다
    Then 할 일 생성이 거절되고 제목을 다시 확인하라는 안내가 보인다
    And 할 일이 저장되지 않는다
```

```java
@Test
@Covers("제목이 비어 있거나 공백만 입력하면 할 일 생성이 거절된다")
@DisplayName("빈 제목으로 만들려다 거절당한다")
void createWithBlankTitleReturnsBadRequest() { ... }

@Test
@Covers("제목이 100자를 초과하면 할 일 생성이 거절된다")
@DisplayName("100자가 넘는 제목으로 만들려다 거절당한다")
void createWithTooLongTitleReturnsBadRequest() { ... }
```

두 테스트의 `@Covers`가 모두 같은 시나리오의 `Covers:` 안에 있으므로, 하네스는 두 테스트를 이 시나리오 아래로 묶어 보고한다.

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

## Given / When / Then 문장 작성 규칙

`.feature`는 PO/QA/기획자/프론트엔드/백엔드가 함께 보는 **업무 시나리오**다. 본문은 화면·라우팅·API 디테일이 아니라 사용자가 체감하는 업무 단위로 적는다.

- **Given**: 사용자/시스템의 시작 상태. "누가 어떤 상태로 무엇을 가지고 있는가." (예: `로그인한 사용자가 할 일을 여러 개 가지고 있다`, `다른 사용자의 할 일도 함께 존재한다`)
- **When**: 사용자가 수행하는 업무 행위 또는 업무 진입점. 라우트/엔드포인트가 아닌 사용자 시점의 행위로 표현한다. (예: `사용자가 할 일 목록을 연다`, `정렬 기준을 바꾼다`, `한 번에 보는 개수를 늘린다`)
- **Then / And**: 사용자가 관찰 가능한 결과. 화면 표시 또는 그에 준하는 비즈니스 관찰값으로 적는다. (예: `자신의 할 일만 보인다`, `현재 묶음 번호, 한 번에 보는 개수, 전체 개수, 전체 묶음 수를 알 수 있다`)

기본적으로 시나리오에 쓰지 않는 표현:

- 구체 URL/route (`/todos`, `/api/v1/...`)
- HTTP method/상태 코드 (`POST`, `GET`, `200`, `404`)
- DTO/Entity 클래스명, JSON 키, CSS selector, 컴포넌트 이름
- 헤더 이름, 쿼리 파라미터 이름 그대로 노출

라우팅·엔드포인트·필드명은 시나리오 밖(컨트롤러/DTO/Entity, FE 라우팅 명세, E2E 테스트 구현)에서 구체화한다. FE/BE는 같은 `.feature` 문장을 각자 자신의 구현 어휘로 해석한다.

다만 **라우팅 자체가 AC**인 경우(예: 딥링크가 보안 요구사항이거나, 특정 화면 URL이 외부 계약으로 노출되는 경우)에는 시나리오에 명시한다. 이 예외는 카드의 수용 기준 문장에 그 라우팅이 직접 적혀 있을 때만 인정한다.

### 발생 경로가 설명되지 않는 행위는 시나리오로 두지 않는다

`When` 문장이 정상 UI 흐름에서 발생하지 않는 행위라면, 사용자가 실제로 마주칠 수 있는 경로(북마크, 딥링크, 브라우저 뒤로가기/새로고침, 다중 기기에서 데이터가 줄어든 상태, 외부 통합 URL 등)를 `Given`에 명시한다. 그런 경로를 설명할 수 없는 행위는 BDD 시나리오가 아니라 API 방어 계약으로 분류한다.

예: `데이터 개수를 초과한 page를 요청하면 빈 content`라는 AC는 정상 UI 흐름에서는 "다음" 버튼이 비활성화되므로 발생하지 않지만, 다음 같은 stale state 경로에서는 사용자가 실제로 마주친다.

```gherkin
Scenario: 사용자가 기억하고 있던 목록 묶음으로 돌아왔는데 그 사이 할 일이 줄어 있다
  Covers:
    - 데이터 개수를 초과한 page를 요청하면 빈 content가 반환되고 totalElements와 totalPages는 데이터에 따라 동일하게 유지된다

  Given 로그인한 사용자가 할 일 목록의 뒤쪽 묶음을 보고 있었다
  And 그 사이 할 일이 줄어 해당 묶음은 더 이상 존재하지 않는다
  When 사용자가 기억하고 있던 같은 묶음으로 돌아온다
  Then 그 묶음에는 할 일이 보이지 않는다
  And 사용자는 현재 남아 있는 전체 개수와 전체 묶음 수를 알 수 있다
```

`size > 100`처럼 정상 UI에서는 발생하지 않지만 외부 진입에서 들어올 수 있는 입력에 대한 cap도 같은 기준을 적용한다. 정상 흐름(기본값 적용)과 방어 계약(상한 cap)은 같은 시나리오에 묶지 말고 분리해 작성한다.

### `Covers:`는 AC를 그대로 옮기는 추적 메타, Given/When/Then은 관계자 검토 본문

`.feature` 안의 두 영역은 독자와 역할이 다르다.

- `Covers:` 블록: AC 문장과 정확히 일치해야 하는 **추적 메타데이터**. 원본은 카드의 수용 기준이므로, AC가 관계자 언어로 쓰여 있으면 Covers도 자연스럽게 관계자 언어가 된다. AC가 아직 기술 어휘로 남아 있더라도 Covers는 AC 문장을 그대로 옮긴다 (`@Covers`와의 정확 일치를 깨면 안 된다).
- `Scenario` 제목과 `Given/When/Then`: PO/QA/기획자/FE/BE가 함께 읽는 **관계자 검토 본문**. 사용자가 관찰하는 형태로만 쓴다.

AC 자체도 관계자 언어를 기본으로 한다. AC 작성 규칙은 [`requirement-authoring.md`](../harness/requirement-authoring.md) "수용 기준 작성"에 둔다. 기술 표현(`null`, JSON 키, HTTP 상태 코드, 오류 코드 등)은 기본적으로 의사결정 로그·API 계약·테스트 assertion으로 분리한다. 따라서 다음 어휘는 GWT 본문에서 제외한다 (필요하면 Acceptance Test에서만 사용한다).

- `null`, `명시적 null`, `필드`, `응답`, `request`, `response`
- DTO/JSON 키 (`title`, `dueDate`, `priority`, `categoryId`, `content`, `totalElements` 등)
- 오류 코드 (`VALIDATION_FAILED`, `INVALID_CATEGORY`, `TODO_NOT_FOUND` 등)
- HTTP 메서드/상태 코드, 헤더 이름, URL, 쿼리 파라미터 이름

대신 다음과 같이 사용자 관찰 어휘로 옮긴다.

| 기술 어휘 | 관계자 언어 |
|---|---|
| `null로 보낸다` | `비운다`, `선택하지 않는다`, `고르지 않는다` |
| `해당 필드 없이 저장된다` | `선택하지 않은 정보 없이 저장된다` |
| `응답으로 식별자가 반환된다` | `생성된 할 일을 확인할 수 있다` |
| `응답에 카테고리 정보가 포함된다` | `할 일에 연결된 카테고리 이름과 색상이 보인다` |
| `잘못된 필드로 title이 표시된다` | `제목을 다시 확인하라는 안내가 보인다` |
| `INVALID_CATEGORY 오류 코드가 응답된다` | `사용할 수 없는 카테고리라는 안내가 보인다` |
| `빈 content가 반환된다` | `목록에는 할 일이 보이지 않는다` |
| `totalElements가 유지된다` | `현재 남아 있는 전체 개수를 알 수 있다` |

예외는 한 가지다. 오류 코드/상태 코드가 **고객 지원·운영자가 직접 보는 명시적 결과**(외부 API 계약, 운영 콘솔 알림 코드 등)라면 GWT에 남길 수 있다. 카드의 수용 기준 문장에 그 코드가 직접 적혀 있을 때만 인정한다.

```gherkin
# 좋은 예 (AC와 GWT 모두 관계자 언어)
Scenario: 사용자가 선택 항목을 비워 두고 새 할 일을 만든다
  Covers:
    - 할 일 생성 시 설명을 비워 두면 설명 없이 저장된다
    - 할 일 생성 시 카테고리를 선택하지 않으면 미분류로 저장된다

  Given 로그인한 사용자가 새 할 일을 만들 준비가 되어 있다
  When 설명과 카테고리를 선택하지 않고 새 할 일을 만든다
  Then 새 할 일이 선택하지 않은 정보 없이 저장된다
  And 카테고리를 고르지 않았다면 미분류 상태로 보인다
```

AC와 Covers가 같은 사용자 관찰 어휘로 정리되어 있고, GWT는 그 위에서 한 번 더 사용자 행위 흐름으로 표현한 모습이다. 카드 AC가 아직 `null을 명시하면` 같은 기술 어휘로 남아 있는 카드는 후속 작업으로 정리한다 — Covers는 AC를 그대로 옮기므로 카드 AC 정리와 함께 같이 바뀐다.

좋은 예 (목록 조회):

```gherkin
Scenario: 사용자가 자신의 할 일 목록을 확인한다
  Covers:
    - 본인의 할 일 목록만 조회된다

  Given 로그인한 사용자가 할 일을 여러 개 가지고 있다
  And 다른 사용자의 할 일도 함께 존재한다
  When 사용자가 할 일 목록을 연다
  Then 자신의 할 일만 보인다
```

피해야 할 예:

```gherkin
# 라우트와 HTTP 메서드를 시나리오에 박은 경우
When 사용자가 GET /todos 를 호출한다
Then 응답 상태 코드가 200이다

# DTO/JSON 키를 시나리오에 노출한 경우
Then 응답 본문의 $.content.length 가 6이다
```

API/DB/Service 명세는 평소대로 컨트롤러·DTO·Entity·Service 골격, 내부 동작 코멘트, `previewSchema` 산출물에서 본다. `.feature`는 그 위에서 사람이 검토하는 업무 시나리오 한 겹이다.

## 자동 검증 항목

- `test`: JUnit 테스트 실행, PASS/FAIL/SKIP 수집.
- `generateHarnessSourceIndex`: 테스트 클래스의 `@Requirement`와 메서드의 `@Covers`/`@DisplayName`을 source index로 수집.
- `generateScenarioIndex`: `docs/scenarios/REQ-XXX-*.feature`를 파싱해 `@REQ-XXX` 태그, Feature/Scenario 제목, `Covers:` 블록, Given/When/Then을 수집한다. Cucumber 런타임은 사용하지 않고 파서만 사용한다.
- `validateHarness`: 카드의 수용 기준이 `@Covers`로 모두 커버되는지, 연결 테스트가 모두 PASS인지 검사.
- `front-end` `npm run validate`: TypeScript, lint, Vitest, Vite build를 실행한다.
- `front-end` `npm run validate:full`: 빠른 FE 게이트에 Storybook build와 Playwright E2E/accessibility smoke를 더한다.
- `generateFrontEndSourceIndex`: Playwright FE BDD 테스트의 `Requirement`/`Covers`, route/page/story 메타데이터를 수집한다.
- `traceRequirements`: 구현 대상에 따라 백엔드 Acceptance Test와 FE BDD 테스트 결과를 병합한다. `front-end` 대상은 FE BDD 테스트 PASS가 필요하고, `full-stack` 대상은 백엔드와 FE가 모두 PASS여야 한다.
- `validateHarness` WARNING (report-only, 마이그레이션 완료 후 ERROR 승격 예정):
  - `TEST_COVERS_NO_SCENARIO_COVERS`: BDD 테스트의 `@Covers` AC가 같은 요건의 어떤 `.feature Scenario Covers:`에도 없음.
  - `SCENARIO_COVERS_NO_CARD_AC`: `.feature`의 `Covers:` 항목이 카드 수용 기준과 정확히 일치하지 않음.
  - `FEATURE_UNKNOWN_REQ_TAG`: `.feature`의 `@REQ-XXX` 태그가 카드에 없는 요건을 가리킴.

## 수동 리뷰 항목

- 시나리오가 사용자 행위 단위로 잘 잘렸는지 (입력 변형/경계값마다 시나리오를 새로 만들지 않았는지)
- 같은 수용 기준에 대해 어떤 분기/경계까지 테스트를 더 만들지
- 시나리오 제목과 Given/When/Then이 업무 언어로 작성되었고 AC 문장의 단순 복사가 아닌지
- 프론트엔드와 백엔드가 같은 시나리오 문서를 보고 구현해도 모순이 없는지
- 한 시나리오에 핵심 When이 여러 개로 묶여 흐름이 과도하게 큰지
- 부수 효과(저장 상태, 외부 호출, 로그) 검증 범위
- 목록 조회에서 첫 페이지, 다음 페이지, 범위 초과 페이지 중 어떤 페이징 경계까지 필요한지
- 테스트 데이터가 의도를 가린 채 "돌게만" 만들어졌는지
