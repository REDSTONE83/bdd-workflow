# Spring Boot BDD Harness Example

이 예제는 별도 시나리오 ID나 API ID 없이 `REQ-001` 같은 요건 ID만 관리하는 코드 중심 BDD 하네스 구조를 보여준다.

## 구성

- API 명세: 컨트롤러 메서드의 OpenAPI 애너테이션
- BDD 시나리오: JUnit Acceptance Test의 클래스/메서드명, `@DisplayName`, `@Covers`
- 요건 연결: API와 테스트에 `@Requirement("REQ-001")` 태깅
- 코드 인덱싱: JavaParser 기반 `generateHarnessSourceIndex` 태스크가 컨트롤러와 테스트를 구조적으로 스캔
- 커버리지 확인: 루트 `tools/harness/trace-requirements.mjs`가 요건 카드, JavaParser source index, FE source index, 테스트 결과를 병합

## 실행

Gradle Wrapper로 Spring Boot 테스트를 실행한다. 시스템에 Gradle CLI가 없어도 된다.

```bash
./gradlew test
```

요건 카드와 코드의 연결 상태를 확인한다.

```bash
./gradlew traceRequirements
```

JavaParser source index만 생성할 수도 있다.

```bash
./gradlew generateHarnessSourceIndex
```

루트에서 테스트 실행 후 하네스 품질 게이트까지 확인한다.

```bash
cd ..
npm run validate
```

백엔드 Gradle 태스크를 직접 확인할 때는 다음을 실행한다.

```bash
./gradlew validateHarness
```

리포트는 루트 `build/harness/trace-report.md`와 `build/harness/trace-report.json`에 생성된다. 테스트를 아직 실행하지 않았다면 결과는 `NOT_RUN`으로 표시된다.

초기 실행에서 `node ../tools/harness/trace-requirements.mjs`만 먼저 실행하면 JavaParser source index나 테스트 결과 파일이 없어 실패하거나 `RED / NOT_RUN`으로 보일 수 있다. `./gradlew traceRequirements` 또는 `./gradlew validateHarness`를 사용하면 필요한 source index가 먼저 생성된다.

## 상태 해석

- `RED`: 수용 기준을 커버하는 테스트가 없거나 테스트가 실패함
- `GREEN`: 수용 기준을 커버하는 테스트가 모두 통과함
- `BLUE`: `GREEN` 이후 요건 카드가 승인되고 열린 질문이 없음
