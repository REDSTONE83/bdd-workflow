# 요건 카드

요건 ID: REQ-032
제목: 하네스 UI 요건 상세 추적
우선순위: 높음
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: acceptance
관련 요건: REQ-029, REQ-030, REQ-031
대체 요건: 없음

## 사용자/목적

하네스 작업자는 요건 하나를 골라 수용 기준별 커버리지, RED 사유, BLUE 차단 사유, 연결된 산출물을 확인하고, 원본 파일을 로컬 에디터로 바로 열어 작업을 이어갈 수 있어야 한다.

## 범위

- 요건 상세는 요건 ID, 제목, 카드 상태, 우선순위, 대상 시스템, 제품 영역, 검증 수준과 추적 상태를 표시한다.
- 주요 정보군은 개요, AC, 수용 시나리오, UI 설계, API 설계, DB 설계, 산출물/소스 탭으로 구분해 표시한다.
- 개요 탭은 요건 카드의 사용자/목적, 범위, 표준 용어 key와 한국어/영어 이름, 제외 범위, 의사결정 로그를 표시한다.
- 수용 기준 원문 목록은 카드 목록으로 표시하고, 수용 시나리오 목록은 Given/When/Then 앞에 자동 번호를 붙이지 않는다.
- 수용 기준은 연결 수용 시나리오를 통해 Covers 관계를 확인할 수 있게 하고, 수용 시나리오는 항목별 파일 위치와 Covers 관계를 확인할 수 있게 한다.
- 수용 기준마다 AC ID는 한 단계 큰 글꼴로 표시하고, 검증 채널은 ID 옆 유형별 색상 뱃지로 표시하며, 판정 상태는 카드 우측에 표시한다.
- 수용 기준마다 연결된 테스트와 연결 수용 시나리오는 바로가기 링크로 제공하고, 연결 테스트 라벨과 목록 컨텐츠는 상단 정렬한다.
- 수용 시나리오마다 Covers 기준으로 연결된 커버리지 판정과 테스트를 항목 안에 표시한다.
- 추적 산출물의 RED 사유와 BLUE 차단 사유를 그대로 표시한다.
- 연결 산출물은 요건 카드와 수용 시나리오 두 종류만 종류 뱃지와 항목별 위치가 있는 목록형 카드로 표시한다.
- 소스코드 위치는 연결 산출물 파일을 제외하고 API 설계, Request, Response, DB 설계, UI Page, UI Story 구현 위치를 종류 뱃지와 함께 목록형 카드로 표시한다.
- 연결된 API는 세로 목록형 카드로 표시하고 method, path, operationId와 구현 위치를 함께 표시한다.
- 연결된 API의 Request와 Response 구성은 카드 안의 펼침 영역에서 확인할 수 있게 하고, Request/Response 필드가 다른 객체를 참조하면 해당 객체 필드를 추가 펼침으로 확인할 수 있게 한다.
- 연결된 DB 설계는 DB 설계 탭에서 DB table을 주 정보로 하는 세로 목록형 카드로 표시하고 JPA className, listener, 구현 위치는 보조 정보로 확인할 수 있게 하며 컬럼 목록은 펼침으로 columnName, PK 여부, nullable, unique, updatable, length를 우선 확인하고 fieldName, javaType, annotation, 연결 요건은 보조 정보로 확인할 수 있게 한다.
- 연결된 UI 설계는 UI 설계 탭에서 세로 목록형 카드로 표시하고, 카드별 설명, Storybook 검토 링크, 구현 파일 위치를 제공한다.
- 카드 원본 문서와 연결 항목의 파일 경로/라인 위치 자체를 로컬 에디터 바로가기 링크로 제공하고 별도 열기 버튼은 두지 않는다.
- 요건 상세는 메타데이터 카드 바깥 상단 좌측에 테두리 없는 요건 목록 버튼을 제공하고, 상세 route의 query를 유지한 채 요건 보드로 돌아갈 수 있게 한다.

## 표준 용어

- harness.requirementCard
- harness.acceptanceCriteria
- harness.scenario
- harness.validationArtifact
- harness.traceState
- harness.finding
- api.operation
- api.request
- api.response
- api.entity

## 제외 범위

- 카드 본문 인라인 편집과 승인 액션.
- 수용 기준 문장 변경 영향 분석(후속 단계).

## 수용 기준

- (UI) 요건 상세는 요건 ID, 제목, 카드 상태, 우선순위, 대상 시스템, 제품 영역, 검증 수준과 추적 상태를 표시한다
- (UI) 요건 상세의 주요 정보군은 개요, AC, 수용 시나리오, UI 설계, API 설계, DB 설계, 산출물/소스 탭으로 구분된다
- (UI) 개요 탭은 요건 카드의 사용자/목적, 범위, 표준 용어 key와 한국어/영어 이름, 제외 범위, 의사결정 로그를 표시한다
- (UI) 수용 기준 원문 목록은 카드로 표시되고 수용 시나리오 목록은 번호 없는 Given/When/Then, 파일 위치, Covers 관계를 확인할 수 있다
- (UI) AC 목록 카드에서 AC ID는 한 단계 큰 글꼴로 표시되고 검증 채널은 ID 옆 유형별 색상 뱃지로 표시되며 판정 상태는 카드 우측에 표시된다
- (UI) AC 목록 카드에서 연결 테스트와 연결 수용 시나리오는 바로가기 링크로 제공되고 연결 테스트 라벨과 목록 컨텐츠는 상단 정렬된다
- (UI) 수용 시나리오마다 Covers 기준으로 연결된 커버리지 판정과 테스트가 항목 안에 표시된다
- (UI) 추적 산출물에 RED 사유가 있으면 규칙과 메시지가 표시된다
- (UI) 추적 산출물에 BLUE 차단 사유가 있으면 그대로 표시된다
- (UI) 연결 산출물은 요건 카드와 수용 시나리오 종류 뱃지와 파일 위치가 있는 목록형 카드로 표시된다
- (UI) 소스코드 위치는 연결 산출물 파일을 제외하고 API 설계, Request, Response, DB 설계, UI Page, UI Story 종류 뱃지와 파일 위치가 있는 목록형 카드로 표시된다
- (UI) 연결된 API는 세로 목록형 카드로 표시되고 Request, Response 구성과 그 안의 중첩 객체 필드는 펼침으로 확인된다
- (UI) 연결된 DB 설계는 DB 설계 탭에서 세로 목록형 카드로 표시되고 table과 컬럼 메타데이터는 펼침으로 확인된다
- (UI) 연결된 UI 설계는 UI 설계 탭에서 세로 목록형 카드로 표시되고 카드별 설명과 Storybook 검토 링크와 구현 파일 위치가 제공된다
- (UI) 카드 원본 문서와 연결 항목의 파일 경로/라인 위치 자체는 로컬 에디터 바로가기 링크로 제공되고 별도 열기 버튼은 표시되지 않는다
- (UI) 요건 상세의 메타데이터 카드 바깥 상단 좌측에 있는 테두리 없는 요건 목록 버튼을 선택하면 기존 필터 query를 유지한 요건 보드 route로 이동한다

## API 설계

- 해당 없음

## DB 설계

- 해당 없음

## UI 설계

- 화면 표면: `harness/ui/src/features/requirements/RequirementDetailPage.tsx`를 `/requirements/:requirementId` route에 둔다. Route wrapper는 source index용 `@Page`/`@Route` 주석을 소유하고, 상세 본문은 `RequirementDetailView.tsx`, 탭별 구현은 `features/requirements/detail/*Tab.tsx`에 둔다.
- 주요 영역: 메타데이터 카드 바깥 상단 좌측의 테두리 없는 요건 목록 복귀 버튼, 요건 메타데이터 머리 영역, 개요 탭, AC 탭, 수용 시나리오 탭, UI 설계 탭, API 설계 탭, DB 설계 탭, 산출물/소스 탭을 둔다. 개요 탭에는 요약 지표, 사용자/목적, 범위, 표준 용어 key와 한국어/영어 이름, 제외 범위, 의사결정 로그를 둔다. AC 탭에는 AC 카드 목록과 각 AC의 커버리지 판정, 채널 색상 뱃지, 연결 테스트 바로가기, 연결 수용 시나리오 바로가기, RED/BLUE 판정 사유를 둔다. 수용 시나리오 탭에는 수용 시나리오 목록과 각 시나리오의 Covers/Given/When/Then, Covers 기준 커버리지 판정과 연결 테스트를 둔다. UI 설계 탭에는 UI Storybook 검토 링크와 구현 위치를 둔다. API 설계 탭에는 API 목록형 카드와 Request/Response 펼침 영역, 중첩 객체 참조 펼침 영역을 둔다. DB 설계 탭에는 DB 설계 목록형 카드와 컬럼 목록 펼침 영역을 둔다. 산출물/소스 탭에는 요건 카드와 수용 시나리오 연결 산출물 목록형 카드, 산출물 파일을 제외한 소스코드 위치 목록형 카드를 두고 각 항목의 종류를 뱃지로 구분한다.
- 표시 필드: 요건 ID, 제목, 카드 상태, 우선순위, 대상 시스템, 제품 영역, 검증 수준, 추적 상태, 사용자/목적, 범위, 표준 용어 key, 표준 용어 한국어 이름, 표준 용어 영어 이름, 제외 범위, 의사결정 로그의 결정일/결정/이유/결정자/영향, AC ID, AC 원문, AC별 검증 채널 색상 뱃지, AC별 판정 상태, AC별 연결 테스트 바로가기, AC별 연결 수용 시나리오 바로가기, 수용 시나리오 제목, 수용 시나리오 Covers, 시나리오별 커버리지 판정, 시나리오별 연결 테스트, 시나리오 Given/When/Then, feature 파일 위치, finding 규칙과 메시지, API method/path/operationId, Request/Response 이름과 필드 구성, Request/Response 중첩 객체 필드 구성, DB table/JPA className/listener/구현 위치, DB 컬럼의 columnName/PK 여부/nullable/unique/updatable/length/JPA fieldName/javaType/annotation/연결 요건, UI surface description, UI route, Storybook title/story, 요건 카드/수용 시나리오 산출물 종류와 바로가기 파일 위치, API 설계/Request/Response/DB 설계/UI Page/UI Story 소스코드 종류와 바로가기 파일 위치를 표시한다.
- 상태 목록: 정상 상세, 탭 전환 가능, 개요 요건 카드 섹션 확인 가능, AC 카드 확인 가능, AC ID와 채널 색상 뱃지 확인 가능, AC 항목별 테스트/수용 시나리오 바로가기 확인 가능, 수용 시나리오 GWT 확인 가능, 수용 시나리오 항목별 테스트 정보 확인 가능, RED 사유 있음, BLUE 차단 있음, 연결 산출물 있음, API 설계 카드 확인 가능, Request/Response 펼침 가능, 중첩 객체 참조 펼침 가능, DB 설계 목록형 카드 확인 가능, DB 컬럼 목록 펼침 가능, API/DB 설계 있음, Storybook 검토 링크 있음, 위치 확인 불가를 검토 상태로 둔다.
- 사용자 행위: 메타데이터 카드 바깥 상단 좌측의 테두리 없는 요건 목록 버튼으로 상세 진입 전 필터 query를 유지한 목록으로 돌아간다. 카드 원본 문서와 연결 산출물의 파일 경로/라인 위치 바로가기로 로컬 에디터 연결을 연다. UI 설계는 Storybook 링크로 먼저 검토하고 필요하면 구현 위치 링크를 연다. 상세 화면 안에서 카드 본문 수정이나 승인 액션은 제공하지 않는다.

## UI 설계 검토 표면

- Harness/Requirements/RequirementDetail: CompleteCoverage, OverviewSections, RedReasons, BlueBlocked, LinkedArtifacts, AcceptanceAndScenarios, DesignSurfaces, BackToBoardLink

## 의사결정 로그

- 결정일: 2026-06-10
  결정: 요건 상세가 보여주는 커버리지, RED 사유, BLUE 차단 사유는 추적 산출물 값을 그대로 표시한다.
  이유: REQ-010 단일 게이트 원칙. 화면이 자체 해석을 더하면 CLI 리포트와 다른 답이 된다.
  결정자: REDSTONE
  영향: 표시 항목은 추적 산출물 스키마(데이터 계약)를 따른다.

- 결정일: 2026-06-10
  결정: 로컬 에디터 열기는 `vscode://file/<절대 경로>:<라인>` 형식의 링크로 제공한다.
  이유: 추가 설정과 서버 측 실행 없이 VS Code가 기본 지원한다.
  결정자: REDSTONE
  영향: 다른 에디터 지원이 필요해지면 후속 요건에서 설정 방식으로 확장한다.

- 결정일: 2026-06-12
  결정: 요건 상세 메타데이터 카드 바깥 상단 좌측에 테두리 없는 요건 목록 복귀 버튼을 제공하고 상세 URL의 query를 목록 route로 전달한다.
  이유: 사용자가 요건 보드에서 적용한 필터 맥락을 상세 확인 후에도 유지해야 같은 작업 집합으로 돌아갈 수 있다.
  결정자: REDSTONE
  영향: 보드 필터 query 계약은 REQ-031이 담당하고, 상세는 query를 해석하지 않고 복귀 링크에 보존한다.

## 수용 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-032-harness-ui-requirement-detail.feature`

### 요건 설계 승인 이력

- 설계일: 2026-06-10
  검증 설계: `.feature`의 Scenario가 카드 수용 기준을 `Covers:`로 연결한다. 모든 AC는 사용자가 관찰하는 상세 화면 결과이므로 `(UI)`로 검증한다.
  UI 설계: `/requirements/:requirementId` route는 trace report/state, requirements index, scenario index, source indexes, findings를 결합한 detail view model을 사용한다. 판정 상태와 차단 사유는 산출물 값을 그대로 표시한다. AC 원문, 수용 시나리오, Covers 관계, AC별 테스트, 시나리오별 테스트, API 설계, Request, Response, DB 설계, UI Storybook story 연결은 trace state의 coverage/scenarios/apis/entities/frontEnd/designSurfaces와 source index 항목을 얇게 정리해 표시한다.
  UI 설계 검토 표면: `Harness/Requirements/RequirementDetail`의 `CompleteCoverage`, `OverviewSections`, `RedReasons`, `BlueBlocked`, `LinkedArtifacts`, `AcceptanceAndScenarios`, `DesignSurfaces` 상태가 있어야 한다.
  서버 설계: 로컬 에디터 연결은 `vscode://file/<절대 경로>:<line>` 문자열을 DTO로 내려준다. 파일이 없거나 line을 알 수 없으면 링크 대신 위치 텍스트와 확인 불가 상태를 내려준다.
  추적 정책: `(UI)` AC는 harness/ui Storybook Vitest 결과로 판정한다. 연결 산출물의 원천은 source index와 trace report이며 화면이 자체 연결 추론을 추가하지 않는다.
  검증: 설계 단계이므로 실행 테스트는 아직 작성하지 않는다. `npm run harness:trace -- --requirement REQ-032`로 카드/시나리오/용어 정합성을 확인한다.
  설계 결과: 승인 대기

### 테스트 리뷰

- 리뷰일: 2026-06-10
  리뷰자: REDSTONE
  확인: 설계 검토중 단계. UI 설계와 UI 설계 검토 표면을 작성했고 실행 테스트는 아직 작성하지 않았다.
  결과: 미완료

- 리뷰일: 2026-06-17
  리뷰자: REDSTONE
  확인: `harness/ui/src/features/requirements/RequirementDetail.stories.tsx`의 Storybook Vitest play 검증이 요건 상세 머리 영역, 탭 구분, 개요 섹션, AC 카드와 연결 테스트/수용 시나리오, GWT 표시, RED/BLUE 사유, 산출물/소스 링크, API Request/Response 중첩 펼침, DB 설계 컬럼 펼침, UI 설계 Storybook 검토, 요건 목록 복귀 query 보존을 확인한다. `npm run test:storybook`과 `npm run harness:trace -- --requirement REQ-032`가 통과했고 REQ-032 trace state는 GREEN이다.
  결과: 승인

- 리뷰일: 2026-06-18
  리뷰자: REDSTONE
  확인: AC ID 글꼴을 본문보다 한 단계 큰 `text-base`로 바로잡아 "한 단계 큰 글꼴" 수용 기준과 구현을 일치시켰고, 시나리오 탭의 커버리지 판정(연결됨)과 연결 테스트 단언을 보강했다.
  결과: 승인

## 열린 질문

- 없음
