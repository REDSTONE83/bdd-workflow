# 요건 카드

요건 ID: REQ-035
제목: 하네스 UI 검증 명령 실행
우선순위: 높음
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability, security
검증 수준: mixed
관련 요건: REQ-029, REQ-030, REQ-032, REQ-037
대체 요건: 없음

## 사용자/목적

하네스 작업자는 터미널로 오가지 않고 하네스 UI에서 허용된 검증 명령을 실행하고, 로그와 성공/실패를 확인한 뒤 갱신된 추적 현황을 바로 볼 수 있어야 한다.

## 범위

- 실행 화면은 허용된 검증 명령 목록만 제공하고, 목록에 없는 명령은 실행할 수 없다.
- 허용 명령 목록은 명시 등록한 검증 명령으로 한다: `harness:trace`, `harness:validate`, `harness:self-test`, `app:trace`, `app:validate`, `repo:validate`와 단일 요건 지정 인자. 루트 package.json에 script가 추가되어도 자동으로 허용되지 않는다.
- 단일 요건 추적 명령은 실행 대상 요건을 선택 항목으로 제공하고, 초기 미선택 상태와 선택 해제를 지원한다.
- 실행 중 출력 로그를 실시간으로 표시하고, 종료 시 성공 또는 실패를 표시한다.
- 한 번에 하나의 명령만 실행한다. 실행 중에는 새 명령을 시작할 수 없고 실행 중임이 표시된다.
- 명령 실행은 기존 하네스 도구가 `build/` 산출물을 갱신하는 경로이며, 하네스 UI 서버 자체는 산출물을 쓰지 않는다. 갱신된 산출물의 화면 반영은 앱셸의 자동 갱신(REQ-030)이 담당한다.

## 표준 용어

- harness.requirementCard
- harness.validationCommand

## 제외 범위

- 임의 셸 명령 실행. 허용 목록 밖 명령은 서버가 거절한다.
- 허용 목록의 자동 파생(package.json script 전체 노출). 목록 확장은 카드 갱신으로만 한다.
- e2e 계열 장시간 명령의 UI 실행. MVP에서는 터미널에서 실행한다.
- 동시 다중 실행과 실행 대기열.
- 실행 이력의 영구 보관 (서버 세션 내 표시까지만).

## 수용 기준

- (UI) 실행 화면은 허용된 검증 명령 목록을 표시하고 선택해 실행할 수 있다
- (UI) 단일 요건 추적 명령은 실행 대상 요건을 선택 항목으로 제공하고 초기 미선택 상태와 선택 해제를 지원한다
- (UI) 실행 중 출력 로그가 실시간으로 표시되고 종료 시 성공 또는 실패가 표시된다
- (UI) 명령이 실행 중이면 새 명령을 시작할 수 없고 실행 중임이 표시된다
- (STATIC) 하네스 UI 서버는 허용 목록에 없는 명령 실행 요청을 거절한다

## 검증 대상

- API: 불필요
- DB: 불필요
- UI: 필요
- Storybook: 필요
- E2E: 불필요
- STATIC: 필요

## API Skeleton

- 해당 없음

## DB Skeleton

- 해당 없음

## UI Skeleton

- 화면 표면: `harness/ui/src/features/runs/CommandRunnerPage.tsx`를 `/runs` route에 둔다.
- 주요 영역: 허용 명령 목록, 선택된 명령 카드 내부의 요건 요약, REQ-037 요건 검색/선택 진입점, 선택된 명령 카드 내부의 실행 버튼, 실행 중 상태, 실시간 로그, 종료 결과, 서버 거절 메시지를 둔다.
- 표시 필드: 명령 ID, 설명, 허용 인자, 실행 대상 요건 선택 여부, 선택 요건 ID, 선택 요건 제목, 선택 요건 추적 상태, 실행 상태, 시작 시각, 종료 코드, 성공/실패, 로그 라인, 거절 사유를 표시한다.
- 상태 목록: 실행 가능, 실행 대상 요건 미선택, 실행 대상 요건 선택됨, 실행 중, 성공, 실패, 허용 목록 밖 요청 거절을 검토 상태로 둔다.
- 사용자 행위: 허용 명령을 선택하고, 선택된 명령 카드 안에서 실행한다. 단일 요건 추적 명령에는 같은 카드 안의 REQ-037 요건 검색/선택 진입점으로 요건 선택값을 받거나 선택 해제할 수 있다. 초기값은 미선택이다. 실행 중에는 새 명령 시작을 막는다. 자유 입력 셸 명령은 UI에 제공하지 않는다.

## Storybook 계약

- Harness/Runs/CommandRunner: Ready, ReadyWithRequirement, Running, Succeeded, Failed, Rejected

## 의사결정 로그

- 결정일: 2026-06-10
  결정: 명령 실행은 허용 목록 방식으로 제한하고 자유 입력 명령은 받지 않는다.
  이유: UI 서버가 임의 명령 실행 통로가 되면 로컬 도구라도 공격 표면이 된다.
  결정자: REDSTONE
  영향: 허용 목록과 인자 검증이 서버 계약이 되고 STATIC 수용 기준으로 검증한다.

- 결정일: 2026-06-10
  결정: 허용 명령 목록은 루트 package.json의 npm script 전부로 한다. (대체됨: 같은 날 아래 명시 허용 목록 결정으로 대체)
  이유: 작업자가 UI 한 곳에서 모든 표준 검증 명령을 실행할 수 있게 한다.
  결정자: REDSTONE
  영향: e2e 계열 같은 장시간 명령도 실행할 수 있으므로 실행 중 표시와 단일 실행 잠금의 중요도가 높아진다. 인자는 단일 요건 지정만 허용한다.

- 결정일: 2026-06-10
  결정: 허용 명령 목록을 명시 등록한 검증 명령(`harness:trace`, `harness:validate`, `harness:self-test`, `app:trace`, `app:validate`, `repo:validate`와 단일 요건 지정 인자)으로 좁힌다. 새 npm script는 자동으로 허용되지 않는다.
  이유: security 품질 속성 대비 전부 허용은 과도하고, 향후 배포·정리 script가 package.json에 추가되면 UI가 자동으로 실행 통로가 된다.
  결정자: REDSTONE
  영향: e2e 계열 장시간 명령은 MVP에서 터미널에 남는다. 허용 목록 확장은 카드 갱신으로만 한다.

- 결정일: 2026-06-12
  결정: 단일 요건 추적 명령의 요건 지정은 자유 텍스트 입력 대신 REQ-037 요건 검색/선택 대화상자의 선택 결과로 제공한다.
  이유: 작업자가 REQ key를 정확히 기억해 입력하는 흐름은 오류가 쉽고, 요건 제목과 추적 상태를 함께 보고 선택하는 편이 실행 대상 확인에 적합하다. 대화상자 내부 검색/선택 계약은 여러 화면에서 재사용되므로 별도 요건이 소유한다.
  결정자: REDSTONE
  영향: 실행 화면은 선택된 요건을 명령 인자로 반영하는 흐름만 검증한다. 서버 인자는 계속 단일 `--requirement REQ-XXX`만 허용한다.

- 결정일: 2026-06-12
  결정: 단일 요건 선택 요약과 검색/선택 진입점은 명령 목록 하단의 독립 영역이 아니라 선택된 명령 카드 내부에 표시한다.
  이유: 요건 선택은 모든 명령 공통 입력이 아니라 단일 요건 추적 명령의 인자이므로, 선택한 명령과 붙어 있어야 작업자가 적용 대상을 오해하지 않는다.
  결정자: REDSTONE
  영향: 실행 화면 레이아웃은 선택된 명령 카드 내부에 요건 요약과 대화상자 버튼을 배치한다.

- 결정일: 2026-06-12
  결정: 실행 버튼도 명령 목록 하단의 독립 영역이 아니라 선택된 명령 카드 내부에 표시한다.
  이유: 실행은 현재 선택한 명령에 대한 행위이므로, 요건 선택과 같은 카드 안에 있어야 실행 대상과 실행 행위가 한 덩어리로 읽힌다.
  결정자: REDSTONE
  영향: 실행 화면 레이아웃은 선택된 명령 카드 내부에서 인자 선택과 실행 버튼을 연속 배치한다.

- 결정일: 2026-06-12
  결정: 실행 대상 요건은 선택 항목으로 두고 초기값은 미선택으로 표시하며, 선택된 상태에서도 해제할 수 있게 한다.
  이유: 단일 요건 인자는 추적 명령의 선택적 인자이며, 초기 자동 선택은 작업자가 의도하지 않은 요건만 대상으로 실행한다고 오해하게 만든다.
  결정자: REDSTONE
  영향: 미선택 상태에서는 `--requirement` 인자를 붙이지 않고, 선택/해제 동작은 선택된 명령 카드 내부에서 확인한다. 대화상자 내부 선택/해제 동작은 REQ-037에서 확인한다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-035-harness-ui-command-runner.feature`

### 요건 Skeleton 설계 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 5개 Scenario가 카드 수용 기준 5개를 1:1 `Covers:`로 연결한다. 명령 목록/실행/로그/잠금은 `(UI)`, 허용 목록 밖 명령 거절은 `(STATIC)`으로 검증한다.
  UI Skeleton: `/runs` route는 command registry view model을 받아 허용 명령만 표시한다. 실행 버튼은 선택된 명령 카드 내부에 둔다. 단일 요건 추적 명령은 같은 카드 내부의 REQ-037 요건 검색/선택 진입점에서 선택값을 받고, 초기값은 미선택으로 둔다. 선택한 요건 ID만 `--requirement REQ-XXX` 인자로 전달하고, 선택 해제 시 요건 인자를 전달하지 않는다.
  Storybook 계약: `Harness/Runs/CommandRunner`의 `Ready`, `ReadyWithRequirement`, `Running`, `Succeeded`, `Failed`, `Rejected` 상태가 있어야 한다.
  서버 Skeleton: command registry는 `harness:trace`, `harness:validate`, `harness:self-test`, `app:trace`, `app:validate`, `repo:validate`만 가진다. 인자는 선택적으로 단일 `--requirement REQ-XXX`만 허용하고, 실행 backend는 한 번에 하나의 child process만 유지한다.
  추적 정책: `(UI)` AC는 harness/ui Storybook Vitest 결과로 판정한다. `(STATIC)` AC는 UI를 거치지 않은 직접 서버 요청 fixture로 허용 목록 밖 명령 거절을 검증한다.
  검증: Skeleton 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-035`로 카드/시나리오/용어 정합성을 확인한다.
  Skeleton 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-10
  리뷰자: REDSTONE
  확인: Skeleton 검토중 단계. UI Skeleton과 Storybook surface를 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

- 리뷰일: 2026-06-17
  리뷰자: REDSTONE
  확인: `harness/ui/src/features/runs/CommandRunner.stories.tsx`의 Storybook Vitest play 검증이 허용 명령 목록, 명령 선택과 실행 요청, 단일 요건 초기 미선택/검색 선택/선택 해제, 실행 중 잠금, 실행 로그와 성공 결과 표시를 확인한다. `harness/self-test/tests/harness-ui-command-runner.test.ts`는 UI를 거치지 않은 직접 서버 요청으로 허용 목록 밖 명령이 거절되는지 검증한다. `npm run test:storybook`, `npm run harness:self-test`, `npm run harness:trace -- --requirement REQ-035`가 통과했고 REQ-035 trace state는 GREEN이다.
  결과: 승인

- 리뷰일: 2026-06-18
  리뷰자: REDSTONE
  확인: `Failed` 스토리에 covers+play를 추가해 "성공 또는 실패"의 실패 표시·로그를 검증하고, `harness-ui-command-runner.test.ts`에 잘못된 요건 인자 형식과 미지원 명령의 요건 인자에 대한 서버 거절(400) 케이스를 추가했다.
  결과: 승인

## 열린 질문

- 없음
