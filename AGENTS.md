# BDD Workflow Harness Agent Guide

이 저장소는 Spring Boot API 개발을 코드 중심 BDD 방식으로 진행하기 위한 하네스 예제다. 별도 시나리오 ID와 API ID는 만들지 않고, 사람이 관리하는 ID는 `REQ-001` 같은 요건 ID만 둔다.

## 핵심 원칙

- 요건 카드는 `/docs/requirements`에 둔다.
- API 명세는 Spring Boot 컨트롤러와 DTO 애너테이션에 둔다.
- DB 스키마는 JPA `@Entity` 클래스에 둔다. 컬럼 단위 추적이 필요하면 필드에도 `@Requirement`를 붙인다.
- BDD 시나리오는 별도 `.feature` 파일이 아니라 Acceptance Test 코드로 표현한다.
- 수용 기준 커버리지는 테스트 메서드의 `@Covers` 값으로 판단한다.
- API, DTO, Entity, 테스트는 `@Requirement("REQ-001")` 또는 `@Requirement({"REQ-001","REQ-002"})`로 하나 이상의 요건에 연결한다. 공통 응답 DTO처럼 도메인 무관한 클래스는 비워둔다.
- 추적표와 검증 리포트는 사람이 직접 관리하지 않고 하네스가 생성한다.

## 직접 관리하는 산출물

사람이 직접 관리하는 산출물은 최소화한다.

```text
docs/requirements/*.md
src/main/java/**/*
src/test/java/**/*AcceptanceTest.java
```

`back-end/build/harness/*` 리포트는 생성 산출물이다.

## 프로젝트 폴더 구조

전체 폴더 구조와 파일 배치 기준은 `docs/harness/project-structure.md`를 따른다.

핵심 배치는 다음과 같다.

```text
docs/requirements/
  요건 카드

docs/harness/
  하네스 운영 문서

back-end/src/main/java/com/example/bddworkflow/{domain}/
  Spring Boot API, 서비스, DTO, 예외, 도메인 모델

back-end/src/test/java/com/example/bddworkflow/{domain}/
  BDD Acceptance Test

back-end/tools/
  하네스 리포터

back-end/src/harness/java/
  JavaParser 기반 source index 생성기

back-end/gradlew
  프로젝트 고정 Gradle Wrapper

back-end/build/harness/
  자동 생성 추적 리포트
```

새 기능은 요건 카드, 도메인 패키지, Acceptance Test를 같은 도메인명 기준으로 추가한다.

## 요건 카드 규칙

요건 카드는 사람이 5-15분 안에 검토할 수 있는 크기로 작성한다.

요건 카드를 작성할 때 불명확한 부분이 있으면 바로 구현하지 않는다. 먼저 사용자에게 짧고 구체적인 질문을 하고, 답변으로 확정된 내용은 `확인 질문 로그`와 `의사결정 로그`에 남긴다.

필수 항목:

- `요건 ID`
- `제목`
- `우선순위`
- `상태`
- `사용자/목적`
- `범위`
- `표준 용어`
- `제외 범위`
- `확인 질문 로그`
- `수용 기준`
- `의사결정 로그`
- `BDD 테스트 리뷰`
- `열린 질문`

`수용 기준`의 각 문장은 Acceptance Test의 `@Covers` 값과 정확히 일치해야 한다.

`표준 용어`에는 `docs/terminology/`에 정의된 term key만 적는다. 검색은 `node back-end/tools/terminology.mjs search <표현>`을 쓰고, 새 용어가 필요하면 `node back-end/tools/terminology.mjs draft add ...`로 후보를 등록한다. `draft.json`은 직접 편집하지 않는다. 명령 상세는 `docs/terminology/README.md` 운영 흐름 절을 참고한다. draft 용어가 카드에 남아 있어도 일상 검증(`validateHarness`)은 통과하지만, 최종 승인 게이트인 `./gradlew validateTerminologyStrict`에서는 error가 되어 빌드를 실패시킨다.

요건 카드에는 API 목록이나 테스트 메서드 목록을 직접 관리하지 않는다. API와 테스트 연결은 코드의 `@Requirement`, `@Covers`를 스캔해 생성 리포트에서 확인한다.

초안 단계에서는 `BDD 테스트 리뷰` 결과를 `미완료`로 둘 수 있다. 수용 기준과 Acceptance Test가 리뷰되기 전에는 요건 카드 상태를 `승인`으로 바꾸지 않는다.

## 질문 기반 요건 작성 절차

요건 작성은 다음 순서로 진행한다.

```text
1. 사용자 요청을 요건 카드 초안으로 정리한다.
2. 모호한 범위, 예외, 정책, 권한, 상태 변화를 질문한다.
3. 사용자 답변을 확인 질문 로그에 기록한다.
4. 확정된 선택은 의사결정 로그에 남긴다.
5. 수용 기준을 검증 가능한 문장으로 정리한다.
6. 수용 기준과 동일한 문장을 @Covers로 사용해 Acceptance Test를 먼저 작성한다.
7. 테스트 코드가 요건을 충분히 커버하는지 리뷰한다.
8. 구현 후 ./gradlew validateHarness로 RED/GREEN/BLUE 상태를 확인한다.
```

사용자에게 질문해야 하는 대표 상황:

- 포함 범위와 제외 범위가 구분되지 않는다.
- 정상 흐름은 알지만 실패/예외 조건이 비어 있다.
- 권한, 인증, 상태 전이, 중복 처리 정책이 불명확하다.
- HTTP 상태 코드나 오류 코드 정책이 정해지지 않았다.
- 수용 기준을 테스트 코드로 옮겼을 때 하나 이상의 해석이 가능하다.

질문은 한 번에 1-3개만 한다. 답변 없이 임의로 결정해야 하는 경우에는 가정을 명시하고, 그 가정을 의사결정 로그에 남긴다.

## 의사결정 로그 규칙

의사결정 로그는 구현 이유를 추적하기 위한 최소 기록이다.

각 항목은 다음을 포함한다.

- 결정일
- 결정
- 이유
- 결정자
- 영향

결정이 수용 기준을 바꾸면 Acceptance Test의 `@Covers`와 `@DisplayName`도 함께 갱신한다.

## API 작성 규칙

컨트롤러 메서드는 관련 요건을 명시한다.

```java
@Requirement("REQ-001")
@PostMapping("/signup")
public ResponseEntity<SignupResponse> signup(...) {
    ...
}
```

OpenAPI 설명은 컨트롤러와 DTO에 둔다.

- 컨트롤러: `@Operation`, `@ApiResponse`
- DTO: `@Schema`, Bean Validation

도메인 DTO(`SignupRequest`, `SignupResponse` 등)는 클래스 레벨에 `@Requirement`를 명시한다. Entity 규칙과 동일하게 명시적으로 부여하며, `validateTerminology`가 카드별 finding을 정확히 attribute하기 위해 필요하다. `ApiError`처럼 도메인 무관한 공통 응답 DTO는 `@Requirement`를 비워두고 `common` 패키지에 둔다.

메서드 레벨 `@RequestMapping`을 사용할 때는 `method = RequestMethod.GET`처럼 HTTP method를 반드시 지정한다. 가능하면 `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`을 우선 사용한다.

전역 API 오류 응답과 검증 예외 처리는 `common` 패키지에 둔다. 도메인 전용 예외를 별도 정책으로 매핑해야 할 때만 해당 도메인 패키지에 전용 handler를 둔다.

## Entity / DB 스키마 작성 규칙

DB 스키마는 JPA `@Entity` 클래스로 정의한다. 별도 ERD나 DDL 문서를 사람이 직접 유지하지 않는다.

```java
@Entity
@Table(name = "user_account")
@Requirement({"REQ-001"})
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Requirement("REQ-001")
    @Column(nullable = false, length = 100)
    private String name;

    @Requirement("REQ-005") // 나중에 추가된 컬럼은 해당 요건만 표기
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
}
```

작성 규칙:

- 클래스 레벨 `@Requirement`는 이 Entity에 손댄 모든 요건 ID를 합집합으로 적는다.
- 필드 레벨 `@Requirement`가 있으면 컬럼 단위 추적에 사용된다. 없으면 클래스 레벨 값으로 폴백한다.
- `@Column`의 `name`, `nullable`, `unique`, `length`는 schema preview가 그대로 읽는다. 정확하게 적는다.
- 구현 전에 `./gradlew previewSchema`로 생성될 DDL을 검토하고 사용자에게 확인을 받는다.
- Entity 변경이 수용 기준에 영향을 주면 요건 카드의 `의사결정 로그`에 남긴다.

## Acceptance Test 작성 규칙

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

테스트 리뷰 시 확인할 항목:

- 모든 수용 기준이 하나 이상의 `@Covers`로 연결되어 있다.
- `@Covers` 문장이 요건 카드의 수용 기준 문장과 정확히 일치한다.
- 테스트명과 `@DisplayName`이 사용자가 이해할 수 있는 결과 중심 문장이다.
- Given/When/Then 구역이 드러난다.
- 정상, 예외, 경계 조건이 빠지지 않았다.
- HTTP 상태, 응답 본문, 저장 상태나 부수 효과를 필요한 만큼 검증한다.
- 테스트가 구현 세부사항보다 API 계약과 업무 결과를 검증한다.

## RED / GREEN / BLUE

하네스는 요건별 상태를 다음처럼 계산한다.

```text
RED
- 관련 API가 없음
- 수용 기준을 커버하는 테스트가 없음
- 테스트가 실행되지 않음
- 테스트가 실패 또는 스킵됨

GREEN
- 관련 API가 있음
- 모든 수용 기준이 테스트로 커버됨
- 연결된 테스트가 모두 PASS
- 단, 요건 카드가 아직 승인되지 않았거나 열린 질문이 남아 있음

BLUE
- GREEN 조건을 만족함
- 요건 카드 상태가 승인
- 열린 질문이 없음
```

## 표준 용어와 용어 검증

용어 사전과 검사 알고리즘은 `docs/terminology/README.md`에서 정의한다. 일상 운영에서 기억할 핵심은 다음과 같다.

- 검증 모드는 두 가지뿐이다. `safe`(기본)는 모든 finding을 warning으로 보고하고 항상 exit 0이며, `strict`는 심각 finding을 error로 보고하고 1개라도 있으면 exit 1이다.
- `validateHarness`는 safe 모드 `validateTerminology`를 의존성으로 포함한다. 따라서 일상 빌드는 terminology finding 때문에 실패하지 않고, 잠재 위반은 `counts.strictError`로 누적되어 미리 보인다.
- 최종 승인이나 릴리스 전에는 `./gradlew validateTerminologyStrict`를 별도로 돌려 strict error를 0으로 맞춘다. 이 게이트는 `validateHarness`에 연결하지 않는다.
- finding 종류별 severity는 README의 표를 따른다. `BAN_VIOLATION`, `UNKNOWN_TERM`, `INVALID_TERM_KEY`, `GLOSSARY_NAME_DUPLICATE`, `DRAFT_TERM`은 safe에서 warning, strict에서 error다. `UNREGISTERED_CODE_NAME`, `AMBIGUOUS_SURFACE`는 모드와 무관하게 warning이다.
- `blue-blocker` severity 개념은 폐지되었다. draft 용어는 더 이상 BLUE 자체를 차단하지 않고, strict 게이트에서 error로만 잡힌다.
- trace 리포트는 terminology finding을 카드별로 표시/집계만 한다. safe 리포트의 `strictError`는 "잠재 strict 실패" 지표로 같이 보여주되, RED/GREEN/BLUE 판정에는 반영하지 않는다. 실제 실패 게이트는 `validateTerminologyStrict` 태스크 하나뿐이며, `validateHarness`를 우회적으로 strict 게이트로 만들지 않는다.

## 검증 명령

Spring Boot 테스트:

```bash
cd back-end
./gradlew test
```

추적 리포트 생성:

```bash
cd back-end
./gradlew traceRequirements
```

JavaParser source index만 생성:

```bash
cd back-end
./gradlew generateHarnessSourceIndex
```

Entity 기반 DDL 미리보기 생성 (`back-end/build/harness/schema-preview.sql`):

```bash
cd back-end
./gradlew previewSchema
```

테스트 실행 후 RED 여부까지 검증 (safe 모드 용어 검증 포함):

```bash
cd back-end
./gradlew validateHarness
```

전체 확인:

```bash
cd back-end
./gradlew check
```

용어 검증만 따로 (safe, 일상용):

```bash
cd back-end
./gradlew validateTerminology
```

최종 승인 / 릴리스 전 strict 게이트:

```bash
cd back-end
./gradlew validateTerminologyStrict
```

## 변경 절차

1. 요건 카드를 초안으로 작성하거나 수정한다.
2. 불명확한 부분을 사용자에게 질문한다.
3. 답변과 결정을 요건 카드에 기록한다.
4. `node back-end/tools/terminology.mjs search`로 기존 용어를 찾고 카드의 `표준 용어`에 term key를 적는다. 필요하면 `node back-end/tools/terminology.mjs draft add ...`로 후보를 등록한다 (수정/삭제도 동일하게 `draft update`, `draft delete`를 쓴다; `draft.json`을 직접 편집하지 않는다).
5. 수용 기준을 확정한다.
6. Acceptance Test에 `@Requirement`, `@Covers`, `@DisplayName`을 작성한다.
7. BDD 테스트 코드가 요건을 충분히 커버하는지 리뷰한다.
8. 컨트롤러/DTO에 API 계약과 `@Requirement`를 명시한다.
9. JPA `@Entity` / 필드에 `@Requirement`를 명시하고, `./gradlew previewSchema` 결과로 사용자에게 스키마 확인을 받는다.
10. 구현한다.
11. `./gradlew validateHarness`로 요건, 표준 용어(safe), API, Entity, 테스트, 결과 연결을 확인한다.
12. 카드를 `승인`으로 올리거나 릴리스 전이라면 `./gradlew validateTerminologyStrict`를 돌려 strict error를 0으로 맞춘다.

요건 카드의 구현 완료 여부는 카드 전체 자연어가 아니라 `수용 기준` 커버리지로 판단한다.
