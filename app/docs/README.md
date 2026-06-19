# Application Docs

이 폴더에는 애플리케이션 명세와 구현 표준만 둔다.

- `requirements/`: 애플리케이션 요건 카드
- `change-sets/`: 애플리케이션 작업 범위
- `scenarios/`: 애플리케이션 BDD 시나리오
- `standards/`: API, JPA, FE, 런타임 구현 표준

저장소 공통 Git/PR 워크플로우 표준은 현재 `standards/git-workflow.md`에 둔다. 이 문서는 애플리케이션 구현 표준이 아니라 브랜치, 커밋, PR 본문 규약을 정하는 공통 협업 표준이다.

하네스 운영 문서와 하네스 요건은 `harness/docs`에 둔다.

원칙은 다음과 같다.

- 관리 ID는 `REQ-001` 같은 요건 ID만 사용한다.
- 별도 시나리오 ID, API ID, 화면 ID는 만들지 않는다.
- API 연결은 `app/back-end` 컨트롤러의 `@Requirement`에서 추출한다.
- FE 화면/라우팅/테스트 연결은 `app/front-end/tools/source-index.mjs`가 생성하는 `build/app/indexes/front-end.source-index.json`에서 추출한다.
- 테스트 연결은 백엔드 Acceptance Test의 `@Requirement`/`@Covers`, Storybook Vitest story의 `requirements`/`covers`, live Playwright 테스트의 `Requirement`/`Covers` 메타데이터에서 추출한다.
- 수용 기준 문장은 테스트의 `@Covers` 또는 `Covers` 값과 일치해야 한다.

요건 카드의 구현 여부는 카드 전체가 아니라 `수용 기준` 커버리지로 판단한다.
