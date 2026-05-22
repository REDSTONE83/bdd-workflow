# Templates

새 문서 작성에 사용하는 템플릿을 둔다.

- `requirement-card.md`: 구현 대상, 범위/제외 범위, 표준 용어, 수용 기준, 의사결정 로그, BDD 테스트 리뷰(요건 Skeleton 승인 이력 + 테스트 리뷰), 열린 질문을 포함한 요건 카드 템플릿
- `scenario-feature.feature`: Gherkin BDD 시나리오 문서 템플릿. `@REQ-XXX` 태그, `Feature` / `Scenario` / `Covers:` / `Given/When/Then`을 포함한다. Gherkin 키워드는 영어로 적고 본문은 한국어로 둔다 (`# language: ko` 지시자 사용 안 함). `docs/scenarios/REQ-XXX-*.feature`로 복사해 사용한다.

템플릿의 필수 항목은 루트 `AGENTS.md`의 요건 카드 규칙과 맞춰 관리한다.
