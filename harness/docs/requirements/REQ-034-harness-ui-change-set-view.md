# 요건 카드

요건 ID: REQ-034
제목: 하네스 UI Change Set 진행 조회
우선순위: 중간
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: acceptance
관련 요건: REQ-029, REQ-030, REQ-032, REQ-037
대체 요건: 없음

## 사용자/목적

하네스 작업자는 진행 중인 Change Set과 그 영향 요건들의 추적 상태를 한 화면에서 확인해, 사용자 요청 단위 작업이 어디까지 왔는지 파악할 수 있어야 한다.

## 범위

- Change Set 목록은 제목, 상태, 요청일, 영향 요건 수, 열린 논의 수를 표시한다.
- Change Set 목록은 제목, 상태, 선택한 영향 요건으로 필터링할 수 있다. 영향 요건 필터는 선택된 요건 ID만 한 줄로 표시하고 돋보기 아이콘으로 검색/선택 대화상자를 연다.
- Change Set 카드를 펼치면 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의, 영향 요건과 각 영향 요건의 추적 상태를 확인할 수 있다.
- 영향 요건에서 해당 요건의 상세 화면으로 이동할 수 있다.

## 표준 용어

- harness.changeSet
- harness.traceState
- harness.validationCommand

## 제외 범위

- Change Set 문서 생성·편집. 조회 전용이다.
- Change Set 완료 여부의 자동 판정. 영향 요건 추적 상태는 참고 정보로만 표시한다.

## 수용 기준

- (UI) Change Set 목록은 제목, 상태, 요청일, 영향 요건 수, 열린 논의 수를 표시한다
- (UI) Change Set 목록은 제목, 상태, 선택한 영향 요건으로 필터링할 수 있고 선택된 영향 요건 필터는 요건 ID만 표시하며 돋보기 아이콘으로 검색/선택 대화상자를 연다
- (UI) Change Set 카드를 펼치면 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의, 영향 요건과 영향 요건의 추적 상태를 확인할 수 있다
- (UI) 영향 요건에서 해당 요건의 상세 화면으로 이동할 수 있다

## 의사결정 로그

- 결정일: 2026-06-10
  결정: Change Set 화면은 Change Set 리포트 산출물을 표시하고 완료 여부를 자체 판정하지 않는다.
  이유: Change Set은 게이트 입력이 아니라 진행 상태 리포트라는 기존 계약을 따른다.
  결정자: REDSTONE
  영향: 표시 항목은 Change Set 리포트와 인덱스 산출물 스키마를 따른다.

- 결정일: 2026-06-12
  결정: Change Set 상세는 대화상자가 아니라 목록형 카드 내부 펼침으로 제공한다.
  이유: Change Set은 비교와 진행 조회가 핵심인 정보성 화면이다. 대화상자는 목록 맥락을 가리고 여러 Change Set을 훑기 어렵기 때문에, 카드 내부 펼침이 제목, 상태, 영향 요건과 상세를 같은 맥락에서 읽기에 적합하다.
  결정자: REDSTONE
  영향: `/change-sets` 화면은 마스터/디테일 패널 대신 카드 목록과 펼침 상세를 사용한다.

- 결정일: 2026-06-12
  결정: 영향 요건 ID, 제목, 추적 상태는 Change Set 카드 요약이 아니라 펼침 상세에만 표시한다.
  이유: 카드 요약에 영향 요건을 모두 노출하면 목록 스캔 밀도가 낮아지고, 상세 검토가 필요한 정보와 요약 정보가 섞인다.
  결정자: REDSTONE
  영향: 카드 요약은 영향 요건 수만 표시하고, 개별 영향 요건과 추적 상태 뱃지는 펼침 상세의 영향 요건 목록에서 제공한다.

- 결정일: 2026-06-12
  결정: Change Set 목록에는 제목 검색, 상태 필터, 영향 요건 필터를 제공한다.
  이유: 진행 중인 작업이 늘어나면 작업 제목이나 관련 요건을 기준으로 빠르게 좁혀 보는 흐름이 필요하다.
  결정자: REDSTONE
  영향: `/change-sets` 화면은 필터 적용 결과 수와 빈 결과 상태를 표시한다.

- 결정일: 2026-06-12
  결정: Change Set 영향 요건 필터는 REQ-037 요건 검색/선택 대화상자가 반환한 단일 요건을 사용한다.
  이유: Change Set 화면은 필터 적용 결과를 소유하고, 요건 후보 표시·검색·선택·해제의 공통 UI 계약은 별도 공용 요건에서 관리해야 한다.
  결정자: REDSTONE
  영향: `/change-sets` 화면은 선택된 영향 요건으로 목록을 좁히고, 필터 영역에는 선택된 요건 ID만 표시하며, 검색/선택은 돋보기 아이콘으로 여는 REQ-037 대화상자에 위임한다.

## 수용 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-034-harness-ui-change-set-view.feature`

### 요건 설계 승인 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 4개 Scenario가 카드 수용 기준 4개를 1:1 `Covers:`로 연결한다. 모든 AC는 사용자가 관찰하는 Change Set 조회 결과이므로 `(UI)`로 검증한다.
  UI 설계: `/change-sets` route는 `change-sets.index.json`, `change-set-report.json`, `trace.state.json`을 결합한 view model을 사용한다. 화면은 Change Set을 목록형 카드로 보여주고, 상세는 카드 내부 펼침으로 제공한다. 카드 요약에는 영향 요건 수만 표시하고, 개별 영향 요건과 추적 상태는 펼침 상세에 둔다. 목록은 제목, 상태, 선택한 영향 요건으로 필터링할 수 있다. 영향 요건 필터는 선택된 ID만 표시하고 돋보기 아이콘으로 REQ-037 대화상자를 호출한다. Change Set 완료 여부를 화면이나 서버가 자체 판정하지 않는다.
  UI 설계 검토 표면: `Harness/ChangeSets/ChangeSetView`의 `List`, `Detail`, `LinkedRequirements`, `FilteredByTitle`, `FilteredByStatus`, `FilteredByAffectedRequirement`, `EmptyResult`, `EmptyAffectedRequirements`, `OpenDiscussions` 상태가 있어야 한다.
  서버 설계: 영향 요건의 추적 상태는 trace state의 값만 붙인다. 영향 요건이 현재 scope에 없으면 상태 확인 불가로 표시하고 상세 이동은 비활성화한다.
  추적 정책: `(UI)` AC는 harness/ui Storybook Vitest 결과로 판정한다.
  검증: 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-034`로 카드/시나리오/용어 정합성을 확인한다.
  설계 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-10
  리뷰자: REDSTONE
  확인: 설계 검토중 단계. UI 설계와 UI 설계 검토 표면을 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

- 리뷰일: 2026-06-17
  리뷰자: REDSTONE
  확인: `harness/ui/src/features/change-sets/ChangeSetView.stories.tsx`의 Storybook Vitest play 검증이 Change Set 목록 요약, 카드 펼침 상세의 요청 요약/작업 범위/완료 조건/검증 명령/열린 논의/영향 요건 추적 상태, 제목·상태·영향 요건 필터와 요건 검색 대화상자 호출, 영향 요건 상세 route 이동을 확인한다. `npm run test:storybook`과 `npm run harness:trace -- --requirement REQ-034`가 통과했고 REQ-034 trace state는 GREEN이다.
  결과: 승인

- 리뷰일: 2026-06-18
  리뷰자: REDSTONE
  확인: `FilteredByAffectedRequirement` play를 사전 주입이 아니라 돋보기 대화상자에서 요건을 선택해 목록이 좁혀지고 필터 칩에 요건 ID만 남는 흐름으로 보강하고, `Detail`의 영향 요건 추적 상태를 REQ-010 행에 고정해 검증한다.
  결과: 승인

## 열린 질문

- 없음
