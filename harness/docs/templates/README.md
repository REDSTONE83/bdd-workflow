# Templates

새 문서 작성에 사용하는 템플릿을 둔다.

- `requirement-card.md`: 새 카드 메타데이터(요건 종류, 명세 역할, 대상 시스템, 제품 영역, 품질 속성, 검증 수준, 관련/대체 요건), 범위/제외 범위, 표준 용어, 마커가 붙은 수용 기준, 의사결정 로그, BDD 테스트 리뷰(요건 Skeleton 승인 이력 + 테스트 리뷰), 열린 질문을 포함한 요건 카드 템플릿
- `change-set.md`: 사용자 요청 단위 작업 범위 템플릿. 별도 사람이 관리하는 ID 없이 파일 경로를 identity로 쓰며, 영향 요건, 작업 범위, 완료 조건, 검증 명령, 열린 논의를 포함한다.
- `scenario-feature.feature`: Gherkin BDD 시나리오 문서 템플릿. `@REQ-XXX` 태그, `Feature` / `Scenario` / `Covers:` / `Given/When/Then`을 포함한다. Gherkin 키워드는 영어로 적고 본문은 한국어로 둔다 (`# language: ko` 지시자 사용 안 함). `app/docs/scenarios/REQ-XXX-*.feature` 또는 `harness/docs/scenarios/REQ-XXX-*.feature`로 복사해 사용한다.

템플릿의 필수 항목은 루트 `AGENTS.md`의 요건 카드 규칙과 맞춰 관리한다.
