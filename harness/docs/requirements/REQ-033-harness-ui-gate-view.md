# 요건 카드

요건 ID: REQ-033
제목: 하네스 UI 게이트 현황 조회
우선순위: 중간
상태: Skeleton 검토중
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: mixed
관련 요건: REQ-010, REQ-029, REQ-030
대체 요건: 없음

## 사용자/목적

하네스 작업자는 scope 게이트가 어떤 카테고리에서 막히는지와 그 근거가 된 검사 결과를 화면에서 확인하고, 고칠 파일 위치로 바로 이동할 수 있어야 한다.

## 범위

- 게이트 화면은 8개 카테고리(TRACE, CARD, REF, TRC, BE, FE, SCN, TRM)별 차단 여부와 검사 결과 수를 표시한다.
- 검사 결과 목록은 규칙, 심각도, 요건, 파일 경로로 좁힐 수 있다.
- 각 검사 결과는 메시지와 위치를 표시하고, 근거와 권고 조치를 펼쳐 볼 수 있다.
- 카테고리 차단 판정은 통합 하네스 게이트 도구의 판정을 그대로 사용한다.

## 표준 용어

- harness.scope
- harness.unifiedGate
- harness.finding

## 제외 범위

- 게이트 판정 로직 변경이나 새 카테고리 추가.
- 검사 결과의 일괄 무시·승인 같은 상태 변경 액션.

## 수용 기준

- (UI) 게이트 화면은 8개 카테고리별 차단 여부와 검사 결과 수를 표시한다
- (UI) 검사 결과 목록은 규칙, 심각도, 요건, 파일 경로로 좁힐 수 있다
- (UI) 각 검사 결과는 메시지와 파일 위치를 표시하고 근거와 권고 조치를 펼쳐 볼 수 있다
- (STATIC) 게이트 화면의 카테고리 차단 판정은 통합 하네스 게이트 도구의 판정과 일치한다

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

- 화면 표면: `harness/ui/src/features/gates/GateViewPage.tsx`를 `/gate` route에 둔다.
- 주요 영역: 8개 게이트 카테고리 요약, 검사 결과 필터, 검사 결과 목록, 펼친 finding 상세를 둔다.
- 표시 필드: 카테고리(TRACE, CARD, REF, TRC, BE, FE, SCN, TRM), 차단 여부, 검사 결과 수, 규칙, 심각도, 요건, 파일 경로, 메시지, 근거, 권고 조치를 표시한다.
- 상태 목록: 게이트 통과, 카테고리 차단, finding 상세 펼침, 필터 적용을 검토 상태로 둔다.
- 사용자 행위: 규칙, 심각도, 요건, 파일 경로로 검사 결과를 좁히고, finding을 펼쳐 근거와 권고 조치를 확인한다.

## Storybook 계약

- Harness/Gates/GateView: Passing, CategoryBlocked, FindingExpanded, Filtered

## 의사결정 로그

- 결정일: 2026-06-10
  결정: 게이트 화면의 차단 판정은 화면이나 UI 서버가 분류 규칙을 복제하지 않고 통합 하네스 게이트 도구의 판정 결과를 그대로 사용한다.
  이유: 카테고리 매핑 규칙이 두 곳에 있으면 게이트와 화면이 다른 답을 줄 수 있다 (REQ-010 단일 게이트 원칙).
  결정자: REDSTONE
  영향: 게이트 판정을 머신이 읽을 수 있게 노출하는 방식이 Skeleton 단계의 설계 대상이 된다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-033-harness-ui-gate-view.feature`

### 요건 Skeleton 설계 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 4개 Scenario가 카드 수용 기준 4개를 1:1 `Covers:`로 연결한다. 카테고리/목록/펼침/필터는 `(UI)`, 통합 게이트 도구 판정 보존은 `(STATIC)`으로 검증한다.
  UI Skeleton: `/gate` route는 gate summary와 findings view model을 받아 카테고리 요약과 검사 결과 목록을 구성한다. 화면은 카테고리 차단 판정을 다시 계산하지 않는다.
  Storybook 계약: `Harness/Gates/GateView`의 `Passing`, `CategoryBlocked`, `FindingExpanded`, `Filtered` 상태가 있어야 한다.
  검사기 Skeleton: 통합 게이트 도구의 카테고리 판정을 UI가 읽을 수 있도록 `gate.report.json` 또는 동등한 machine-readable DTO를 만든다. DTO에는 8개 카테고리의 차단 여부, error 수, ruleId별 수량, 관련 finding 참조가 포함되어야 한다.
  추적 정책: `(UI)` AC는 harness/ui Playwright FE BDD 결과로 판정한다. `(STATIC)` AC는 gate summary DTO가 `gate.mjs`의 CATEGORY_ORDER와 finding 집계를 그대로 반영하는 self-test로 판정한다.
  검증: Skeleton 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-033`로 카드/시나리오/용어 정합성을 확인한다.
  Skeleton 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-10
  리뷰자: REDSTONE
  확인: Skeleton 검토중 단계. UI Skeleton과 Storybook surface를 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

## 열린 질문

- 없음
