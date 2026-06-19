# Change Set: 2026-06-19 legacy 요건 카드 섹션 warning 정책

상태: 완료
요청일: 2026-06-19
변경 유형: 하네스 개선, 표준 개정, 수정
영향 요건: REQ-010, REQ-012, REQ-034
논의 상태: 없음

## 요청 요약

- `Skeleton`/`BDD 테스트 리뷰`/`Storybook 계약` alias를 즉시 제거하지 않고, 전환 기간에는 읽기 호환하되 카드 검사 warning으로 노출한다.
- 앱 scope 카드 이관 Change Set은 `app/docs/change-sets/2026-06-19-app-requirement-card-design-surface-migration.md`에서 별도로 추적한다.
- 기존 Change Set index report-only warning 1건을 정리해 하네스 검증 산출물의 잡음을 줄인다.
- 하네스 Change Set report가 교차 scope 영향 요건을 알 수 없는 요건으로 오탐하지 않도록 app/harness 요건 인덱스를 함께 참조한다.

## 작업 범위

- requirements index의 `sectionPresent`에 legacy 설계/리뷰 섹션 존재 여부를 노출한다.
- `validate-requirement-cards.mjs`가 legacy 섹션을 `CARD-LEGACY-SECTION` warning으로 보고한다.
- warning은 전환 안내이며, 이번 단계에서는 gate 실패로 승격하지 않는다.
- `render-change-set-report.mjs`가 현재 scope와 app/harness 요건 인덱스를 병합해 영향 요건을 해석한다.
- `2026-06-19-change-set-duplicate-command-key.md`의 허용되지 않은 `변경 유형: 하네스 수정`을 허용값으로 정리한다.

## 제외 범위

- legacy alias 제거 또는 error 승격.
- 기존 하네스 요건 카드 본문 전체 마이그레이션.
- 앱 요건 카드 본문 이관. 앱 scope Change Set에서 처리한다.

## 완료 조건

- legacy 카드 섹션이 남아 있으면 `CARD-LEGACY-SECTION` warning이 생성된다.
- legacy 섹션 warning은 `severity=warning`이며 통합 게이트를 실패시키지 않는다.
- 교차 scope Change Set의 영향 요건이 peer 요건 인덱스에 있으면 `CHANGE-SET-AFFECTED-REQ-UNKNOWN` warning을 생성하지 않는다.
- Change Set index의 기존 `CHANGE-SET-TYPE-INVALID` warning이 사라진다.

## 검증 명령

- `npm run harness:validate`
- `npm run app:validate`
- `npm run repo:validate`

## 검증 결과

- 2026-06-19: 관련 tool-test `index-requirements`, `validate-requirement-cards` 통과.
- 2026-06-19: `npm run app:validate`, `npm run harness:validate` 통과.
- 2026-06-19: harness requirement card finding은 `CARD-LEGACY-SECTION` warning 48건만 생성되고 error는 0건이다.
- 2026-06-19: app/harness Change Set index warning과 harness Change Set report warning은 모두 0건이다.

## 결정 로그

- 2026-06-19: legacy alias는 읽기 호환을 유지하되 새 카드 작성 기준 위반을 warning으로 노출한다.
- 2026-06-19: warning에서 error로의 승격은 앱/하네스 카드 본문 전체 마이그레이션 완료 후 별도 Change Set에서 진행한다.

## 열린 논의

- 없음
