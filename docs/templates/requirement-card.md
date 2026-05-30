# 요건 카드

요건 ID: REQ-000
제목: 요건 제목
우선순위: 높음
상태: 초안
구현 대상: back-end

`구현 대상`은 `back-end`, `front-end`, `full-stack` 중 하나로 적는다. 기존 카드에서 생략된 경우 `back-end`로 본다.

<!-- 작성 전 점검:
- 환경에 따라 동작이 달라지는가? (local/test/prod, FE/BE, browser/server, proxy/profile 등)
- 생성·발급·저장·시작한 상태를 어떻게 삭제·만료·해제·정리하는가?
- 외부 클라이언트나 사용자가 의존하는 계약이 있는가? (API, route, OpenAPI, 이벤트, 파일, 화면 진입점 등)
- 사용자가 전달한 값이 이동 대상, 조회 범위, 처리 대상을 바꾸는가? 허용 범위와 fallback은 무엇인가?
- 실패 유형을 같은 응답/안내로 숨길지, 구분해서 드러낼지 정했는가?
-->

## 사용자/목적

사용자는 어떤 목적을 달성해야 하는가.

## 범위

- 포함할 동작을 작성한다.

## 표준 용어

- domain.concept

`docs/terminology/`에 정의된 term key만 적는다. 검색은 `node tools/harness/terminology.mjs search <표현>`을 사용한다. 새 용어가 필요하면 `node tools/harness/terminology.mjs draft add ...`로 후보를 등록한 뒤 key를 적는다 (`draft.json`은 직접 편집하지 않는다). draft 상태는 `validateHarness`(safe)는 통과하지만 `validateTerminologyStrict`에서는 error로 잡힌다.

## 제외 범위

- 이번 요건에서 제외할 동작을 작성한다.

## 수용 기준

- 첫 번째 수용 기준을 작성한다
- 두 번째 수용 기준을 작성한다
- 목록 조회 API가 포함되면 page/size 요청에 따른 content 슬라이스와 page/size/totalElements/totalPages 메타데이터 수용 기준을 반드시 작성한다
- 화면 목록이 포함되면 한 번에 보는 묶음, 다음 묶음, 전체 개수/묶음 수처럼 사용자가 관찰하는 페이징 결과를 수용 기준으로 작성한다
- 화면이 범위에 있으면 화면 레이아웃 단위(보호 화면 chrome / 비인증 단일 카드 등)와 카드 구성(제목, 입력, 버튼, 링크, 안내 영역 등)을 `범위`에 narrative로 적고 검증 가능한 한 줄을 수용 기준으로도 둔다

## 의사결정 로그

- 결정일: YYYY-MM-DD
  결정: 무엇을 결정했는가.
  이유: 왜 그렇게 결정했는가.
  결정자: Product Owner, Tech Lead
  영향: 구현과 검증에 어떤 영향이 있는가.

## BDD 테스트 리뷰

시나리오 문서는 `docs/scenarios/REQ-XXX-*.feature`에 Gherkin 형식으로 별도로 작성하고 승인한다. 이 섹션에는 요건 단위 Skeleton 승인 이력과 전체 테스트 리뷰 결과만 요약한다.

- 시나리오 문서: `docs/scenarios/REQ-000-feature.feature`

### 요건 Skeleton 승인 이력

요건 Skeleton 단계에서 한 블록만 추가한다. 검증 설계, API, DB, Service 인터페이스, 화면/라우팅 Skeleton이 함께 승인되었는지 남긴다. 해당 없는 항목은 `해당 없음`으로 적는다.

- 승인일: YYYY-MM-DD
  검증 설계: `.feature`의 Scenario들이 모든 수용 기준을 `Covers:`로 다루는지 확인 완료 여부.
  API Skeleton: 엔드포인트, 요청/응답 DTO, 상태 코드, 오류 코드. 확인 완료 여부.
  DB Skeleton: 변경되는 Entity/컬럼/관계. `previewSchema` 확인 완료 여부.
  Service Skeleton: 공개 메서드와 내부 동작 코멘트. 업무 로직 미구현 확인 완료 여부.
  화면/라우팅 Skeleton: 별도 파일로 작성한 인터랙션 mockup 컴포넌트 위치, 화면 이름, 업무 진입점, 예상 route 초안, 접근 권한, 주요 표시 정보, 사용자가 관찰할 상태(initial / fieldErrors / submitting / serverRejection / success 등), 작성한 route 기준 page mock story와 상태별 story 위치. routes.tsx swap, 외부 API client 결합, 다른 카드 placeholder 정리, `@Covers` FE BDD 테스트, visual snapshot baseline은 Skeleton에서 작성하지 않고 구현 단계 작업 목록으로 분리한다.
  검증: `compileJava`, `generateHarnessSourceIndex`, `generateFrontEndSourceIndex`, `previewSchema`(필요 시), `traceRequirementCard -Preq=REQ-000`, FE 대상이면 `npm run typecheck`, `npm run lint`, `npm run source-index`, `npm run build-storybook` 결과.
  승인자: Product Owner, Tech Lead
  Skeleton 결과: 승인 또는 수정 요청

### 테스트 리뷰

- 리뷰일: YYYY-MM-DD
  리뷰자: Product Owner, Tech Lead, QA
  확인: 모든 수용 기준이 `@Covers`로 커버, BDD 테스트의 `@Covers` AC가 같은 요건의 어떤 `.feature` 시나리오 `Covers:`에 포함됨(`TEST_COVERS_NO_SCENARIO_COVERS` 0건), 시나리오는 사용자 행위 단위로 잘림, 정상/예외/경계 조건 커버, 목록 API/화면의 페이징 AC/테스트 포함, FE 대상이면 `npm run validate:full` 성공과 Storybook/Playwright/접근성 smoke 확인.
  결과: 미완료, 승인, 또는 수정 필요.

## 열린 질문

- 없음

질문이 남아 있으면 한 번에 하나씩 둔다. 선택지형 질문을 우선 사용하고, 정량 기준은 후보값과 직접 입력 여지를 함께 적는다.
