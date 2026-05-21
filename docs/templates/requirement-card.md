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

## 확인 질문 로그

- 질문일: YYYY-MM-DD
  질문: 사용자에게 확인한 내용.
  답변: 사용자 답변.
  반영: 범위, 제외 범위, 수용 기준, 의사결정 로그 중 어디에 반영했는가.

## 수용 기준

- 첫 번째 수용 기준을 작성한다
- 두 번째 수용 기준을 작성한다

## 의사결정 로그

- 결정일: YYYY-MM-DD
  결정: 무엇을 결정했는가.
  이유: 왜 그렇게 결정했는가.
  결정자: Product Owner, Tech Lead
  영향: 구현과 검증에 어떤 영향이 있는가.

## BDD 테스트 리뷰

- 리뷰일: YYYY-MM-DD
  리뷰자: Product Owner, Tech Lead, QA
  확인: 수용 기준과 `@Covers` 일치 여부, 정상/예외/경계 조건 커버 여부.
  결과: 미완료, 승인, 또는 수정 필요.

## 열린 질문

- 없음
