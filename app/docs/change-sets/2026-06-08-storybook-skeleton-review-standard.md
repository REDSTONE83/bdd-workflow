# Change Set: 2026-06-08 Storybook 기반 Skeleton UI 검토 표준

상태: 완료
요청일: 2026-06-08
변경 유형: 표준 개정
영향 요건: REQ-005, REQ-016, REQ-017, REQ-018, REQ-019, REQ-022, REQ-023, REQ-024, REQ-025, REQ-027
논의 상태: 없음

## 요청 요약

- UI가 있는 요건은 Skeleton 단계에서 Storybook으로 Page/Component/Dialog/List 상태를 확인할 수 있어야 한다.
- Storybook은 완료 판정 대체물이 아니라 UI 상태 계약과 사용자 검토 표면으로 사용한다.

## 작업 범위

- FE UI/테스트 표준에 Storybook 기반 Skeleton 검토 절차를 명시한다.
- 요건 카드 표준과 작성 절차에서 API/DB/UI/Storybook 계약과 테스트 승인 단계를 정리한다.
- 할 일 관리 요건 일부에 Storybook 계약을 명시해 누락 방지 검사의 적용 대상을 만든다.
- 하네스 정책 변경은 `harness/docs/change-sets/2026-06-08-stage-aware-tdd-workflow.md`에서 추적한다.

## 제외 범위

- 기존 모든 화면 요건의 Storybook 계약 일괄 작성.
- visual regression baseline 도입.
- 모바일/태블릿 검토 기준 확대.

## 완료 조건

- Skeleton UI 검토에서 Storybook 상태 카탈로그가 필수 검토 표면으로 문서화된다.
- `REQ-022`~`REQ-027`의 할 일 UI Storybook 계약이 카드에 명시된다.
- `npm run build-storybook`이 통과한다.

## 검증 명령

- `npm run build-storybook`
- `npm run app:front-end-source-index`
- `npm run app:trace -- --requirement REQ-022`
- `npm run app:validate`

## 결정 로그

- 2026-06-08: FE 상태 Skeleton을 문서 표로만 검토하지 않고 Storybook 상태 카탈로그로 검토한다.
- 2026-06-08: Storybook 계약은 AC PASS를 대체하지 않고 Skeleton/visual 검토와 정적 누락 검사를 담당한다.

## 열린 논의

- 없음
