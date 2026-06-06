# Change Set: 상위 요건 통합 스모크 테스트 구성

상태: 완료
요청일: 2026-06-05
변경 유형: 수정
영향 요건: REQ-015, REQ-021
논의 상태: 없음

## 요청 요약

- 상위 요건의 E2E 대상을 실 백엔드와 실 프런트엔드가 함께 동작하는 통합 스모크 테스트로 구성한다.

## 작업 범위

- 상위 요건의 E2E 수용 기준을 실 백엔드와 실 프런트엔드가 함께 동작하는 Playwright 스모크 테스트로 검증한다.
- 기존 mock 기반 FE E2E는 세부 화면 회귀 테스트로 유지하고, 상위 요건 커버리지 원천에서는 제외한다.
- live Playwright 결과 파일을 애플리케이션 test-results index에 합쳐 trace/gate가 실행 결과를 읽게 한다.
- 상위 `(E2E)` AC의 FE 커버가 live spec에만 머물고, live spec이 mock helper를 import하지 않도록 하네스 검증 규칙을 추가한다.

## 제외 범위

- 할 일 관리 화면 본문 구현.
- 모든 FE E2E를 실서버 테스트로 전환.
- 운영 배포용 reverse proxy 또는 HTTPS 구성.

## 완료 조건

- `REQ-015`와 `REQ-021`의 상위 요건 E2E AC가 live Playwright 결과로 PASS 판정된다.
- `npm run app:validate`가 mock E2E와 live smoke를 함께 실행한다.
- `validate-front-end-standards`가 상위 E2E AC의 mock spec 커버와 live spec mock helper import를 error로 차단한다.

## 검증 명령

- `npm run e2e`
- `npm run e2e:live`
- `npm run app:trace -- --requirement REQ-015`
- `npm run app:trace -- --requirement REQ-021`
- `npm run app:validate`

## 결정 로그

- 상위 요건 E2E 커버리지는 mock API가 아니라 live Playwright smoke spec이 소유한다.
- `REQ-021`은 2026-06-05 기준으로 할 일 화면 본문이 아직 범위 밖이므로, 브라우저 로그인 세션에서 FE origin proxy를 통해 `/todos` API 생명주기를 검증한다.
- 2026-06-06 할 일 화면 본문이 구현되면서 `REQ-021` live smoke를 화면 조작 여정으로 승격한다.
- `TodoLifecycleApiAcceptanceTest`는 `REQ-021` trace에서 제외하고 API 생명주기 회귀 테스트로만 유지한다.

## 열린 논의

- 없음
