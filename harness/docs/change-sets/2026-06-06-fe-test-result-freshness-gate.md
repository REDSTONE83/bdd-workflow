# Change Set: 2026-06-06 FE 실행 결과 freshness 게이트

상태: 계획
요청일: 2026-06-06
변경 유형: 하네스 개선, 수정
영향 요건: REQ-010, REQ-012
논의 상태: 없음

## 요청 요약

- FE BDD 테스트의 `Covers` metadata를 바꾼 뒤 예전 PASS 결과가 그대로 남아 새 AC 커버 결과처럼 매칭되는 문제를 막는다. 결과는 test identity로 매칭되므로, 테스트를 다시 실행하지 않고 `Covers`만 바꿔도 옛 PASS가 새 AC로 흘러간다.
- 이 문제는 FE 실행 결과 두 종류 모두에 해당한다: Storybook Vitest(`UI` AC, mock e2e)와 live Playwright(`E2E` AC, live e2e). mock e2e는 별도 Playwright가 아니라 Storybook Vitest 경로이며, `UI` AC 커버 대부분이 여기서 나온다. 따라서 freshness 게이트는 두 결과를 모두 다룬다.
- FE 실행 결과가 현재 FE BDD source metadata와 같은 실행에서 나온 것인지 sidecar manifest fingerprint로 검증한다.
- fingerprint가 맞지 않으면 `app:trace`는 테스트를 대신 실행하지 않고 stale 결과로 보고한다.
- `app:validate`는 두 결과와 manifest fingerprint를 반드시 새로 생성한 뒤 판정한다.
- 동시성/격리(runId·run root·동적 포트)는 직교 문제라 별도 Change Set이 다룬다: [run output 전체 격리와 병렬 실행](2026-06-06-run-output-root-isolation.md). 그 카드가 e2e wrapper 골격(포트·출력 경로)·결과 수집·run root publish/hydrate를 만들었고, 이 카드는 그 위에 manifest 생성·fingerprint 필터를 얹는다.
- app 소유 표준 문서(`app/docs/standards/front-end-testing.md`)에 freshness 정책을 반영하는 부분은 혼합 작업이라 짝 app Change Set이 다룬다(AGENTS.md 분리 규칙): [app: FE 테스트 결과 freshness 정책 표준 반영](../../../app/docs/change-sets/2026-06-06-fe-test-result-freshness-standard.md).

## 작업 범위

- FE 실행 결과 파일마다 sidecar manifest를 둔다.
  - Storybook Vitest: `app/front-end/test-results/storybook-junit.manifest.json`
  - live Playwright: `app/front-end/test-results/e2e-live-results.manifest.json`
- manifest에는 실행 시점의 FE BDD fingerprint와 실행 metadata를 기록한다.
  - test 식별자(`identity`와 `alternateIdentities`)
  - `Requirement` 목록
  - `Covers` 목록과 AC `target` 마커
  - runtime (`storybook-vitest` | `playwright`)
  - fingerprint: 위 식별자·`Requirement`·`Covers`·`target` metadata만으로 계산한 hash. 결과 매칭과 무관한 렌더 코드/테스트 본문 편집으로는 stale이 나지 않도록 파일 전체 hash는 쓰지 않는다.
  - startedAt, completedAt, exitStatus
  - resultFile, resultFileSha256
- fingerprint 기준은 현재 FE source index(`front-end.source-index.json`)가 수집한 Storybook Vitest/Playwright BDD metadata로 둔다. manifest 생성과 trace 비교가 같은 source-of-truth를 쓴다.
- `app:e2e`와 `app:e2e:live`는 하네스 wrapper를 통해 실행한다.
  - manifest fingerprint는 실행 시점 source metadata가 필요하므로, 단독 실행 경로도 테스트 전에 FE source index를 먼저 생성한다. (현재 `app:e2e`/`app:e2e:live`는 source index를 돌리지 않고 `app:validate`만 `collectAppStaticInputs`로 먼저 인덱싱한다.)
  - 실행 시작 전에 해당 run root의 결과 파일과 manifest를 비운다.
  - 테스트 실행 뒤 결과 파일이 있으면 manifest를 생성한다.
  - 테스트가 실패해도 결과 파일이 생성되면 manifest를 생성하고, 실패 결과는 최신 `FAIL`로 trace에 반영 가능해야 한다.
  - 실행이 중단되어 결과 파일 또는 manifest를 만들 수 없으면 명령은 실패한다.
- `app:validate`는 Storybook Vitest와 live Playwright wrapper를 모두 실행해 두 manifest를 반드시 갱신한 뒤 `index-test-results`와 trace/gate를 수행한다.
- 성공 실행의 canonical publish는 결과 파일과 그 manifest를 한 단위로 함께 교체한다. `harness/tools/run.mjs`의 `publishFrontEndArtifacts`가 `storybook-junit.xml`·`e2e-live-results.json`을 publish할 때 각 manifest도 같은 단위로 publish한다.
- `app:trace`는 테스트를 실행하지 않는다. canonical 결과를 run root로 hydrate할 때(`hydrateTraceTestResults`) manifest sidecar도 함께 hydrate하고, 현재 FE source index fingerprint와 manifest fingerprint를 비교해 불일치하거나 manifest가 없으면 stale로 본다.
- `harness/tools/index-test-results.mjs`는 manifest fingerprint가 현재 source fingerprint와 일치하는 결과만 `test-results.index.json`에 수집한다. 필터는 Storybook Vitest 수집(`collectStorybookVitestJUnit`)과 Playwright 수집(`collectPlaywright`) 양쪽에 적용하되 app scope에만 건다. 이를 위해 인덱서는 `front-end.source-index.json`을 신규 입력으로 읽는다.
- stale 또는 manifest 누락은 `index-test-results.mjs`가 `test-results.index.json`의 `issues[]`로 남기고, `validate-front-end-standards.mjs`가 이를 `FE-TEST-RESULT-STALE` error finding으로 정규화한다. 이를 위해 검사기는 `test-results.index.json`을 신규 입력으로 읽는다. (현재는 `front-end.source-index.json`만 읽는다.)
- `FE-TEST-RESULT-STALE` finding은 결과 종류(Storybook Vitest/live Playwright) 구분과 재실행 명령을 remediation에 포함한다.
  - Storybook Vitest: `npm run app:e2e`
  - live Playwright: `npm run app:e2e:live`
- stale 결과는 AC 커버 결과로 인정하지 않는다. 해당 FE BDD 테스트 결과는 trace에서 `NOT_RUN` 또는 `MISSING` 상태로 계산된다.
- `harness/docs/standards/acceptance-test.md`에 FE 실행 결과(Storybook Vitest·live Playwright) freshness 정책을 반영한다. app 소유 표준 `app/docs/standards/front-end-testing.md` 반영은 짝 app 카드가 다룬다.
- 하네스 self-test에 manifest 일치, manifest 불일치, manifest 누락, partial 결과 제외 fixture를 추가한다. Storybook Vitest와 live Playwright 두 런타임을 모두 fixture로 다룬다.

## 제외 범위

- `app:trace`가 stale을 감지했을 때 테스트를 자동 실행하는 기능.
- `e2e-results.partial.json`을 canonical trace 입력으로 인정하는 기능. 현재 `index-test-results.mjs`는 이 파일을 읽지 않으므로 제외는 이미 충족이며, self-test fixture로 회귀만 막는다. 남아 있는 잔재 파일 정리는 후속.
- Playwright/Storybook Vitest `Requirement`/`Covers` metadata 작성 형식 변경.
- 백엔드 JUnit 결과 freshness manifest 도입.
- harness scope(`harness/ui`) Storybook Vitest 결과 freshness. 같은 stale 위험이 있으나 이번 카드는 app scope만 다룬다. harness scope 결과는 manifest가 없어도 stale로 처리하지 않으며, 필요하면 후속 카드로 harness UI freshness를 다룬다.
- runId 기반 output root 격리·동적 포트(별도 카드: [run output 전체 격리와 병렬 실행](2026-06-06-run-output-root-isolation.md)).
- app 소유 표준 `app/docs/standards/front-end-testing.md` 편집(짝 app 카드).
- live E2E의 포트 충돌 사전 검사(격리 카드 소유).
- 애플리케이션 화면 기능 또는 테스트 시나리오 내용 변경.

## 완료 조건

- 이전 PASS 결과가 있는 상태에서 FE BDD 테스트의 `Covers` metadata를 바꾸고 `npm run app:trace`를 실행하면 `FE-TEST-RESULT-STALE` error가 보고된다. Storybook Vitest(`UI` AC)와 live Playwright(`E2E` AC) 두 경로 모두에서 성립한다.
- stale 상태의 결과는 AC 커버 PASS로 인정되지 않고 해당 AC는 `NOT_RUN` 또는 `MISSING`으로 계산된다.
- `npm run app:e2e`는 `storybook-junit.xml`과 `storybook-junit.manifest.json`을 같은 실행 fingerprint로 갱신한다.
- `npm run app:e2e:live`는 `e2e-live-results.json`과 `e2e-live-results.manifest.json`을 같은 실행 fingerprint로 갱신한다.
- `npm run app:validate`는 두 manifest를 모두 새로 만든 뒤 trace/gate를 판정한다.
- `app:validate`에서 테스트가 실패하더라도 결과 파일과 manifest가 생성됐으면 trace는 오래된 PASS가 아니라 최신 FAIL을 본다.
- 결과 파일에 대응하는 manifest가 없으면 그 결과는 stale로 보고된다.
- `e2e-results.partial.json`은 manifest가 있어도 canonical trace 입력에 포함되지 않는다.
- harness scope 결과는 manifest가 없어도 stale로 처리되지 않아 `npm run harness:validate`가 회귀 없이 통과한다.
- `npm run harness:self-test`가 manifest freshness fixture(두 런타임)를 검증한다.
- `npm run harness:validate`가 통과한다.

## 검증 명령

- `npm run harness:self-test`
- `npm run harness:validate`
- `npm run app:e2e`
- `npm run app:e2e:live`
- `npm run app:trace -- --requirement REQ-021` (상위 `E2E` AC = live Playwright 경로)
- `npm run app:trace -- --requirement REQ-022` (`UI` AC = Storybook Vitest 경로)
- `npm run app:validate`

## 결정 로그

- FE 실행 결과는 sidecar manifest fingerprint가 현재 FE BDD source fingerprint와 일치할 때만 AC 커버 결과로 인정한다.
- freshness 대상은 Playwright만이 아니라 FE 실행 결과 두 종류(Storybook Vitest JUnit, live Playwright JSON)다. mock e2e가 Storybook Vitest 경로라 `UI` AC 커버 대부분이 여기서 나오므로, Playwright만 다루면 주력 경로의 stale을 못 막는다.
- fingerprint는 test 식별자·`Requirement`·`Covers`·`target` metadata만으로 계산한다. 파일 전체 hash는 결과 매칭과 무관한 편집으로 false-stale을 유발하므로 쓰지 않는다.
- manifest fingerprint가 일치하지 않으면 `app:trace`는 테스트를 실행하지 않고 `FE-TEST-RESULT-STALE` 메시지와 재실행 명령을 반환한다.
- `app:validate`는 stale fingerprint를 보고 멈추는 명령이 아니라, 두 결과와 manifest를 반드시 새로 생성한 뒤 판정하는 명령이다.
- manifest 생성 실패는 `app:e2e`, `app:e2e:live`, `app:validate`의 실패 사유다.
- 테스트 실패는 freshness 실패가 아니다. 결과 파일과 manifest가 같은 실행에서 생성되면 최신 실패 결과로 trace에 반영한다.
- manifest 누락은 하위 호환으로 통과시키지 않고 stale로 차단한다. 최초 적용 후 한 번은 canonical E2E 재실행이 필요하다.
- stale 판정은 결과와 source를 함께 보는 `index-test-results.mjs`가 수행해 `test-results.index.json`의 issue로 남기고, `validate-front-end-standards.mjs`가 `FE-TEST-RESULT-STALE`로 정규화한다. 두 도구 모두 비교에 필요한 신규 입력을 받는다(인덱서는 source index, 검사기는 test-results index).
- fingerprint 필터·stale 판정은 app scope에만 적용한다. harness scope Storybook Vitest는 manifest가 없으므로, scope 구분 없이 적용하면 manifest 누락으로 전부 stale 처리되어 `harness:validate`가 깨진다.
- 결과 파일과 manifest는 publish·hydrate에서 한 단위로 함께 교체/복사한다. 분리하면 `resultFileSha256`으로 정합성은 지키되 불필요한 false-stale이 생긴다.
- partial 실행 결과는 빠른 디버깅용으로만 남기고 canonical trace/gate 입력에서 계속 제외한다. 현재 인덱서가 이미 partial을 읽지 않으므로 self-test로 회귀만 막는다.
- 동시성/격리와 신선도는 직교 문제라 별도 Change Set으로 두고 cross-link한다. 격리 카드가 e2e wrapper 골격·결과 수집·run root publish/hydrate를, 이 카드가 manifest·fingerprint를 담당한다.
- app 소유 표준 문서 편집은 AGENTS.md 혼합 작업 규칙에 따라 짝 app 카드로 분리한다.

## 열린 논의

- 없음
