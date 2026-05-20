# 프로젝트 폴더 구조 가이드

## 전체 구조

```text
bdd-workflow/
  AGENTS.md
  .gitignore
  docs/
    README.md
    harness/
      overview.md
      project-structure.md
      requirement-authoring.md
    requirements/
      REQ-001-email-signup.md
    templates/
      README.md
      requirement-card.md
  back-end/
    README.md
    gradlew
    gradlew.bat
    build.gradle
    settings.gradle
    gradle.properties
    gradle/
      wrapper/
        gradle-wrapper.jar
        gradle-wrapper.properties
    package.json
    tools/
      trace-requirements.mjs
    src/
      harness/
        java/
          com/example/bddworkflow/harness/
            SourceIndexGenerator.java
      main/
        java/
          com/example/bddworkflow/
            BddWorkflowApplication.java
            common/
              ApiError.java
              ApiExceptionHandler.java
            harness/
              Requirement.java
            user/
              UserController.java
              UserService.java
              InMemoryUserRepository.java
              SignupRequest.java
              SignupResponse.java
              DuplicateEmailException.java
              UserAccount.java
        resources/
          application.yml
      test/
        java/
          com/example/bddworkflow/
            harness/
              AcceptanceTest.java
              Covers.java
            user/
              SignupApiAcceptanceTest.java
    build/
      harness/
        source-index.json
        trace-report.md
        trace-report.json
```

## 루트

```text
AGENTS.md
```

하네스 운영의 최상위 규칙이다. 요건 작성, 질문, 의사결정 로그, BDD 테스트 작성, RED/GREEN/BLUE 판정, 검증 명령은 이 문서를 기준으로 한다.

```text
.gitignore
```

Gradle 빌드 산출물, 하네스 생성 리포트, 클래스 파일 등 생성물을 제외한다.

## docs

```text
docs/README.md
```

문서 폴더의 진입점이다.

```text
docs/harness/
```

하네스 자체의 운영 문서를 둔다.

- `overview.md`: 하네스 목적, 추적 구조, 상태 판정
- `project-structure.md`: 프로젝트 전체 폴더 구조
- `requirement-authoring.md`: 질문 기반 요건 작성과 BDD 테스트 리뷰 절차

```text
docs/requirements/
```

사람이 직접 관리하는 요건 카드를 둔다. 파일명은 요건 ID와 짧은 제목을 포함한다.

```text
REQ-001-email-signup.md
```

```text
docs/templates/
```

새 요건 카드 작성 템플릿을 둔다.

## back-end

```text
back-end/build.gradle
back-end/settings.gradle
back-end/gradle.properties
```

Spring Boot Gradle 프로젝트 설정이다. `validateHarness`와 `traceRequirements` 태스크도 여기서 정의한다.

```text
back-end/gradlew
back-end/gradlew.bat
back-end/gradle/wrapper/
```

프로젝트 고정 Gradle Wrapper다. 검증 명령은 시스템 Gradle 대신 `./gradlew`를 기준으로 실행한다.

```text
back-end/package.json
```

Node 기반 하네스 스캐너 실행 편의 스크립트를 둔다. 애플리케이션 런타임 의존성 관리는 Gradle이 담당한다.

```text
back-end/tools/trace-requirements.mjs
```

요건 카드, JavaParser source index, Gradle 테스트 결과를 병합해 추적 리포트를 생성한다.

```text
back-end/src/harness/java/com/example/bddworkflow/harness/SourceIndexGenerator.java
```

JavaParser로 컨트롤러와 Acceptance Test 소스를 파싱해 `build/harness/source-index.json`을 생성한다. Java 코드 내용은 Node 정규식이 아니라 이 인덱서가 구조적으로 읽는다.

## Spring Boot 소스 구조

기본 원칙은 도메인 또는 기능 단위 패키지다.

```text
src/main/java/com/example/bddworkflow/
  BddWorkflowApplication.java
  common/
  harness/
  {domain}/
```

```text
common/
```

전역 API 오류 응답과 공통 예외 처리를 둔다.

- `ApiError.java`: API 오류 응답 DTO
- `ApiExceptionHandler.java`: Bean Validation 같은 전역 예외 응답 매핑

```text
harness/
```

운영 코드에서 사용하는 하네스 애너테이션을 둔다.

- `Requirement.java`

```text
{domain}/
```

도메인별 API, 서비스, DTO, 예외, 도메인 모델을 같은 패키지에 둔다. 예제는 `user/` 패키지다.

- `*Controller.java`: API 엔드포인트, `@Requirement`, OpenAPI 명세
- `*Service.java`: 유스케이스 처리
- `*Repository.java`: 예제 저장소 또는 영속성 포트
- `*Request.java`: 요청 DTO, Bean Validation, `@Schema`
- `*Response.java`: 응답 DTO, `@Schema`
- `*Exception.java`: 도메인 예외
- 도메인 모델: `UserAccount.java` 같은 업무 객체

## 테스트 구조

```text
src/test/java/com/example/bddworkflow/
  harness/
  {domain}/
```

```text
test/harness/
```

BDD 테스트 작성에 필요한 테스트 전용 애너테이션을 둔다.

- `AcceptanceTest.java`
- `Covers.java`

```text
test/{domain}/
```

요건 수용 기준을 검증하는 Acceptance Test를 둔다.

파일명은 다음 형식을 따른다.

```text
{Feature}ApiAcceptanceTest.java
```

테스트 클래스에는 `@AcceptanceTest`와 `@Requirement("REQ-000")`를 붙인다. 테스트 메서드는 수용 기준 문장을 `@Covers`와 `@DisplayName`에 그대로 사용한다.

## 생성 산출물

```text
back-end/build/
```

Gradle 빌드와 하네스 리포트 생성물이다. 사람이 직접 수정하지 않는다.

```text
back-end/build/harness/trace-report.md
back-end/build/harness/trace-report.json
back-end/build/harness/source-index.json
```

요건, API, 테스트, 테스트 결과를 연결한 자동 생성 산출물이다.

## 새 기능 추가 위치

새 요건을 추가할 때는 다음 순서로 파일을 만든다.

```text
docs/requirements/REQ-002-some-feature.md
back-end/src/main/java/com/example/bddworkflow/{domain}/SomeController.java
back-end/src/main/java/com/example/bddworkflow/{domain}/SomeService.java
back-end/src/main/java/com/example/bddworkflow/{domain}/SomeRequest.java
back-end/src/main/java/com/example/bddworkflow/{domain}/SomeResponse.java
back-end/src/test/java/com/example/bddworkflow/{domain}/SomeApiAcceptanceTest.java
```

구현 전에는 요건 카드와 Acceptance Test를 먼저 작성하고 리뷰한다.

## 금지 사항

- 요건 카드에 API 목록과 테스트 목록을 수기로 유지하지 않는다.
- 별도 시나리오 ID와 API ID를 만들지 않는다.
- `build/` 아래 생성물을 직접 편집하지 않는다.
- 수용 기준 문장과 `@Covers` 값을 다르게 쓰지 않는다.
