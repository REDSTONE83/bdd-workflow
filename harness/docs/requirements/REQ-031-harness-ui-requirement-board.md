# 요건 카드

요건 ID: REQ-031
제목: 하네스 UI 요건 추적 보드
우선순위: 높음
상태: Skeleton 검토중
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: mixed
관련 요건: REQ-029, REQ-030
대체 요건: 없음

## 사용자/목적

하네스 작업자는 선택한 scope의 모든 요건이 어떤 추적 상태(RED/GREEN/BLUE/INACTIVE)와 카드 상태에 있는지 한 화면에서 파악하고, 작업할 요건을 골라 상세로 들어갈 수 있어야 한다.

## 범위

- 요건 보드는 선택한 scope의 추적 산출물에 있는 모든 요건을 표시한다.
- 목록의 각 항목은 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위를 표시한다.
- 보드 상단에 추적 상태별 요건 수 요약을 표시한다.
- 추적 상태, 카드 상태, 제품 영역으로 목록을 좁힐 수 있다.
- 목록에서 요건을 선택하면 해당 요건의 상세 화면으로 이동한다.

## 표준 용어

- harness.requirementCard
- harness.scope
- harness.validationArtifact
- harness.traceState

## 제외 범위

- 요건 카드 본문 편집. 조회 전용이다.
- 추적 상태 재계산. 추적 산출물의 판정 값을 그대로 표시한다.
- 시간 흐름에 따른 상태 변화 이력 표시.

## 수용 기준

- (UI) 요건 보드는 선택한 scope의 모든 요건을 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위와 함께 목록으로 표시한다
- (UI) 보드 상단에 추적 상태별 요건 수 요약이 표시된다
- (UI) 추적 상태, 카드 상태, 제품 영역으로 목록을 좁힐 수 있다
- (UI) 목록에서 요건을 선택하면 그 요건의 상세 화면으로 이동한다
- (STATIC) 하네스 UI 서버가 제공하는 요건 추적 데이터는 추적 산출물의 판정 값과 일치한다

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

- 화면 표면: `harness/ui/src/features/requirements/RequirementBoardPage.tsx`를 `/requirements` route에 둔다.
- 주요 영역: 추적 상태별 요약, 필터 막대, 요건 목록, 빈 결과 안내, 선택 요건 상세 이동 진입점을 둔다.
- 표시 필드: 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위, scope, 산출물 생성 시각을 표시한다.
- 상태 목록: 전체 목록, 필터 적용, 빈 결과, RED/GREEN/BLUE/INACTIVE 요약을 검토 상태로 둔다.
- 사용자 행위: 추적 상태, 카드 상태, 제품 영역 필터를 바꾸고, 목록 항목을 선택해 `/requirements/:requirementId`로 이동한다. 정렬과 페이징은 MVP 범위에 넣지 않는다.

## Storybook 계약

- Harness/Requirements/RequirementBoard: AllRequirements, Filtered, EmptyResult, StateSummary

## 의사결정 로그

- 결정일: 2026-06-10
  결정: 보드의 추적 상태는 추적 산출물(trace state)의 판정 값을 그대로 표시하고 화면이나 서버가 재계산하지 않는다.
  이유: REQ-010 단일 게이트 원칙. 판정이 둘이 되면 CLI와 UI가 다른 답을 줄 수 있다.
  결정자: REDSTONE
  영향: 산출물이 없거나 오래된 경우의 안내는 REQ-030 앱셸의 신선도 표시가 담당한다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-031-harness-ui-requirement-board.feature`

### 요건 Skeleton 설계 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 5개 Scenario가 카드 수용 기준 5개를 1:1 `Covers:`로 연결한다. 목록/요약/필터/상세 이동은 `(UI)`, 추적 산출물 값 보존은 `(STATIC)`으로 검증한다.
  UI Skeleton: `/requirements` route는 `src/lib/harness-data`의 requirement board view model을 받아 목록 행을 만든다. React 컴포넌트는 `trace.state.json` 원형을 직접 순회하지 않는다.
  Storybook 계약: `Harness/Requirements/RequirementBoard`의 `AllRequirements`, `Filtered`, `EmptyResult`, `StateSummary` 상태가 있어야 한다.
  서버 Skeleton: 요건 목록 DTO는 추적 산출물의 판정 값과 카드 인덱스의 제목/상태/제품 영역/우선순위를 결합하되, RED/GREEN/BLUE를 새로 계산하지 않는다.
  추적 정책: `(UI)` AC는 harness/ui Playwright FE BDD 결과로 판정한다. `(STATIC)` AC는 DTO가 trace state 값을 그대로 노출하는 self-test로 판정한다.
  검증: Skeleton 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-031`로 카드/시나리오/용어 정합성을 확인한다.
  Skeleton 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-10
  리뷰자: REDSTONE
  확인: Skeleton 검토중 단계. UI Skeleton과 Storybook surface를 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

## 열린 질문

- 없음
