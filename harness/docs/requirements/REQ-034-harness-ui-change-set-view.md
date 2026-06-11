# 요건 카드

요건 ID: REQ-034
제목: 하네스 UI Change Set 진행 조회
우선순위: 중간
상태: Skeleton 검토중
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: acceptance
관련 요건: REQ-029, REQ-030, REQ-032
대체 요건: 없음

## 사용자/목적

하네스 작업자는 진행 중인 Change Set과 그 영향 요건들의 추적 상태를 한 화면에서 확인해, 사용자 요청 단위 작업이 어디까지 왔는지 파악할 수 있어야 한다.

## 범위

- Change Set 목록은 제목, 상태, 요청일, 영향 요건과 각 영향 요건의 추적 상태를 표시한다.
- Change Set을 선택하면 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의를 확인할 수 있다.
- 영향 요건에서 해당 요건의 상세 화면으로 이동할 수 있다.

## 표준 용어

- harness.changeSet
- harness.traceState
- harness.validationCommand

## 제외 범위

- Change Set 문서 생성·편집. 조회 전용이다.
- Change Set 완료 여부의 자동 판정. 영향 요건 추적 상태는 참고 정보로만 표시한다.

## 수용 기준

- (UI) Change Set 목록은 제목, 상태, 요청일, 영향 요건과 영향 요건의 추적 상태를 표시한다
- (UI) Change Set을 선택하면 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의를 확인할 수 있다
- (UI) 영향 요건에서 해당 요건의 상세 화면으로 이동할 수 있다

## 검증 대상

- API: 불필요
- DB: 불필요
- UI: 필요
- Storybook: 필요
- E2E: 불필요
- STATIC: 불필요

## API Skeleton

- 해당 없음

## DB Skeleton

- 해당 없음

## UI Skeleton

- 화면 표면: `harness/ui/src/features/change-sets/ChangeSetViewPage.tsx`를 `/change-sets` route에 둔다.
- 주요 영역: Change Set 목록, 선택한 Change Set 상세, 영향 요건 목록, 영향 요건 상세 이동 진입점을 둔다.
- 표시 필드: Change Set 제목, 상태, 요청일, 영향 요건, 영향 요건의 추적 상태, 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의를 표시한다.
- 상태 목록: 목록, 상세 선택, 영향 요건 추적 상태 표시, 영향 요건 없음, 열린 논의 있음을 검토 상태로 둔다.
- 사용자 행위: Change Set을 선택하고, 영향 요건을 선택해 `/requirements/:requirementId`로 이동한다. Change Set 문서 생성/편집은 제공하지 않는다.

## Storybook 계약

- Harness/ChangeSets/ChangeSetView: List, Detail, LinkedRequirements, OpenDiscussions

## 의사결정 로그

- 결정일: 2026-06-10
  결정: Change Set 화면은 Change Set 리포트 산출물을 표시하고 완료 여부를 자체 판정하지 않는다.
  이유: Change Set은 게이트 입력이 아니라 진행 상태 리포트라는 기존 계약을 따른다.
  결정자: REDSTONE
  영향: 표시 항목은 Change Set 리포트와 인덱스 산출물 스키마를 따른다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-034-harness-ui-change-set-view.feature`

### 요건 Skeleton 설계 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 3개 Scenario가 카드 수용 기준 3개를 1:1 `Covers:`로 연결한다. 모든 AC는 사용자가 관찰하는 Change Set 조회 결과이므로 `(UI)`로 검증한다.
  UI Skeleton: `/change-sets` route는 `change-sets.index.json`, `change-set-report.json`, `trace.state.json`을 결합한 view model을 사용한다. Change Set 완료 여부를 화면이나 서버가 자체 판정하지 않는다.
  Storybook 계약: `Harness/ChangeSets/ChangeSetView`의 `List`, `Detail`, `LinkedRequirements`, `OpenDiscussions` 상태가 있어야 한다.
  서버 Skeleton: 영향 요건의 추적 상태는 trace state의 값만 붙인다. 영향 요건이 현재 scope에 없으면 상태 확인 불가로 표시하고 상세 이동은 비활성화한다.
  추적 정책: `(UI)` AC는 harness/ui Playwright FE BDD 결과로 판정한다.
  검증: Skeleton 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-034`로 카드/시나리오/용어 정합성을 확인한다.
  Skeleton 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-10
  리뷰자: REDSTONE
  확인: Skeleton 검토중 단계. UI Skeleton과 Storybook surface를 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

## 열린 질문

- 없음
