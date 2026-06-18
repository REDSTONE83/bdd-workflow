# Change Set: 2026-06-12 앱 프런트엔드 Storybook Vitest 전환

상태: 완료
요청일: 2026-06-12
변경 유형: 마이그레이션, 수정
영향 요건: REQ-001, REQ-011, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-027
논의 상태: 없음

## 요청 요약

- 앱 프런트엔드 UI 수용 기준 커버리지를 하네스 UI와 동일하게 Storybook Vitest browser mode로 수집한다.
- 기존 mock 기반 Playwright FE BDD 테스트는 제거하고, 상위 요건의 live Playwright 통합 smoke만 유지한다.
- `npm run app:validate`가 Storybook Vitest 결과, Storybook build, 백엔드 테스트, live Playwright smoke, trace `--check`를 한 번에 검증하도록 맞춘다.
- 하네스 수집기·판정기·표준 변경은 짝 Change Set인 [2026-06-12 앱 Storybook Vitest 하네스 지원](../../../harness/docs/change-sets/2026-06-12-app-storybook-vitest-harness-support.md)에서 추적한다.

## 작업 범위

- 앱 프런트엔드 테스트 구성: `app/front-end` Storybook Vitest addon, `vitest.config.ts`, `test:storybook` 스크립트.
- 앱 UI story 메타데이터: 주요 page/component story의 `parameters.harness.requirements`와 `parameters.harness.covers`.
- 앱 UI story 상호작용 검증: `covers`가 있는 story의 `play` 함수와 `expect(...)` 성공 조건.
- Storybook story test 작성 표준: `assert...` 성공 조건, portal 대화상자 범위 지정, 사용자 조작 기반 제출, 성공 후 닫힘/목록 반영 검증.
- 표준 문서: 앱 프런트엔드 테스트 표준, 프로젝트 구조 표준, UI 표준, 상태 관리 표준.

## 제외 범위

- 상위 요건 live Playwright smoke 제거.
- 시각 회귀 기준선 도입.
- 기존 승인 카드의 과거 BDD 리뷰 로그 일괄 재작성.
- 하네스 요건 카드 변경과 하네스 self-test 변경. 해당 범위는 짝 하네스 Change Set에서 다룬다.

## 완료 조건

- `app/front-end/test-results/storybook-junit.xml`이 앱 UI AC 판정 입력으로 수집된다.
- AC를 커버하는 Storybook story는 렌더링만 하지 않고 `play` assertion으로 사용자 관찰 상태를 검증한다.
- 앱 mock Playwright spec과 `playwright.config.ts`가 제거되고 live Playwright smoke만 남는다.
- `npm run app:validate`가 Storybook Vitest와 live Playwright smoke를 포함해 통과한다.
- 앱 영향 요건의 Storybook Vitest 커버와 live Playwright smoke가 최신 실행 결과로 BLUE를 유지한다.

## 검증 명령

- `cd app/front-end && npm run typecheck`
- `cd app/front-end && npm run lint`
- `cd app/front-end && npm run test`
- `cd app/front-end && npm run test:storybook`
- `npm run app:trace -- --requirement REQ-001`
- `npm run app:trace -- --requirement REQ-011`
- `npm run app:validate`

## 결정 로그

- 2026-06-12: 앱 UI AC 커버리지는 Storybook Vitest story test를 canonical 결과로 사용한다. 하네스 UI와 같은 검증 모델을 적용하면 상태별 화면 검토, story 문서, UI 수용 기준 커버리지를 한 경로로 관리할 수 있기 때문이다.
- 2026-06-12: mock Playwright spec과 `playwright.config.ts`를 제거하고, `app/front-end/test-results/storybook-junit.xml`을 trace 입력으로 수집한다.
- 2026-06-12: 애플리케이션 상위 요건의 `(E2E)` AC는 계속 live Playwright smoke가 소유한다. 상위 성과는 실 백엔드, Vite proxy, 브라우저 Cookie 인증 흐름 결합을 확인해야 하기 때문이다.
- 2026-06-12: 앱 Change Set의 영향 요건에는 application scope 요건만 남긴다. 앱 Storybook Vitest 결과를 하네스가 수집·판정하는 변경은 별도 하네스 Change Set으로 분리한다.
- 2026-06-12: `parameters.harness.covers`가 있는 Storybook story는 `play` 함수와 `expect(...)` 검증을 필수로 둔다. 성공 조건 없는 렌더링 story는 UI 검토 자료일 수는 있지만 AC 완료 근거가 될 수 없기 때문이다.
- 2026-06-12: Storybook story test는 정상 사용자 조작을 기준으로 작성한다. `form.requestSubmit(...)` 같은 DOM API 우회는 실제 사용자가 수행하는 흐름과 다르고, 컴포넌트 상태 버그를 가릴 수 있기 때문이다.
- 2026-06-12: 대화상자·메뉴·portal 표면은 현재 열린 role/name 범위 안에서 검증한다. Storybook Docs DOM과 이전 portal 잔상이 섞이면 테스트가 실제 검토 표면이 아닌 요소를 통과시킬 수 있기 때문이다.

## 열린 논의

- 없음
