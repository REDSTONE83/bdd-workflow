# 요건 검증 하네스 Agent Guide

이 저장소는 애플리케이션 예제와 이를 검사하는 요건 검증 하네스를 최상위에서 분리한다.

```text
app/       애플리케이션 문서, Spring Boot 백엔드, React/Vite 프런트엔드
harness/   하네스 문서, annotations, source-indexer, Node 도구, self-test
build/app      애플리케이션 검증 산출물
build/harness  하네스 검증 산출물
```

사람이 관리하는 ID는 `REQ-001` 같은 요건 ID만 둔다. ID는 전역 유일하게 유지하고, 소유권은 파일 경로와 카드의 `대상 시스템: application | harness`로 구분한다.

## 핵심 원칙

- 애플리케이션 요건 카드는 `app/docs/requirements`에 둔다.
- 하네스 요건 카드는 `harness/docs/requirements`에 둔다.
- 애플리케이션 Change Set은 `app/docs/change-sets`, 하네스 Change Set은 `harness/docs/change-sets`에 둔다. 혼합 작업은 두 Change Set으로 나누고 서로 링크한다.
- Change Set 파일명은 `YYYY-MM-DD-slug.md`, 첫 줄 제목은 `# Change Set: YYYY-MM-DD 작업 제목` 형식으로 쓰며, 파일명 날짜와 `요청일`은 일치시킨다.
- 애플리케이션 수용 시나리오는 `app/docs/scenarios`, 하네스 수용 시나리오는 `harness/docs/scenarios`에 둔다. 파일 형식은 Gherkin `.feature`를 유지한다.
- 애플리케이션 소스는 `app/back-end`와 `app/front-end`에 둔다.
- 하네스 self-test는 `harness/self-test`에 둔다. 하네스 self-test는 앱 테스트 결과나 앱 생성 파일을 직접 갱신하지 않는다.
- 추적표와 검증 리포트는 사람이 직접 관리하지 않고 하네스가 생성한다.

## 직접 관리하는 산출물

```text
app/docs/requirements/*.md
app/docs/change-sets/*.md
app/docs/scenarios/*.feature
app/docs/standards/*.md
app/back-end/src/main/java/**/*
app/back-end/src/test/java/**/*
app/back-end/src/openApiIndex/java/**/*
app/front-end/src/**/*
app/front-end/tests/e2e/**/*
app/front-end/.storybook/**/*
app/front-end/tools/**/*

harness/docs/**/*.md
harness/docs/**/*.feature
harness/annotations/**/*
harness/source-indexer/**/*
harness/tools/**/*
harness/self-test/**/*.ts
```

`build/app/*`, `build/harness/*`, `app/front-end/dist`, `app/front-end/storybook-static`, `app/front-end/playwright-report`, `app/front-end/test-results`는 생성 산출물이다.

## 문서 인덱스

- 앱 문서: `app/docs/README.md`
- 앱 구현 표준: `app/docs/standards/README.md`
- 저장소 공통 Git/PR 워크플로우 표준: `app/docs/standards/git-workflow.md`
- 하네스 개요: `harness/docs/overview.md`
- 하네스 데이터 계약: `harness/docs/data-contracts.md`
- 하네스 프로젝트 구조: `harness/docs/project-structure.md`
- 요건 작성 절차: `harness/docs/requirement-authoring.md`
- 카드/Acceptance/용어 표준: `harness/docs/standards/`

## 작업 절차

애플리케이션 작업:

1. `app/docs/change-sets`에 작업 범위를 정리한다.
2. 앱 요건은 `app/docs/requirements`, 시나리오는 `app/docs/scenarios`에 작성한다.
3. 백엔드/프런트엔드 구현은 `app/back-end`, `app/front-end`에서 진행한다.
4. 설계 검토 단계에서는 `npm run app:trace -- --requirement REQ-XXX`로 현황만 본다.
5. 구현과 테스트가 들어간 뒤 `npm run app:validate`로 앱 게이트를 통과시킨다.

하네스 작업:

1. `harness/docs/change-sets`에 작업 범위를 정리한다.
2. 하네스 요건은 `harness/docs/requirements`, 시나리오는 `harness/docs/scenarios`에 작성한다.
3. 하네스 구현은 `harness/tools`, `harness/source-indexer`, `harness/annotations`에서 진행한다.
4. 하네스 검증 코드는 `harness/self-test`에 둔다.
5. `npm run harness:validate`로 하네스 게이트를 통과시킨다.

Git/PR 작업:

1. PR 생성 또는 PR 본문 수정 전 `app/docs/standards/git-workflow.md`를 읽고 제목, 본문, 검증 기록 형식을 맞춘다.
2. `main`에는 직접 커밋하지 않고 작업 브랜치에서 커밋한 뒤 PR로 머지한다.
3. PR 본문에는 표준의 `요약`, `변경 사항`, `검증`, `후속` 섹션과 관련 Change Set, 영향 요건, RED/GREEN/BLUE 요약을 포함한다.
4. 머지 후 작업 브랜치를 정리하고 `main`을 최신화한다.

저장소 전체 확인이 필요할 때만 `npm run repo:validate`를 실행한다. `harness/tools/gate.mjs`는 REQ-010 통합 게이트 구현이며, 각 scope의 state/findings만 읽어 판정한다.

## RED / GREEN / BLUE

상태 판정 기준은 `harness/docs/overview.md`를 따른다.

```text
RED
- 관련 구현 연결 없음 / 수용 기준 커버 테스트 없음 / 테스트 미실행 / 실패 또는 스킵
- 알려지지 않은 요건 ID가 코드에 남아 있음

GREEN
- 구현 대상에 맞는 API 또는 화면 연결 있음
- 수용 기준 모두 커버됨
- 연결 테스트 모두 PASS

BLUE
- GREEN 조건 충족
- 카드 승인
- 열린 질문 없음
```

## 자주 쓰는 검증 명령

```bash
npm run app:validate
npm run app:trace -- --requirement REQ-011
npm run app:test
npm run app:e2e
npm run app:e2e:live
npm run app:source-index
npm run app:front-end-source-index
npm run app:openapi-index

npm run harness:validate
npm run harness:trace -- --requirement REQ-010
npm run harness:test
npm run harness:self-test

npm run repo:validate
```

백엔드 상세:

```bash
cd app/back-end
./gradlew test
./gradlew generateOpenApiIndex
./gradlew previewSchema
```

프런트엔드 상세:

```bash
cd app/front-end
npm run typecheck
npm run lint
npm run test
npm run build
npm run build-storybook
npm run e2e
npm run e2e:live
npm run validate
npm run validate:full
```
