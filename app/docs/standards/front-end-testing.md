# Front-end 테스트 표준

프런트엔드 테스트는 TDD 보조 테스트와 BDD Acceptance Test를 분리한다. 모든 테스트가 요건 완료 판정에 들어가지 않는다. 요건 완료 여부는 기존 원칙대로 카드의 수용 기준 문장과 정확히 일치하는 `Covers` 메타데이터가 있는 BDD 테스트로 판단한다.

## 테스트 계층

```text
Vitest / Testing Library
  상태별 렌더링, validation, hook, view model, API 상태별 UI

Storybook
  공통 컴포넌트와 화면 조각의 상태 카탈로그

Playwright E2E
  사용자 흐름, 라우팅, 인증, 주요 화면 진입, 데스크톱 smoke

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
- 연결: `Requirement` 값(`REQ-XXX`)과 `Covers` 문장
- `Covers` 문장은 카드 수용 기준과 정확히 일치해야 한다.
- 시나리오 제목과 테스트 제목은 일치하지 않아도 된다.
- 별도 시나리오 ID는 만들지 않는다.

### 요건 연결 정책

FE BDD/E2E의 `Requirement` 메타데이터는 기본적으로 화면 슬라이스가 아니라 원자 요건을 가리킨다. 같은 기능에 속한다는 사실은 상위 REQ와 `관련 요건` 관계로 표현하고, 테스트 완료 판정은 하위 원자 요건의 AC로 계산한다.

- 화면이 특정 원자 요건의 사용자 결과를 검증하면 해당 원자 REQ를 적는다.
- 여러 원자 요건을 관통하는 사용자 여정 또는 기능 전체 성과를 검증할 때만 상위 REQ를 직접 적는다.
- Storybook story, page metadata, route/page source annotation도 같은 원칙을 따른다. 상태 카탈로그가 특정 원자 요건의 화면 상태라면 원자 REQ를 적는다.
- 화면 카드가 canonical REQ로 병합되면 FE BDD 테스트, story, page metadata의 `Requirement`도 canonical REQ 또는 새 원자 REQ로 옮긴다.
- `상태: 대체됨`인 구현 슬라이스 REQ에는 새 FE 테스트나 story metadata를 연결하지 않는다.

표준 메타데이터 형식:

```ts
test("사용자가 할 일 목록을 확인한다", async ({ page }) => {
  test.info().annotations.push(
    { type: "Requirement", description: "REQ-002" },
    { type: "Covers", description: "본인의 할 일 목록만 조회된다" },
  )

  // Given / When / Then을 실제 화면 행위로 옮긴다.
})
```

`npm run app:front-end-source-index`는 위 literal annotation만 AC 커버리지 대상으로 수집한다. `type`은 `Requirement`와 `Covers`를 사용한다. 동적으로 만든 annotation 객체는 추적 누락을 막기 위해 source index issue로 보고한다.

Playwright 전체 실행 결과는 `app/front-end/test-results/e2e-results.json`으로 남긴다. `npm run app:trace`와 `npm run app:validate`는 FE BDD 테스트 상태를 이 파일에서만 읽는다. `npm run e2e`와 `npm run validate:full`만 이 canonical 결과 파일을 갱신한다.

개별 spec 또는 `-g` 필터로 부분 실행할 때는 `npm run e2e:partial -- ...` 또는 직접 `playwright test ...`를 사용한다. 부분 실행의 JSON 결과는 기본적으로 `app/front-end/test-results/e2e-results.partial.json`에 기록하며, canonical 결과를 덮어쓰지 않는다. `(UI)` 또는 `(E2E)` AC가 있는 카드 검증 전에는 반드시 `npm run e2e` 또는 `npm run validate:full`로 전체 결과를 새로 갱신한다.

### E2E API mock 경계

Playwright API mock은 SPA 문서 네비게이션을 가로채면 안 된다. `/todos`, `/categories`처럼 화면 route와 API path가 같은 경우 `page.goto("/categories")`의 document 요청까지 JSON으로 fulfill하면 React 앱이 부팅되지 않는다. 경로가 충돌하지 않는 API라도 같은 실수를 막기 위해 모든 API mock은 기본적으로 document 요청을 fallback한다.

- E2E API mock은 `tests/e2e/_helpers/apiRoute.ts`의 `routeApi(page, url, handler)`를 경유한다.
- 직접 `page.route(...)`를 쓰지 않는다. ESLint `bdd-workflow/no-raw-page-route`가 이를 차단한다.
- `routeApi`는 `request.resourceType() === "document"`이면 `route.fallback()`으로 넘기고, fetch/xhr 같은 API 요청만 handler에 전달한다.
- 도메인 mock helper(`auth-mocks.ts`, `category-mocks.ts` 등)는 모두 `routeApi` 위에 만든다. spec 본문에서 예외 mock이 필요해도 `routeApi`를 사용한다.

### 비동기와 캐시 신선도

Playwright의 web-first assertion은 계속 렌더되는 DOM 변화에 사용한다. 반대로 모달 초기값처럼 "열 때 한 번 snapshot되는" surface는 mutation 직후 오래된 Query cache를 읽을 수 있으므로, 다시 열기 전에 재조회 완료 신호를 기다린다.

- 계속 렌더되는 목록/버튼/상태 문구: `await expect(locator).toBeVisible()` 같은 자동 재시도를 사용한다.
- mutation 후 다시 여는 dialog/drawer/form 초기값: 저장 클릭 전에 `page.waitForResponse(...)` 또는 도메인별 재조회 완료 promise를 등록하고, 재조회가 끝난 뒤 다시 연다.
- 가상 스크롤 목록은 `front-end-ui.md`의 목록 가상 스크롤 테스트 기준을 따른다. 화면 밖 항목은 스크롤 후 단언하고, row height/overscan 같은 구현 세부를 고정하지 않는다.

### 분기 테스트 데이터

화이트리스트, redirect, fallback, 기본값 분기는 단일 값 테스트만으로는 충분하지 않다. 구현이 입력을 존중하는지와 항상 기본값으로 보내는지를 구분해야 한다.

- 신뢰 목록이 2개 이상이면 테스트에도 최소 2개의 서로 다른 신뢰 값을 등장시킨다.
- redirect 성공 분기는 기본 진입점이 아닌 신뢰 대상으로 한 번 이상 검증한다.
- 거절 분기는 외부 URL, protocol-relative URL, 알려지지 않은 내부 경로처럼 서로 다른 실패 계열을 포함한다.

### React Compiler 비호환 라이브러리

React Compiler 경고가 나는 라이브러리는 근거 주석과 함께 한 줄 단위로만 억제한다. 파일 전체 disable은 금지한다.

- `@tanstack/react-virtual`의 `useVirtualizer`: `react-hooks/incompatible-library` 경고가 나면 해당 호출 바로 위에 라이브러리명과 이유를 주석으로 남기고 `eslint-disable-next-line react-hooks/incompatible-library`를 둔다.
- 비호환 라이브러리가 추가되면 이 목록에 라이브러리명, 훅/API명, 억제 이유를 함께 추가한다.

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
- Tailwind class 나열 검증
```

### data-testid 정책

role/label/text 같은 접근성 기반 selector 로 표현 가능한 요소에는 `data-testid` 를 두지 않는다. 인증 스켈레톤처럼 사용자에게 의미 있는 이름을 주기 어려운 시각 상태 컨테이너에만 제한적으로 허용한다. testid 를 추가할 때는 컴포넌트 옆에 짧은 주석으로 도입 이유를 남긴다.

## 브라우저 기반 스타일 검증

Playwright computed style 검증은 핵심 상태와 레이아웃 전환만 본다.

검증할 수 있는 항목:

```text
- 데스크톱 기준 화면에서 핵심 영역이 보이는가
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
3. 데스크톱 취약 화면: 테이블, 차트, 사이드바, 모달
4. 테마 화면: 다크모드, 고객사 테마, 고대비 모드

운영 규칙:

- browser, 데스크톱 viewport, font, OS 환경을 고정한다.
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

- Story는 상태 카탈로그이며, route가 있는 page는 route 기준 page mock story로 첫 화면을 확인한다.
- E2E는 사용자 흐름 검증이다.
- Storybook story 이름은 요건 추적 ID가 아니다.
- 요건 추적은 `Requirement` 값(`REQ-XXX`)과 `Covers`만 사용한다.

## 데스크톱 화면 테스트

표준 검증 viewport:

```text
desktop: 1440 x 900
```

BDD 또는 visual 대상이 되는 화면은 데스크톱 기준 화면만 확인한다. 모바일/태블릿 대응은 기본 표준에서 제외하고, 별도 요건이 승인된 경우에만 해당 요건의 수용 기준과 테스트로 다룬다.

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
cd app/front-end

npm run test          # Vitest
npm run source-index  # FE source index
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
- `npm run e2e`: Playwright 사용자 흐름, 데스크톱 smoke, axe 접근성 smoke.
- `npm run validate:full`: FE 전체 기준선.
- `npm run source-index` 또는 루트 `npm run app:front-end-source-index`: FE BDD 테스트의 `Requirement`와 `Covers`, page/route/story 메타데이터 추출.
- `npm run lint`: E2E의 직접 `page.route(...)` 사용을 차단하고 `routeApi` 경유를 강제한다.
- 통합 trace report: AC 마커에 따라 API/UI/E2E/STATIC 검증 채널별 테스트 결과 병합.

## 수동 리뷰 항목

- 테스트가 사용자 결과를 검증하는가, 구현 세부를 과도하게 고정하지 않는가
- Storybook story가 공통 컴포넌트의 주요 상태를 포함하는가
- E2E가 핵심 업무 흐름을 검증하고 세부 스타일 테스트로 변질되지 않았는가
- redirect/화이트리스트/기본값 분기가 비-기본 신뢰 값과 거절 값을 모두 검증하는가
- visual baseline 변경이 의도된 디자인 변경인가
