# Change Set: 하네스 프로젝트 분리

상태: 완료
요청일: 2026-06-04
변경 유형: 하네스 개선, 분리, 마이그레이션
영향 요건: REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-012
논의 상태: 없음

## 요청 요약

- 하네스 테스트 프로젝트 자체를 `back-end`에서 분리한다.
- Java에 고정하지 않고, 하네스 실행 진입점과 self-test, 공통 애너테이션/테스트 지원 API를 애플리케이션과 독립적으로 관리한다.

## 작업 범위

- `harness/` 독립 프로젝트를 만들고 Java `annotations`, JavaParser `source-indexer`, Node/TypeScript `self-test`를 둔다.
- Spring/MockMvc/JWT 기반 백엔드 테스트 지원 코드는 `back-end/src/test/java/com/example/bddworkflow/testsupport`가 소유한다.
- `back-end`는 composite build로 하네스 공통 라이브러리를 참조하되, 하네스 self-test와 JavaParser 인덱서 구현은 포함하지 않는다.
- 하네스 Node 도구를 `harness/tools`로 이동하고, 루트 `npm run validate`/`npm run trace`가 `harness/tools/run.mjs`를 통합 진입점으로 사용하게 한다.
- OpenAPI dump는 백엔드 애플리케이션 계약 export 어댑터로 `back-end/src/openApiIndex/java`에 둔다.
- 하네스 self-test 결과와 OpenAPI export 결과는 계속 루트 `build/harness` 아래에 생성한다.
- 하네스 표준 문서, 요건 카드, 시나리오의 경로와 검증 명령을 새 구조로 갱신한다.

## 제외 범위

- 프런트엔드 Playwright BDD 테스트 구조 변경
- 하네스 JSON data contract의 필드 구조 변경
- 애플리케이션 업무 로직 변경
- OpenAPI export를 HTTP 서버 기동 방식으로 전환

## 완료 조건

- `back-end`에는 레거시 하네스 source set이 없다.
- `back-end/build.gradle`에 하네스 self-test 태스크가 없다.
- `cd back-end && ./gradlew test`는 애플리케이션 JUnit 테스트만 실행한다.
- `npm run harness:self-test`는 `harness/self-test`의 하네스 요건 테스트만 실행한다.
- `npm run harness:source-index`는 애플리케이션 Java 테스트를 `backend.source-index.json`에 기록한다.
- `npm run harness:self-test-index`는 하네스 TypeScript self-test를 `harness.self-test.index.json`에 기록한다.
- `npm run validate`가 루트 하네스 진입점에서 통합 게이트를 실행한다.

## 검증 명령

- `cd back-end && ./gradlew compileJava compileTestJava compileOpenApiIndexJava`
- `npm run harness:source-index`
- `npm run harness:self-test-index`
- `cd back-end && ./gradlew test`
- `npm run harness:self-test`
- `npm run validate`

검증 결과:

- `cd back-end && ./gradlew compileJava compileTestJava compileOpenApiIndexJava` PASS
- `npm run harness:source-index` PASS
- `npm run harness:self-test-index` PASS
- `cd back-end && ./gradlew test` PASS
- `npm run harness:self-test` PASS
- `npm run validate` PASS

## 결정 로그

- 2026-06-04: 하네스 프로젝트는 `back-end` 하위 source set이 아니라 루트 `harness/` 독립 빌드로 분리한다. 백엔드는 composite build로 하네스 공통 라이브러리만 참조한다.
- 2026-06-04: OpenAPI dump는 실제 Spring Boot 컨텍스트가 필요하므로 백엔드의 계약 export 어댑터로 남기되, 하네스 self-test와 분리해 `src/openApiIndex/java`에 둔다.
- 2026-06-04: 통합 실행 진입점은 Gradle 태스크가 아니라 `harness/tools/run.mjs`로 둔다. 루트 `npm run validate`가 이 러너를 호출한다.
- 2026-06-04: `spring-test-support` 모듈은 하네스에서 제거한다. `ApiAcceptanceTest`, `ApiRequestSupport`, `TestJwt`는 Spring/MockMvc/JWT에 묶인 백엔드 테스트 fixture이므로 백엔드 테스트 소스로 이동한다.
- 2026-06-04: `AcceptanceTest` 애너테이션은 제거한다. 하네스 추적에 필요한 최소 Java 애너테이션은 `Requirement`와 `Covers`로 제한한다.
- 2026-06-04: 하네스 self-test는 Java/JUnit이 아니라 Node/TypeScript 테스트로 둔다. 실행은 Node 내장 test runner, 추적 메타데이터 수집은 `harness.self-test.index.json`, 결과 수집은 `node/harness` 런타임으로 분리한다.

## 열린 논의

- 없음
