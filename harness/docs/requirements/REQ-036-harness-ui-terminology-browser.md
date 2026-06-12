# 요건 카드

요건 ID: REQ-036
제목: 하네스 UI 표준 용어 조회
우선순위: 중간
상태: Skeleton 검토중
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: mixed
관련 요건: REQ-029, REQ-030, REQ-032
대체 요건: 없음

## 사용자/목적

하네스 작업자는 요건 카드와 시나리오를 작성하기 전에 하네스 UI에서 전체 표준 용어 목록을 조회하고 검색해, 이미 합의된 term key와 표현을 빠르게 확인할 수 있어야 한다.

## 범위

- AppShell 좌측 LNB는 표준 용어 화면으로 이동하는 메뉴를 제공한다.
- 표준 용어 화면은 선택한 scope의 `terminology.index.json`에 있는 전체 term key 목록을 기본으로 표시한다.
- 목록 항목은 term key, 승인 상태, 한국어 이름, 영어 이름, 의미, source file을 표시한다.
- 검색은 term key, 한국어 이름, 영어 이름, 의미, 허용 표현, 금지 표현, 코드 이름을 대상으로 한다.
- 도메인과 승인 상태로 표준 용어 목록을 좁힐 수 있다.
- 표준 용어를 선택하면 의미, 허용 표현, 금지 표현, 코드 이름, note, reason을 확인할 수 있다.
- 표준 용어 화면은 용어 사전 파일을 직접 읽지 않고 UI 서버가 제공하는 산출물 기반 DTO를 사용한다.

## 표준 용어

- ui.appShell
- harness.standardTerm
- harness.scope
- harness.validationArtifact

## 제외 범위

- 표준 용어 생성·수정·삭제. 조회 전용이다.
- `draft.json` 직접 편집 또는 draft 승격 워크플로우.
- CLI `terminology search`의 정규화 알고리즘을 UI에서 완전히 재구현하는 것. MVP 검색은 산출물 DTO의 문자열 필드 검색으로 제한한다.
- 표준 용어가 연결된 모든 요건/코드 참조의 역추적 그래프 표시. 후속 요건에서 다룬다.

## 수용 기준

- (UI) AppShell 좌측 LNB에서 표준 용어 화면으로 이동할 수 있다
- (UI) 표준 용어 화면은 전체 term key 목록을 승인 상태, 한국어 이름, 영어 이름, 의미, source file과 함께 표시한다
- (UI) term key, 한국어 이름, 영어 이름, 의미, 허용 표현, 금지 표현, 코드 이름으로 표준 용어 목록을 검색할 수 있다
- (UI) 도메인과 승인 상태로 표준 용어 목록을 좁힐 수 있다
- (UI) 표준 용어를 선택하면 의미, 허용 표현, 금지 표현, 코드 이름, note, reason을 확인할 수 있다
- (STATIC) 하네스 UI 서버가 제공하는 표준 용어 데이터는 `terminology.index.json`의 term key, status, sourceFile, meaning, allow, ban, names 값을 보존한다

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

- 화면 표면: `harness/ui/src/features/terminology/TerminologyBrowserPage.tsx`를 `/terminology` route에 두고, `AppShell` 좌측 LNB에 표준 용어 메뉴를 추가한다.
- 주요 영역: 표준 용어 요약, 검색 입력, 도메인 필터, 승인 상태 필터, 표준 용어 목록, 선택한 표준 용어 상세, 빈 결과 안내를 둔다.
- 표시 필드: term key, domain, status, 한국어 이름, 영어 이름, meaning, allow, ban, names, note, reason, sourceFile, scope, 산출물 생성 시각을 표시한다.
- 상태 목록: 전체 목록, 검색 결과, 도메인 필터, 승인 상태 필터, 선택 상세, 빈 결과, 산출물 없음, 조회 실패를 검토 상태로 둔다.
- 사용자 행위: AppShell 좌측 LNB로 `/terminology`에 진입하고, 검색어와 필터를 바꾸고, 목록 항목을 선택해 상세를 확인한다. 표준 용어 편집 액션은 제공하지 않는다.

## Storybook 계약

- Harness/Terminology/TerminologyBrowser: AllTerms, SearchResults, FilteredByDomain, FilteredByStatus, TermDetail, EmptyResult

## 의사결정 로그

- 결정일: 2026-06-12
  결정: 표준 용어 조회 화면은 `terminology.index.json`을 UI 서버 DTO로 정리한 값을 표시하고 용어 사전 원본 파일을 직접 읽지 않는다.
  이유: 하네스 UI는 생성 산출물을 표시하는 관제 화면이며, 원본 문서와 산출물의 신선도 판단은 AppShell이 담당한다.
  결정자: REDSTONE
  영향: 데이터 보존은 STATIC 수용 기준으로 검증하고, 용어 편집과 draft 승격은 후속 요건으로 분리한다.

- 결정일: 2026-06-12
  결정: AppShell 좌측 LNB에 표준 용어 메뉴와 `/terminology` route를 추가한다.
  이유: 요건 작성 중 term key를 찾는 흐름은 모든 화면에서 접근 가능한 전역 조회 도구여야 한다.
  결정자: REDSTONE
  영향: REQ-030 AppShell 내비 계약과 하네스 UI 표준의 route 목록을 함께 갱신한다.

## BDD 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-036-harness-ui-terminology-browser.feature`

### 요건 Skeleton 설계 이력

- 설계일: 2026-06-12
  검증 설계: `.feature`의 6개 Scenario가 카드 수용 기준 6개를 1:1 `Covers:`로 연결한다. 메뉴 진입, 목록, 검색, 필터, 상세는 `(UI)`, 산출물 DTO 값 보존은 `(STATIC)`으로 검증한다.
  UI Skeleton: `/terminology` route는 `src/lib/harness-data`의 terminology browser view model을 받아 표준 용어 목록과 상세를 만든다. React 컴포넌트는 `terminology.index.json` 원형을 직접 순회하지 않는다.
  Storybook 계약: `Harness/Terminology/TerminologyBrowser`의 `AllTerms`, `SearchResults`, `FilteredByDomain`, `FilteredByStatus`, `TermDetail`, `EmptyResult` 상태가 있어야 한다.
  서버 Skeleton: terminology DTO는 선택한 scope의 `build/{scope}/indexes/terminology.index.json`에서 term key, status, sourceFile, meaning, allow, ban, names 값을 보존해 제공한다. 검색/필터는 화면 모델 필드 기준으로 수행한다.
  추적 정책: `(UI)` AC는 harness/ui Storybook Vitest 결과로 판정한다. `(STATIC)` AC는 DTO fixture 또는 서버 self-test로 산출물 값 보존을 검증한다.
  검증: Skeleton 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-036`로 카드/시나리오/용어 정합성을 확인한다.
  Skeleton 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-12
  리뷰자: REDSTONE
  확인: Skeleton 검토중 단계. UI Skeleton과 Storybook surface를 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

## 열린 질문

- 없음
