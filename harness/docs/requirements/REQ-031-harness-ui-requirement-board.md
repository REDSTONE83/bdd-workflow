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

- 요건 보드는 선택한 scope의 추적 산출물에 있는 모든 요건을 목록형 카드로 표시한다.
- 목록형 카드의 각 항목은 요건 ID, 제목, 카드 상태, 제품 영역, 우선순위, 명세 역할, 상위 요건 ID, 하위 요건 수를 한 줄에 표시하고, 카드 상태, 제품 영역, 우선순위는 제목 바로 오른쪽에 접두 문자 없는 종류별 색상의 작은 뱃지로 표시하며, 추적 상태 뱃지는 우측 끝에 배치한다.
- 하위 요건 카드는 좌측 들여쓰기와 세로선으로 하위 관계를 시각적으로 구분한다.
- 보드 상단에 추적 상태별 요건 수 요약을 표시한다.
- 제목 검색어, 추적 상태, 카드 상태, 제품 영역으로 목록을 좁힐 수 있고 필터 상태는 URL query에 반영된다.
- 목록에서 요건 ID를 선택하면 현재 필터 query를 유지한 채 해당 요건의 상세 화면 route로 이동한다.

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

- (UI) 요건 보드는 선택한 scope의 모든 요건을 요건 ID, 제목, 카드 상태, 제품 영역, 우선순위, 명세 역할, 상위 요건 ID, 하위 요건 수가 한 줄에 있고 추적 상태 뱃지가 우측 끝에 있는 목록형 카드로 표시하며, 카드 상태, 제품 영역, 우선순위는 제목 바로 오른쪽에 접두 문자 없는 종류별 색상의 작은 뱃지로 표시한다
- (UI) 하위 요건 카드는 좌측 들여쓰기와 세로선으로 하위 관계가 구분된다
- (UI) 보드 상단에 추적 상태별 요건 수 요약이 표시된다
- (UI) 제목 검색어, 추적 상태, 카드 상태, 제품 영역으로 목록을 좁힐 수 있고 필터 상태는 URL query에 반영된다
- (UI) 목록에서 요건 ID를 선택하면 현재 필터 query를 유지한 채 그 요건의 상세 화면 route로 이동한다
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
- 주요 영역: 추적 상태별 요약, 제목 검색과 상태 필터 막대, 요건 목록형 카드, 빈 결과 안내, 요건 ID 상세 이동 진입점을 둔다.
- 표시 필드: 요건 ID, 제목, 카드 상태, 제품 영역, 우선순위, 명세 역할, 상위 요건 ID, 하위 요건 수는 한 줄에 표시하고 긴 제목은 말줄임 처리한다. 카드 상태, 제품 영역, 우선순위는 제목 바로 오른쪽에 접두 문자 없이 값만 담은 종류별 색상의 작은 뱃지로 표시한다. 추적 상태 뱃지는 카드 우측 끝에 둔다. scope와 산출물 생성 시각은 보드 항목에 반복 노출하지 않고 앱셸/산출물 상태에서 다룬다.
- 구조 표시: 별도 구조 열을 두지 않고 카드 머리의 역할/상위/하위 뱃지와 하위 카드의 좌측 들여쓰기·세로선으로 표시한다. 전체 관련 요건 목록은 상세 화면에서 확인한다.
- 상태 목록: 전체 목록, 상위/하위 요건 구조, 제목 검색 필터 적용, 상태 필터 적용, 빈 결과, RED/GREEN/BLUE/INACTIVE 요약을 검토 상태로 둔다.
- 사용자 행위: 제목 검색어를 입력하거나 추적 상태, 카드 상태, 제품 영역 필터를 바꾸면 URL query가 갱신된다. 목록 카드의 요건 ID를 선택하면 현재 query를 유지한 `/requirements/:requirementId`로 이동한다. 정렬과 페이징은 MVP 범위에 넣지 않는다.

## Storybook 계약

- Harness/Requirements/RequirementBoard: AllRequirements, Hierarchy, Filtered, FilteredByTitle, EmptyResult, StateSummary, DetailNavigation

## 의사결정 로그

- 결정일: 2026-06-10
  결정: 보드의 추적 상태는 추적 산출물(trace state)의 판정 값을 그대로 표시하고 화면이나 서버가 재계산하지 않는다.
  이유: REQ-010 단일 게이트 원칙. 판정이 둘이 되면 CLI와 UI가 다른 답을 줄 수 있다.
  결정자: REDSTONE
  영향: 산출물이 없거나 오래된 경우의 안내는 REQ-030 앱셸의 신선도 표시가 담당한다.

- 결정일: 2026-06-12
  결정: 요건 보드는 표가 아니라 목록형 카드로 표시하고, 계층 정보는 명세 역할, 상위 요건 ID, 하위 요건 수로 축약한다.
  이유: 상위/하위 관계는 작업 영향 범위 판단에 필요하지만, 전체 관련 요건 목록을 보드에 펼치면 목록 스캔성이 떨어진다.
  결정자: REDSTONE
  영향: 하위 요건은 좌측 들여쓰기와 세로선으로 구분하고, 상세한 관련 요건 검토는 요건 상세 화면이 담당한다.

- 결정일: 2026-06-12
  결정: 요건 보드 목록 카드는 요건 ID와 제목을 한 줄에 두고 추적 상태 뱃지를 우측 끝에 배치하는 밀도 높은 형식으로 표시한다.
  이유: 요건 수가 많을 때 카드 높이가 커지면 보드의 스캔성과 비교성이 떨어진다.
  결정자: REDSTONE
  영향: 카드 상태, 제품 영역, 우선순위는 제목 바로 오른쪽에 접두 문자 없는 종류별 색상의 작은 뱃지로 유지하고, 긴 제목은 한 줄 말줄임으로 처리한다. 보드 카드 높이는 보조 줄 없이 한 줄 기준으로 맞춘다.

- 결정일: 2026-06-12
  결정: 요건 보드 필터는 URL query로 보존하고 상세 이동 시 query를 유지한다.
  이유: 상세를 확인한 뒤 목록으로 돌아올 때 사용자가 좁혀 둔 작업 맥락이 사라지면 탐색 비용이 커진다.
  결정자: REDSTONE
  영향: 상세 화면의 목록 복귀 링크는 상세 route의 query를 유지한 `/requirements`로 이동한다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-031-harness-ui-requirement-board.feature`

### 요건 Skeleton 설계 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 4개 Scenario가 카드 수용 기준 6개를 `Covers:`로 연결한다. 목록/요약/필터/상세 이동은 `(UI)`, 추적 산출물 값 보존은 `(STATIC)`으로 검증한다.
  UI Skeleton: `/requirements` route는 `src/lib/harness-data`의 requirement board view model을 받아 목록 행을 만든다. React 컴포넌트는 `trace.state.json` 원형을 직접 순회하지 않는다.
  Storybook 계약: `Harness/Requirements/RequirementBoard`의 `AllRequirements`, `Hierarchy`, `Filtered`, `FilteredByTitle`, `EmptyResult`, `StateSummary`, `DetailNavigation` 상태가 있어야 한다.
  서버 Skeleton: 요건 목록 DTO는 추적 산출물의 판정 값과 카드 인덱스의 제목/상태/제품 영역/우선순위/명세 역할/상위 요건 ID/하위 요건 수를 결합하되, RED/GREEN/BLUE를 새로 계산하지 않는다.
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
