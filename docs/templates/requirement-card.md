# 요건 카드

요건 ID: REQ-000
제목: 요건 제목
우선순위: 높음
상태: 초안

## 사용자/목적

사용자는 어떤 목적을 달성해야 하는가.

## 범위

- 포함할 동작을 작성한다.

## 표준 용어

- domain.concept

`docs/terminology/`에 정의된 term key만 적는다. 검색은 `node back-end/tools/terminology.mjs search <표현>`을 사용한다. 새 용어가 필요하면 `node back-end/tools/terminology.mjs draft add ...`로 후보를 등록한 뒤 key를 적는다 (`draft.json`은 직접 편집하지 않는다). draft 상태는 `validateHarness`(safe)는 통과하지만 `validateTerminologyStrict`에서는 error로 잡힌다.

## 제외 범위

- 이번 요건에서 제외할 동작을 작성한다.

## 수용 기준

- 첫 번째 수용 기준을 작성한다
- 두 번째 수용 기준을 작성한다
- 목록 조회 API가 포함되면 page/size 요청에 따른 content 슬라이스와 page/size/totalElements/totalPages 메타데이터 수용 기준을 반드시 작성한다

## 의사결정 로그

- 결정일: YYYY-MM-DD
  결정: 무엇을 결정했는가.
  이유: 왜 그렇게 결정했는가.
  결정자: Product Owner, Tech Lead
  영향: 구현과 검증에 어떤 영향이 있는가.

## BDD 테스트 리뷰

시나리오 문서는 `docs/scenarios/REQ-XXX-*.feature`에 Gherkin 형식으로 별도로 작성하고 승인한다. 이 섹션에는 시나리오 단위 Mock-up 승인 이력과 전체 테스트 리뷰 결과만 요약한다.

- 시나리오 문서: `docs/scenarios/REQ-000-feature.feature`

### 시나리오 승인 이력

각 시나리오마다 한 블록씩 추가한다. AC가 모두 커버될 때까지 시나리오를 늘려나간다.

- 승인일: YYYY-MM-DD
  시나리오: `.feature`의 `Scenario:` 제목. 업무 언어로 작성하며 AC 문장을 그대로 복사하지 않는다.
  연결 AC: 이 시나리오가 검증하는 수용 기준 문장 목록 (`.feature`의 `Covers:` 블록과 동일).
  API Mock-up: 엔드포인트, 요청/응답 예시, 상태 코드, 오류 코드. 확인 완료 여부.
  DB Mock-up: 변경되는 Entity/컬럼/관계. `previewSchema` 확인 완료 여부.
  승인자: Product Owner, Tech Lead
  Mock-up 결과: 승인 또는 수정 요청

### 테스트 리뷰

- 리뷰일: YYYY-MM-DD
  리뷰자: Product Owner, Tech Lead, QA
  확인: 모든 수용 기준이 승인된 `.feature` 시나리오와 `@Covers`로 커버, 각 BDD 테스트의 `@DisplayName`이 승인된 `Scenario:` 제목과 일치, 정상/예외/경계 조건 커버, 목록 API의 페이징 AC/테스트 포함.
  결과: 미완료, 승인, 또는 수정 필요.

## 열린 질문

- 없음

질문이 남아 있으면 한 번에 하나씩 둔다. 선택지형 질문을 우선 사용하고, 정량 기준은 후보값과 직접 입력 여지를 함께 적는다.
