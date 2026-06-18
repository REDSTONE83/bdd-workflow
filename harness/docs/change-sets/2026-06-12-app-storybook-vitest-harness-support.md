# Change Set: 2026-06-12 앱 Storybook Vitest 하네스 지원

상태: 완료
요청일: 2026-06-12
변경 유형: 하네스 개선, 표준 개정, 수정
영향 요건: REQ-012
논의 상태: 없음

## 요청 요약

- 앱 프런트엔드 UI 수용 기준 검증을 Storybook Vitest로 전환하는 작업을 하네스 추적 파이프라인이 수집하고 판정할 수 있게 한다.
- 앱 Change Set은 [2026-06-12 앱 프런트엔드 Storybook Vitest 전환](../../../app/docs/change-sets/2026-06-12-app-storybook-vitest-testing.md)에서 추적한다.

## 작업 범위

- `harness/tools/index-test-results.mjs`가 앱 Storybook Vitest JUnit 결과를 테스트 결과 인덱스로 수집한다.
- `app/front-end/tools/source-index.mjs`의 Storybook story `covers` 메타데이터를 front-end 테스트 커버로 인덱싱하고, 하네스 추적 판정기가 이를 `(UI)` AC의 실행 검증으로 사용한다.
- Storybook story 인덱스에 `hasPlay`/`hasAssertion`을 보존하고, `covers`가 있으나 실행 assertion이 없는 story를 FE 표준 위반으로 차단한다.
- `harness/tools/run.mjs`의 앱 검증 흐름에서 mock Playwright E2E 대신 Storybook Vitest와 live Playwright smoke를 실행하도록 조정한다.
- REQ-012와 하네스 Acceptance Test/카드/요건 작성 표준을 Storybook Vitest 기반 UI 검증 채널과 story test 작성 규칙에 맞게 갱신한다.

## 제외 범위

- harness/ui 자체의 Storybook Vitest 도입과 UI Skeleton 구현. 해당 작업은 2026-06-10 하네스 로컬 웹 UI MVP Change Set에서 추적한다.
- 애플리케이션 요건 카드 내용 변경. 해당 범위는 짝 앱 Change Set에서 추적한다.
- Storybook Visual Test 또는 시각 회귀 기준선 도입.

## 완료 조건

- 앱 Storybook Vitest JUnit 결과가 `build/app/indexes/test-results.index.json`에 수집된다.
- 앱 Storybook story `parameters.harness.covers`가 `build/app/indexes/front-end.source-index.json`의 acceptance test 항목으로 수집된다.
- `parameters.harness.covers`가 있는 story에 `play` assertion이 없으면 `FE-STORY-COVER-NO-PLAY` error가 발생한다.
- REQ-012의 `(UI)`/`(E2E)` target 판정 표준이 앱 Storybook Vitest 전환 후에도 BLUE를 유지한다.

## 검증 명령

- `npm run app:front-end-source-index`
- `HARNESS_SCOPE=application node harness/tools/index-test-results.mjs`
- `npm run harness:self-test`
- `npm run harness:trace -- --requirement REQ-012`

## 결정 로그

- 2026-06-12: 앱 UI AC의 canonical 실행 결과는 Storybook Vitest JUnit으로 수집한다. 기존 mock Playwright 결과보다 story 상태, Docs, 수용 기준 커버가 한 위치에서 관리되기 때문이다.
- 2026-06-12: `(E2E)` target은 프런트엔드 사용자 여정 테스트 커버를 허용하되, application 상위 요건의 실제 통합 smoke는 별도 front-end standards rule로 `tests/e2e/live/**/*.live.spec.ts` 위치를 계속 강제한다.
- 2026-06-12: Change Set은 scope별로 분리한다. application 영향 요건은 앱 Change Set에, 하네스 추적 파이프라인과 표준 변경은 본 하네스 Change Set에 둔다.
- 2026-06-12: Storybook Vitest 커버는 `covers` 메타데이터만으로 인정하지 않고 `play`와 assertion이 있을 때만 인정한다. JUnit PASS가 있어도 assertion 없는 story는 성공 조건을 표현하지 못하기 때문이다.
- 2026-06-12: story test의 성공 조건은 `play` 또는 `assert...` 함수에 드러나야 한다. 공통 helper가 성공 조건을 숨기면 하네스가 커버 테스트의 의도를 검토하기 어렵기 때문이다.

## 열린 논의

- 없음
