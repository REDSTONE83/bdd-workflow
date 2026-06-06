# Change Set: 2026-06-06 FE 테스트 결과 freshness 정책 표준 반영

상태: 진행중
요청일: 2026-06-06
변경 유형: 수정
영향 요건: REQ-005
논의 상태: 없음

## 요청 요약

- Playwright canonical 결과 freshness 게이트 정책을 app 소유 FE 테스트 표준에 반영한다.
- 정책·검사기·wrapper 구현은 harness 짝 Change Set이 다루고, 이 카드는 app 표준 문서 반영만 다룬다: [harness: Playwright canonical 결과 freshness 게이트](../../../harness/docs/change-sets/2026-06-06-playwright-result-freshness.md).

## 작업 범위

- `app/docs/standards/front-end-testing.md`에 canonical Playwright 결과 freshness 정책을 반영한다.
  - canonical 결과는 sidecar manifest fingerprint가 현재 FE BDD source fingerprint와 일치할 때만 AC 커버 결과로 인정된다.
  - `Covers` metadata 변경 후에는 canonical E2E(`npm run app:e2e`, `npm run app:e2e:live`)를 재실행해야 stale이 해소된다.
  - stale 또는 manifest 누락 결과는 AC 커버 PASS로 인정되지 않고, 해당 FE BDD 결과는 trace에서 `NOT_RUN`/`MISSING`으로 계산된다.
  - `e2e-results.partial.json`은 canonical trace/gate 입력이 아니다.

## 제외 범위

- freshness manifest·fingerprint·`FE-TEST-RESULT-STALE` finding·e2e wrapper·인덱서/검사기 구현. → harness 짝 카드.
- `harness/docs/standards/acceptance-test.md` 반영. → harness 짝 카드.
- 테스트 시나리오 내용 변경, 화면 기능 변경.

## 완료 조건

- `app/docs/standards/front-end-testing.md`가 canonical 결과 freshness 정책과 stale 해소 절차(재실행 명령)를 설명한다.
- harness 짝 카드의 정책 설명과 모순되지 않는다.

## 검증 명령

- `npm run app:validate`

## 결정 로그

- freshness 정책의 원천은 harness 카드이고, app 표준 문서는 FE 작성자 관점의 절차(stale 해소 재실행 명령 등)만 반영한다.
- 영향 요건 REQ-005(front-end foundation/테스트 표준)는 수용 기준이 바뀌지 않는다. FE 테스트 표준 문서가 영향을 받아 regression 확인 대상이다.

## 열린 논의

- 없음
