# Requirement Cards

이 폴더에는 사람이 직접 관리하는 요건 카드만 둔다.

루트 `AGENTS.md`는 인덱스다. 본문 규칙은 다음 폴더로 분기한다.

- `docs/standards/`: 사람이 정한 구현 표준 (요건 카드, API, Entity, FE, 테스트, 용어). 진입점은 `docs/standards/README.md`.
- `docs/harness/overview.md`: 하네스 구조와 상태 판정.
- `docs/harness/project-structure.md`: 전체 폴더 구조.
- `docs/harness/requirement-authoring.md`: 질문 기반 작성 절차.
- `docs/templates/requirement-card.md`: 새 요건 작성 양식. 폴더 설명은 `docs/templates/README.md`.

원칙은 다음과 같다.

- 관리 ID는 `REQ-001` 같은 요건 ID만 사용한다.
- 별도 시나리오 ID, API ID, 화면 ID는 만들지 않는다.
- API 연결은 컨트롤러의 `@Requirement`에서 추출한다.
- FE 화면/라우팅/테스트 연결은 `front-end/tools/source-index.mjs`가 생성하는 `build/harness/indexes/front-end.source-index.json`에서 추출한다.
- 테스트 연결은 Acceptance Test의 `@Requirement`/`@Covers`와 FE BDD 테스트의 `Requirement`/`Covers` 메타데이터에서 추출한다.
- 수용 기준 문장은 테스트의 `@Covers` 값과 일치해야 한다.

요건 카드의 구현 여부는 카드 전체가 아니라 `수용 기준` 커버리지로 판단한다.
