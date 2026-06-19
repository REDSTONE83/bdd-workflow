# Change Set: 2026-06-18 PR 워크플로우 표준 참조 보완

상태: 완료
요청일: 2026-06-18
변경 유형: 하네스 개선, 표준 개정
영향 요건: 없음
논의 상태: 없음

## 요청 요약

- PR 생성 시 저장소의 Git 워크플로우 표준을 먼저 참조하지 않아 PR 본문이 표준의 `요약 / 변경 사항 / 검증 / 후속` 구조를 따르지 못했다.
- 원인은 PR 생성 작업을 단순 GitHub 명령 실행으로 처리한 점, PR 본문 표준이 `app/docs/standards` 아래 있어 하네스 작업 중 저장소 공통 표준으로 인식하기 어려웠던 점, `.github/pull_request_template.md`나 PR 본문 검사 같은 강제 장치가 없었던 점이다.
- 이후 PR 생성·수정 작업에서 표준 참조가 자연스럽고 반복 가능하도록 작업 절차, 표준 위치/링크, PR 템플릿을 보완한다.

## 작업 범위

- `AGENTS.md`의 Git/PR 작업 절차에 PR 생성 또는 PR 본문 수정 전 `CONTRIBUTING.md`를 반드시 확인한다는 규칙을 추가한다.
- Git/PR 워크플로우 표준 원문을 루트 `CONTRIBUTING.md`로 옮기고 기존 `app/docs/standards/git-workflow.md`는 호환 링크 문서로 유지한다.
- 표준 문서 인덱스가 PR 본문 규약의 위치를 명확히 가리키도록 갱신한다.
- `.github/pull_request_template.md`를 추가해 PR 생성 화면에서 `요약`, `변경 사항`, `검증`, `후속` 섹션과 RED/GREEN/BLUE 요약, 영향 요건, Change Set 링크를 기본 입력 항목으로 제공한다.
- 필요한 경우 후속 단계에서 `harness/tools`에 PR 본문 검사 또는 생성 보조 도구를 둘지 검토한다. 이 Change Set의 1차 보완은 문서와 템플릿으로 제한한다.

## 제외 범위

- 현재 열린 PR의 코드 변경 범위 수정. 이미 생성된 PR 본문은 수동으로 보완했고, 이 Change Set은 재발 방지용 후속 작업을 다룬다.
- GitHub Actions 또는 브랜치 보호 규칙으로 PR 본문을 강제 차단하는 작업. 자동 차단은 문서/템플릿 보완 이후 별도 Change Set에서 결정한다.
- 하네스 UI 설계·구현 시 `app/docs/standards/*`를 참조하지 않는다는 기존 하네스 UI 표준 변경. 이번 보완은 Git/PR 공통 워크플로우 표준 참조에 한정한다.
- 생성 산출물(`build/*`, `storybook-static`, `test-results`) 변경.

## 완료 조건

- PR 생성/수정 작업 전에 참조해야 할 Git 워크플로우 표준이 `AGENTS.md` 또는 동등한 작업 가이드에서 명시된다.
- PR 본문 규약이 저장소 공통 표준임이 문서 위치 또는 문서 본문에서 분명히 드러난다.
- `.github/pull_request_template.md`가 표준의 필수 섹션과 검증 항목을 기본 템플릿으로 제공한다.
- 문서 인덱스가 Git/PR 워크플로우 표준의 위치를 올바르게 가리킨다.
- `npm run harness:validate`가 통과하고 Change Set 형식 경고가 늘지 않는다.

## 검증 명령

- `npm run harness:trace`
- `npm run harness:validate`
- `gh pr view <PR번호> --json body,title,url`

## 검증 결과

- 2026-06-19: `AGENTS.md`에 PR 생성/수정 전 `CONTRIBUTING.md` 확인 절차를 추가했다.
- 2026-06-19: Git/PR 표준 원문을 `CONTRIBUTING.md`로 옮기고 `app/docs/standards/git-workflow.md`는 기존 링크 호환용 안내 문서로 유지했다.
- 2026-06-19: `app/docs/standards/README.md`, `app/docs/README.md`에 Git/PR 표준의 공통 위치를 명시했다.
- 2026-06-19: `.github/pull_request_template.md`를 추가해 표준의 필수 섹션과 검증 항목을 기본 입력 항목으로 제공한다.
- 2026-06-19: `npm run harness:trace` 통과. 하네스 요건은 `BLUE=16`, `RED=0`, `GREEN=0`, Change Set warning은 0건이다.
- 2026-06-19: `npm run harness:validate` 통과. tool-test 59건, Storybook Vitest 69건, self-test 61건이 모두 통과했다.

## 결정 로그

- 2026-06-18: PR 본문 표준은 앱 UI 또는 앱 구현 표준이 아니라 저장소 공통 Git/PR 워크플로우 표준으로 취급한다. 하네스 UI 설계에서 app 표준을 참조하지 않는다는 원칙과 충돌하지 않도록 표준의 성격과 위치를 명확히 한다.
- 2026-06-19: 표준 원문은 루트 `CONTRIBUTING.md`로 이동한다. `app/docs/standards/git-workflow.md`에 원문을 두면 디렉터리 구조만 보고 앱 구현 표준으로 오판할 여지가 남기 때문이다.
- 2026-06-18: 1차 보완은 문서와 PR 템플릿으로 처리한다. PR 본문 자동 검사나 생성 도구는 유용하지만, 먼저 사람이 PR 생성 시 보는 기본 경로를 바로잡는 것이 비용 대비 효과가 크다.
- 2026-06-18: PR 생성 명령을 실행하기 전 표준 파일을 읽는 절차를 작업 가이드에 명시한다. 도구 실행만으로는 표준 적용 여부가 보장되지 않기 때문이다.

## 열린 논의

- 없음
