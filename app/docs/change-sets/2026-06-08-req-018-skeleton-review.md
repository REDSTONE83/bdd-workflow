# Change Set: 2026-06-08 REQ-018 Skeleton 검토 전환

상태: 완료
요청일: 2026-06-08
변경 유형: 마이그레이션, 수정
영향 요건: REQ-018
논의 상태: 없음

## 요청 요약

- 단계 인식 TDD 워크플로우에 맞춰 `REQ-018` 카테고리 수정 카드를 한 단계씩 검증하며 이관한다.
- 첫 단계로 레거시 `검토중` 상태를 `Skeleton 검토중`으로 전환하고 Skeleton 검토 대상과 Storybook 계약을 명시한다.

## 작업 범위

- `REQ-018` 상태를 `Skeleton 검토중`으로 변경한다.
- `REQ-018`에 `검증 대상`, `API Skeleton`, `DB Skeleton`, `UI Skeleton`, `Storybook 계약` 섹션을 추가한다.
- `CategoryFormDialog`에 수정 모드 검토용 Storybook 상태를 추가한다.
- 카테고리 입력 대화상자 코드 주석의 UI 어휘를 정규 표현으로 맞춘다.
- 기존 AC, Scenario Covers, 실행 테스트 문자열은 변경하지 않는다.

## 제외 범위

- `REQ-018`의 `Skeleton 승인` 승격.
- 카테고리 목록/생성/삭제 카드(`REQ-016`, `REQ-017`, `REQ-019`) 이관.
- 애플리케이션 업무 코드와 테스트 코드 변경.

## 완료 조건

- `REQ-018` 단일 카드 trace가 RED 없이 통과한다.
- `REQ-018` Storybook 계약이 실제 story named export와 연결된다.
- Storybook build가 통과한다.
- 앱 Change Set 리포트에 경고가 없어야 한다.

## 검증 명령

- `npm run app:trace -- --requirement REQ-018`
- `cd app/front-end && npm run build-storybook`
- `npm run app:trace`

## 결정 로그

- 2026-06-08: 수정 카드는 `CategoryFormDialog`의 edit 상태와 `CategoriesPage`의 route-level 수정 흐름을 Storybook 계약으로 검토한다.
- 2026-06-08: 생성/수정이 공유하는 검증 UI라도 수정 카드에서는 `Edit...` named export를 별도로 두어 사용자 검토 표면을 명확히 한다.

## 열린 논의

- 없음
