# Change Set: 2026-06-06 e2e run 격리와 동적 포트

상태: 진행중
요청일: 2026-06-06
변경 유형: 수정
영향 요건: REQ-005, REQ-011
논의 상태: 없음

## 요청 요약

- 하네스가 실행마다 부여하는 `runId`·run output root·동적 포트를 app 빌드/테스트 산출물과 dev 서버가 실제로 소비하도록 맞춘다.
- 목적은 trace/validate/live e2e를 동시에 실행해도 파일 출력과 포트가 충돌하지 않게 하는 것이다.
- 혼합 작업이라 harness 짝 Change Set과 함께 묶인다(AGENTS.md 분리 규칙). 짝: [harness: run output 전체 격리와 병렬 실행](../../../harness/docs/change-sets/2026-06-06-run-output-root-isolation.md).
- 이 카드는 app 소유 파일만 다룬다: back-end `build.gradle` 출력 경로/`buildDir`, front-end playwright/vite config의 포트·출력 경로, e2e 스크립트. runId·run root·포트 값 할당과 env 주입은 harness 카드가 한다.

## 작업 범위

- back-end `build.gradle`
  - `generateOpenApiIndex` Test task의 `reports.html`/`junitXml` `outputLocation`이 `../../build/app/...`로 하드코딩되어 `HARNESS_OUTPUT_ROOT`를 무시한다. 이를 `HARNESS_OUTPUT_ROOT` 기준으로 파생시키고 `doFirst`의 삭제 경로도 맞춘다.
  - `test`/`generateOpenApiIndex`의 `buildDir`·binary results가 harness가 주입하는 per-run `buildDir`(`-Dorg.gradle.project.buildDir` 등)를 따르도록 정리한다. (값 주입은 harness 카드.)
- front-end `playwright.config.ts` (mock e2e)
  - `webServer.command`의 vite 포트(`--port 5173` 하드코딩), `webServer.url`, `use.baseURL`을 env(`E2E_FRONTEND_PORT`, `E2E_BASE_URL`)에서 읽게 한다.
  - `outputDir`(`test-results/artifacts`), json reporter `outputFile`(`E2E_RESULTS_FILE`는 이미 env), html 리포트 폴더를 env 기반 run root 경로로 받게 한다.
- front-end `playwright.live.config.ts` (live e2e)
  - 두 `webServer`의 포트를 env(`E2E_BACKEND_PORT`, `E2E_FRONTEND_PORT`, `E2E_BASE_URL`)에서 읽게 한다: back-end `bootRun --server.port`와 `url`, front-end vite `--port`와 `url`, `use.baseURL`.
  - `VITE_BACKEND_ORIGIN`을 할당된 back-end 포트로 구성한다(현재 `http://127.0.0.1:8080` 고정).
  - `outputDir`(`test-results/live-artifacts`), live json `outputFile`(`E2E_LIVE_RESULTS_FILE`는 이미 env), html 리포트 폴더(`playwright-report/live`)를 env 기반 run root로 받게 한다.
- front-end `vite.config`: proxy target(`BACKEND_ORIGIN`=`VITE_BACKEND_ORIGIN`)이 동적 back-end 포트를 받게 유지·확인한다. dev `--host`는 유지하고 포트는 CLI/env로 주입한다.
- front-end `package.json`: `e2e`/`e2e:live` 스크립트가 위 env를 통과시키도록 정리한다(고정값 제거 또는 env 우선).
- `app/docs/standards/front-end-testing.md`의 live E2E 실행 안정성 기준을 "고정 포트 청소"에서 "실행 소유 포트 격리"로 갱신한다(포트는 harness가 할당, 기존 프로세스 자동 kill 없음, 명시 포트 점유 시 fail-fast). 충돌 진단/할당 로직 구현 자체는 harness 카드가 소유한다.

## 제외 범위

- runId·run output root·포트 값 할당과 env 주입, 인덱서/게이트 경로 전환, Gradle 격리 플래그 주입. → harness 짝 카드.
- 제품 동작/AC 변경. 이번 작업은 테스트 하네스 인프라(출력 경로·포트)만 바꾼다.
- 포트 충돌 진단·fail-fast·자동 재선택·기존 프로세스 보호(no-kill) 로직 구현. harness 카드(`run.mjs` wrapper)가 소유한다. app은 env 소비·fallback과 표준 문서 반영만 한다.
- storybook/preview 등 e2e 경로 밖 명령의 포트 격리.

## 완료 조건

- `HARNESS_OUTPUT_ROOT`가 주어지면 `generateOpenApiIndex`의 reports/junitXml과 `openapi.index.json`이 그 root 아래에 생성된다.
- E2E 포트 env가 주어지면 mock/live e2e가 그 포트로 vite·back-end·`baseURL`을 구성한다.
- E2E 결과·아티팩트·html 리포트가 주어진 run root 경로에 생성된다.
- 포트·root env가 없으면 기존 고정값(5173/8080, `build/app`)으로 fallback해 단발 실행이 그대로 동작한다.
- (harness 짝 카드와 함께) `npm run app:validate`를 두 번 동시 실행해도 포트·파일 충돌 없이 각자 통과한다.
- 포트 env가 없어도 기존 8080/5173 dev server가 떠 있을 때 live E2E가 harness 할당 포트로 충돌 없이 실행된다(harness 카드 wrapper 동작에 의존).
- `app/docs/standards/front-end-testing.md`가 live E2E 기본 안정화 전략을 "실행 소유 포트 격리"로 설명한다.
- 단발 `npm run app:validate`, `npm run app:e2e`, `npm run app:e2e:live`가 회귀 없이 통과한다.

## 검증 명령

- `npm run app:e2e`
- `npm run app:e2e:live`
- `npm run app:openapi-index`
- 병렬(짝 카드와 함께): `npm run app:validate` / `npm run app:validate`
- 단발 회귀: `npm run app:validate`

## 결정 로그

- 포트는 harness(`run.mjs`)가 할당하고 app config는 env로 소비만 한다. config가 직접 포트를 고르면 중복 할당이 생기므로 하지 않는다.
- 포트 env가 없으면 기존 고정값(5173/8080)으로, `HARNESS_OUTPUT_ROOT`가 없으면 `build/app`으로 fallback해 단발 실행 호환을 지킨다.
- back-end 데이터 저장소는 in-memory H2(`jdbc:h2:mem`)라 `bootRun` 병렬에도 프로세스별로 격리된다. 별도 처리 불필요.
- 영향 요건(REQ-005 front-end foundation/e2e 하네스, REQ-011 dev proxy/live origin)은 수용 기준이 바뀌지 않는다. e2e 하네스와 proxy origin 구성이 영향을 받아 regression 확인 대상이다.

## 열린 논의

- 없음
