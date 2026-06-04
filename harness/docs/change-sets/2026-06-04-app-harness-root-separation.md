# Change Set: 앱/하네스 최상위 루트 분리

상태: 완료
요청일: 2026-06-04
변경 유형: 분리, 마이그레이션, 하네스 개선
영향 요건: REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-012
논의 상태: 없음

## 요청 요약

- 애플리케이션과 하네스의 테스트, 리포트, 명령, 문서, 소스 루트를 최상위에서 분리한다.
- 애플리케이션 검증과 하네스 검증을 같은 workflow 안에서 섞지 않고 별도 레인으로 운영한다.

## 작업 범위

- `app/` 아래에 애플리케이션 문서, 백엔드, 프런트엔드 소스를 둔다.
- `harness/` 아래에 하네스 문서, 도구, annotations, source-indexer, self-test를 둔다.
- 루트 npm scripts를 `app:*`, `harness:*`, `repo:*`로 분리한다.
- 앱 리포트는 `build/app`, 하네스 리포트는 `build/harness` 아래에 생성한다.
- 하네스 self-test가 앱 생성 파일을 직접 갱신하지 않도록 fixture 기반 검증으로 바꾼다.

## 제외 범위

- 요건 ID 체계(`REQ-XXX`) 변경.
- 별도 monorepo 패키지 매니저 workspace 도입.

## 완료 조건

- `npm run app:validate`가 앱 요건과 앱 테스트/리포트만 처리한다.
- `npm run harness:validate`가 하네스 요건과 하네스 self-test/리포트만 처리한다.
- `npm run repo:validate`가 두 검증을 명시적으로 순차 실행한다.
- `build/app`과 `build/harness` 산출물이 서로 섞이지 않는다.
- 루트 `back-end/`, `front-end/`, `docs/requirements`, `docs/scenarios`, `docs/change-sets` 직접 경로가 더 이상 운영 경로가 아니다.

## 검증 명령

- `npm run harness:self-test`
- `npm run harness:validate`
- `npm run app:validate`
- `npm run repo:validate`
- `git diff --check`

## 결정 로그

- `REQ-XXX` ID는 전역 유일 ID로 유지하고, 소유권은 경로와 `대상 시스템`으로 구분한다.
- 애플리케이션 구현 표준은 `app/docs/standards`, 하네스 추적/카드/용어 표준은 `harness/docs/standards`에 둔다.
- 루트 `validate`/`trace` alias는 제거한다. 사용자는 `app:*`, `harness:*`, `repo:*` 중 하나를 명시해야 한다.

## 열린 논의

- 없음
