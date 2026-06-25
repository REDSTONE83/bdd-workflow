# 요건 카드

요건 ID: REQ-039
제목: 하네스 UI 테스트 결과 조회
우선순위: 중간
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: mixed
관련 요건: REQ-029, REQ-030, REQ-033, REQ-035
대체 요건: 없음

## 사용자/목적

하네스 작업자는 선택한 범위의 테스트 정의와 최근 수행 결과를 하네스 UI의 별도 메뉴에서 확인해, 어떤 테스트가 실행됐고 어떤 테스트가 미실행 또는 실패 상태인지 빠르게 파악할 수 있어야 한다.

## 범위

- AppShell 좌측 LNB는 테스트 결과 화면으로 이동하는 메뉴를 제공한다.
- 테스트 결과 화면은 선택한 scope의 테스트 총수와 PASS, FAIL, SKIP, NOT_RUN 수를 요약한다.
- 테스트 결과 화면은 backend source index, front-end source index, harness self-test index의 테스트 정의와 test-results index의 수행 결과를 합쳐 테스트 목록을 표시한다.
- 각 테스트 행은 테스트 구분(API, UI, UNIT, E2E 등), 런타임, 수행 상태, 연결 요건 ID와 제목, 구현 위치, Cover 문구와 연결된 요건 ID와 제목을 표시한다. source index 정의가 없는 result-only 행은 결과 파일 위치 대신 구현 위치 없음으로 표시한다.
- 결과 XML/JSON 파일 위치는 테스트 카드에 표시하지 않는다.
- API 테스트의 구현 위치와 연결 요건은 백엔드 테스트 source index의 테스트 코드 위치와 요건을 기준으로 표시한다.
- 검색어, 테스트 구분, 런타임, 수행 상태로 테스트 목록을 좁힐 수 있다.
- test-results index에 freshness 이슈가 있으면 목록 위에 이슈 목록을 표시한다.
- 화면과 UI 서버는 테스트 수행 상태를 새로 판정하지 않고 test-results index의 상태 값을 그대로 표시한다.

## 표준 용어

- harness.scope
- harness.validationArtifact
- harness.validationChannel

## 제외 범위

- 테스트 실행 액션. 실행은 기존 실행 화면과 검증 명령이 담당한다.
- 테스트 결과 파일 생성·수정·삭제.
- 테스트 성공/실패 판정 재계산.
- 시간순 실행 이력 또는 추세 분석.

## 수용 기준

- (UI) AppShell 좌측 LNB에서 테스트 결과 화면으로 이동할 수 있다
- (UI) 테스트 결과 화면은 선택한 scope의 테스트 총수와 PASS, FAIL, SKIP, NOT_RUN 수를 요약하고 테스트 목록을 표시한다
- (UI) 각 테스트 행은 테스트 구분, 런타임, 수행 상태, 연결 요건 ID와 제목, 구현 위치, Cover 문구와 연결된 요건 ID와 제목을 표시한다
- (UI) 검색어, 테스트 구분, 런타임, 수행 상태로 테스트 목록을 좁힐 수 있다
- (UI) 테스트 결과 인덱스에 freshness 이슈가 있으면 화면에 이슈 목록을 표시한다
- (STATIC) 하네스 UI 서버가 제공하는 테스트 결과 DTO는 test source index와 test-results index의 식별자, 테스트 구분, 런타임, 상태, 요건 ID와 제목, 구현 위치 값을 보존한다

## API 설계

- `GET /api/tests?scope={harness|application}`
- 응답은 `scope`, `generatedAt`, `sourceGeneratedAt`, `resultGeneratedAt`, `summary`, `tests`, `issues`를 포함한다.
- `tests[]` 행은 `displayName`, `runtime`, `source`, `testType`, `status`, `requirements`, `covers`, `file`, `line`과 비표시 매칭 메타데이터인 `resultIdentity`, `resultFile`, `resultLine`을 포함한다.

## DB 설계

해당 없음

## UI 설계

- Route: `/tests`
- 화면 이름: `TestResultsPage`
- 주요 표시 정보: 전체 테스트 수, PASS/FAIL/SKIP/NOT_RUN 수, 테스트 구분별 수, 검색 입력, 테스트 구분 필터, 런타임 필터, 수행 상태 필터, 테스트 목록, freshness 이슈 목록.
- 테스트 카드: 수행 상태 뱃지, 테스트 구분 뱃지, 런타임, source, 테스트 표시명, 연결 요건 ID와 제목, 구현 위치, Cover 문구와 연결 요건 ID와 제목. source index 정의가 없는 result-only 행은 구현 위치 없음으로 표시한다. 결과 위치와 테스트/결과 식별자 상세 영역은 표시하지 않는다.

## UI 설계 검토 표면

- Harness/Shell/AppShell: TestResultsNavigation
- Harness/Tests/TestResults: SummaryAndList, Filtered, FreshnessIssues, EmptyScope, Loading, ErrorStateStory

## 의사결정 로그

- 결정일: 2026-06-25
  결정: 테스트 결과 화면의 원천은 `backend.source-index.json`, `front-end.source-index.json`, `harness.self-test.index.json`, `test-results.index.json`으로 한다.
  이유: 테스트 정의와 수행 결과가 분리되어 있으므로 둘을 매칭해야 미실행 테스트를 NOT_RUN으로 표시할 수 있다.
  결정자: REDSTONE
  영향: application scope의 백엔드 JUnit 결과는 backend source index의 테스트 정의와 표시명 기반으로 매칭해 구현 위치와 연결 요건을 표시한다. source index 정의가 없는 결과는 test-results 기반 행으로 표시한다.

- 결정일: 2026-06-25
  결정: 화면과 UI 서버는 PASS/FAIL/SKIP/NOT_RUN 상태를 재계산하지 않는다.
  이유: 수행 결과 판정과 freshness 판정은 기존 인덱서와 추적기가 소유한다.
  결정자: REDSTONE
  영향: UI 서버는 식별자 매칭과 DTO 정리만 수행하고 상태 값은 산출물을 그대로 보존한다.

## 수용 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-039-harness-ui-test-results.feature`

### 요건 설계 승인 이력

- 설계일: 2026-06-25
  검증 설계: `.feature`의 6개 Scenario가 카드 수용 기준 6개를 `Covers:`로 연결한다. 메뉴 진입, 요약/목록, 행 필드, 필터, freshness 이슈는 `(UI)`, DTO 값 보존은 `(STATIC)`으로 검증한다.
  API 설계: `/api/tests`는 source index 테스트 정의와 test-results index 수행 결과를 합쳐 화면 DTO를 제공한다.
  DB 설계: 해당 없음.
  UI 설계: `/tests` route는 상태 요약, 검색/필터, 테스트 카드 목록, freshness 이슈 목록으로 구성한다.
  검사기 설계: 신규 테스트 수집 규칙은 추가하지 않고 UI 서버 DTO 빌더와 self-test만 추가한다.
  추적 정책: `(UI)` AC는 harness/ui Storybook Vitest 결과로, `(STATIC)` AC는 `harness/self-test` 서버 DTO 보존 테스트로 판정한다.
  검증: `cd harness/ui && npm run typecheck`, `cd harness/ui && npm run test`, `cd harness/ui && npm run test:storybook`, `npm run harness:self-test`, `npm run harness:trace -- --requirement REQ-039`
  승인자: REDSTONE
  설계 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-25
  리뷰자: REDSTONE
  확인: Storybook Vitest play 검증으로 AppShell 메뉴 진입, PASS/FAIL/SKIP/NOT_RUN 요약, 테스트 행의 테스트 구분·런타임·상태·연결 요건 `ID - 제목`·구현 위치, 결과 위치 미표시, Cover 문구와 연결 요건 `ID - 제목`, 식별자 상세 미표시, 검색어/테스트 구분/런타임/수행 상태 필터, freshness 이슈 목록을 확인했다. 브라우저 확인으로 실제 `/tests` 화면의 구분 그룹, `REQ-XXX - 제목`, `Cover 1개`, 결과 위치와 식별자 상세 미표시를 확인했다. `harness/self-test/tests/harness-ui-test-results.test.ts`는 UI 서버가 backend source index의 API 테스트 정의를 JUnit 표시명 결과와 매칭해 테스트 코드 위치와 연결 요건 제목을 DTO로 보존하는지 검증한다. `cd harness/ui && npm run typecheck`, `cd harness/ui && npm run test`, `cd harness/ui && npm run test:storybook`, `npm run harness:self-test`, `npm run harness:trace -- --requirement REQ-039`를 통과했고 REQ-039 추적 상태는 BLUE다.
  결과: 승인

## 열린 질문

- 없음
