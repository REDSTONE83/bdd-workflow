# Requirement Cards

이 폴더에는 사람이 직접 관리하는 요건 카드만 둔다.

하네스 전체 운영 규칙은 루트 `AGENTS.md`를 기준으로 한다. 구조 설명은 `docs/harness/overview.md`, 전체 폴더 구조는 `docs/harness/project-structure.md`, 질문 기반 작성 절차는 `docs/harness/requirement-authoring.md`, 새 요건 작성 양식은 `docs/templates/requirement-card.md`를 사용한다. 템플릿 폴더 설명은 `docs/templates/README.md`에 둔다.

원칙은 다음과 같다.

- 관리 ID는 `REQ-001` 같은 요건 ID만 사용한다.
- 별도 시나리오 ID와 API ID는 만들지 않는다.
- API 연결은 컨트롤러의 `@Requirement`에서 추출한다.
- 테스트 연결은 Acceptance Test의 `@Requirement`와 `@Covers`에서 추출한다.
- 수용 기준 문장은 테스트의 `@Covers` 값과 일치해야 한다.

요건 카드의 구현 여부는 카드 전체가 아니라 `수용 기준` 커버리지로 판단한다.
