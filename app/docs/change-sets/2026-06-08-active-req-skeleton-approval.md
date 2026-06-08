# Change Set: 2026-06-08 활성 요건 Skeleton 승인

상태: 완료
요청일: 2026-06-08
변경 유형: 마이그레이션, 수정
영향 요건: REQ-001, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027
논의 상태: 없음

## 요청 요약

- 단계 인식 TDD 워크플로우에 맞춰 활성 GREEN 요건의 Skeleton 검토 결과를 한 단계씩 반영한다.
- `Skeleton 검토중` 상태의 활성 애플리케이션 요건을 `Skeleton 승인`으로 승격한다.

## 작업 범위

- `REQ-001`, `REQ-015`~`REQ-027` 활성 요건의 상태를 `Skeleton 승인`으로 변경한다.
- 기존 `검증 대상`, `API Skeleton`, `DB Skeleton`, `UI Skeleton`, `Storybook 계약`을 기준으로 하네스 검증을 수행한다.
- 기존 AC, Scenario Covers, 실행 테스트 문자열, 업무 코드, Storybook 구현은 변경하지 않는다.

## 제외 범위

- `테스트 작성중`, `테스트 승인`, `구현중`, `검증중`, `승인` 단계 승격.
- 대체됨/폐기 카드 상태 변경.
- 기존 승인 카드 `REQ-004`, `REQ-005`, `REQ-011` 변경.
- 애플리케이션 업무 코드와 테스트 코드 변경.

## 완료 조건

- 활성 요건에 레거시 `검토중` 또는 `Skeleton 검토중` 상태가 남지 않는다.
- `Skeleton 승인` 상태 요건의 검증 대상별 계약 누락이 없어야 한다.
- Storybook 계약이 있는 요건은 실제 story title과 named export 상태로 연결되고 Storybook build가 통과해야 한다.
- 앱 Change Set 리포트에 경고가 없어야 한다.

## 검증 명령

- `cd app/front-end && npm run build-storybook`
- `npm run app:trace`

## 결정 로그

- 2026-06-08: 기존 구현과 테스트가 이미 GREEN인 마이그레이션 상황이므로, Skeleton 승인 단계는 계약과 검토 표면의 정합성 확인으로 제한한다.
- 2026-06-08: 이후 테스트/구현/최종 승인 단계 승격은 별도 Change Set에서 수행한다.

## 열린 논의

- 없음
