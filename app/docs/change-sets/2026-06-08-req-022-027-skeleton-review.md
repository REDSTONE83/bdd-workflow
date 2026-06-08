# Change Set: 2026-06-08 REQ-022~REQ-027 Skeleton 검토 전환

상태: 완료
요청일: 2026-06-08
변경 유형: 마이그레이션, 수정
영향 요건: REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027
논의 상태: 없음

## 요청 요약

- 단계 인식 TDD 워크플로우에 맞춰 `REQ-021` 개인별 할 일 관리의 하위 원자 요건들을 한 번에 다음 단계로 진행한다.
- 레거시 `검토중` 상태를 `Skeleton 검토중`으로 일괄 전환하고 각 카드의 API/DB/UI/Storybook 검증 대상을 명시한다.

## 작업 범위

- `REQ-022`~`REQ-027` 상태를 `Skeleton 검토중`으로 변경한다.
- 각 카드에 `검증 대상`과 필요한 `API Skeleton`, `DB Skeleton`, `UI Skeleton` 섹션을 추가한다.
- UI가 있는 `REQ-022`, `REQ-023`, `REQ-024`, `REQ-025`, `REQ-027`은 기존 Storybook 계약을 유지하고 실제 story 연결을 검증한다.
- UI가 없는 `REQ-026`은 API/DB 검증 대상으로만 둔다.
- 기존 AC, Scenario Covers, 실행 테스트 문자열은 변경하지 않는다.

## 제외 범위

- `REQ-022`~`REQ-027`의 `Skeleton 승인` 승격.
- `REQ-021` 상위 요건 상태 변경.
- 할 일 API, DB, UI, Storybook 구현 변경.
- 애플리케이션 업무 코드와 테스트 코드 변경.

## 완료 조건

- `REQ-022`~`REQ-027` 단일/묶음 trace가 RED 없이 통과한다.
- Storybook 계약이 실제 story title과 named export 상태로 연결된다.
- 앱 Change Set 리포트에 경고가 없어야 한다.

## 검증 명령

- `npm run app:trace -- --requirement REQ-022 --requirement REQ-023 --requirement REQ-024 --requirement REQ-025 --requirement REQ-026 --requirement REQ-027`
- `cd app/front-end && npm run build-storybook`
- `npm run app:trace`

## 결정 로그

- 2026-06-08: 같은 상위 요건 `REQ-021`에 속한 하위 원자 요건은 단계 전환과 Skeleton 계약 보강을 묶음 Change Set으로 관리한다.
- 2026-06-08: `REQ-026`은 카테고리 삭제 후 할 일 연결 해제 정책이므로 별도 UI/Storybook 검토 대상에서 제외한다.

## 열린 논의

- 없음
