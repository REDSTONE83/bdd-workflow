# Change Set: 2026-06-08 단계 인식 TDD 요건 워크플로우

상태: 완료
요청일: 2026-06-08
변경 유형: 하네스 개선, 표준 개정
영향 요건: REQ-010, REQ-012, REQ-028
논의 상태: 없음

## 요청 요약

- 엄격한 TDD를 기본 워크플로우로 두고, Skeleton 승인 이후 테스트 코드를 먼저 승인한 뒤 구현을 진행할 수 있게 한다.
- UI가 있는 요건은 Skeleton 단계에서 Storybook으로 검토 가능해야 한다.
- 하네스는 요건 상태에 따라 검증 대상과 게이트 강도를 다르게 적용한다.

## 작업 범위

- `REQ-028` 하네스 요건과 시나리오를 추가한다.
- 요건 인덱스에 검증 대상과 Storybook 계약을 수집한다.
- 카드 구조 검사에 새 상태와 Skeleton 계약 검사를 추가한다.
- FE 표준 검사에 REQ별 Storybook 계약 정적 검사를 추가한다.
- 통합 게이트가 요건 상태에 따라 RED 차단 대상을 구분한다.
- `app:validate`가 Storybook build를 포함하도록 한다.

## 제외 범위

- 기존 모든 application 요건 카드의 상태 일괄 전환.
- Storybook visual regression baseline 도입.
- 테스트 충분성 의미론의 완전 자동 판정.

## 완료 조건

- 새 상태 enum과 Storybook 계약 검사 정책이 문서화된다.
- Storybook 계약 누락, 상태 누락, REQ metadata 누락이 FE finding으로 보고된다.
- `테스트 승인`/`구현중`의 테스트 누락 RED는 통합 게이트에서 차단되고, 실행된 테스트 실패 RED는 검증중 전까지 허용된다.
- `검증중` 또는 `승인` RED는 통합 게이트에서 차단된다.
- 관련 하네스 self-test와 tool-test가 통과한다.

## 검증 명령

- `npm run harness:tool-test`
- `npm run harness:self-test`
- `npm run harness:trace -- --requirement REQ-028`
- `npm run harness:validate`

## 결정 로그

- 2026-06-08: 요건 상태 하나로 TDD 워크플로우 단계를 표현한다.
- 2026-06-08: UI Skeleton 검토는 Storybook으로 실제 확인 가능한 상태여야 한다.
- 2026-06-08: 기존 카드는 점진 마이그레이션하고, 새 단계 상태를 쓰는 카드부터 강한 검사를 적용한다.

## 열린 논의

- 없음
