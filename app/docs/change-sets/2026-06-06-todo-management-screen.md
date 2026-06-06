# Change Set: 2026-06-06 할 일 관리 화면 기능별 요건 구현

상태: 완료
요청일: 2026-06-06
변경 유형: 신규, 수정
영향 요건: REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-027, REQ-011
논의 상태: 없음

## 요청 요약

- 사용자가 `/todos` 보호 화면에서 자신의 할 일을 보고 만들고 수정하고 삭제하며 완료 상태를 바꿀 수 있는 관리 화면을 추가한다.
- 화면 전용 신규 요건을 두지 않고, 카테고리 관리 구조와 같이 할 일 생성/목록/수정/삭제/완료 상태 원자 요건에 API와 UI 수용 기준을 함께 둔다.

## 작업 범위

- `REQ-022`, `REQ-023`, `REQ-024`, `REQ-025`, `REQ-027`에 기능별 UI 수용 기준과 BDD 시나리오를 추가한다.
- `REQ-021` 상위 live smoke를 API fetch 중심 검증에서 화면 조작 여정으로 승격한다.
- 기존 `/todos` placeholder를 할 일 관리 화면 컨테이너로 교체한다.
- FE API 경계 모듈, TanStack Query 서버 상태 훅, 화면 컴포넌트, Storybook 상태를 추가한다.
- mock API 기반 Playwright FE BDD 테스트로 기능별 화면 수용 기준을 검증한다.

## 제외 범위

- 할 일 API 계약 변경.
- 백엔드 도메인 로직 변경.
- 검색, 필터, 사용자 지정 정렬.
- 모바일/태블릿 전용 레이아웃 최적화.
- 별도 화면 전용 신규 요건 유지.

## 완료 조건

- 할 일 원자 요건의 모든 UI 수용 기준이 FE BDD 테스트의 `Covers` 메타데이터와 연결된다.
- `REQ-021` 상위 E2E 수용 기준이 실서버 화면 조작 live smoke와 연결된다.
- `/todos` 경로가 보호 앱 셸 안의 실제 할 일 관리 화면을 표시한다.
- `npm run app:validate`가 통과한다.

## 검증 명령

- `npm run app:trace -- --requirement REQ-021`
- `npm run app:trace -- --requirement REQ-022`
- `npm run app:trace -- --requirement REQ-023`
- `npm run app:trace -- --requirement REQ-024`
- `npm run app:trace -- --requirement REQ-025`
- `npm run app:trace -- --requirement REQ-027`
- `npm run app:test`
- `npm run app:e2e`
- `npm run app:validate`

## 결정 로그

- 할 일 관리 화면은 기존 보호 앱 셸의 `/todos` 경로를 그대로 사용한다.
- 목록은 기존 `GET /todos` 페이지 API를 한 묶음 20개 무한 로드로 소비한다.
- 생성/수정은 모달 폼으로 처리하고 삭제는 확인 모달로 처리한다.
- 완료 상태는 목록 항목의 체크박스로 즉시 토글한다.
- 카테고리 선택지는 기존 `GET /categories` 첫 묶음 100개를 불러와 제공한다.
- 할 일 화면 UI 수용 기준은 별도 화면 카드가 아니라 `REQ-022`, `REQ-023`, `REQ-024`, `REQ-025`, `REQ-027`에 기능별로 둔다.

## 열린 논의

- 없음
