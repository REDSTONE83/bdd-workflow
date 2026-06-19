# Change Set: 2026-06-19 앱 요건 카드 설계 표면 이관

상태: 완료
요청일: 2026-06-19
변경 유형: 마이그레이션, 수정
영향 요건: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-011, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027
논의 상태: 없음

## 요청 요약

- 하네스 Change Set `2026-06-18 요건 검증 워크플로우 용어와 설계 추출 전환 계획`에 맞춰 application 요건 카드의 legacy 섹션을 새 카드 표준으로 이관한다.
- 카드 본문에 사람이 복사해 둔 `검증 대상`, `API Skeleton`, `DB Skeleton`, `UI Skeleton`, `Storybook 계약`은 제거하고, API/DB/UI 설계 표면은 source index와 trace report 생성 산출물에서 확인한다.
- `BDD 테스트 리뷰` 섹션명은 `수용 테스트 리뷰`로 바꾸되, 기존 시나리오/테스트 리뷰 이력은 보존한다.

## 작업 범위

- app 요건 카드 21개에서 `## BDD 테스트 리뷰`를 `## 수용 테스트 리뷰`로 치환한다.
- 수작업 설계 표면 섹션이 남아 있는 app 요건 카드에서 `## 검증 대상`, `## API Skeleton`, `## DB Skeleton`, `## UI Skeleton`, `## Storybook 계약` 블록을 제거한다.
- `app/docs/standards/source-requirement-links.md`에 API/DB/UI 설계 표면 생성을 위한 소스 요건 ID 연결 위치를 명시한다.
- 카드의 수용 기준, 의사결정 로그, 열린 질문, 승인 상태는 변경하지 않는다.

## 제외 범위

- 코드 annotation, 테스트 `@Covers`, Storybook metadata, `.feature` 시나리오의 요건 ID 변경.
- 생성 산출물의 API/DB/UI 설계 표면 구조 변경.
- 하네스 parser alias 제거와 warning 정책 변경. 이 항목은 하네스 Change Set에서 처리한다.

## 완료 조건

- app 요건 카드 본문에 legacy top-level 섹션 `## 검증 대상`, `## API Skeleton`, `## DB Skeleton`, `## UI Skeleton`, `## Storybook 계약`, `## BDD 테스트 리뷰`가 남지 않는다.
- `npm run app:validate`가 통과하고, 생성 설계 표면 기준 trace가 BLUE를 유지한다.
- `npm run app:trace -- --requirement REQ-001`과 `npm run app:trace -- --requirement REQ-020`이 BLUE를 유지한다.

## 검증 명령

- `npm run app:source-index`
- `npm run app:openapi-index`
- `npm run app:front-end-source-index`
- `npm run app:trace -- --requirement REQ-001`
- `npm run app:trace -- --requirement REQ-020`
- `npm run app:validate`

## 검증 결과

- 2026-06-19: `npm run app:source-index`, `npm run app:openapi-index`, `npm run app:front-end-source-index` 통과.
- 2026-06-19: `npm run app:trace -- --requirement REQ-001`, `npm run app:trace -- --requirement REQ-020` 모두 BLUE.
- 2026-06-19: `npm run app:validate` 통과. 앱 Change Set index warning은 0건이다.

## 결정 로그

- 2026-06-19: app 카드의 legacy 설계 섹션은 명세 원천이 아니라 생성 설계 표면으로 대체한다.
- 2026-06-19: 카드 본문 이관은 AC/Covers 문자열을 바꾸지 않으므로 시나리오와 실행 테스트 연결은 그대로 유지한다.
- 2026-06-19: 기존 리뷰 이력은 검증 근거이므로 `수용 테스트 리뷰` 아래에 보존한다.
- 2026-06-19: 소스 요건 ID 연결 표준은 기존 코드 패턴을 문서화하며, 이번 Change Set에서 코드 annotation 자체는 바꾸지 않는다.

## 열린 논의

- 없음
