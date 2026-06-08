# Change Set: Playwright canonical 결과 freshness 게이트

상태: 진행중
요청일: 2026-06-06
변경 유형: 하네스 개선, 수정
영향 요건: REQ-010, REQ-012
논의 상태: 없음

## 요청 요약

- FE BDD 테스트의 `Covers` metadata를 바꾼 뒤 예전 Playwright PASS 결과가 그대로 남아 새 AC 커버 결과처럼 매칭되는 문제를 막는다.
- Playwright canonical 결과가 현재 FE BDD source metadata와 같은 실행에서 나온 것인지 manifest fingerprint로 검증한다.
- fingerprint가 맞지 않으면 `app:trace`는 테스트를 대신 실행하지 않고 stale 메시지를 반환한다.
- `app:validate`는 canonical Playwright 결과와 manifest fingerprint를 반드시 새로 생성한 뒤 판정한다.
- 동시성/격리(runId·run root·동적 포트)는 직교 문제라 별도 Change Set이 다룬다: [harness: run output 전체 격리와 병렬 실행](2026-06-06-run-output-root-isolation.md). 단 e2e wrapper와 `index-test-results.mjs`의 Playwright 수집을 공유하므로 접점을 조율한다 — isolation 카드가 wrapper 골격과 결과 수집 경로를 만들고, 이 카드가 manifest 생성·fingerprint 필터를 얹는다.
- app 소유 표준 문서(`app/docs/standards/front-end-testing.md`)에 freshness 정책을 반영하는 부분은 혼합 작업이라 짝 app Change Set이 다룬다(AGENTS.md 분리 규칙): [app: FE 테스트 결과 freshness 정책 표준 반영](../../../app/docs/change-sets/2026-06-06-fe-test-result-freshness-standard.md).

## 작업 범위

- Playwright canonical 결과 파일마다 sidecar manifest를 둔다.
  - `app/front-end/test-results/e2e-results.manifest.json`
  - `app/front-end/test-results/e2e-live-results.manifest.json`
- manifest에는 실행 시점의 FE BDD fingerprint와 실행 metadata를 기록한다.
  - spec file path
  - test title path
  - `Requirement` 목록
  - `Covers` 목록
  - test file content hash 또는 BDD metadata hash
  - startedAt, completedAt, exitStatus
  - resultFile, resultFileSha256
- fingerprint 기준은 현재 FE source index가 수집한 Playwright BDD metadata로 둔다.
- `app:e2e`와 `app:e2e:live`는 하네스 wrapper를 통해 실행한다.
  - 실행 시작 전에 해당 canonical JSON과 manifest를 삭제한다.
  - Playwright 실행 뒤 canonical JSON이 있으면 manifest를 생성한다.
  - Playwright 테스트 실패여도 JSON 결과가 생성되면 manifest를 생성하고, 실패 결과는 최신 `FAIL`로 trace에 반영 가능해야 한다.
  - Playwright 실행이 중단되어 canonical JSON 또는 manifest를 만들 수 없으면 명령은 실패한다.
- `app:validate`는 mock E2E와 live E2E wrapper를 모두 실행해 두 manifest를 반드시 갱신한 뒤 `index-test-results`와 trace/gate를 수행한다.
- `app:trace`는 Playwright를 실행하지 않는다. 현재 FE source index fingerprint와 manifest fingerprint를 비교하고, 불일치하거나 manifest가 없으면 stale finding을 보고한다.
- `harness/tools/index-test-results.mjs`는 manifest fingerprint가 현재 source fingerprint와 일치하는 Playwright 결과만 `test-results.index.json`에 수집한다.
- stale 또는 manifest 누락은 Layer 1 issue로 남기고, `validate-front-end-standards.mjs`가 이를 `FE-TEST-RESULT-STALE` error finding으로 정규화한다.
- `FE-TEST-RESULT-STALE` finding은 mock/live 결과 구분과 재실행 명령을 remediation에 포함한다.
  - mock: `npm run app:e2e`
  - live: `npm run app:e2e:live`
- stale 결과는 AC 커버 결과로 인정하지 않는다. 해당 FE BDD 테스트 결과는 trace에서 `NOT_RUN` 또는 `MISSING` 상태로 계산된다.
- `harness/docs/standards/acceptance-test.md`에 canonical 결과 freshness 정책을 반영한다. app 소유 표준 `app/docs/standards/front-end-testing.md` 반영은 짝 app 카드가 다룬다.
- 하네스 self-test에 manifest 일치, manifest 불일치, manifest 누락, partial 결과 제외 fixture를 추가한다.

## 제외 범위

- `app:trace`가 stale을 감지했을 때 Playwright 테스트를 자동 실행하는 기능.
- `e2e-results.partial.json`을 canonical trace 입력으로 인정하는 기능.
- Playwright `Requirement`/`Covers` metadata 작성 형식 변경.
- 백엔드 JUnit 결과 freshness manifest 도입.
- runId 기반 output root 격리·동적 포트(별도 카드: [run output 전체 격리와 병렬 실행](2026-06-06-run-output-root-isolation.md)).
- app 소유 표준 `app/docs/standards/front-end-testing.md` 편집(짝 app 카드).
- live E2E의 8080/5173 포트 충돌 사전 검사.
- 애플리케이션 화면 기능 또는 테스트 시나리오 내용 변경.

## 완료 조건

- 이전 PASS canonical 결과가 있는 상태에서 FE BDD 테스트의 `Covers` metadata를 바꾸고 `npm run app:trace`를 실행하면 `FE-TEST-RESULT-STALE` error가 보고된다.
- stale 상태의 Playwright 결과는 AC 커버 PASS로 인정되지 않고 해당 AC는 `NOT_RUN` 또는 `MISSING`으로 계산된다.
- `npm run app:e2e`는 mock canonical JSON과 `e2e-results.manifest.json`을 같은 실행 fingerprint로 갱신한다.
- `npm run app:e2e:live`는 live canonical JSON과 `e2e-live-results.manifest.json`을 같은 실행 fingerprint로 갱신한다.
- `npm run app:validate`는 mock/live manifest를 모두 새로 만든 뒤 trace/gate를 판정한다.
- `app:validate`에서 Playwright 테스트가 실패하더라도 JSON 결과와 manifest가 생성됐으면 trace는 오래된 PASS가 아니라 최신 FAIL을 볼 수 있다.
- canonical manifest가 없으면 해당 Playwright 결과는 stale로 보고된다.
- `e2e-results.partial.json`은 manifest가 있어도 canonical trace 입력에 포함되지 않는다.
- `npm run harness:self-test`가 manifest freshness fixture를 검증한다.
- `npm run harness:validate`가 통과한다.

## 검증 명령

- `npm run harness:self-test`
- `npm run harness:validate`
- `npm run app:e2e`
- `npm run app:e2e:live`
- `npm run app:trace -- --requirement REQ-021`
- `npm run app:validate`

## 결정 로그

- Playwright canonical 결과는 sidecar manifest fingerprint가 현재 FE BDD source fingerprint와 일치할 때만 AC 커버 결과로 인정한다.
- manifest fingerprint가 일치하지 않으면 `app:trace`는 테스트를 실행하지 않고 `FE-TEST-RESULT-STALE` 메시지와 재실행 명령을 반환한다.
- `app:validate`는 stale fingerprint를 보고 멈추는 명령이 아니라, mock/live canonical 결과와 manifest를 반드시 새로 생성한 뒤 판정하는 명령이다.
- manifest 생성 실패는 `app:e2e`, `app:e2e:live`, `app:validate`의 실패 사유다.
- Playwright 테스트 실패는 freshness 실패가 아니다. JSON 결과와 manifest가 같은 실행에서 생성되면 최신 실패 결과로 trace에 반영한다.
- manifest 누락은 하위 호환으로 통과시키지 않고 stale로 차단한다. 최초 적용 후 한 번은 canonical E2E 재실행이 필요하다.
- partial 실행 결과는 빠른 디버깅용으로만 남기고, canonical trace/gate 입력에서 계속 제외한다.
- 동시성/격리와 신선도는 직교 문제라 별도 Change Set으로 두고 cross-link한다. e2e wrapper와 `index-test-results.mjs` 공유 접점은 isolation 카드가 골격을, 이 카드가 manifest·fingerprint를 담당하도록 나눈다.
- app 소유 표준 문서 편집은 AGENTS.md 혼합 작업 규칙에 따라 짝 app 카드로 분리한다.

## 열린 논의

- 없음
