# Change Set: 2026-06-08 REQ-020 Skeleton 검토 전환

상태: 완료
요청일: 2026-06-08
변경 유형: 마이그레이션, 수정
영향 요건: REQ-020
논의 상태: 없음

## 요청 요약

- 단계 인식 TDD 워크플로우에 맞춰 `REQ-020` 신규 사용자 기본 카테고리 제공 카드를 한 단계씩 검증하며 이관한다.
- 첫 단계로 레거시 `검토중` 상태를 `Skeleton 검토중`으로 전환하고 API/DB Skeleton 검토 대상을 명시한다.

## 작업 범위

- `REQ-020` 상태를 `Skeleton 검토중`으로 변경한다.
- `REQ-020`에 `검증 대상`, `API Skeleton`, `DB Skeleton` 섹션을 추가한다.
- UI/Storybook/E2E 검증은 본 카드의 직접 검증 대상이 아님을 명시한다.
- 기존 AC, Scenario Covers, 실행 테스트 문자열은 변경하지 않는다.

## 제외 범위

- `REQ-020`의 `Skeleton 승인` 승격.
- 기본 카테고리 수정/삭제 UX 변경.
- 가입 화면 UI 변경.
- 애플리케이션 업무 코드와 테스트 코드 변경.

## 완료 조건

- `REQ-020` 단일 카드 trace가 RED 없이 통과한다.
- 앱 Change Set 리포트에 경고가 없어야 한다.

## 검증 명령

- `npm run app:trace -- --requirement REQ-020`
- `npm run app:trace`

## 결정 로그

- 2026-06-08: `REQ-020`은 사용자가 보는 별도 UI 상태가 아니라 가입 API 이후 기본 데이터 준비 정책이므로 Storybook 검증 대상에서 제외한다.

## 열린 논의

- 없음
