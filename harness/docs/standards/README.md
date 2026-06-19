# 하네스 표준 인덱스

하네스 표준은 요건 카드, 시나리오, 용어, 하네스 UI 같은 하네스 자체 산출물의 작성·검증 규칙을 정의한다. 애플리케이션 구현 표준은 `app/docs/standards`에 둔다.

## 문서

- [`requirement-card.md`](./requirement-card.md): 요건 카드 구조, 상태, 수용 기준, 설계/승인 단계 규칙.
- [`acceptance-test.md`](./acceptance-test.md): 수용 시나리오와 실행 테스트 연결 규칙.
- [`terminology.md`](./terminology.md): 표준 용어 운영과 카드 `표준 용어` 섹션 정책.
- [`ui-vocabulary.md`](./ui-vocabulary.md): UI 컴포넌트/위젯 문서 어휘.
- [`harness-ui.md`](./harness-ui.md): `harness/ui` 로컬 웹 UI의 구조, UI 서버, 데이터 경계, Storybook Vitest, 명령 실행 표준.

## 표준 추가 원칙

- 하네스 자체 동작을 바꾸는 규칙은 이 디렉터리에 둔다.
- 애플리케이션 런타임 구현 규칙은 `app/docs/standards`에 둔다.
- 새 표준이 요건 카드 구조, 데이터 계약, 게이트 판정에 영향을 주면 관련 문서와 Change Set을 함께 갱신한다.
