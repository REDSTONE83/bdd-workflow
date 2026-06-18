# Change Set: 2026-06-19 Change Set 중복 검증 명령 key 보정

상태: 완료
요청일: 2026-06-19
변경 유형: 하네스 수정
영향 요건: REQ-034
논의 상태: 없음

## 요청 요약

- 실제 개발 서버에서 application 범위 정보를 확인하던 중 Change Set 상세의 검증 명령 목록에 동일 명령이 반복될 때 React list key 경고가 발생했다.

## 작업 범위

- Change Set 상세의 문자열 목록 렌더링 key를 항목 값 단독이 아니라 항목 값과 위치 조합으로 생성해 중복 문자열을 허용한다.

## 제외 범위

- Change Set 산출물 생성 방식 변경.
- 중복 검증 명령 자체의 병합 또는 정규화.

## 완료 조건

- 동일 검증 명령이 한 Change Set 상세에 반복되어도 React 중복 key 경고가 발생하지 않는다.
- application 범위 Change Set 화면이 실제 API 데이터로 조회된다.

## 검증 명령

- `cd harness/ui && npm run typecheck`
- `cd harness/ui && npm run test`

## 결정 로그

- 2026-06-19: 검증 명령은 Change Set 작성 의도상 반복될 수 있으므로 데이터에서 제거하지 않고 UI 렌더링 key만 안정화한다.

## 열린 논의

- 없음
