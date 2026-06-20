# Change Set: 2026-06-06 e2e run 격리와 동적 포트

상태: 완료
요청일: 2026-06-06
변경 유형: 수정
영향 요건: REQ-005, REQ-011
논의 상태: 없음

## 요청 요약

- 하네스가 실행마다 부여하는 `runId`·run output root·동적 포트를 app 빌드/테스트 산출물과 dev 서버가 실제로 소비하도록 맞춘다.
- 목적은 trace/validate/live e2e를 동시에 실행해도 파일 출력과 포트가 충돌하지 않게 하는 것이다.
- 혼합 작업이라 harness 짝 Change Set과 함께 묶인다(AGENTS.md 분리 규칙). 짝: [harness: run output 전체 격리와 병렬 실행](../../../harness/docs/change-sets/2026-06-06-run-output-root-isolation.md).
- 이 카드는 app 소유 파일만 다룬다: back-end `build.gradle` 출력 경로/`buildDir`, front-end playwright/vite config의 포트·출력 경로, e2e 스크립트. runId·run root·포트 값 할당과 env 주입은 harness 카드가 한다.

## 2026-06-20 재검토 결과

- 기존 Change Set을 유지하되 구현 착수 전 계획 상태로 정렬한다. harness 짝 Change Set도 같은 시점에 보류에서 계획으로 되돌렸다.
- 현재 `app/front-end`에는 mock Playwright용 `playwright.config.ts`가 없다. `npm run app:e2e`는 `app/front-end`의 `e2e` 스크립트를 통해 Storybook Vitest(`test:storybook`)를 실행한다. 따라서 mock Playwright 포트 격리 항목은 제거하고 Storybook Vitest JUnit 결과 격리로 바꾼다.
- live Playwright는 `playwright.live.config.ts`가 유일한 Playwright config이며, back-end 8080 / front-end 5173 / report·artifact 경로가 고정되어 있다. 동적 포트와 run root 적용 대상은 이 파일과 `e2e:live` 스크립트다.
- `app/front-end/vite.config.ts`는 이미 `VITE_BACKEND_ORIGIN` fallback을 갖고 있으므로, 핵심 작업은 live config와 runner env가 같은 origin/port를 쓰게 하는 것이다.
- `app/back-end/build.gradle`의 `generateOpenApiIndex`는 `HARNESS_OUTPUT_ROOT`를 system property로 넘기지만 report outputLocation은 여전히 `../../build/app`로 고정되어 있다. OpenAPI JSON뿐 아니라 JUnit/html report도 run root로 맞춘다.

## 2026-06-20 구현 결과

- `app/back-end/build.gradle`가 `HARNESS_OUTPUT_ROOT` 아래에 `test`/`generateOpenApiIndex` JUnit·html report를 쓰고, `HARNESS_GRADLE_BUILD_DIR`가 있으면 `layout.buildDirectory`를 run root build dir로 옮기게 했다.
- `app/front-end` Storybook Vitest는 `STORYBOOK_JUNIT_FILE`을 우선해 run root JUnit을 생성하고, env가 없으면 기존 canonical `test-results/storybook-junit.xml`로 fallback한다.
- `playwright.live.config.ts`가 `E2E_BACKEND_PORT`, `E2E_FRONTEND_PORT`, `E2E_BASE_URL`, `VITE_BACKEND_ORIGIN`, `E2E_LIVE_*` 결과 경로, `HARNESS_GRADLE_PROJECT_CACHE_DIR`를 소비한다. env가 없으면 기존 8080/5173 및 canonical 결과 경로를 유지한다.
- `app/docs/standards/front-end-testing.md`는 live E2E 안정화 기준을 실행 소유 포트 격리와 run root 결과 publish 기준으로 갱신했다.

## 작업 범위

- back-end `build.gradle`
  - `generateOpenApiIndex` Test task의 `reports.html`/`junitXml` `outputLocation`이 `../../build/app/...`로 하드코딩되어 `HARNESS_OUTPUT_ROOT`를 무시한다. 이를 `HARNESS_OUTPUT_ROOT` 기준으로 파생시키고 `doFirst`의 삭제 경로도 맞춘다.
  - `test`/`generateOpenApiIndex`의 `buildDir`·binary results를 harness가 주입하는 per-run build dir로 옮긴다. Gradle 9.5에서 `buildDir` 프로퍼티는 deprecated이므로 `-Dorg.gradle.project.buildDir` 주입 대신 build.gradle가 harness env(예: `HARNESS_GRADLE_BUILD_DIR`)를 읽어 `layout.buildDirectory.set(...)`로 자기-적용한다. build.gradle가 스스로 적용하므로 Playwright가 띄우는 live `bootRun`도 같은 build.gradle를 평가해 별도 커맨드 주입 없이 동일 build dir을 상속한다. (`layout.buildDirectory`를 옮기면 위 `doFirst` 삭제 경로도 같은 root로 따라온다. env 값 할당은 harness 카드.)
- front-end Storybook Vitest (`e2e`/`test:storybook`)
  - `test:storybook`의 JUnit output path가 `test-results/storybook-junit.xml`에 고정되어 있으므로, env(예: `STORYBOOK_JUNIT_FILE` 또는 harness가 정한 동등 변수)로 run root 경로를 받을 수 있게 한다.
  - env가 없으면 기존 canonical `test-results/storybook-junit.xml`로 fallback해 단발 실행 호환을 유지한다.
  - `e2e` 스크립트는 계속 Storybook Vitest를 호출하되, runner가 주입한 JUnit path env를 보존한다.
- front-end `playwright.live.config.ts` (live e2e)
  - 두 `webServer`의 포트를 env(`E2E_BACKEND_PORT`, `E2E_FRONTEND_PORT`, `E2E_BASE_URL`)에서 읽게 한다: back-end `bootRun --server.port`와 `url`, front-end vite `--port`와 `url`, `use.baseURL`.
  - `VITE_BACKEND_ORIGIN`을 할당된 back-end 포트로 구성한다(현재 `http://127.0.0.1:8080` 고정).
  - `outputDir`(`test-results/live-artifacts`), live json `outputFile`(`E2E_LIVE_RESULTS_FILE`는 이미 env), html 리포트 폴더(`playwright-report/live`)를 env 기반 run root로 받게 한다.
  - back-end `bootRun` webServer 커맨드에 harness가 준 Gradle project-cache-dir(예: `HARNESS_GRADLE_PROJECT_CACHE_DIR`)를 env에서 읽어 `--project-cache-dir <dir>`로 append한다. 이 `bootRun`은 run.mjs가 아니라 Playwright webServer가 띄우므로, 포트(`--server.port`) 핸드오프와 동일하게 harness가 값을 env로 주입하고 app config가 flag로 반영한다. project-cache-dir는 CLI startup flag라 env 등가물이 없어 이 append가 필요하다. build dir는 build.gradle가 env로 자기-적용하므로 여기서 추가 주입하지 않는다.
- front-end `vite.config`: proxy target(`BACKEND_ORIGIN`=`VITE_BACKEND_ORIGIN`)이 동적 back-end 포트를 받게 유지·확인한다. dev `--host`는 유지하고 포트는 CLI/env로 주입한다.
- front-end `package.json`: `test:storybook`/`e2e`/`e2e:live` 스크립트가 위 env를 통과시키도록 정리한다. 특히 `e2e:live`의 `E2E_LIVE_RESULTS_FILE=test-results/e2e-live-results.json` 인라인 고정값은 config fallback으로 옮기고 env 우선을 보장한다.
- `app/docs/standards/front-end-testing.md`의 live E2E 실행 안정성 기준을 "고정 포트 청소"에서 "실행 소유 포트 격리"로 갱신한다(포트는 harness가 할당, 기존 프로세스 자동 kill 없음, 명시 포트 점유 시 fail-fast). 충돌 진단/할당 로직 구현 자체는 harness 카드가 소유한다.

## 제외 범위

- runId·run output root·포트·Gradle 격리 dir(build dir·project-cache-dir) 값 할당과 env 주입, 인덱서/게이트 경로 전환. → harness 짝 카드. 단 주입된 env를 읽어 back-end `build.gradle` `layout.buildDirectory`와 live `bootRun --project-cache-dir`에 반영하는 소비는 이 app 카드가 맡는다(포트 소비와 동일 패턴).
- 제품 동작/AC 변경. 이번 작업은 테스트 하네스 인프라(출력 경로·포트)만 바꾼다.
- 포트 충돌 진단·fail-fast·자동 재선택·기존 프로세스 보호(no-kill) 로직 구현. harness 카드(`run.mjs` wrapper)가 소유한다. app은 env 소비·fallback과 표준 문서 반영만 한다.
- storybook/preview 등 e2e 경로 밖 명령의 포트 격리.
- mock Playwright config 신설. 현재 mock e2e는 Storybook Vitest 경로이므로 별도 `playwright.config.ts`를 만들지 않는다.

## 완료 조건

- `HARNESS_OUTPUT_ROOT`가 주어지면 `generateOpenApiIndex`의 reports/junitXml과 `openapi.index.json`이 그 root 아래에 생성된다.
- Storybook JUnit output env가 주어지면 `npm run app:e2e`/`test:storybook` 결과가 그 경로에 생성된다.
- live E2E 포트 env가 주어지면 live e2e가 그 포트로 vite·back-end·`baseURL`을 구성한다.
- live E2E 결과·아티팩트·html 리포트가 주어진 run root 경로에 생성된다.
- 포트·root env가 없으면 기존 고정값(5173/8080, `build/app`)으로 fallback해 단발 실행이 그대로 동작한다.
- (harness 짝 카드와 함께) `npm run app:validate`를 두 번 동시 실행해도 포트·파일 충돌 없이 각자 통과한다.
- 포트 env가 없어도 기존 8080/5173 dev server가 떠 있을 때 live E2E가 harness 할당 포트로 충돌 없이 실행된다(harness 카드 wrapper 동작에 의존).
- `app/docs/standards/front-end-testing.md`가 live E2E 기본 안정화 전략을 "실행 소유 포트 격리"로 설명한다.
- 단발 `npm run app:validate`, `npm run app:e2e`, `npm run app:e2e:live`가 회귀 없이 통과한다.

## 검증 명령

- `npm run app:e2e`
- `npm run app:e2e:live`
- `npm run app:openapi-index`
- `STORYBOOK_JUNIT_FILE=<tmp>/storybook-junit.xml npm run app:e2e`
- `E2E_FRONTEND_PORT=<free> E2E_BACKEND_PORT=<free> E2E_BASE_URL=http://127.0.0.1:<free> E2E_LIVE_RESULTS_FILE=<tmp>/e2e-live-results.json npm run app:e2e:live`
- 병렬(짝 카드와 함께): `npm run app:validate` / `npm run app:validate`
- 단발 회귀: `npm run app:validate`

## 검증 기록

- 2026-06-20: `npm run app:front-end-source-index` 통과. run root `build/app/runs/20260620124947-29794-d97930`에 생성 후 canonical `build/app/indexes`로 publish.
- 2026-06-20: `npm run app:openapi-index` 통과. run root `build/app/runs/20260620125017-30510-8af3fb`에 OpenAPI index, JUnit/html report, Gradle build/cache 산출물을 분리 생성 후 canonical publish.
- 2026-06-20: `npm run app:e2e` 통과. Storybook Vitest 99개 PASS, JUnit은 run root에 생성 후 `app/front-end/test-results/storybook-junit.xml`로 publish.
- 2026-06-20: `npm run app:e2e:live` 통과. 동적 포트 frontend=54327/backend=54328에서 live Playwright 2개 PASS, JSON/artifact/html report publish.
- 2026-06-20: `npm run app:validate` 통과. RED 0 / GREEN 0 / BLUE 17 / INACTIVE 4, Storybook Vitest 99개, back-end JUnit 125개, live Playwright 2개 결과를 run root 기준으로 병합.
- 2026-06-20: `npm run app:validate` 2회 병렬 실행 통과. run root `build/app/runs/20260620144833-40563-364904`(frontend=55269/backend=55270)와 `build/app/runs/20260620144833-40578-84fef0`(frontend=55271/backend=55272)이 각각 RED 0 / GREEN 0 / BLUE 17 / INACTIVE 4로 `gate: pass`.

## 결정 로그

- 포트는 harness(`run.mjs`)가 할당하고 app config는 env로 소비만 한다. config가 직접 포트를 고르면 중복 할당이 생기므로 하지 않는다.
- Gradle per-run 격리도 포트와 같은 핸드오프다: 값(build dir·project-cache-dir) 할당·env 주입은 harness, 소비는 app. live `bootRun`은 Playwright webServer가 띄워 run.mjs가 직접 CLI를 못 잡으므로, project-cache-dir는 `playwright.live.config.ts`가 env에서 읽어 커맨드에 append하고(=`--server.port`와 동형), build dir는 build.gradle가 env로 `layout.buildDirectory.set`해 자기-적용한다(같은 build.gradle를 평가하는 bootRun이 자동 상속).
- Gradle 9.5에서 `buildDir` 프로퍼티·`-Dorg.gradle.project.buildDir`는 deprecated이라 build dir 재배치는 build.gradle의 `layout.buildDirectory.set(...)` env-read로 한다. project-cache-dir는 startup flag라 deprecation 영향이 없다.
- 포트 env가 없으면 기존 고정값(5173/8080)으로, `HARNESS_OUTPUT_ROOT`가 없으면 `build/app`으로 fallback해 단발 실행 호환을 지킨다.
- mock e2e는 현재 Playwright가 아니라 Storybook Vitest다. 따라서 파일/포트 충돌의 핵심은 mock Playwright webServer가 아니라 Storybook JUnit canonical 파일을 run root로 분리하는 것이다.
- back-end 데이터 저장소는 in-memory H2(`jdbc:h2:mem`)라 `bootRun` 병렬에도 프로세스별로 격리된다. 별도 처리 불필요.
- 영향 요건(REQ-005 front-end foundation/e2e 하네스, REQ-011 dev proxy/live origin)은 수용 기준이 바뀌지 않는다. e2e 하네스와 proxy origin 구성이 영향을 받아 regression 확인 대상이다.

## 열린 논의

- 없음
