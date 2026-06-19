# Git 워크플로 표준

브랜치, 커밋, PR 규약을 둔다. 이 문서는 애플리케이션 구현 표준이나 하네스 표준이 아니라 저장소 공통 협업 표준이다. 앱 작업과 하네스 작업 모두 PR 생성 또는 PR 본문 수정 전에 이 문서를 확인한다.

이 표준은 하네스 자동 검증 대상이 **아니다**(게이트 입력이 아님). PR 리뷰에서 수동으로 확인한다. 요건 완료 판정은 여전히 카드 수용 기준 커버리지와 scope별 validate 명령으로 한다.

## 브랜치

- `main`은 보호 브랜치다. 직접 커밋하지 않고, 항상 작업 브랜치를 만든 뒤 PR로 머지한다.
- 브랜치 이름은 `<type>/<요건ID-요약>` 형식을 권장한다.
  - 예: `feat/req-013-email-signup-screen`, `fix/req-011-login-alert`
  - `type`: `feat`, `fix`, `refactor`, `docs`, `test`, `chore` 중 하나.
- 머지된 작업 브랜치는 로컬·원격 모두 정리하고, 로컬 `main`을 최신화한다.

## 커밋 메시지

- 제목 한 줄 + 빈 줄 + 본문. 제목 형식은 `<type>(<요건ID>): <요약>`.
  - 예: `feat(REQ-013): 이메일 회원 가입 화면 구현`
  - 요건과 무관한 변경(빌드 설정 등)은 `(<요건ID>)`를 생략한다.
- 본문은 "무엇을/왜"를 적는다. "어떻게"는 코드가 말한다.
- 마지막 줄에 공동 작성자 푸터를 둔다.

  ```text
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```

- 생성 산출물(`build/`, `app/front-end/dist`, `storybook-static`, `test-results`, `playwright-report`)은 커밋하지 않는다(`.gitignore` 유지).

## PR 본문

PR 하나는 가능하면 요건 카드 하나(또는 명확히 연관된 묶음)에 대응한다. 본문에 다음을 포함한다.

- **요약**: 무엇을 왜 했는지 1-3줄. 관련 요건 ID(`REQ-XXX`)와 카드/시나리오 경로.
- **변경 사항**: 구현, 표준, 테스트 등 주요 변경을 분류해 나열.
- **검증**: 실행한 게이트 결과를 그대로 적는다. 최소한 다음을 포함한다.
  - `npm run app:validate` 또는 `npm run harness:validate` 게이트 결과와 RED/GREEN/BLUE 요약
  - 영향 카드의 `npm run app:trace -- --requirement REQ-XXX` 또는 `npm run harness:trace -- --requirement REQ-XXX`
  - FE 변경이 있으면 `npm run e2e`, `npm run build-storybook`
- **후속**: 이번 PR에서 의도적으로 미룬 작업(후속 카드/이슈)을 명시.
- 관련 Change Set 경로와 영향 요건 목록을 본문에 포함한다. 영향 요건이 없으면 `영향 요건: 없음`을 명시한다.
- 다른 BLUE 요건의 기대(AC/시나리오/테스트)를 건드렸다면, 이관/변경 사실과 해당 카드 `의사결정 로그` 위치를 함께 적는다.
- 마지막 줄에 생성 푸터를 둔다.

  ```text
  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  ```

## 머지

- 모든 게이트가 통과한 상태(scope에 맞는 validate exit=0, 영향 카드가 BLUE이거나 카드에 명시된 의도된 상태)에서만 머지한다.
- 머지 후 [브랜치](#브랜치) 규칙대로 작업 브랜치를 정리한다.
