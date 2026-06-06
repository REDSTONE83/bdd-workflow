# Change Set: runId 기반 하네스 run output 전체 격리와 병렬 실행

상태: 진행중
요청일: 2026-06-06
변경 유형: 하네스 개선, 수정
영향 요건: REQ-006, REQ-007, REQ-008, REQ-010
논의 상태: 없음

## 요청 요약

- 하네스 명령(trace/validate/test/e2e/live)을 동시에 실행해도 산출물과 런타임 리소스가 충돌하지 않도록, 실행마다 고유 `runId`·run output root와 동적 포트를 부여해 구조적 병렬을 보장한다.
- fail-fast lock이 아니라 격리로 푼다. 단발 실행 동작과 canonical 호환 경로는 유지한다.
- 이 작업은 app 산출물·포트도 바꾸는 혼합 작업이라 app Change Set과 짝을 이룬다(AGENTS.md 혼합 작업 분리 규칙). 짝: [app: e2e run 격리와 동적 포트](../../../app/docs/change-sets/2026-06-06-e2e-run-isolation-and-dynamic-ports.md).
- 이 카드는 harness 소유 작업만 다룬다: runner 오케스트레이션, run root, env 전파, 포트 할당, 인덱서/게이트 경로, Gradle 호출 격리 플래그, canonical publish. app 소유(build.gradle 출력·buildDir 파생, playwright/vite/Spring 포트·출력 경로 소비, e2e 스크립트)는 짝 카드가 다룬다.
- Playwright 결과 신선도(stale 결과 차단)는 직교 문제라 별도 Change Set이 다룬다: [harness: Playwright canonical 결과 freshness 게이트](2026-06-06-playwright-result-freshness.md). 단 e2e wrapper와 `index-test-results.mjs`의 Playwright 수집을 공유한다. 접점 소유권: 이 카드가 e2e wrapper 골격(포트·출력 경로)과 Playwright 결과 수집 경로를 만들고, freshness 카드가 그 위에 manifest 생성·fingerprint 필터를 얹는다.

## 작업 범위

- `harness/tools/run.mjs`가 실행 시작 시 `runId`를 생성하고 scope별 run output root `build/<scope>/runs/<runId>`를 정한다.
- `run.mjs`의 `appOutputRoot`/`harnessOutputRoot` 계산을 모듈 로드 시점 canonical 고정에서 runId 기반 run root로 바꾼다. 내부 경로 계산(`sourceIndex`, `frontEndSourceIndex`, `selfTest`, `collectHarnessStaticInputs` stale 정리)과 `envFor`의 `HARNESS_OUTPUT_ROOT`가 같은 root를 쓰게 한다.
- 전 파이프라인의 collector/validator/reporter/trace/gate가 canonical `build/<scope>`가 아니라 run root를 읽고 쓴다. Node 도구는 `outputRootFor`(`HARNESS_OUTPUT_ROOT`)를 이미 쓰므로 재사용한다. 게이트(`harness/tools/gate.mjs`)는 이미 `outputRootFor()` 기반이라 root 주입만 맞춘다.
- run root를 무시하고 canonical에 직접 쓰는 하드코딩을 전환한다.
  - `harness/tools/index-harness-self-tests.mjs`: `build/harness/indexes`를 하드코딩하고 `workspace-config`를 쓰지 않는다 → `outputRootFor` 기반으로 전환.
  - `harness/tools/index-test-results.mjs`: back-end test 결과(`backendRoot/build/test-results/test`)와 Playwright 결과(`frontEndRoot/test-results/*.json`)를 run root 기반 경로로 읽도록 전환한다. (실제 산출 위치를 run root로 옮기는 config는 app 카드, 그 위치를 읽게 하는 건 이 카드.)
- Gradle 호출 격리: `run.mjs`가 trace/validate/live 경로의 모든 Gradle 호출(`app/back-end`의 `generateOpenApiIndex`·`test`·`bootRun`, `harness`의 source-indexer)에 run별 `--project-cache-dir`와 `buildDir` override(`-Dorg.gradle.project.buildDir=<runRoot>/gradle-build` 등)를 주입해 컴파일 산출물·Test binary results·빌드 락을 분리한다. (`build.gradle`의 `outputLocation` 파생은 app 카드.)
- 동적 포트 오케스트레이션: `run.mjs`가 실행마다 free 포트를 할당해 front-end 포트와 (live) back-end 포트를 env로 주입한다: `E2E_FRONTEND_PORT`, `E2E_BACKEND_PORT`, `E2E_BASE_URL`, `VITE_BACKEND_ORIGIN`. 값 할당·주입·로깅은 이 카드가, 그 env를 읽어 vite `--port`/Spring `--server.port`/Playwright `baseURL`·webServer·proxy origin에 반영하는 config는 app 카드가 맡는다.
- 포트 충돌 진단(mock·live 공통): 사용자가 `E2E_FRONTEND_PORT`/`E2E_BACKEND_PORT`를 명시하면 그 포트를 존중하되 점유돼 있으면 실행 전에 fail-fast로 중단하고 점유 PID/command/해결 안내를 출력한다. 자동 할당 포트가 실행 직전 점유되면 새 free 포트를 재선택하거나 fail-fast한다. 기존 프로세스는 자동 kill하지 않는다(사용자 소유 프로세스 보호). 이 정책으로 기존 dev server(8080/5173)가 떠 있어도 별도 포트로 실행된다.
- Playwright 결과·아티팩트도 run root로 보낸다: `E2E_RESULTS_FILE`/`E2E_LIVE_RESULTS_FILE`와 `outputDir`/html 리포트 폴더용 env를 run root 경로로 주입한다.
- 성공한 실행은 run root 최신 스냅샷을 canonical 위치에 파일 단위 atomic replace로 publish한다. 산출물 종류별 canonical은 다르다: 하네스 인덱스/findings/리포트/state는 `build/<scope>`, Playwright 결과는 `app/front-end/test-results/`(`index-test-results.mjs`가 읽는 위치). 세트(디렉터리) 단위 원자성은 보장하지 않는다.
- 단, Playwright 결과 JSON과 같은 디렉터리의 sidecar(예: freshness manifest)는 한 publish 단위로 함께 교체한다. 짝을 분리해 publish하지 않는다(분리 시 freshness 카드의 `resultFileSha256` 덕분에 정합성은 fail-safe로 유지되나 불필요한 false-stale이 생긴다).
- 실행 로그에 `runId`, run root, 할당 포트, canonical publish 여부를 출력한다.
- `HARNESS_RUN_ID`/`HARNESS_OUTPUT_ROOT`와 포트·결과 경로 env 사용법을 문서화한다.

## 제외 범위

- app 소유 파일 수정: `app/back-end/build.gradle`의 `outputLocation`/`buildDir` 파생, `app/front-end`의 `playwright.config`·`playwright.live.config` 포트·출력 env화, vite proxy origin 스레딩, `e2e`/`e2e:live` 스크립트. → 짝 app 카드.
- `HARNESS_OUTPUT_ROOT`보다 우선하는 `--output-root` CLI override. env만 지원, 후속.
- 오래된 `build/<scope>/runs/*` 자동 정리. 후속 cleanup 정책.
- Playwright 결과 freshness/stale 검사. 별도 카드가 다룬다: [Playwright canonical 결과 freshness 게이트](2026-06-06-playwright-result-freshness.md).
- Change Set metadata enum 승격, 용어 오류 메시지 개선.
- 병렬 실행 중 canonical을 읽는 외부 도구(`app/front-end/tools/generate-api-client.mjs` 등)의 강한 일관성. 병렬 안전은 각 invocation의 run root 기준으로만 보장한다.

## 완료 조건

- `run.mjs`가 `runId`·run root·할당 포트를 생성·주입하고 로그에 남긴다.
- 모든 indexer/validator/gate가 run root 기준으로 동작한다(canonical 하드코딩 제거: `index-harness-self-tests.mjs`, `index-test-results.mjs`).
- trace/validate/live 경로의 Gradle 호출이 run별 `buildDir`·`project-cache-dir`로 격리된다.
- 같은 workspace에서 `npm run app:trace -- --requirement REQ-021`과 `npm run app:trace -- --requirement REQ-022`를 동시 실행해도 서로의 산출물을 훼손하지 않는다.
- (짝 app 카드와 함께) 같은 workspace에서 `npm run app:validate`를 두 번 동시 실행해도 산출물·Gradle `buildDir`·포트·Playwright 출력이 충돌하지 않고 각자 통과한다. 이 조건은 app 카드 완료에 의존한다.
- 단발 `npm run app:validate`/`npm run harness:validate`가 회귀 없이 통과한다.
- 성공 후 canonical `build/app/indexes/openapi.index.json`, `build/app/state/trace.state.json`, `build/harness/state/trace.state.json`가 최신 성공 실행 스냅샷으로 갱신된다.

## 검증 명령

- 병렬 trace(app):
  - `npm run app:trace -- --requirement REQ-021`
  - `npm run app:trace -- --requirement REQ-022`
- 병렬 validate(짝 카드와 함께):
  - `npm run app:validate`
  - `npm run app:validate`
- 병렬 trace(harness):
  - `npm run harness:trace`
  - `npm run harness:trace`
- 회귀(단발): `npm run app:validate`, `npm run harness:validate`

## 결정 로그

- runId 형식은 사람이 로그에서 식별할 수 있도록 `<yyyyMMddHHmmss>-<pid>-<shortRandom>`로 둔다.
- run output root는 `build/<scope>/runs/<runId>`로 둔다.
- `run.mjs`는 runId 기반 root를 내부 경로 계산과 하위 프로세스 env 양쪽에 일관되게 쓴다. 모듈 로드 시점 canonical 고정값을 쓰지 않는다.
- 하위 프로세스 env: `HARNESS_RUN_ID`, `HARNESS_OUTPUT_ROOT`, 그리고 포트·결과 경로(`E2E_FRONTEND_PORT`, `E2E_BACKEND_PORT`, `E2E_BASE_URL`, `VITE_BACKEND_ORIGIN`, `E2E_RESULTS_FILE`, `E2E_LIVE_RESULTS_FILE` 등). 포트 할당 주체는 오케스트레이터(`run.mjs`)이고 config는 env 소비만 한다(app 카드).
- 포트 충돌은 기존 프로세스 자동 kill이 아니라 실행 소유 포트 격리 + fail-fast 진단으로 처리한다. 사용자가 명시한 포트가 점유되면 진단 메시지(점유 PID/command/해결 안내)와 함께 차단한다. 동시 실행 안전은 자동 할당 free 포트로 구조적으로 보장되고, 충돌 진단은 사용자 소유 프로세스와의 우발 충돌을 막는 보조 장치다.
- Gradle 격리는 report 위치 재지정만으로 부족하므로(컴파일 산출물·binary results·빌드 락 공유) run별 `--project-cache-dir` + `buildDir` override로 한다.
- 혼합 작업이라 AGENTS.md 규칙에 따라 harness/app 두 Change Set으로 나누고 cross-link한다.
- live 병렬 시 back-end 데이터 저장소는 `jdbc:h2:mem:bdd-workflow`(in-memory)라 프로세스별로 격리된다. 같은 이름이어도 JVM마다 별도 인스턴스이므로 공유 자원이 아니다(`application-test.yml`은 별도 datasource를 정의하지 않고 `application.yml`의 in-memory 설정을 상속).
- `repo:validate`는 단일 invocation이 app→harness를 순차 수행하므로 하나의 `runId`로 `build/app/runs/<runId>`와 `build/harness/runs/<runId>` 두 root를 만든다.
- canonical publish는 성공한 invocation 마지막에 파일 단위 rename으로 교체하고 last successful writer wins로 둔다. 세트 단위 원자성·외부 동시 reader 일관성은 보장하지 않는다.
- Playwright 결과의 canonical은 `build/<scope>`가 아니라 `app/front-end/test-results/`다. 결과 JSON과 sidecar manifest는 한 단위로 함께 publish해 freshness 카드(`resultFileSha256` 기반 검사)와의 정합성을 지킨다.
- v1은 env만 지원하고 `--output-root` CLI override는 후속으로 남긴다.
- 영향 요건(REQ-006/007/008/010)은 이번 작업으로 수용 기준이 바뀌지 않는다. openapi contract index와 통합 게이트의 입력 경로가 영향을 받아 regression 확인 대상이다.
- 오래된 `build/<scope>/runs/*` 정리는 후속 cleanup 정책으로 남긴다.

## 열린 논의

- 없음
