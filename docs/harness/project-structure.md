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
    standards/
      README.md
      requirement-card.md
      package-structure.md
      api-contract.md
      persistence-schema.md
      acceptance-test.md
      id-policy.md
      datetime.md
      terminology.md
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
      preview-schema.mjs
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
              UserRepository.java
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
        schema-preview.sql
```

## 루트

```text
AGENTS.md
```

문서 진입점 인덱스다. 핵심 원칙과 작성 절차 요약을 두고, 세부 규칙은 `docs/standards/`, 하네스 운영은 `docs/harness/`로 분기한다.

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
docs/standards/
```

사람이 정한 전역 구현 표준을 둔다. 요건 카드 형식, API 계약, JPA Entity, Acceptance Test, 표준 용어 운영 규칙이 모두 이 폴더의 단일 소스에서 관리된다. `AGENTS.md`는 이 폴더의 인덱스 역할만 한다.

- `requirement-card.md`: 요건 카드 필수 항목과 작성 규칙
- `api-contract.md`: 컨트롤러/DTO/OpenAPI/전역 오류 응답
- `persistence-schema.md`: JPA Entity와 schema preview
- `acceptance-test.md`: Acceptance Test와 리뷰 체크리스트
- `terminology.md`: 표준 용어 safe/strict 게이트 운영

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

Spring Boot Gradle 프로젝트 설정이다. `validateHarness`, `traceRequirements`, `previewSchema` 태스크도 여기서 정의한다.

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
back-end/tools/preview-schema.mjs
```

JavaParser source index의 `entities[]`를 읽어 검토용 DDL(`build/harness/schema-preview.sql`)을 생성한다. 구현 전 사용자에게 스키마 확인을 받는 용도이며, 실제 마이그레이션 산출물은 아니다.

```text
back-end/src/harness/java/com/example/bddworkflow/harness/SourceIndexGenerator.java
```

JavaParser로 컨트롤러, JPA `@Entity` 클래스, Acceptance Test 소스를 파싱해 `build/harness/source-index.json`을 생성한다. Java 코드 내용은 Node 정규식이 아니라 이 인덱서가 구조적으로 읽는다. `@Requirement`는 클래스/메서드/필드 어디에 붙어 있어도 인덱싱되며, 단일값과 배열값(`{"REQ-001","REQ-002"}`)을 모두 지원한다.

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

도메인별로 별도 패키지를 둔다. 한 도메인 안에서는 다음 6개 하위 패키지로 명시적으로 분리한다. 자세한 규칙은 `docs/standards/package-structure.md`를 본다.

```text
{domain}/
  controller/   # API 엔드포인트, @Requirement, OpenAPI
  dto/          # Request/Response DTO, Bean Validation, @Schema
  service/      # 유스케이스 처리
  domain/       # 도메인 모델 / JPA Entity
  exception/    # 도메인 예외
  repository/   # Spring Data JPA repository 또는 영속성 포트
```

- 컨트롤러/DTO는 [`api-contract.md`](../standards/api-contract.md), Entity는 [`persistence-schema.md`](../standards/persistence-schema.md)를 따른다.
- 식별자는 시간 정렬 UUID ([`id-policy.md`](../standards/id-policy.md)), 시각은 `Instant` UTC ([`datetime.md`](../standards/datetime.md)).

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
back-end/build/harness/schema-preview.sql
```

요건, API, Entity, 테스트, 테스트 결과를 연결한 자동 생성 산출물이다. `schema-preview.sql`은 구현 전 사용자 검토용 DDL 미리보기다.

## 새 기능 추가 위치

새 요건을 추가할 때는 다음 순서로 파일을 만든다.

```text
docs/requirements/REQ-002-some-feature.md
back-end/src/main/java/com/example/bddworkflow/{domain}/controller/SomeController.java
back-end/src/main/java/com/example/bddworkflow/{domain}/service/SomeService.java
back-end/src/main/java/com/example/bddworkflow/{domain}/dto/SomeRequest.java
back-end/src/main/java/com/example/bddworkflow/{domain}/dto/SomeResponse.java
back-end/src/main/java/com/example/bddworkflow/{domain}/domain/SomeEntity.java       # 필요 시
back-end/src/main/java/com/example/bddworkflow/{domain}/exception/SomeException.java # 필요 시
back-end/src/main/java/com/example/bddworkflow/{domain}/repository/SomeRepository.java
back-end/src/test/java/com/example/bddworkflow/{domain}/SomeApiAcceptanceTest.java
```

구현 전에는 요건 카드와 Acceptance Test를 먼저 작성하고 리뷰한다. DB 스키마가 새로 생기거나 바뀌면 `./gradlew previewSchema` 결과를 사용자에게 확인 받는다.

## 금지 사항

- 요건 카드에 API 목록, Entity 목록, 테스트 목록을 수기로 유지하지 않는다.
- 별도 시나리오 ID, API ID, 테이블 ID를 만들지 않는다.
- `build/` 아래 생성물을 직접 편집하지 않는다.
- 수용 기준 문장과 `@Covers` 값을 다르게 쓰지 않는다.
- `@Requirement`에 카드에 없는 요건 ID를 남기지 않는다. (validateHarness가 실패한다)
