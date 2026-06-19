# Change Set: UI 컴포넌트 용어 표준 분리

상태: 완료
요청일: 2026-06-06
변경 유형: 하네스 개선, 수정
영향 요건: REQ-010
논의 상태: 없음

## 요청 요약

- 카드 `## 표준 용어`는 추적이 필요한 업무/정책/품질/화면 품질 의미 단위만 담는다. `ui.button`, `ui.checkbox`, `ui.formDialog` 같은 UI 컴포넌트/위젯 원자 키가 이 섹션에 들어오면 deny-list로 차단해, 등록 누락(`CARD-TERM-UNREGISTERED`)이 아니라 잘못된 레이어에 둔 용어임을 정확히 안내한다.
- UI 컴포넌트/위젯은 추적용 표준 용어로 등록하지 않고, 문서 작성용 UI 어휘 표준으로 정규 명칭을 관리한다. 요건 본문·수용 기준·시나리오에서 `대화상자`, `확인 대화상자`, `체크박스` 같은 정규 명칭을 쓰고 `다이얼로그`, `모달`, `팝업` 같은 별칭 혼용은 terminology ban으로 막는다.
- 카드 `## 표준 용어` 레이어는 현재 위반 0건이라 가드를 error로 즉시 도입해도 회귀가 없다. 별칭 혼용은 application 카드 **본문**(REQ-011·017·018·019·022·024·025)에 실재하므로, 본문 정규화와 그에 맞춘 ban 적용은 application Change Set `app/docs/change-sets/2026-06-06-ui-vocabulary-body-migration.md`에서 함께 진행한다. 본 하네스 Change Set은 표준·deny-list 가드·ban 사전 정의를 제공한다.

## 작업 범위

- UI 어휘 표준을 신설한다(`harness/docs/standards/ui-vocabulary.md`). 정규 명칭, 허용 사용 위치, 피해야 할 별칭을 둔다.
  - 정규 명칭: `대화상자`, `확인 대화상자`, `입력 대화상자`, `체크박스`, `텍스트 입력`, `아이콘 버튼`, `드롭다운`, `탭`, `토글`, `도구 설명`.
  - 피해야 할 별칭: `다이얼로그`, `모달`, `팝업`, `확인창`, `인풋`, `체크 박스`.
  - 정규 명칭 목록은 현재 화면 요건에서 실제 쓰이는 컴포넌트로 한정하고, 새 컴포넌트가 나오면 표준에 증분 추가한다.
  - 정규 명칭은 문서 작성 어휘다. 코드 식별자(shadcn `dialog.tsx`, `modal` prop 등 영문 컴포넌트 API)는 본 표준 대상이 아니다.
- 재발 방지를 위해 별칭을 terminology 사전 ban으로 등록한다.
  - 대화상자 의미 term의 `ban`에 `다이얼로그`, `모달`, `팝업`, `확인창`을, `allow`에 정규 명칭(`대화상자`, `확인 대화상자`, `입력 대화상자`)을 둔다. 체크박스 term의 `ban`에 `체크 박스`, 텍스트 입력 term의 `ban`에 `인풋`을 둔다.
  - 이 사전 등록은 **본문 어휘 통제(ban/allow surface)** 용도다. 같은 key를 카드 `## 표준 용어`에 쓰는 것은 아래 deny-list가 막는다.
- `harness/tools/validate-requirement-cards.mjs`에 `CARD-TERM-UI-PRIMITIVE`를 신설한다.
  - 명시적 deny-list를 SSOT로 둔다: `ui.button`, `ui.input`, `ui.checkbox`, `ui.dialog`, `ui.formDialog`, `ui.confirmDialog`, `ui.tooltip`, `ui.modal`, `ui.dropdown`, `ui.tab`, `ui.toggle`.
  - 카드 `## 표준 용어` term이 deny-list에 있으면 `CARD-TERM-UI-PRIMITIVE` error로 보고한다. 이 판정은 `CARD-TERM-UNREGISTERED`보다 **먼저** 수행해, 등록 누락이 아니라 잘못된 레이어임을 안내한다.
  - deny-list 밖의 미등록 용어는 기존대로 `CARD-TERM-UNREGISTERED`로 남긴다. 등록된 `ui.appShell`·`ui.desktopViewport`·`ui.accessibilityCheck`는 deny-list에 없으므로 계속 통과한다.
- `CARD-TERM-UNREGISTERED` 메시지에 두 갈래 remediation을 둔다.
  - 업무/정책/품질 의미 용어이면 용어집에 draft 또는 approved로 등록한다.
  - UI 원자나 구현 세부사항이면 카드 `## 표준 용어`에서 제거하고 UI 어휘 표준의 정규 명칭으로 본문/수용 기준/시나리오에 표현한다.
- 단일 소스 문서를 갱신한다.
  - `harness/docs/terminology/README.md`의 "카드 `## 표준 용어` 섹션 정책"에 UI 컴포넌트 원자 제외와 `CARD-TERM-UI-PRIMITIVE`를 반영한다. 이 문서가 카드 표준 용어 정책의 단일 소스다.
  - `harness/docs/standards/terminology.md`(운영 요약)에 추적용 표준 용어와 문서 작성용 UI 어휘의 차이를 요약한다.
  - `harness/docs/standards/requirement-card.md` 표준 용어 절에 deny-list 차단 기준을 보강한다.
  - `harness/docs/requirement-authoring.md`에 본문/수용 기준/시나리오에서 UI 원자 용어를 쓸 때 UI 어휘 표준의 정규 명칭을 따라야 한다고 명시한다.
- 도구 단위 self-test를 신설한다(`harness/tools/__tests__/validate-requirement-cards.ui-primitive.test.mjs`). `CARD-TERM-UI-PRIMITIVE`는 요건 AC로 추적되지 않는 카드 스키마 룰이므로, 요건 추적 self-test(`harness/self-test/tests/`)가 아니라 기존 validator 단위 테스트(`validate-front-end-standards.api-usage.test.mjs`)와 같은 `__tests__` 위치에 둔다. validator는 fixture 경로를 주입할 수 있도록 `--requirements-index`/`--terminology-index`/`--out` override를 받는다.
  - deny-list UI 원자 키가 카드 표준 용어로 들어온 fixture → `CARD-TERM-UI-PRIMITIVE`.
  - 일반 미등록 도메인 용어 fixture → `CARD-TERM-UNREGISTERED`.
  - 같은 카드에 두 종류가 함께 있을 때 각각 분리 판정되고 UI 원자는 `CARD-TERM-UNREGISTERED`로 잡히지 않음을 검증한다.
  - 본문 별칭(`모달` 등)의 `BAN_VIOLATION` 실제 작동은 `terminology.mjs validate`가 실제 카드를 읽으므로 fixture 단위 테스트 대신 application Change Set의 `app:validate` 통합 검증으로 확인한다.

## 제외 범위

- UI 컴포넌트/위젯 원자를 카드 `## 표준 용어`에 등록하는 예외 정책(`ui.button` 등 카드 사용 승인).
- 프런트엔드 컴포넌트 API나 shadcn/ui 파일명·prop 변경.
- 애플리케이션 화면 구현 변경.
- application 카드 본문의 별칭 치환 자체. 본문 정규화와 `app:validate` 통과는 application Change Set `app/docs/change-sets/2026-06-06-ui-vocabulary-body-migration.md`가 담당한다. 본 하네스 Change Set은 표준·deny-list·ban 정의만 제공한다.
- 코드 식별자(영문 `modal`/`dialog` 등)에 대한 ban. ban은 한국어 별칭 본문 표현만 대상으로 한다.

## 완료 조건

- 카드 `## 표준 용어`에 deny-list UI 원자 키(`ui.formDialog` 등)가 있으면 `validate-requirement-cards`가 `CARD-TERM-UI-PRIMITIVE` error를 보고하고, 그 메시지는 용어집 등록이 아니라 UI 어휘 표준의 정규 명칭으로 본문/수용 기준/시나리오에 쓰라고 안내한다.
- deny-list 밖 미등록 도메인 용어는 기존처럼 `CARD-TERM-UNREGISTERED`로 보고되며, remediation에 용어집 등록과 UI 원자 제거 기준이 함께 나온다.
- 등록된 `ui.appShell`·`ui.desktopViewport`·`ui.accessibilityCheck`는 카드 표준 용어로 계속 통과한다.
- 본문에 `다이얼로그`/`모달`/`팝업`/`확인창`이 쓰이면 `BAN_VIOLATION`(`strictSeverity: error`)으로 보고되어 통합 게이트가 차단한다.
- `harness/docs/terminology/README.md`와 `harness/docs/standards/terminology.md`가 추적용 표준 용어와 문서 작성용 UI 어휘의 구분, UI 컴포넌트 원자 제외를 명시한다.
- `npm run harness:test`(도구 단위 테스트 포함)가 UI 원자 차단 fixture, 일반 미등록 fixture, 레이어 분리/우선순위를 검증한다.
- `npm run harness:validate`가 통과한다.

## 검증 명령

- `npm run harness:test`
- `npm run harness:validate`
- `node harness/tools/terminology.mjs validate --strict`

## 결정 로그

- UI 컴포넌트/위젯 원자는 추적용 표준 용어로 등록하지 않고 문서 작성용 UI 어휘 표준에서 관리한다. 카드 `## 표준 용어`는 업무 도메인, 정책, 품질 속성, 화면 전반 사용자 경험처럼 추적이 필요한 의미 단위만 담는다.
- `CARD-TERM-UI-PRIMITIVE`의 판정 기준은 명시적 deny-list이며, SSOT는 `validate-requirement-cards.mjs`의 상수다. 표준 문서는 이 목록을 설명·링크만 한다. 새 UI 컴포넌트는 deny-list에 증분 추가한다. prefix 휴리스틱(미등록 `ui.*`를 모두 UI 원자로 간주)은 아직 미등록인 신규 화면 품질 `ui.*`를 오분류하므로 채택하지 않는다.
- deny-list 목록: `ui.button`, `ui.input`, `ui.checkbox`, `ui.dialog`, `ui.formDialog`, `ui.confirmDialog`, `ui.tooltip`, `ui.modal`, `ui.dropdown`, `ui.tab`, `ui.toggle`.
- `ui.appShell`, `ui.desktopViewport`, `ui.accessibilityCheck`처럼 화면 품질 또는 플랫폼 의미를 가진 등록 용어는 deny-list에 없으며 카드 `## 표준 용어`에 둘 수 있다.
- 재발 방지를 위해 별칭을 terminology 사전 ban으로 등록한다. 사전에 UI 어휘 term을 두는 것은 본문 ban/allow surface 통제 용도이지 카드 `## 표준 용어` 사용 허가가 아니다. 사전에 있어도 deny-list가 카드 사용을 막는다. 이 "사전 등록 ≠ 카드 표준 용어 허용" 구분을 표준 문서에 명문화한다.
- 정규 명칭으로 `다이얼로그`/`모달` 대신 `대화상자`를 채택한다. 한국어 표준 표기를 기준으로 하며, 모달 동작을 강조하는 영문 식별자(`modal` 등)는 코드에서 계속 쓸 수 있다. 본 표준은 문서 작성 어휘만 통제한다.
- 카드 표준 용어 레이어는 현재 위반 0건이므로 `CARD-TERM-UI-PRIMITIVE`를 error로 즉시 도입해도 회귀가 없다. 본문 별칭은 application 카드에 다수 존재하므로, 본문 BAN 게이트의 실제 차단 효과는 application Change Set의 본문 치환이 끝난 뒤 회귀 없이 발현된다.
- 본문 치환은 scope 분리 원칙(애플리케이션 문서는 `app/docs`)에 따라 application Change Set으로 분리하고 상호 링크한다.

## 열린 논의

- 없음
