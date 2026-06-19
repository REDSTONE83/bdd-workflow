# 요건 카드

요건 ID: REQ-000
제목: 요건 제목
우선순위: 중간
상태: 초안
요건 종류: 기능
명세 역할: 원자 요건
대상 시스템: application
제품 영역: domain
품질 속성: none
검증 수준: acceptance
관련 요건: 없음
대체 요건: 없음

<!-- 작성 전 점검:
- 기존 원자 요건의 범위/AC 변경인가, 새 요건인가?
- 제목이 Change Set 작업명이나 구현 단계명이 아니라 장기 명세 이름인가?
- 제목에 API/화면/백엔드/프런트엔드 같은 구현 표면을 써야 하는 실제 명세 이유가 있는가?
- 여러 기능에 걸친 여정이면 통합 요건인가?
- 여러 기능에 반복 적용되는 품질 보장이면 비기능 요건인가?
- 기능 변경/정책 전환이면 전환 작업명이 아니라 최종 명세가 범위와 AC에 남았는가?
- 작업 순서 때문에 생긴 슬라이스라면 관련 원자 요건을 적었는가?
- 여러 사용자 목표, 생명주기 단계, 정책, 품질 보장이 섞여 5-15분 안에 검토하기 어려운가?
- 제품 영역은 닫힌 enum이 아니라 소문자/숫자/하이픈 키인가?
- 검증 수준과 AC 마커 집합이 서로 맞는가? acceptance=API 또는 UI 단일 채널, e2e=E2E, mixed=둘 이상, static=STATIC.
- 환경 경계, 생명주기 대칭, 외부 계약 노출, 불신 입력, 실패 분류를 어디에 귀속할 것인가?
-->

## 사용자/목적

사용자는 어떤 목적을 달성해야 하는가.

## 범위

- 포함할 동작과 정책을 작성한다.

## 표준 용어

- domain.concept

`harness/docs/terminology/`에 정의된 term key만 적는다. 검색은 `node harness/tools/terminology.mjs search <표현>`을 사용한다. 새 용어가 필요하면 `node harness/tools/terminology.mjs draft add ...`로 후보를 등록한 뒤 key를 적는다 (`draft.json`은 직접 편집하지 않는다).

## 제외 범위

- 이번 요건에서 제외할 동작과 후속 요건 여부를 작성한다.

## 수용 기준

- (API) 백엔드 API/서비스/DB 계약으로 검증할 결과를 작성한다
- (UI) 화면/라우팅/Storybook Vitest 테스트로 검증할 결과를 작성한다
- (E2E) 여러 기능을 관통하는 사용자 여정 결과를 작성한다
- (STATIC) 하네스/정적 검사/리포트로 검증할 결과를 작성한다

마커는 필수이며 `@Covers`, Storybook Vitest `covers`, live Playwright `Covers`, `.feature` `Covers:`에는 마커를 포함하지 않는다.

## API 설계

- 소스 기반 API 설계 표면이 필요하면 연결 기준과 검토 내용을 작성한다. 해당 없음이면 `해당 없음`.

## DB 설계

- 소스 기반 DB 설계 표면이 필요하면 연결 기준과 검토 내용을 작성한다. 해당 없음이면 `해당 없음`.

## UI 설계

- 소스 기반 UI 설계 표면이 필요하면 route, 화면 이름, 주요 표시 정보, 상태별 story 위치를 작성한다. 해당 없음이면 `해당 없음`.

## UI 설계 검토 표면

- Storybook 검토 표면이 필요하면 `Title: StateA, StateB` 형식으로 작성한다. 해당 없음이면 `해당 없음`.

## 의사결정 로그

- 결정일: YYYY-MM-DD
  결정: 무엇을 결정했는가.
  이유: 왜 그렇게 결정했는가.
  결정자: Product Owner, Tech Lead
  영향: 범위, AC, 시나리오, 테스트, 관련 요건에 어떤 영향이 있는가.

## 수용 테스트 리뷰

시나리오 문서는 `app/docs/scenarios/REQ-XXX-*.feature` 또는 `harness/docs/scenarios/REQ-XXX-*.feature`에 Gherkin 형식으로 별도로 작성하고 승인한다. 이 섹션에는 요건 단위 설계 승인 이력과 전체 테스트 리뷰 결과만 요약한다.

- 시나리오 문서: `app/docs/scenarios/REQ-000-feature.feature` 또는 `harness/docs/scenarios/REQ-000-feature.feature`

### 요건 설계 승인 이력

- 설계일: YYYY-MM-DD
  검증 설계: `.feature`의 Scenario들이 모든 수용 기준을 `Covers:`로 다루는지 확인 완료 여부.
  API 설계: 엔드포인트, 요청/응답 DTO, 상태 코드, 오류 코드. 해당 없음이면 `해당 없음`.
  DB 설계: 변경되는 Entity/컬럼/관계, `previewSchema` 확인 결과. 해당 없음이면 `해당 없음`.
  UI 설계: 화면 이름, route, 접근 권한, 주요 표시 정보, 상태별 story 위치. 해당 없음이면 `해당 없음`.
  검사기 설계: collector/validator/reporter/gate 변경. 해당 없음이면 `해당 없음`.
  추적 정책: AC 마커, 관련 요건, 대체 요건, RED/GREEN/BLUE 판정 영향.
  검증: 실행한 명령과 결과.
  승인자: Product Owner, Tech Lead
  설계 결과: 승인 또는 수정 요청

### 테스트 리뷰

- 리뷰일: YYYY-MM-DD
  리뷰자: Product Owner, Tech Lead, QA
  확인: 모든 수용 기준이 `@Covers` 또는 FE `Covers`로 커버되고, 같은 요건의 `.feature` 시나리오 `Covers:`와 연결됨. 정상/예외/경계 조건과 API/UI/E2E/STATIC 채널별 검증이 충분함.
  결과: 미완료 | 승인 | 수정 필요

## 열린 질문

- 없음
