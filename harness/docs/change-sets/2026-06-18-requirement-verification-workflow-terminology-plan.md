# Change Set: 2026-06-18 요건 검증 워크플로우 용어와 설계 추출 전환 계획

상태: 완료
요청일: 2026-06-18
변경 유형: 하네스 개선, 표준 개정, 마이그레이션
영향 요건: REQ-006, REQ-010, REQ-012, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-036
논의 상태: 없음

## 요청 요약

- 저장소의 실제 목적은 BDD 방법론 자체가 아니라 요건 ID를 기준으로 수용 기준, 수용 시나리오, API/DB/UI 설계, 테스트, 구현을 연결해 검증하는 것이다.
- `BDD`와 `Skeleton` 중심 용어를 걷어내고, 사용자-facing 용어는 `요건 검증`, `수용 시나리오`, `설계 검토`, `API/DB/UI 설계`로 정리한다.
- 요건 카드는 사용자의 의도, 범위, 수용 기준, 승인 상태만 최소한으로 관리하고, API/DB/UI 설계는 소스코드와 산출물의 요건 ID 연결에서 추출한다.
- 목표 플로우는 `요건 정의 -> AC·수용 시나리오 초안 검토 -> API/DB/UI 설계 작성 및 검토 -> AC·수용 시나리오 확정 -> 테스트 작성 및 검토 -> 구현 작성 및 검토 -> 최종 검증`이다.

## 작업 범위

- 표면마다 흩어진 명칭(`AGENTS.md`의 `BDD Workflow Harness`, `harness/docs/overview.md`의 `코드 중심 BDD 하네스`, 하네스 UI의 `BDD Harness`)을 공식 명칭 `요건 검증 하네스`로 통일한다.
- `BDD 시나리오`는 `수용 시나리오`로 전환하되, 파일 형식 설명이 필요할 때만 Gherkin을 기술 세부사항으로 남긴다.
- `BDD 테스트 리뷰`는 `수용 테스트 리뷰`로 전환하고, 리뷰 대상은 AC, 수용 시나리오, 실행 테스트 연결로 정의한다.
- `Skeleton 검토중`과 `Skeleton 승인` 상태는 각각 `설계 검토중`과 `설계 승인`으로 전환한다.
- `API Skeleton`, `DB Skeleton`, `UI Skeleton`, `Storybook 계약`은 사람이 카드에 직접 유지하는 섹션이 아니라 소스 기반 추출 결과인 `API 설계`, `DB 설계`, `UI 설계`로 대체한다.
- Storybook은 독립 계약이 아니라 UI 설계를 사람이 검토하고 UI 테스트로 승격하기 위한 검토 표면으로 정의한다.
- 요건 카드 최소 필드는 헤더 메타데이터, 사용자/목적, 범위, 표준 용어, 제외 범위, 수용 기준, 의사결정 로그, 수용 테스트 리뷰, 열린 질문으로 제한한다.
- `검증 대상`과 수작업 Skeleton/Storybook 섹션은 새 카드 템플릿에서 제거하고, 전환 기간 동안 기존 카드는 읽기 호환만 유지한다.
- 앱 scope 소스 인덱서가 요건 ID가 붙은 Controller/DTO/API 작업, Entity/Repository/schema preview, Route/Page/Component/Storybook story, 테스트 메타데이터를 수집해 요건별 설계 표면을 만든다. 하네스 scope에는 백엔드(Spring Controller/JPA Entity)가 없으므로 하네스 카드는 `UI 설계`와 STATIC 검증 표면만 생성하고, `API 설계`/`DB 설계`는 앱 scope 카드에만 적용한다.
- 요건 상세 리포트와 하네스 UI는 카드 본문에 복사된 계약이 아니라 생성된 `API 설계`, `DB 설계`, `UI 설계`, 테스트 연결, 구현 연결을 표시한다.
- 통합 게이트는 새 상태와 생성 설계 표면을 기준으로 `설계 승인`, `테스트 승인`, `검증중`, `승인` 단계별 차단 조건을 판정한다.
- 기존 `BDD`, `Skeleton`, `Storybook 계약` 명칭은 문서, 템플릿, 리포트, UI label, self-test 이름, rule message에서 단계적으로 치환한다.

## 제외 범위

- 전체 요건 카드 본문의 수작업 설계 섹션 일괄 제거와 legacy alias 제거는 이번 완료 범위에서 제외한다. 전환 대상 하네스 카드와 템플릿, 표준, 리포트, UI label, 파서, 게이트는 새 용어와 생성 설계 표면 중심으로 전환한다.
- 기존 요건 카드의 범위, 수용 기준, 수용 시나리오 의미는 이 전환만으로 바꾸지 않는다.
- `REQ-XXX` ID 체계, 헤더 관계 필드(`상위 요건`/`관련 요건`/`대체 요건`/`명세 역할`), AC 마커 `(API)/(UI)/(E2E)/(STATIC)`, RED/GREEN/BLUE 판정 모델은 유지한다.
- 앱 요건 카드 본문의 수작업 섹션 제거는 이 하네스 change set이 아니라 별도 앱 scope change set에서 수행한다(AGENTS.md의 scope 분리 규칙).
- Gherkin 파일 형식 자체를 제거하지 않는다. 공식 산출물 이름만 `수용 시나리오`로 바꾼다.
- Storybook Vitest와 live Playwright의 테스트 채널 의미는 유지한다.
- 구현 소스에 요건 ID를 붙이는 구체 annotation/API 표준은 후속 설계 추출 작업에서 확정한다.

## 완료 조건

- 하네스 표준 문서와 템플릿에 새 공식 플로우와 용어가 일관되게 반영된다.
- 새 카드 템플릿에서 사람이 직접 관리하는 `검증 대상`, `API Skeleton`, `DB Skeleton`, `UI Skeleton`, `Storybook 계약` 섹션이 제거된다.
- 앱 scope 소스 인덱스와 trace state가 요건 ID 기준으로 `API 설계`, `DB 설계`, `UI 설계`를 생성하고, 하네스 scope는 `UI 설계`와 STATIC 표면을 생성한다.
- 새 카드는 수작업 계약 섹션 없이도 설계 검토 단계에서 필요한 설계 표면을 리포트와 하네스 UI에서 확인할 수 있다.
- 전환 기간에는 기존 `Skeleton`/`Storybook 계약` 섹션을 가진 카드가 즉시 실패하지 않고, 호환 파서가 읽으며 새 표준 메시지에서 이관 방향을 안내한다.
- `설계 승인` 이후 단계의 요건은 필요한 설계 표면이 소스 기반 추출 결과에 없으면 게이트가 차단한다.
- `수용 테스트 리뷰`는 최신 `결과:` 라인을 기준으로 판정하고, 기존 `BDD 테스트 리뷰` 섹션은 호환 기간에만 alias로 읽는다.
- 하네스 UI 요건 상세 화면은 카드 복사본이 아니라 생성 산출물에서 온 API/DB/UI 설계와 테스트/구현 연결을 표시한다.
- 관련 하네스 self-test, tool-test, scope validate가 새 용어와 새 추출 모델을 검증한다.

## 검증 명령

- `npm run harness:front-end-source-index` (하네스 UI 설계 표면)
- `npm run harness:trace -- --requirement REQ-028`
- `npm run harness:trace -- --requirement REQ-029`
- `npm run harness:trace -- --requirement REQ-032`
- `npm run harness:self-test`
- `npm run harness:validate`
- `npm run app:source-index` (앱 API/DB 설계 표면 소스)
- `npm run app:openapi-index`
- `npm run app:front-end-source-index`
- `npm run app:trace -- --requirement REQ-001` (백엔드 API+DB를 가진 앱 카드로 설계 추출 검증)
- `npm run app:validate`
- `npm run repo:validate`

## 검증 결과

- 2026-06-19: `npm run harness:self-test`, `npm run harness:validate`, `npm run app:validate`, `npm run repo:validate` 통과.
- 2026-06-19: `npm run harness:trace -- --requirement REQ-028`, `npm run harness:trace -- --requirement REQ-029`, `npm run harness:trace -- --requirement REQ-032` 모두 BLUE.
- 2026-06-19: `npm run app:trace -- --requirement REQ-001`, `npm run app:trace -- --requirement REQ-020` 모두 BLUE.
- 2026-06-19: `npm run app:source-index`, `npm run app:openapi-index`, `npm run app:front-end-source-index`로 앱 API/DB/UI 설계 표면 생성 경로를 확인했다.

## 전환 단계

### 1단계: 용어 표준 고정

- `요건 검증 하네스`, `수용 시나리오`, `수용 테스트 리뷰`, `설계 검토중`, `설계 승인`, `API/DB/UI 설계`를 공식 용어로 확정한다.
- `BDD`는 방법론 이름이 아니라 Gherkin 기반 시나리오의 배경 설명으로만 제한한다.
- `Skeleton`은 UI 로딩 placeholder 같은 제품 UI 용례에만 남기고, 요건 단계명과 계약 검토 용례에서는 제거한다.

### 2단계: 카드 최소 스키마 정의

- 요건 카드는 최종 명세와 승인 상태만 유지한다.
- `검증 대상`과 수작업 설계 섹션은 생성 산출물로 이동한다.
- 카드에 남는 수용 기준은 관계자 언어를 유지하고, HTTP status, DTO field, table column 같은 기술 계약값은 소스 기반 설계 표면에서 확인한다.

### 3단계: 소스 기반 설계 추출

- API 설계는 Controller/DTO/error code/OpenAPI index와 요건 ID 연결에서 추출한다.
- DB 설계는 Entity/Repository/schema preview와 요건 ID 연결에서 추출한다.
- UI 설계는 route/page/component/story metadata와 요건 ID 연결에서 추출한다.
- Storybook title과 named export 상태는 UI 설계의 검토 표면으로 수집하되, 별도 카드 계약으로 복사하지 않는다.
- 각 추출 항목은 kind, 요건 ID, 파일 위치, 표시 이름, 주요 계약값, 근거 산출물, 검증 상태를 가진다.
- 추출 대상의 scope를 분리한다. `API 설계`와 `DB 설계`는 백엔드를 가진 앱 scope 카드에서만 만들고, 하네스 scope 카드는 `UI 설계`(`harness/ui`)와 STATIC 표면만 갖는다.
- 앱 scope 소스 인덱서(`harness/source-indexer`의 `SourceIndexGenerator`)는 이미 api/dto/entity/repository/test를 `@Requirement`로 수집한다. 따라서 이 단계의 핵심은 신규 수집이 아니라, 수집된 항목을 요건별 설계 표면으로 묶어 리포트/하네스 UI에 노출하고 수작업 카드 섹션을 대체하는 것이다.

### 4단계: 게이트와 리포트 전환

- 설계 검토 단계에서는 수용 시나리오 초안과 생성 설계 표면의 충돌, 누락, 요건 ID 미연결을 finding으로 보고한다.
- 설계 승인 단계부터는 필요한 설계 표면이 없으면 RED 또는 gate finding으로 차단한다.
- 테스트 승인 단계부터는 모든 AC가 실행 테스트와 연결되어야 한다.
- 검증중과 승인 단계에서는 기존 RED/GREEN/BLUE 판정과 scope validate를 유지한다.

### 5단계: 호환 마이그레이션

- 파서는 기존 `Skeleton 검토중`, `Skeleton 승인`, `BDD 테스트 리뷰`, `Storybook 계약`을 일정 기간 alias로 읽는다.
- 새 문서와 새 카드는 새 용어만 사용한다.
- 상태 enum 전환(`Skeleton 검토중`/`Skeleton 승인` → `설계 검토중`/`설계 승인`)은 현재 해당 상태에 머문 카드가 0장이므로(전 카드가 `검증중`/`승인`) 위험이 낮다. 실제 마이그레이션 부담은 본문 수작업 섹션 제거이며 대상 규모는 `## API Skeleton` 22장, `## DB Skeleton` 22장, `## UI Skeleton` 20장, `## Storybook 계약` 20장, `## 검증 대상` 24장, `## BDD 테스트 리뷰` 37장이다.
- 기존 카드의 수작업 Skeleton/Storybook 섹션은 생성 설계 표면이 동등하게 확보된 뒤 제거한다. 앱 카드 본문 편집은 앱 scope change set에서 수행한다.
- rule message와 UI label은 새 용어로 먼저 바꾸고, 내부 JSON field는 호환 기간에만 기존 이름을 유지할 수 있다.

### 6단계: 호환 제거

- 전체 카드와 표준 문서가 새 용어로 이동한 뒤 old alias 허용을 warning에서 error로 승격한다.
- `storybookContract`, `apiSkeleton`, `dbSkeleton`, `uiSkeleton` 같은 내부 field는 새 schema로 대체하거나 generated design surface 하위 호환 필드로만 남긴다.
- 하네스 UI와 리포트에서 `Skeleton`과 `BDD` label이 사라졌는지 검증한다.

## 결정 로그

- 2026-06-18: 전체 체계 이름은 `BDD Workflow Harness`가 아니라 `요건 검증 하네스`로 전환한다.
- 2026-06-18: Gherkin 파일은 유지하되 공식 산출물 이름은 `수용 시나리오`로 둔다.
- 2026-06-18: 단계명은 `Skeleton` 대신 `설계`를 사용하고, 상태는 `설계 검토중`과 `설계 승인`으로 둔다.
- 2026-06-18: `API/DB/UI 계약`보다 사용자-facing 문구로 자연스러운 `API/DB/UI 설계`를 공식 용어로 둔다.
- 2026-06-18: 계약의 정밀 값은 카드에 복사하지 않고 소스코드와 산출물의 요건 ID 연결에서 추출한다.
- 2026-06-18: Storybook은 UI 설계의 일부를 검토하는 표면으로 보며, UI 설계와 같은 레이어의 독립 계약으로 취급하지 않는다.
- 2026-06-18: 요건 카드는 최소 명세 원천으로 유지하고, 검토 표면과 추적 결과는 생성 산출물로 본다.
- 2026-06-18: 영향 요건을 REQ-006(OpenAPI/API 설계 소스), REQ-030/031/033(하네스 UI 앱셸·추적 보드·게이트 현황), REQ-036(표준 용어 화면)까지 확장한다. 이들이 변경된 상태 라벨·생성 설계 표면·승인 용어집을 렌더링하기 때문이다.
- 2026-06-18: `API 설계`/`DB 설계`는 백엔드를 가진 앱 scope 카드에서만 추출하고, 하네스 scope 카드는 `UI 설계`와 STATIC 표면만 갖는다. 하네스 scope에는 Spring Controller/JPA Entity가 없기 때문이다.
- 2026-06-18: 명칭이 표면별로 흩어져 있으므로(`BDD Workflow Harness`/`코드 중심 BDD 하네스`/`BDD Harness`) 단일 `요건 검증 하네스`로 통일한다.
- 2026-06-18: `npm run harness:source-index`는 존재하지 않으므로 `harness:front-end-source-index`로 정정하고, 설계 추출은 하네스 scope만으로 검증할 수 없어 검증 명령에 `app:source-index`/`app:openapi-index`/`app:trace`를 포함한다.
- 2026-06-18: 상태 enum 전환은 해당 상태 카드 0장으로 저위험이고, 실제 부담은 20~37장 카드 본문의 수작업 설계/리뷰 섹션 제거임을 분리해 기록한다.
- 2026-06-19: 하네스 표준/템플릿/UI/파서/게이트/self-test를 새 용어와 생성 설계 표면 중심으로 전환하고, 기존 `Skeleton`/`Storybook 계약`/`BDD 테스트 리뷰` 명칭은 호환 alias로만 읽는다.
- 2026-06-19: 앱 요건 카드 본문 전체 마이그레이션은 앱 scope Change Set으로 분리하고, 이번 하네스 Change Set은 앱 소스 인덱스와 trace 검증으로 설계 표면 생성 경로만 확인한다.

## 열린 논의

- 없음
