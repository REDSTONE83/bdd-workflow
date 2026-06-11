# 프로젝트 폴더 구조 가이드

이 저장소는 애플리케이션과 하네스를 최상위에서 분리한다. 운영 경로는 `app/`과 `harness/`이며, 예전 루트 `docs/`, `back-end/`, `front-end/`는 더 이상 사용하지 않는다.

## 전체 구조

```text
bdd-workflow/
  AGENTS.md
  package.json
  app/
    docs/
      README.md
      requirements/
      change-sets/
      scenarios/
      standards/
    back-end/
      build.gradle
      settings.gradle
      src/main/java/
      src/test/java/
      src/openApiIndex/java/
      tools/preview-schema.mjs
    front-end/
      package.json
      src/
      tests/e2e/
      .storybook/
      tools/
  harness/
    docs/
      overview.md
      project-structure.md
      data-contracts.md
      requirement-authoring.md
      change-set.md
      requirements/
      change-sets/
      scenarios/
      standards/
      terminology/
      templates/
    annotations/
    source-indexer/
    tools/
    self-test/
    ui/
  build/
    app/
      indexes/
      findings/
      state/
      reports/
    harness/
      indexes/
      findings/
      state/
      reports/
      test-results/
```

## 루트

`AGENTS.md`는 작업 규칙 인덱스다. 세부 운영 문서는 `app/docs`와 `harness/docs`에 둔다.

루트 `package.json`은 scope가 명시된 명령만 제공한다.

```bash
npm run app:validate
npm run app:trace -- --requirement REQ-XXX
npm run app:test

npm run harness:validate
npm run harness:trace -- --requirement REQ-XXX
npm run harness:test
npm run harness:self-test

npm run repo:validate
```

`repo:validate`는 저장소 전체 확인용으로 앱 검증과 하네스 검증을 순서대로 실행한다. 개별 workflow에서는 `app:*` 또는 `harness:*`만 사용한다.

## app

`app/`는 제품 애플리케이션의 명세와 소스를 소유한다.

- `app/docs/requirements`: 애플리케이션 요건 카드
- `app/docs/change-sets`: 애플리케이션 작업 범위
- `app/docs/scenarios`: 애플리케이션 BDD 시나리오
- `app/docs/standards`: API, JPA, FE, 런타임 구현 표준
- `app/back-end`: Spring Boot API와 애플리케이션 JUnit/API 테스트
- `app/back-end/src/openApiIndex/java`: `/v3/api-docs` export 전용 Spring 테스트 어댑터
- `app/front-end`: React/Vite/TypeScript 프런트엔드와 Playwright E2E

애플리케이션 검증 산출물은 `build/app` 아래에 생성한다.

```text
build/app/
  indexes/
    backend.source-index.json
    front-end.source-index.json
    scenarios.index.json
    requirements.index.json
    change-sets.index.json
    terminology.index.json
    openapi.index.json
    test-results.index.json
  findings/
  state/
  reports/
  schema-preview.sql
```

## harness

`harness/`는 추적/검증 도구와 하네스 자체 명세를 소유한다.

- `harness/docs/requirements`: 하네스 요건 카드
- `harness/docs/change-sets`: 하네스 작업 범위
- `harness/docs/scenarios`: 하네스 BDD 시나리오
- `harness/docs/standards`: 요건 카드, Acceptance, 용어 등 하네스 운영 표준
- `harness/docs/terminology`: 전역 표준 용어 사전
- `harness/annotations`: 애플리케이션이 사용하는 `@Requirement`, `@Covers`
- `harness/source-indexer`: JavaParser 기반 백엔드 source indexer
- `harness/tools`: Node 기반 collector, validator, trace, report, gate
- `harness/self-test`: 하네스 요건을 검증하는 Node/TypeScript self-test
- `harness/ui`: 하네스 산출물을 조회하고 허용된 검증 명령을 실행하는 로컬 웹 UI

하네스 검증 산출물은 `build/harness` 아래에 생성한다.

```text
build/harness/
  indexes/
    harness.self-test.index.json
    scenarios.index.json
    requirements.index.json
    change-sets.index.json
    terminology.index.json
    test-results.index.json
  findings/
  state/
  reports/
  test-results/nodeSelfTest/
```

하네스 scope에서는 애플리케이션 `backend.source-index.json`, `openapi.index.json`을 입력으로 요구하지 않는다. `harness/ui` 도입 이후 `front-end.source-index.json`은 하네스 UI source index 산출물로 사용한다. 하네스 self-test는 필요한 계약을 fixture로 만든다.

## 작업 단위 예시

애플리케이션 기능은 다음 경로에만 둔다.

```text
app/docs/requirements/REQ-XXX-feature.md
app/docs/scenarios/REQ-XXX-feature.feature
app/back-end/src/main/java/com/example/bddworkflow/{domain}/...
app/back-end/src/test/java/com/example/bddworkflow/{domain}/...ApiAcceptanceTest.java
app/front-end/src/features/{domain}/...
app/front-end/tests/e2e/{feature}.spec.ts
```

하네스 기능은 다음 경로에만 둔다.

```text
harness/docs/requirements/REQ-XXX-harness-rule.md
harness/docs/scenarios/REQ-XXX-harness-rule.feature
harness/tools/{collector-or-validator}.mjs
harness/self-test/tests/{rule}.test.ts
harness/ui/src/features/{domain}/...
harness/ui/tests/e2e/{feature}.spec.ts
```

혼합 작업은 하나의 Change Set에 앱/하네스 산출물을 섞지 않는다. `app/docs/change-sets`와 `harness/docs/change-sets`에 별도 Change Set을 만들고 서로 참조한다.

## 생성 산출물

다음 경로는 사람이 직접 편집하지 않는다.

```text
build/app/
build/harness/
app/back-end/build/
app/front-end/dist/
app/front-end/storybook-static/
app/front-end/playwright-report/
app/front-end/test-results/
app/front-end/coverage/
harness/ui/dist/
harness/ui/storybook-static/
harness/ui/playwright-report/
harness/ui/test-results/
harness/ui/coverage/
```
