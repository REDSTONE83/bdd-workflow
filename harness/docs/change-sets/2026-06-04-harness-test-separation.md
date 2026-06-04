# Change Set: 하네스 테스트와 결과 산출물 분리

상태: 완료
요청일: 2026-06-04
변경 유형: 하네스 개선, 분리
영향 요건: REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-012
논의 상태: 없음

## 요청 요약

- 하네스 요건에 대한 테스트 코드, 테스트 결과, 테스트 리포트가 애플리케이션 테스트와 섞이지 않도록 분리한다.

## 작업 범위

- 공통 테스트 지원 코드를 `src/testSupport/java`로 분리한다.
- 하네스 요건 검증 테스트는 후속 분리에서 `harness/self-test/tests/*.test.ts`로 이동했다.
- OpenAPI dump 전용 테스트는 `back-end/src/openApiIndex/java`로 분리한다.
- Gradle `test`, `generateOpenApiIndex`, Node `harness:self-test`의 실행 대상과 리포트 위치를 분리한다.
- Java source index와 test result index가 애플리케이션 테스트와 하네스 테스트를 모두 수집하되 scope를 구분하도록 갱신한다.
- 표준 문서와 하네스 요건 카드의 테스트 경로와 검증 명령을 갱신한다.

## 제외 범위

- 운영 코드에 포함된 `@Requirement` 애너테이션 API의 별도 모듈화
- 프런트엔드 Playwright BDD 테스트 구조 변경
- 새로운 요건 ID 발급

## 완료 조건

- `./gradlew test`는 애플리케이션 JUnit 테스트만 실행한다.
- `npm run harness:self-test`는 하네스 요건 TypeScript 테스트만 실행한다.
- 하네스 self-test 결과는 루트 `build/harness/test-results/nodeSelfTest` 아래에 생성된다.
- `npm run validate`는 분리된 테스트 결과를 읽어 기존 RED/GREEN/BLUE 판정을 유지한다.

## 검증 명령

- `cd back-end && ./gradlew compileTestJava compileOpenApiIndexJava` PASS
- `npm run harness:source-index` PASS
- `npm run harness:self-test` PASS
- `cd back-end && ./gradlew test` PASS
- `cd back-end && ./gradlew generateOpenApiIndex` PASS
- `node harness/tools/index-test-results.mjs` PASS (`junit/application=124`, `junit/harness=1`, `node/harness=39`, `playwright/application=56`)
- `npm run validate` PASS

## 결정 로그

- 2026-06-04: 애플리케이션 테스트와 하네스 요건 테스트를 분리한다. 최종 구조에서 공통 Spring 테스트 지원 API는 `back-end/src/test/java/com/example/bddworkflow/testsupport`가 소유한다.
- 2026-06-04: 하네스 테스트 결과는 애플리케이션 `back-end/build/test-results/test`와 섞지 않고 루트 `build/harness/test-results/nodeSelfTest` 아래에 둔다.

## 열린 논의

- 없음
