# BDD Workflow Harness Agent Guide

이 저장소는 Spring Boot API와 React/Vite 프런트엔드 개발을 코드 중심 BDD 방식으로 진행하기 위한 하네스 예제다. 별도 시나리오 ID, API ID, 화면 ID는 만들지 않고, 사람이 관리하는 ID는 `REQ-001` 같은 요건 ID만 둔다.

이 문서는 인덱스다. 본문 규칙은 아래 링크된 표준/하네스 문서에 둔다.

## 핵심 원칙

- 요건 카드는 `/docs/requirements`에 둔다.
- 사용자 요청 단위 작업 범위는 `/docs/change-sets`에 둔다. Change Set은 명세 원천이 아니며, 별도 사람이 관리하는 ID를 만들지 않고 파일 경로를 identity로 쓴다.
- BDD 시나리오는 `/docs/scenarios`의 Gherkin `.feature`로 관리한다. PO/QA/기획자/프론트엔드/백엔드가 함께 검토하는 공유 명세이자 하네스 추적 입력이며, Cucumber 실행 도구는 도입하지 않는다.
- API 명세는 Spring Boot 컨트롤러와 DTO 애너테이션에 둔다.
- DB 스키마는 JPA `@Entity` 클래스에 둔다. 컬럼 단위 추적이 필요하면 필드에도 `@Requirement`를 붙인다.
- 프런트엔드 화면/라우팅/컴포넌트는 `front-end/src`에 둔다. UI는 React/Vite/TypeScript/shadcn/ui/Tailwind CSS를 기준으로 한다.
- Acceptance Test는 승인된 `.feature` 시나리오가 다루는 AC를 실행 가능한 검증 코드로 옮긴다. Scenario는 사용자 행위 단위, Test는 AC 검증 단위이며, 둘의 연결은 `Scenario.Covers ∩ Test.@Covers`로 판단한다. `@Covers`는 카드 수용 기준 문장과 정확히 일치하고, `@DisplayName`은 JUnit 표시용 자유 레이블이다.
- 수용 기준 커버리지는 테스트 메서드의 `@Covers` 값으로 판단한다.
- API, DTO, Entity, 테스트는 `@Requirement("REQ-001")` 또는 `@Requirement({"REQ-001","REQ-002"})`로 하나 이상의 요건에 연결한다. 공통 응답 DTO처럼 도메인 무관한 클래스는 비워둔다.
- 추적표와 검증 리포트는 사람이 직접 관리하지 않고 하네스가 생성한다.

## 문서 구조

- `docs/change-sets`: 사용자 요청을 처리하기 위한 작업 범위
- `docs/requirements`: 무엇을 만들어야 하는가 (요건 카드)
- `docs/scenarios`: 사용자가 어떻게 경험하는가 (Gherkin `.feature` 시나리오)
- `docs/standards`: 어떤 방식으로 만들어야 하는가 (구현 표준)
- `docs/harness`: 그걸 어떻게 검사하고 추적하는가 (하네스 운영)
- `docs/terminology`: 표준 용어 사전과 검사 알고리즘

## 직접 관리하는 산출물

사람이 직접 관리하는 산출물은 최소화한다.

```text
docs/requirements/*.md
docs/change-sets/*.md
docs/scenarios/*.feature
docs/standards/*.md
back-end/src/main/java/**/*
back-end/src/test/java/**/*AcceptanceTest.java
front-end/src/**/*
front-end/tests/e2e/**/*
front-end/.storybook/**/*
front-end/tools/**/*
```

`build/harness/*`, `front-end/dist`, `front-end/storybook-static`, `front-end/playwright-report`, `front-end/test-results` 리포트는 생성 산출물이다.

전체 폴더 구조는 [`docs/harness/project-structure.md`](docs/harness/project-structure.md)를 따른다.

## 구현 표준 인덱스

세부 규칙은 모두 `docs/standards/` 아래에 있다. 진입점은 [`docs/standards/README.md`](docs/standards/README.md).

문서 작성:

- [`requirement-card.md`](docs/standards/requirement-card.md): 요건 카드 필수 항목, 수용 기준 작성, 의사결정 로그 양식
- [`terminology.md`](docs/standards/terminology.md): 표준 용어 safe/strict 모드와 게이트

코드 구조:

- [`package-structure.md`](docs/standards/package-structure.md): 도메인 패키지 내부 레이어 (controller/dto/service/domain/exception/repository)
- [`api-contract.md`](docs/standards/api-contract.md): 컨트롤러, DTO, OpenAPI, 전역 오류 응답, PATCH/페이징/Jackson 구성
- [`persistence-schema.md`](docs/standards/persistence-schema.md): JPA Entity, 컬럼 매핑, Repository / Pageable 패턴, schema preview
- [`acceptance-test.md`](docs/standards/acceptance-test.md): Acceptance Test 작성과 리뷰 체크리스트
- [`java-code-style.md`](docs/standards/java-code-style.md): Lombok 허용 범위와 금지 애너테이션 목록
- [`front-end-project-structure.md`](docs/standards/front-end-project-structure.md): React/Vite/shadcn 기반 FE 폴더 구조, 생성 산출물, 검증 명령
- [`front-end-api-contract.md`](docs/standards/front-end-api-contract.md): OpenAPI 기반 FE 타입/클라이언트, 인증, 오류, 페이징 연동
- [`front-end-state.md`](docs/standards/front-end-state.md): FE 상태 분류, TanStack Query 서버 상태 구성, query key, mutation invalidation 정책
- [`front-end-ui.md`](docs/standards/front-end-ui.md): shadcn/ui, Tailwind token, 데스크톱 화면, 폼 입력 UX(자동 포커스/autocomplete/비밀번호 show/hide 토글), 접근성, Storybook 상태 표준
- [`front-end-testing.md`](docs/standards/front-end-testing.md): FE TDD, BDD, Visual Regression, E2E, 접근성 테스트 표준

런타임 정책:

- [`auth.md`](docs/standards/auth.md): 인증/행위자 식별 (JWT Bearer)
- [`configuration.md`](docs/standards/configuration.md): `app.*` 프로젝트 소유 설정, typed binding, profile override 정책
- [`transaction.md`](docs/standards/transaction.md): 서비스 트랜잭션 경계와 부수효과
- [`validation.md`](docs/standards/validation.md): DTO Bean Validation과 서비스 명세 검증 분담, 정규화

값 표준:

- [`id-policy.md`](docs/standards/id-policy.md): 시간 정렬 UUID 단일 식별자 정책
- [`datetime.md`](docs/standards/datetime.md): Instant + UTC 저장, ISO-8601 직렬화

협업:

- [`git-workflow.md`](docs/standards/git-workflow.md): 브랜치 전략, 커밋 메시지, PR 본문 규약 (하네스 게이트 입력 아님, 수동 리뷰)

## 작성 절차

요건 작성과 BDD 테스트 리뷰 절차는 [`docs/harness/requirement-authoring.md`](docs/harness/requirement-authoring.md)에 둔다. 핵심 순서만 옮기면 다음과 같다.

1. 사용자 요청을 Change Set으로 정리하고, 기존 REQ 수정인지 새 REQ가 필요한지 판단한다.
2. 모호한 범위, 예외, 정책, 권한, 상태 변화, 정량 기준을 사용자에게 질문한다. 기본은 한 번에 하나씩 확인하고, 서로 분리하면 오해가 생기는 항목만 최대 3개까지 묶는다. **질문은 항상 선택지형으로 만들고 첫 항목을 `(권장)` 표기와 한 줄 근거가 붙은 추천안으로 둔다** (자세한 형식은 [`requirement-authoring.md`](docs/harness/requirement-authoring.md#선택지와-추천안은-기본값이다)). 미해결 질문은 `열린 질문`에 둔다.
3. 답변이 확정되면 그 내용을 `범위`/`제외 범위`/`수용 기준` 중 해당 위치에 반영하고, 정책 선택이 따로 필요한 결정은 `의사결정 로그`에 남긴다. 해당 항목은 `열린 질문`에서 제거한다.
4. 표준 용어 검색/등록은 `node tools/harness/terminology.mjs ...`로 한다 (`draft.json` 직접 편집 금지).
5. 수용 기준을 검증 가능한 문장으로 정리한다.
6. 요건 하나를 선택해 검증 설계(`.feature` 시나리오 묶음)와 요건 Skeleton을 한 번에 작성한다. 백엔드는 Controller/DTO/Entity/Repository/Service의 인터페이스와 계약까지만 만들고 업무 로직은 작성하지 않는다. FE 대상 요건은 routes.tsx swap 없이 별도 파일로 화면 인터랙션 mockup(폼 입력 반응, 클라이언트 검증 안내, submitting/error/success 상태 전환)과 route 기준 page mock story + 상태별 story 묶음을 함께 작성해 Storybook에서 사용자 흐름을 검토할 수 있게 한다. 외부 API client 직접 호출, routes.tsx swap, 다른 카드 placeholder 정리, `@Covers` FE BDD 테스트, visual snapshot baseline은 Skeleton에서 작성하지 않고 구현 단계 작업 목록으로 분리한다.
7. Skeleton 단계에서 `compileJava`, `generateHarnessSourceIndex`, `generateFrontEndSourceIndex`, 필요 시 `previewSchema`, `traceRequirementCard -Preq=REQ-XXX`로 인터페이스와 추적 상태를 확인한다. FE 대상이면 `npm run typecheck`, `npm run lint`, `npm run source-index`, `npm run build-storybook`도 확인한다. 스키마가 새로 생기거나 바뀌면 `./gradlew previewSchema` 결과까지 포함해 사용자 승인을 받는다. 사용자 승인 결과는 요건 카드의 `BDD 테스트 리뷰 > 요건 Skeleton 승인 이력`에 남긴다.
8. 승인된 같은 요건에 대해 `.feature`의 `Covers:` AC를 검증하는 실행 테스트(Acceptance Test 또는 FE BDD 테스트)를 작성하고 Service 업무 로직, 컨트롤러 본문을 구현한다. FE 대상이면 Skeleton에서 만든 인터랙션 mockup에 외부 API client 호출과 navigate 이동을 결합하고, routes.tsx 의 placeholder route 를 새 화면으로 swap 하며, 영향받는 다른 카드(예: REQ-011)의 placeholder 수용 기준/시나리오/FE BDD 테스트/page mock story 메타데이터를 함께 갱신한다. FE 공통 UI primitive나 주요 화면 조각을 추가/변경해도 Storybook story를 함께 작성하거나 갱신한다. `@Covers` 또는 FE `Covers` 메타데이터는 카드 AC와 정확 일치, 표시용 테스트 이름은 자유.
9. BDD 테스트 코드 리뷰를 받는다.
10. `./gradlew validateHarness`로 요건/표준 용어(strict)/API/Entity/테스트/결과 연결을 확인한다. 통합 게이트(`gate.mjs`, REQ-010)가 TRACE/CARD/REF/TRC/BE/FE/SCN/TRM 카테고리를 한 번에 차단한다.
11. 카드를 `승인`으로 올릴 수 있다 (TRM strict는 `validateHarness`가 이미 차단하므로 별도 단계 불필요). 단독 strict 진단이 필요하면 `./gradlew validateTerminologyStrict`로 따로 돌릴 수 있다.

요건 카드의 구현 완료 여부는 카드 전체 자연어가 아니라 `수용 기준` 커버리지로 판단한다.

## RED / GREEN / BLUE

상태 판정 기준은 [`docs/harness/overview.md`](docs/harness/overview.md)에 둔다. 요약은 다음과 같다.

```text
RED
- 관련 구현 연결 없음(API 또는 화면) / 수용 기준 커버 테스트 없음 / 테스트 미실행 / 실패 또는 스킵
- 알려지지 않은 요건 ID가 코드에 남아 있음

GREEN
- 구현 대상에 맞는 API 또는 화면 연결 있음, 수용 기준 모두 커버됨, 테스트 모두 PASS
- 단, 카드가 아직 승인되지 않았거나 열린 질문이 남아 있음

BLUE
- GREEN 조건 충족 + 카드 승인 + 열린 질문 없음
```

## 자주 쓰는 검증 명령

```bash
# 루트 통합 진입점
npm run validate                    # 통합 게이트(REQ-010): BE/FE/SCN/CARD/REF/TRC/TRM + RED/GREEN/BLUE
npm run trace                       # 추적 리포트 생성
npm run harness:trace -- --check    # 루트 Node 하네스 직접 실행

# 백엔드/Gradle 상세 진입점
cd back-end

./gradlew test                       # JUnit 테스트 (OpenApiContractDumpTest는 제외 - generateOpenApiIndex 전용)
./gradlew generateHarnessSourceIndex # JavaParser source index만 생성
./gradlew generateFrontEndSourceIndex # FE source index만 생성
./gradlew generateScenarioIndex      # Gherkin .feature 시나리오 인덱스 생성
./gradlew generateOpenApiIndex       # /v3/api-docs dump 1회 -> build/harness/indexes/openapi.index.json
./gradlew previewSchema              # Entity 기반 DDL 미리보기
./gradlew traceRequirements          # 추적 리포트 생성 (always exit 0)
./gradlew generateChangeSetReport    # Change Set 영향 REQ 상태 리포트 생성
./gradlew traceRequirementCard -Preq=REQ-XXX        # 단일 카드 추적 리포트 (always exit 0)
./gradlew validateRequirementCard -Preq=REQ-XXX     # 단일 카드 strict 게이트 (RED 또는 카드 구조 위반 시 실패)
./gradlew validateRequirementCardBlue -Preq=REQ-XXX # 단일 카드 BLUE 게이트 (BLUE 미달 시 실패)
./gradlew validateStandards          # docs/standards 정적 검사 리포트 (always exit 0)
./gradlew validateStandardsStrict    # docs/standards strict 게이트 (위반 시 실패)
./gradlew harnessReport              # 표준/용어/테스트/추적 리포트 모두 생성 (집계용)
./gradlew validateHarness            # 통합 게이트(REQ-010): BE + FE + SCN + CARD + REF + TRC + TRM strict + RED/GREEN/BLUE
./gradlew validateTerminology        # 용어 finding emit만 (safe 모드, 차단은 통합 게이트가 수행)
./gradlew validateTerminologyStrict  # 통합 게이트와 동일한 TRM 차단을 단독 진단으로 돌리는 도구
./gradlew check                      # 전체 확인
```

```bash
cd front-end

npm run typecheck       # TypeScript 정적 검증
npm run lint            # ESLint
npm run test            # Vitest unit/component test
npm run build           # Vite production build
npm run build-storybook # Storybook static build
npm run e2e             # Playwright E2E/accessibility smoke
npm run validate        # 빠른 FE 게이트
npm run validate:full   # Storybook/E2E 포함 전체 FE 게이트
```
