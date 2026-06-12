# 요건 카드

요건 ID: REQ-029
제목: 하네스 UI 검증 채널
우선순위: 높음
상태: Skeleton 검토중
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: none
검증 수준: static
관련 요건: REQ-010, REQ-012, REQ-030
대체 요건: 없음

## 사용자/목적

하네스 작업자는 하네스 UI 화면 요건의 `(UI)` 수용 기준과 Storybook 계약이 다른 요건과 같은 방식으로 RED/GREEN/BLUE 추적, 통합 게이트, Skeleton 검토에 포함되는지 확인할 수 있어야 한다.

## 범위

- harness/ui Playwright FE BDD 테스트의 요건·수용 기준 메타데이터(Requirement/Covers)를 하네스 scope 인덱스로 수집한다.
- harness/ui Playwright 실행 결과 JSON을 하네스 scope 테스트 결과 인덱스에 병합한다.
- 하네스 scope 추적 판정이 (UI) 마커 수용 기준을 front-end 테스트 채널로 판정한다.
- `npm run harness:validate`가 harness/ui FE BDD 테스트 실행과 결과 수집을 포함한다.
- harness/ui Storybook story 메타데이터(표면 title, named export 상태, 요건 연결)를 하네스 scope 인덱스로 수집한다.
- `npm run harness:validate`가 harness/ui Storybook build를 실행한다.

## 표준 용어

- harness.requirementCard
- harness.acceptanceCriteria
- harness.scope
- harness.validationChannel

## 제외 범위

- 애플리케이션 scope의 FE BDD 채널 동작 변경. 기존 동작을 유지한다.
- harness/ui에 대한 (E2E) live smoke 채널. 필요해지면 별도 요건으로 다룬다.
- Vitest 단위 테스트의 AC 커버리지 포함. TDD 보조 테스트로만 사용한다.
- Storybook 시각 회귀 baseline 도입.

## 수용 기준

- (STATIC) harness/ui Playwright FE BDD 테스트의 요건·수용 기준 메타데이터가 하네스 scope 테스트 인덱스로 수집된다
- (STATIC) harness/ui Playwright 실행 결과가 하네스 scope 테스트 결과 인덱스에 병합되어 수용 기준 판정에 사용된다
- (STATIC) 하네스 scope에서 (UI) 마커 수용 기준은 front-end 테스트의 커버와 결과로 PASS/FAIL이 판정된다
- (STATIC) `npm run harness:validate`는 harness/ui FE BDD 테스트를 실행해 최신 결과로 판정한다
- (STATIC) harness/ui 테스트나 결과가 없는 (UI) 마커 수용 기준은 RED로 보고된다
- (STATIC) Storybook 계약을 선언한 하네스 scope 요건은 harness/ui에서 수집한 story 인덱스와 대조되어, 선언한 표면이나 상태가 없으면 위반으로 보고된다
- (STATIC) `npm run harness:validate`는 harness/ui Storybook build를 실행해 Skeleton 검토 표면이 빌드 가능한지 확인한다

## 검증 대상

- API: 불필요
- DB: 불필요
- UI: 불필요
- Storybook: 불필요
- E2E: 불필요
- STATIC: 필요

## API Skeleton

- 해당 없음

## DB Skeleton

- 해당 없음

## UI Skeleton

- 해당 없음

## Storybook 계약

- 해당 없음

## 의사결정 로그

- 결정일: 2026-06-10
  결정: 하네스 UI 카드의 (UI) 수용 기준은 하네스 scope에 front-end 테스트 채널을 추가해 harness/ui Playwright FE BDD 테스트로 판정한다.
  이유: 기존 하네스 카드의 (STATIC)+self-test 채널만으로는 화면 동작을 사용자 관찰 수준에서 검증할 수 없고, 추적 판정기는 이미 front-end 테스트 채널 분기를 갖고 있어 수집·병합만 추가하면 된다.
  결정자: REDSTONE
  영향: 하네스 scope collector 추가, 테스트 결과 병합, `run.mjs`의 `harness:validate` 단계 확장. REQ-030~REQ-036과 이후 하네스 UI 카드가 (UI) 마커를 쓸 수 있게 된다.

- 결정일: 2026-06-10
  결정: harness/ui Storybook 정적 검증을 하네스 scope 검증 채널에 와이어링한다. story 메타데이터를 수집해 카드 Storybook 계약과 대조하고, `harness:validate`가 Storybook build를 실행한다.
  이유: Storybook 계약 검증이 없으면 하네스 UI 카드의 Skeleton 승인 게이트가 약해진다.
  결정자: REDSTONE
  영향: REQ-030~REQ-036과 이후 하네스 UI 카드의 Skeleton 승인이 Storybook 계약 대조를 받는다. `harness:validate` 실행 시간이 Storybook build만큼 늘어난다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-029-harness-ui-coverage-channel.feature`

### 요건 Skeleton 설계 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 7개 Scenario가 카드 수용 기준 7개를 1:1 `Covers:`로 연결한다. 모든 AC는 `(STATIC)`이며 실행 테스트는 하네스 self-test로 작성한다.
  검사기 Skeleton: `harness/ui/tools/source-index.mjs`가 page, route, story, Playwright FE BDD annotation을 수집해 `build/harness/indexes/front-end.source-index.json`을 만든다. `index-test-results.mjs`는 `harness/ui/test-results/e2e-results.json`을 하네스 scope `front-end` 테스트 결과로 병합한다. `evaluate-trace-state.mjs`는 하네스 scope의 `(UI)` AC를 front-end 테스트 채널로 판정한다. `validate-front-end-standards.mjs`는 하네스 UI Storybook 계약과 story 인덱스를 대조한다.
  실행 Skeleton: `run.mjs`는 REQ-029 구현 이후 `harness:validate`에서 harness/ui source index, Storybook build, Playwright FE BDD 실행, 테스트 결과 인덱싱을 순차 실행한다. 부분 실행 결과는 canonical 결과 파일을 덮어쓰지 않는다.
  추적 정책: REQ-030~REQ-036과 이후 하네스 UI 카드의 `(UI)` AC는 harness/ui FE BDD 결과가 생기기 전까지 RED가 정상이다. 이 카드의 `(STATIC)` AC는 self-test가 작성된 뒤 GREEN 판정한다.
  검증: Skeleton 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-029`로 카드/시나리오/용어 정합성을 확인한다.
  Skeleton 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-10
  리뷰자: REDSTONE
  확인: Skeleton 검토중 단계. source-indexer Skeleton과 하네스 UI 검증 채널 설계를 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

## 열린 질문

- 없음
