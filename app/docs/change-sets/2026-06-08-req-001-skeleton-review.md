# Change Set: 2026-06-08 REQ-001 Skeleton 검토 전환

상태: 완료
요청일: 2026-06-08
변경 유형: 마이그레이션, 수정
영향 요건: REQ-001
논의 상태: 없음

## 요청 요약

- 단계 인식 TDD 워크플로우에 맞춰 `REQ-001` 이메일 회원 가입 카드를 한 단계씩 검증하며 이관한다.
- 레거시 `검토중` 상태를 `Skeleton 검토중`으로 전환하고 API/DB/UI/Storybook/E2E 검증 표면을 명시한다.

## 작업 범위

- `REQ-001` 상태를 `Skeleton 검토중`으로 변경한다.
- `REQ-001`에 `검증 대상`, `API Skeleton`, `DB Skeleton`, `UI Skeleton`, `Storybook 계약` 섹션을 추가한다.
- 회원 가입 API, 회원 가입 화면, 가입 완료 로그인 안내 story, 가입 성공/가드 E2E 흐름을 본 카드의 검토 표면으로 정리한다.
- 기존 AC, Scenario Covers, 실행 테스트 문자열은 변경하지 않는다.

## 제외 범위

- `REQ-001`의 `Skeleton 승인` 승격.
- 회원 가입 API, DB, UI, Storybook 구현 변경.
- 가입 정책 변경.
- 애플리케이션 업무 코드와 테스트 코드 변경.

## 완료 조건

- `REQ-001` 단일 카드 trace가 RED 없이 통과한다.
- Storybook 계약이 실제 story title과 named export 상태로 연결된다.
- 앱 Change Set 리포트에 경고가 없어야 한다.

## 검증 명령

- `npm run app:trace -- --requirement REQ-001`
- `cd app/front-end && npm run build-storybook`
- `npm run app:trace`

## 결정 로그

- 2026-06-08: `REQ-001`은 이메일 회원 가입의 API와 화면을 함께 소유하는 canonical 원자 요건이므로 API/DB/UI/Storybook/E2E를 모두 직접 검증 대상으로 둔다.

## 열린 논의

- 없음
