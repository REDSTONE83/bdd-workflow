# Change Set: 2026-06-18 하네스 UI live API 데이터 연결

상태: 진행중
요청일: 2026-06-18
변경 유형: 하네스 개선, 수정
영향 요건: REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036
논의 상태: 없음

## 요청 요약

- 하네스 UI가 서버 실행 중에도 fixture 데이터로만 동작하므로, Storybook에서만 fixture를 쓰고 실제 화면은 UI 서버 API를 통해 산출물 데이터를 조회하도록 개선한다.

## 작업 범위

- UI 서버에 요건 보드, 요건 상세, 게이트, Change Set, 명령 실행 화면용 API DTO를 추가한다.
- Vite dev server의 `/api/*` 요청을 같은 서버 핸들러로 연결해 `npm run harness:ui` 실행 화면이 실제 API를 호출하게 한다.
- page 컨테이너는 react-query 기반 API 호출을 사용하고, Storybook story는 프레젠테이션 컴포넌트에 fixture를 직접 넘기는 구조를 유지한다.
- 산출물 DTO 변환 함수 단위 테스트를 추가한다.

## 제외 범위

- 검증 명령의 실제 child process 실행 backend 구현.
- 하네스 UI의 원격 접근, 인증, 배포 서버 구성.
- Storybook fixture 상태 제거.

## 완료 조건

- 서버 실행 화면에서 `/api/requirements`, `/api/requirements/{id}`, `/api/gate`, `/api/change-sets`, `/api/command-runner`, `/api/terminology` 응답을 통해 화면 데이터가 채워진다.
- Storybook story는 계속 fixture 데이터로 독립 실행된다.
- `cd harness/ui && npm run typecheck`와 `cd harness/ui && npm run test`가 통과한다.

## 검증 명령

- `cd harness/ui && npm run typecheck`
- `cd harness/ui && npm run test`

## 결정 로그

- 2026-06-18: fixture는 Storybook 검토 상태에만 남기고, page 컨테이너는 API client와 react-query를 통해 UI 서버 DTO를 조회한다. 같은 컴포넌트를 Storybook과 live 화면이 공유하되 데이터 경계는 컨테이너에서 분리한다.
- 2026-06-18: UI 서버 DTO는 `trace.state.json`, `requirements.index.json`, `gate-report.json`, findings, `change-sets.index.json`, `terminology.index.json`을 얇게 정리하고 판정 값을 재계산하지 않는다.

## 열린 논의

- 없음
