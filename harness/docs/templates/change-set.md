# Change Set: YYYY-MM-DD 작업 제목

상태: 계획 | 진행중 | 완료 | 보류
요청일: YYYY-MM-DD
변경 유형: 신규 | 수정 | 분리 | 병합 | 대체 | 폐기 | 마이그레이션 | 하네스 개선
영향 요건: 없음 또는 REQ-001, REQ-002
논의 상태: 없음 또는 열린 논의 요약

## 요청 요약

- 사용자 요청을 한두 문장 또는 bullet로 요약한다.

## 작업 범위

- 이번 요청으로 함께 바꿀 산출물과 의도를 적는다.

## 제외 범위

- 이번 Change Set에서 하지 않을 일을 적는다.

## 완료 조건

- 완료로 볼 조건을 적는다.

## 검증 명령

- `npm run app:trace -- --requirement REQ-XXX` 또는 `npm run harness:trace -- --requirement REQ-XXX`
- `npm run app:validate` 또는 `npm run harness:validate`

## 결정 로그

- YYYY-MM-DD: 결정 내용과 이유

## 열린 논의

- 없음
