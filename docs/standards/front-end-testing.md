# Front-end 테스트 표준

프런트엔드 테스트는 TDD 보조 테스트와 BDD Acceptance Test를 분리한다. 모든 테스트가 요건 완료 판정에 들어가지 않는다. 요건 완료 여부는 기존 원칙대로 카드의 수용 기준 문장과 정확히 일치하는 `Covers` 메타데이터가 있는 BDD 테스트로 판단한다.

## 테스트 계층

```text
Vitest / Testing Library
  상태별 렌더링, validation, hook, view model, API 상태별 UI

Storybook
  공통 컴포넌트와 화면 조각의 상태 카탈로그

Playwright E2E
  사용자 흐름, 라우팅, 인증, 주요 화면 진입, 반응형 smoke

Visual Regression
  Storybook story와 핵심 화면 screenshot baseline

Accessibility
  axe smoke, keyboard focus, label/error 연결
```

## TDD / 보조 테스트

TDD 테스트는 구현 설계와 회귀 방지 목적이다.

- 위치: `src/**/*.test.{ts,tsx}`
- 도구: Vitest, React Testing Library, jest-dom, user-event
- 검증 대상: 상태별 렌더링, form validation, disabled/loading/error, hook, formatter, view model
- `Covers` 메타데이터를 붙이지 않는다.
- AC 커버리지에 포함하지 않는다.

좋은 검증:

```text
- 필수 입력을 비우면 오류 문구가 보인다
- 저장 중에는 제출 버튼이 비활성화된다
- 빈 목록이면 empty state가 보인다
- API 오류가 form alert로 변환된다
```

피할 검증:

```text
- 모든 padding 값
- 모든 색상 hex
- Tailwind class 이름 세부값
- 컴포넌트 내부 DOM 구조
```

## FE BDD Acceptance Test

FE BDD 테스트는 승인된 `.feature` 시나리오의 Given/When/Then을 실제 화면 행위로 옮긴다.

- 위치: `tests/e2e/**/*.spec.ts`
- 도구: Playwright
- 연결: `REQ-XXX`와 `Covers` 문장
- `Covers` 문장은 카드 수용 기준과 정확히 일치해야 한다.
- 시나리오 제목과 테스트 제목은 일치하지 않아도 된다.
- 별도 시나리오 ID는 만들지 않는다.

예정 메타데이터 형식:

```ts
test("사용자가 할 일 목록을 확인한다", async ({ page }) => {
  test.info().annotations.push(
    { type: "Requirement", description: "REQ-002" },
    { type: "Covers", description: "본인의 할 일 목록만 조회된다" },
  )

  // Given / When / Then을 실제 화면 행위로 옮긴다.
})
```

하네스 인덱서가 확정되면 위 형식을 표준 고정하고, `generateFrontEndSourceIndex`가 이 메타데이터를 수집한다.

## DOM 기반 스타일 검증

Testing Library에서는 스타일 자체보다 상태에 따른 UI 표시를 검증한다.

허용:

```text
- visible / hidden
- disabled / enabled
- aria-invalid
- error message 연결
- loading indicator 표시
```

제한:

```text
- class 이름 직접 비교
- 모든 inline style 검증
- Tailwind responsive class 나열 검증
```

## 브라우저 기반 스타일 검증

Playwright computed style 검증은 핵심 상태와 레이아웃 전환만 본다.

검증할 수 있는 항목:

```text
- 모바일에서 세로 배치로 전환되는가
- 주요 영역이 viewport 밖으로 넘치지 않는가
- focus ring이 보이는가
- destructive/primary 같은 핵심 variant가 적용되는가
```

과도하게 고정하지 않을 항목:

```text
- 모든 margin/padding
- 모든 font-size
- 모든 color token 값
- 내부 class 이름
```

## Screenshot / Visual Regression

시각 회귀 테스트는 실제 브라우저 렌더링 결과를 확인하는 가장 강한 검증이다. 전 화면에 적용하지 않고, 공통 컴포넌트와 핵심 화면에 제한한다.

우선순위:

1. 공통 컴포넌트: Button, Input, Select, Checkbox, Modal, Alert, Toast, Table, Pagination, Tabs
2. 업무 핵심 화면: 가입, 로그인, 목록, 상세, 등록/수정
3. 반응형 취약 화면: 테이블, 차트, 사이드바, 모달
4. 테마 화면: 다크모드, 고객사 테마, 고대비 모드

운영 규칙:

- browser, viewport, font, OS 환경을 고정한다.
- threshold를 둔다.
- snapshot baseline 변경은 코드 리뷰에서 의도된 디자인 변경인지 확인한다.
- animation, 현재 시각, 랜덤 값은 고정한다.

## Storybook 기반 시각 검증

Storybook story는 visual regression의 기본 대상이다.

```text
BDD Scenario
  -> Storybook State
  -> Visual Regression
  -> E2E Screenshot
```

- Story는 상태 카탈로그다.
- E2E는 사용자 흐름 검증이다.
- Storybook story 이름은 요건 추적 ID가 아니다.
- 요건 추적은 `REQ`와 `Covers`만 사용한다.

## 반응형 테스트

대표 viewport:

```text
mobile: 390 x 844
tablet: 768 x 1024
desktop: 1440 x 900
```

BDD 또는 visual 대상이 되는 화면은 최소 mobile/desktop을 확인한다. 테이블, drawer, modal처럼 깨지기 쉬운 화면은 tablet도 포함한다.

## 접근성 테스트

자동 접근성 검사는 axe smoke test를 기본으로 한다.

함께 확인할 항목:

- keyboard tab 순서
- focus visible
- label과 form control 연결
- error message와 입력 연결
- icon-only button 접근 이름
- 색 대비
- modal focus trap

자동 검사만으로 접근성이 완료됐다고 보지 않는다. 키보드 조작과 스크린 리더 의미는 수동 리뷰 대상이다.

## 검증 명령

```bash
cd front-end

npm run test          # Vitest
npm run e2e           # Playwright E2E/accessibility
npm run build-storybook
npm run validate
npm run validate:full
```

## 금지 사항

- 모든 CSS 속성을 테스트로 고정
- 모든 화면을 screenshot baseline으로 관리
- E2E에서 세부 스타일을 대량 검증
- class 이름 기반으로 기능 테스트 작성
- BDD 테스트에 카드 AC와 다른 `Covers` 문장 사용
- 별도 시나리오 ID 생성

## 자동 검증 항목

- `npm run test`: TDD/컴포넌트 테스트.
- `npm run e2e`: Playwright 사용자 흐름, 반응형 smoke, axe 접근성 smoke.
- `npm run validate:full`: FE 전체 기준선.
- (예정) `generateFrontEndSourceIndex`: FE BDD 테스트의 `REQ`와 `Covers` 추출.
- (예정) 통합 trace report: AC별 FE/BE 테스트 결과 병합.

## 수동 리뷰 항목

- 테스트가 사용자 결과를 검증하는가, 구현 세부를 과도하게 고정하지 않는가
- Storybook story가 공통 컴포넌트의 주요 상태를 포함하는가
- E2E가 핵심 업무 흐름을 검증하고 세부 스타일 테스트로 변질되지 않았는가
- visual baseline 변경이 의도된 디자인 변경인가
