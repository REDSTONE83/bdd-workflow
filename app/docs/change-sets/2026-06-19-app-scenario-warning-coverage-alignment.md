# Change Set: 2026-06-19 앱 시나리오 경고 커버리지 문구 정렬

상태: 완료
요청일: 2026-06-19
변경 유형: 수정
영향 요건: REQ-016, REQ-023
논의 상태: 없음

## 요청 요약

- `npm run repo:validate`에서 앱 trace report에 남은 report-only 시나리오 경고 `TEST_COVERS_NO_SCENARIO_COVERS` 1건을 정리한다.
- `ProtectedLayout / TodosActive` Storybook 테스트의 `Covers` 문구가 `REQ-023` 카드와 `.feature` Scenario의 canonical AC 문구와 달라, 실행 테스트는 있으나 시나리오 커버가 없는 것처럼 보고된다.
- 기능 동작을 바꾸지 않고 수용 기준, Scenario, Storybook `Covers` 문구의 추적 문자열을 한 canonical 문장으로 정렬한다.

## 작업 범위

- `app/front-end/src/components/ProtectedLayout.stories.tsx:124` `TodosActive` 스토리의 `covers` 문자열을 canonical AC 문구로 정렬한다.
  - 변경 전: `할 일 화면 경로로 진입했다가 로그인하면 할 일 관리 화면으로 돌아온다`
  - 변경 후: `할 일 화면 경로로 진입했다가 로그인하면 할 일 화면으로 돌아온다`
  - 실제 차이는 `할 일 관리 화면` → `할 일 화면`(`관리 ` 토큰 1개 제거)뿐이며, 같은 스토리의 다른 `covers` 항목·`play` 단언·스토리 동작은 그대로 둔다.
- canonical 문구는 `REQ-023` 카드 수용 기준(`app/docs/requirements/REQ-023-todo-list.md` `(UI) 할 일 화면 경로로 진입했다가 로그인하면 할 일 화면으로 돌아온다`)과 `.feature` Scenario(`app/docs/scenarios/REQ-023-todo-list.feature` `비인증 사용자가 할 일 화면 경로로 진입했다가 로그인한다`)가 이미 동일하게 쓰고 있으므로, Storybook 문자열을 그 둘에 맞추는 단방향 정렬로 둔다.
- `TodosActive` 스토리는 `REQ-016`(보호 앱 셸 `ProtectedLayout` 소유)과 `REQ-023`(`/todos` 화면·로그인 복귀 AC 소유)을 함께 유지한다. `CategoriesActive`가 `REQ-016`+`REQ-011`을 함께 다는 것과 대칭 구조이므로 요건 태그는 바꾸지 않는다.
- 변경 후 앱 trace report의 `TRC-COV-01` / `TEST_COVERS_NO_SCENARIO_COVERS` 경고가 0건이 되는지 확인한다(현재 `build/app/findings/cross-artifact.findings.json`의 유일한 finding이다).

## 제외 범위

- 할 일 화면 또는 카테고리 화면의 UI 동작 변경.
- `REQ-023` 수용 기준 의미 변경.
- `REQ-023` 카드 수용 기준 문자열과 `.feature` Scenario `Covers` 문자열 수정 — 이미 canonical이므로 손대지 않는다.
- `TodosActive` 스토리의 요건 태그(`REQ-016`, `REQ-023`)와 `play` 단언 변경.
- 하네스의 `TRC-COV-01` 판정 규칙 변경.
- report-only 경고를 게이트 차단 오류로 승격하는 정책 변경.

## 완료 조건

- `build/app/findings/cross-artifact.findings.json`에서 `TRC-COV-01`(`TEST_COVERS_NO_SCENARIO_COVERS`) 경고가 0건이다.
- 같은 파일에 `TRC-COV-02`(Scenario `Covers`↔카드 AC 불일치) 경고가 새로 생기지 않는다.
- 앱 trace summary의 `Scenario warnings`가 0건이다.
- `npm run app:trace -- --requirement REQ-023`과 `npm run app:trace -- --requirement REQ-016`이 모두 경고 0건을 유지한다.
- `REQ-023` trace에서 할 일 화면 로그인 복귀 AC가 Scenario와 Storybook 테스트에 함께 연결된다.
- `npm run app:validate`가 통과한다.

## 검증 명령

- `npm run app:trace -- --requirement REQ-023`
- `npm run app:trace -- --requirement REQ-016`
- `npm run app:validate`
- `npm run repo:validate`

> `app:trace`/`app:validate`는 실행 시 front-end source index를 재생성하므로, Storybook `covers` 변경이 별도 인덱스 명령 없이 반영된다.

## 검증 결과

- 2026-06-19: `app/front-end/src/components/ProtectedLayout.stories.tsx:124` `TodosActive` `covers`를 `…할 일 관리 화면으로 돌아온다` → `…할 일 화면으로 돌아온다`로 정렬(`관리 ` 토큰 1개 제거). 카드 AC·Scenario·요건 태그·`play` 단언은 미변경.
- 2026-06-19: `npm run app:trace -- --requirement REQ-023` `gate: pass`. `(UI) 할 일 화면 경로로 진입했다가 로그인하면 할 일 화면으로 돌아온다` AC가 `TodosActive` 스토리와 Scenario `비인증 사용자가 할 일 화면 경로로 진입했다가 로그인한다`에 PASS로 연결됨.
- 2026-06-19: `npm run app:trace -- --requirement REQ-016` REQ-016 BLUE, Scenario warnings 0, `gate: pass`.
- 2026-06-19: `build/app/findings/cross-artifact.findings.json` finding 1건 → 0건. `TRC-COV-01` 0건이며 `TRC-COV-02` 신규 경고도 없음.
- 2026-06-19: `npm run app:validate` `gate: pass`. RED 0, Scenario warnings 0, Change Set warnings 0, Terminology error/warning 0.
- 2026-06-19: `npm run harness:validate` `gate: pass` (RED 0). 하네스 파일 미변경이라 게이트 상태 유지. app + harness 게이트 동시 통과로 `repo:validate` 수준 그린을 확인.

## 결정 로그

- 2026-06-19: 현재 경고는 기능 누락이 아니라 테스트 `Covers` 문자열과 Scenario `Covers` 문자열의 용어 불일치로 판단한다. 카드와 Scenario의 `할 일 화면` 표현을 canonical 문구로 두고 Storybook 문구를 맞추는 방향을 우선한다.
- 2026-06-19: 카드 AC와 Scenario가 이미 공유하는 `할 일 화면으로 돌아온다`를 canonical로 두고 Storybook `covers`만 단방향으로 맞춘다. 카드·Scenario를 거꾸로 바꾸면 `TRC-COV-02` 회귀가 생길 수 있어 그 방향은 택하지 않는다.
- 2026-06-19: `TodosActive`는 `ProtectedLayout`을 소유한 `REQ-016`과 `/todos` 복귀 AC를 소유한 `REQ-023`을 함께 유지한다. 경고가 두 요건에 태깅되는 것은 테스트가 두 요건을 함께 달기 때문이고, 실제 수정 대상 AC는 `REQ-023` 소유다.
- 2026-06-19: 이번 작업은 Storybook 한 문자열만 바꾸는 app 전용 변경이라 혼합 작업이 아니다. 하네스 경고 정책 변경이 필요하면 별도 하네스 Change Set으로 분리하며, 이 Change Set 범위에는 포함하지 않는다.

## 열린 논의

- 없음
