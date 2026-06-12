# 요건 카드

요건 ID: REQ-030
제목: 하네스 UI 앱셸
우선순위: 높음
상태: Skeleton 검토중
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: mixed
관련 요건: REQ-029, REQ-036
대체 요건: 없음

## 사용자/목적

하네스 작업자는 로컬에서 하네스 UI를 띄워 애플리케이션 scope와 하네스 scope의 검증 산출물을 한 화면 흐름에서 살펴볼 수 있어야 한다.

## 범위

- `npm run harness:ui`로 하네스 UI 서버를 기동한다. 서버는 localhost 전용이며 외부 주소 접근을 받지 않는다.
- 기본 포트는 5180이고 `HARNESS_UI_PORT` 환경변수로 변경할 수 있다.
- 앱셸은 상단 머리 영역(제품명, scope 전환)과 요건, 표준 용어, 게이트, Change Set, 실행 화면으로 이동하는 좌측 LNB로 구성한다.
- scope 전환은 애플리케이션과 하네스 중 하나를 선택하고, 모든 화면이 선택한 scope의 산출물을 표시한다.
- 선택한 scope의 검증 산출물이 아직 없으면 빈 화면 대신 산출물 생성 명령 안내를 표시한다.
- 화면은 표시 중인 산출물의 생성 시각을 보여주고, 산출물보다 늦게 바뀐 원본 문서가 있으면 오래된 데이터 경고를 표시한다.
- 산출물 파일이 바뀌면 화면을 새로 고침하지 않아도 자동 갱신된다.
- 하네스 UI는 추적 상태와 게이트 판정을 재계산하지 않고 산출물 값을 그대로 표시한다.

## 표준 용어

- ui.appShell
- harness.scope
- harness.validationArtifact

## 제외 범위

- 문서 작성·편집·승인 액션. 후속 Change Set에서 다룬다.
- 원격 접근, 인증, 멀티 저장소 워크스페이스.
- 데스크탑 앱 패키징.

## 수용 기준

- (STATIC) 하네스 UI 서버는 localhost 요청만 수신하고 다른 호스트 주소로는 접근을 받지 않는다
- (UI) 하네스 UI는 모든 화면에서 요건, 표준 용어, 게이트, Change Set, 실행 화면으로 이동하는 좌측 LNB를 표시한다
- (UI) scope 전환으로 애플리케이션과 하네스 산출물을 오갈 수 있고, 현재 선택한 scope가 화면에 표시된다
- (UI) 선택한 scope의 검증 산출물이 없으면 산출물 생성 명령 안내가 표시된다
- (UI) 화면은 표시 중인 산출물의 생성 시각을 표시한다
- (UI) 산출물보다 늦게 바뀐 원본 문서가 있으면 오래된 데이터 경고가 표시된다
- (UI) 산출물 파일이 바뀌면 새로 고침 없이 화면 내용이 갱신된다

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

- 화면 표면: `harness/ui/src/features/shell/AppShell.tsx`가 모든 route를 감싸고 기본 진입은 `/requirements`로 둔다. 라우트는 `/requirements`, `/requirements/:requirementId`, `/terminology`, `/gate`, `/change-sets`, `/runs`를 가진다.
- 주요 영역: 상단 머리 영역에는 제품명, 현재 scope, scope 전환, 표시 중인 산출물 생성 시각, 오래된 데이터 경고를 둔다. 좌측 LNB는 요건, 표준 용어, 게이트, Change Set, 실행 화면 순서로 둔다. 본문은 LNB 오른쪽의 현재 route 화면에 표시한다.
- 표시 필드: 현재 scope(`application` 또는 `harness`), 산출물 생성 시각, 산출물 없음 안내, 오래된 원본 문서 경로, 현재 활성 내비, 자동 갱신 상태를 표시한다.
- 상태 목록: 기본 산출물 있음, 산출물 없음, 오래된 데이터, scope 전환 후 산출물 표시, 파일 변경 후 자동 갱신을 검토 상태로 둔다.
- 사용자 행위: scope를 전환하고, 좌측 LNB로 화면을 이동하며, 산출물 없음 안내에서 검증 명령 실행 화면으로 이동할 수 있다. 화면은 추적 상태와 게이트 판정을 재계산하지 않는다.

## Storybook 계약

- Harness/Shell/AppShell: DefaultArtifacts, MissingArtifacts, StaleArtifacts, ScopeSwitch

## 의사결정 로그

- 결정일: 2026-06-10
  결정: 하네스 UI는 `harness/ui`에 두고 React + Vite + TypeScript + Tailwind로 작성한다.
  이유: 기술 스택은 익숙한 조합을 쓰되, 화면 구조와 검증 기준은 `harness/docs/standards/harness-ui.md`가 별도로 소유한다.
  결정자: REDSTONE
  영향: AGENTS.md 직접 관리 산출물 목록에 `harness/ui` 경로 추가가 필요하다. app 표준이나 app 구현을 하네스 UI Skeleton의 입력으로 쓰지 않는다.

- 결정일: 2026-06-10
  결정: 하네스 UI는 추적 상태와 게이트 판정을 재계산하지 않는 표시 전용 화면으로 한다.
  이유: 판정 로직이 둘이 되면 REQ-010 단일 게이트 원칙이 깨진다.
  결정자: REDSTONE
  영향: 서버는 `build/{scope}` 산출물을 가공 최소화로 제공하고, 화면은 산출물 값을 그대로 표시한다.

- 결정일: 2026-06-10
  결정: MVP의 쓰기는 로컬 에디터 점프까지만 제공하고 문서 쓰기는 제외한다.
  이유: 사람이 직접 관리하는 산출물 원칙과의 충돌을 피하면서 관제 가치를 먼저 확보한다.
  결정자: REDSTONE
  영향: 편집·승인 액션은 후속 Change Set으로 분리한다.

- 결정일: 2026-06-10
  결정: 기본 포트는 고정 5180으로 하고 `HARNESS_UI_PORT` 환경변수로 변경할 수 있게 한다.
  이유: Vite(5173), Storybook(6006)과 충돌하지 않는 고정값이 안내와 문서화에 단순하다.
  결정자: REDSTONE
  영향: 기동 안내 문서와 self-test가 기본 포트 5180을 기준으로 작성된다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-030-harness-ui-app-shell.feature`

### 요건 Skeleton 설계 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 5개 Scenario가 카드 수용 기준 7개를 `Covers:`로 연결한다. localhost 제한은 `(STATIC)`, 내비와 scope/산출물 상태는 `(UI)`로 검증한다.
  UI Skeleton: `AppShell` route wrapper와 `src/lib/harness-data`의 scope별 산출물 summary DTO를 기준으로 구현한다. 파일 watch와 cache 무효화는 shell provider에서 한 번만 처리하고, 개별 화면은 선택 scope의 화면 모델만 받는다.
  Storybook 계약: `Harness/Shell/AppShell`의 `DefaultArtifacts`, `MissingArtifacts`, `StaleArtifacts`, `ScopeSwitch` 상태가 있어야 한다.
  서버 Skeleton: `npm run harness:ui`는 loopback 주소에만 bind하고 기본 포트 5180을 사용한다. `HARNESS_UI_PORT`는 포트만 바꾸며 외부 bind 주소를 열지 않는다.
  추적 정책: `(UI)` AC는 harness/ui Storybook Vitest 결과로 판정한다. `(STATIC)` localhost 제한은 하네스 self-test 또는 서버 단위 검증으로 판정한다.
  검증: Skeleton 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-030`로 카드/시나리오/용어 정합성을 확인한다.
  Skeleton 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-10
  리뷰자: REDSTONE
  확인: Skeleton 검토중 단계. UI Skeleton과 Storybook surface를 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

## 열린 질문

- 없음
