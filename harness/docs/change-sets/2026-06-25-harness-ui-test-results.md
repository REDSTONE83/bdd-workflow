# Change Set: 2026-06-25 하네스 UI 테스트 결과 조회

상태: 완료
요청일: 2026-06-25
변경 유형: 신규, 하네스 개선
영향 요건: REQ-039
논의 상태: 없음

## 요청 요약

- 하네스 UI에서 선택한 범위의 테스트 목록과 수행 결과를 확인할 수 있는 메뉴 화면을 추가한다.
- API, UI, UNIT, E2E와 같은 테스트 구분을 표시하고, 결과 위치 표시를 삭제하며, Cover 문구와 연결된 요건을 `ID - 제목` 형태로 정확히 표시한다.
- API 테스트의 구현 위치와 연결 요건은 백엔드 테스트 source index를 기준으로 정확히 표시한다.

## 작업 범위

- REQ-039 요건 카드와 수용 시나리오를 추가한다.
- 하네스 UI 서버가 backend/front-end/self-test source index와 test-results index에서 테스트 결과 DTO를 만든다.
- AppShell 좌측 LNB에 테스트 결과 메뉴와 `/tests` route를 추가한다.
- 테스트 상태 요약, 테스트 구분별 요약/그룹, 검색/구분/런타임/상태 필터, 테스트 목록형 카드, freshness 이슈 목록을 구현한다.
- 테스트 행과 freshness 이슈에서 결과 XML/JSON 위치는 표시하지 않는다. source index 정의가 없는 result-only 행은 구현 위치 없음으로 표시한다.
- API 테스트 JUnit 결과는 `ClassName.DisplayName` 키로 백엔드 테스트 정의와 매칭해 테스트 코드 위치와 요건을 표시한다.
- 연결 요건과 Cover 연결 요건은 trace state의 제목을 결합해 `REQ-XXX - 제목` 형태로 표시한다.
- 테스트 카드의 식별자 상세 영역은 표시하지 않는다.
- Storybook 상태, 단위 테스트, 하네스 self-test로 화면과 서버 DTO 계약을 검증한다.

## 제외 범위

- 테스트 실행 액션.
- 테스트 결과 파일 생성·수정·삭제.
- 테스트 성공/실패 판정 재계산.
- 시간순 실행 이력 또는 추세 분석.

## 완료 조건

- `/tests` 화면에서 테스트 목록과 수행 결과를 조회할 수 있다. ✓
- PASS/FAIL/SKIP/NOT_RUN 요약이 표시된다. ✓
- API/UI/UNIT/E2E 등 테스트 구분 요약, 그룹, 필터가 표시된다. ✓
- 검색어, 테스트 구분, 런타임, 수행 상태로 테스트 목록을 좁힐 수 있다. ✓
- 결과 위치는 테스트 카드와 freshness 이슈에 표시되지 않는다. ✓
- API 테스트의 구현 위치는 Java 테스트 메서드 위치로 표시되고 연결 요건은 `ID - 제목`으로 표시된다. ✓
- Cover 문구와 연결된 요건이 `ID - 제목` 형태로 표시된다. ✓
- 식별자 상세, 테스트 식별자, 결과 식별자는 테스트 카드에 표시되지 않는다. ✓
- freshness 이슈가 있으면 화면에 표시된다. ✓
- UI 서버 DTO가 source index와 test-results index의 테스트 구분, 요건 ID와 제목, 구현 위치 값을 보존한다. ✓
- `cd harness/ui && npm run typecheck && npm run test`와 `npm run harness:self-test`를 통과한다. ✓

## 검증 명령

- `cd harness/ui && npm run typecheck`
- `cd harness/ui && npm run test`
- `cd harness/ui && npm run test:storybook`
- `npm run harness:self-test`
- `npm run harness:trace -- --requirement REQ-039`
- `npm run harness:validate`

## 검증 결과

- 2026-06-25: `cd harness/ui && npm run typecheck` 통과.
- 2026-06-25: `cd harness/ui && npm run test` 통과(19 files, 50 tests).
- 2026-06-25: `cd harness/ui && npm run test:storybook` 통과(11 files, 85 tests). sandbox 포트 바인딩 제한으로 권한 상승 후 실행했다.
- 2026-06-25: `npm run app:source-index` 통과. backend source index의 API 테스트 행에 Java 테스트 파일과 method line이 생성됨을 확인했다.
- 2026-06-25: `npm run app:trace -- --requirement REQ-011` 통과. REQ-011 상태 BLUE, gate pass filter=REQ-011.
- 2026-06-25: `npm run harness:self-test` 통과(67 tests).
- 2026-06-25: `/api/tests?scope=application` 응답에서 API 테스트가 `source=back-end`, Java 테스트 코드 위치, `REQ-011 - 이메일·비밀번호 로그인과 로그아웃` 연결 요건, Cover 연결 요건으로 표시됨을 확인했다.
- 2026-06-25: 브라우저에서 `http://127.0.0.1:5180/tests` application scope의 API 필터 화면을 확인했고, 테스트 구분 그룹과 `REQ-011 - 제목`, Java 테스트 코드 위치, `Cover 1개`, 결과 XML/JSON 위치와 식별자 상세 미표시를 확인했다.
- 2026-06-25: `npm run harness:trace -- --requirement REQ-039` 통과. REQ-039 상태 BLUE, 카드 구조 오류 0.
- 2026-06-25: `npm run harness:validate` 통과. gate pass.

## 결정 로그

- 2026-06-25: 테스트 결과 화면은 새 테스트 수집 규칙을 만들지 않고 기존 `backend.source-index.json`, `front-end.source-index.json`, `harness.self-test.index.json`, `test-results.index.json`을 읽는다.
- 2026-06-25: source index 정의와 result index 항목이 매칭되지 않은 source 테스트는 NOT_RUN으로 표시하고, source 정의가 없는 result 항목은 result 기반 행으로 표시한다.
- 2026-06-25: 백엔드 JUnit 결과는 Gradle XML의 표시명 기반 identity와 backend source index의 `className.displayName` 대체 키로 매칭한다.

## 열린 논의

- 없음
