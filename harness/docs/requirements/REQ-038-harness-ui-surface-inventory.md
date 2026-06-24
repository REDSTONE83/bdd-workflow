# 요건 카드

요건 ID: REQ-038
제목: 하네스 UI 표면 조회
우선순위: 중간
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: mixed
관련 요건: REQ-030, REQ-032, REQ-036
대체 요건: 없음

## 사용자/목적

하네스 작업자는 선택한 범위 안에 존재하는 API, Entity, UI 표면을 요구사항 상세 화면을 일일이 열지 않고도 한 메뉴에서 목록과 상세 정보로 조회할 수 있어야 한다.

## 범위

- AppShell 좌측 LNB는 API/Entity/UI 표면 조회 화면으로 이동하는 메뉴를 제공한다.
- 표면 조회 화면은 선택한 scope의 API, Entity, UI 표면 수를 요약한다.
- API 탭은 API 목록형 카드에 method, path, operationId, 연결 요건, 구현 위치, 응답 코드와 Request/Response 구성을 펼침으로 표시한다.
- Entity 탭은 Entity 목록형 카드에 className, table, 연결 요건, 구현 위치, listener, 컬럼 정보를 표시한다.
- UI 탭은 Page, Route, Story 목록형 카드에 종류, 이름, route 또는 Storybook 식별자, 연결 요건, 구현 위치, play/assertion 여부, Storybook 검토 링크를 표시한다.
- 검색은 각 탭의 이름, 경로, 파일, 연결 요건, 주요 식별자를 대상으로 한다.
- 표면 조회 화면은 source index 파일을 직접 읽지 않고 UI 서버가 제공하는 산출물 기반 DTO를 사용한다.

## 표준 용어

- api.operation
- api.entity
- harness.scope
- harness.validationArtifact

## 제외 범위

- 표면 생성·수정·삭제. 조회 전용이다.
- API와 Entity의 새로운 정적 수집 규칙 추가.
- 요건 상세 화면의 표면 탭 대체. 상세 화면은 특정 요건 관점의 표면 조회를 계속 담당한다.
- trace state, RED/GREEN/BLUE, 게이트 판정 재계산.

## 수용 기준

- (UI) AppShell 좌측 LNB에서 API/Entity/UI 표면 조회 화면으로 이동할 수 있다
- (UI) 표면 조회 화면은 API, Entity, UI 표면 수를 요약하고 세 표면을 탭별 목록형 카드로 조회할 수 있다
- (UI) API 탭은 method, path, operationId, 연결 요건, 구현 위치, 응답 코드와 Request/Response 구성을 카드 펼침으로 표시한다
- (UI) Entity 탭은 className, table, 연결 요건, 구현 위치, listener, 컬럼 정보를 카드에 표시한다
- (UI) UI 탭은 Page, Route, Story, route 또는 Storybook 식별자, 연결 요건, 구현 위치, Storybook 검토 링크, play/assertion 여부를 카드에 표시한다
- (UI) 검색어로 현재 탭의 표면 목록을 이름, 경로, 파일, 연결 요건, 주요 식별자 기준으로 좁힐 수 있다
- (STATIC) 하네스 UI 서버가 제공하는 표면 조회 DTO는 source index의 API, Entity, UI 표면 주요 값을 보존한다

## API 설계

해당 없음

## DB 설계

해당 없음

## UI 설계

- Route: `/surfaces`
- 화면 이름: `SurfaceInventoryPage`
- 주요 표시 정보: API 수, Entity 수, UI 표면 수, 범위, 탭별 목록형 카드, 검색 입력.
- API 카드: method, path, operationId, summary, 연결 요건, 구현 위치, 응답 코드, Request/Response 펼침, Request/Response 필드와 중첩 참조 객체 펼침.
- Entity 카드: className, table, listener, 연결 요건, 구현 위치, 컬럼명, fieldName, Java 타입, PK, nullable, unique, updatable, length.
- UI 카드: Page/Route/Story 종류, 이름, route 또는 Storybook title/story, 연결 요건, 구현 위치, Storybook 검토 링크, play/assertion 여부.

## UI 설계 검토 표면

- Harness/Surfaces/SurfaceInventory: ApiTab, EntityTab, UiTab, SearchResults, EmptyScope, Loading, ErrorStateStory

## 의사결정 로그

- 결정일: 2026-06-24
  결정: API, Entity, UI 전역 조회를 별도 메뉴 하나와 세 개의 탭으로 구성한다.
  이유: 사용자는 표면 종류별 목록을 독립적으로 훑어야 하지만, 모두 같은 scope와 source index 산출물에 기반한 조회 흐름이다.
  결정자: REDSTONE
  영향: AppShell 좌측 LNB에 `/surfaces` route를 추가하고 하네스 UI 표준의 LNB 목록을 갱신한다.

- 결정일: 2026-06-24
  결정: 표면 조회 DTO는 UI 서버가 source index와 trace state를 읽어 만든다.
  이유: React 화면이 `build/` JSON 원형이나 파일 시스템에 직접 결합하지 않아야 한다.
  결정자: REDSTONE
  영향: 서버 DTO 보존은 STATIC 수용 기준으로 검증하고, 화면 검색/표시는 Storybook Vitest와 단위 테스트로 검증한다.

## 수용 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-038-harness-ui-surface-inventory.feature`

### 요건 설계 승인 이력

- 설계일: 2026-06-24
  검증 설계: `.feature`의 7개 Scenario가 카드 수용 기준 7개를 `Covers:`로 연결한다. 메뉴 진입, 탭별 표시, 검색은 `(UI)`, DTO 값 보존은 `(STATIC)`으로 검증한다.
  API 설계: 해당 없음.
  DB 설계: 해당 없음.
  UI 설계: `/surfaces` route는 API, Entity, UI 탭을 제공하고 각 탭은 요건 상세의 UI/API/DB 설계와 같은 세로 목록형 카드로 구성한다.
  검사기 설계: source index 신규 수집은 하지 않고 UI 서버 DTO 빌더와 self-test만 추가한다.
  추적 정책: `(UI)` AC는 harness/ui Storybook Vitest 결과로, `(STATIC)` AC는 `harness/self-test` 서버 DTO 보존 테스트로 판정한다.
  검증: `cd harness/ui && npm run typecheck`, `cd harness/ui && npm run test`, `npm run harness:self-test`, `npm run harness:trace -- --requirement REQ-038`
  승인자: REDSTONE
  설계 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-24
  리뷰자: REDSTONE
  확인: Storybook Vitest play 검증으로 AppShell 메뉴 진입, API/Entity/UI 탭별 목록형 카드와 검색 결과를 확인했다. `harness/self-test/tests/harness-ui-surface-inventory.test.ts`는 UI 서버가 source index의 API, Entity, UI 표면 주요 값을 DTO로 보존하는지 검증한다. `cd harness/ui && npm run typecheck`, `cd harness/ui && npm run test`, `cd harness/ui && npm run test:storybook`, `npm run harness:self-test`, `npm run harness:trace -- --requirement REQ-038`를 통과했고 REQ-038 추적 상태는 BLUE다.
  결과: 승인

## 열린 질문

- 없음
