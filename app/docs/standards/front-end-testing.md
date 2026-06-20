# Front-end 테스트 표준

프런트엔드 테스트는 TDD 보조 테스트와 BDD Acceptance Test를 분리한다. 모든 테스트가 요건 완료 판정에 들어가지 않는다. 요건 완료 여부는 기존 원칙대로 카드의 수용 기준 문장과 정확히 일치하는 `Covers` 메타데이터가 있는 BDD 테스트로 판단한다.

## 테스트 계층

```text
Vitest / Testing Library
  상태별 렌더링, 입력 검증, React hook, 화면 모델, API 상태별 UI

Storybook
  공통 컴포넌트와 화면 상태 카탈로그

Storybook Vitest
  UI 수용 기준 커버리지, 라우팅/인증/상태별 화면 행위, 접근성 smoke

Playwright live smoke
  상위 요건의 통합 사용자 성과, 실 백엔드 + 실 프런트엔드 + Vite proxy + Cookie 인증

시각 회귀
  Storybook story와 핵심 화면 캡처 기준선

접근성
  axe 스모크, 키보드 포커스, 레이블/오류 연결
```

## TDD / 보조 테스트

TDD 테스트는 구현 설계와 회귀 방지 목적이다.

- 위치: `src/**/*.test.{ts,tsx}`
- 도구: Vitest, React Testing Library, jest-dom, user-event
- 검증 대상: 상태별 렌더링, 양식 입력 검증, 비활성화/로딩/오류, React hook, formatter, 화면 모델
- `Covers` 메타데이터를 붙이지 않는다.
- AC 커버리지에 포함하지 않는다.

좋은 검증:

```text
- 필수 입력을 비우면 오류 문구가 보인다
- 저장 중에는 제출 버튼이 비활성화된다
- 빈 목록이면 빈 상태 안내가 보인다
- API 오류가 양식 전체 경고 안내로 변환된다
```

피할 검증:

```text
- 모든 padding 값
- 모든 색상 hex
- Tailwind class 이름 세부값
- 컴포넌트 내부 DOM 구조
```

## Storybook Vitest Acceptance Test

Storybook Vitest 테스트는 승인된 `.feature` 시나리오의 Given/When/Then을 실제 화면 행위로 옮긴다. 앱 UI 수용 기준은 Storybook Vitest story test가 담당한다.

- 위치: `src/**/*.stories.tsx`
- 도구: Storybook Vitest browser mode
- 연결: story `parameters.harness.requirements`의 `REQ-XXX` 값과 `parameters.harness.covers`의 `Covers` 문장
- `Covers` 문장은 카드 수용 기준과 정확히 일치해야 한다.
- story export 이름과 시나리오 제목은 일치하지 않아도 된다.
- 별도 시나리오 ID는 만들지 않는다.
- AC 커버리지에 포함할 story는 `tags: ["test"]`를 둔다.
- `parameters.harness.covers`가 있는 story는 `play` 함수 안에서 사용자 행위와 `expect(...)` 검증을 함께 둔다. 단순 렌더링 story나 문서용 상태 story는 AC 커버리지로 인정하지 않는다.
- 성공 조건은 사용자가 관찰하는 최종 상태로 단언한다. 대화상자, 메뉴, 포털처럼 Storybook Docs DOM과 섞일 수 있는 surface는 현재 열린 role/name 대상 안에서 검증한다.

### 요건 연결 정책

Storybook Vitest/live E2E의 `Requirement` 메타데이터는 기본적으로 화면 슬라이스가 아니라 원자 요건을 가리킨다. 같은 기능에 속한다는 사실은 상위 REQ와 `관련 요건` 관계로 표현하고, 테스트 완료 판정은 하위 원자 요건의 AC로 계산한다.

- 화면이 특정 원자 요건의 사용자 결과를 검증하면 해당 원자 REQ를 적는다.
- 여러 원자 요건을 관통하는 사용자 여정 또는 기능 전체 성과를 검증할 때만 상위 REQ를 직접 적는다. 이 경우 mock 기반 E2E가 아니라 아래 "상위 요건 live 통합 스모크" 기준을 따른다.
- Storybook story, 화면 metadata, 경로/화면 source annotation도 같은 원칙을 따른다. 상태 카탈로그가 특정 원자 요건의 화면 상태라면 원자 REQ를 적는다.
- 화면 카드가 canonical REQ로 병합되면 Storybook Vitest story, 화면 metadata의 `Requirement`도 canonical REQ 또는 새 원자 REQ로 옮긴다.
- `상태: 대체됨`인 구현 슬라이스 REQ에는 새 FE 테스트나 story metadata를 연결하지 않는다.

표준 메타데이터 형식:

```ts
export const Empty: Story = {
  tags: ["test"],
  parameters: {
    harness: {
      requirements: ["REQ-023"],
      covers: ["할 일이 없으면 빈 상태 안내가 보인다"],
    },
  },
}
```

`npm run app:front-end-source-index`는 위 literal metadata만 AC 커버리지 대상으로 수집한다. `requirements`는 `REQ-XXX` 형식이어야 하고, `covers`는 카드 수용 기준 원문과 정확히 일치해야 한다.

### Storybook story test 작성 규칙

`parameters.harness.covers`가 있는 story는 문서용 상태가 아니라 실행 가능한 Acceptance Test다. 테스트 작성자는 story가 성공했다고 볼 수 있는 사용자 관찰 결과를 `play` 경로에서 드러내야 한다.

기본 형태:

```ts
const assertEmptyTodos = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)

  await expect(canvas.getByText("아직 할 일이 없습니다. 새 할 일을 만들어 보세요.")).toBeVisible()
  await expect(canvas.getByRole("button", { name: "새 할 일" })).toBeVisible()
}

export const Empty: Story = {
  parameters: {
    harness: {
      requirements: ["REQ-023"],
      covers: ["할 일이 하나도 없으면 할 일이 비어 있다는 안내가 보인다"],
    },
  },
  play: assertEmptyTodos,
}
```

작성 기준:

- `covers`가 있는 story는 `play`를 둔다.
- `play`는 `expect(...)`가 들어 있는 `assert...` 함수 또는 inline 함수로 연결한다. 성공 조건이 `openDialog`, `submitForm` 같은 일반 helper 이름 뒤에만 숨어 있으면 커버리지 근거로 보지 않는다.
- `assert...` 함수는 story 파일 안에 두고, 테스트 성공 조건을 읽는 사람이 해당 파일에서 바로 확인할 수 있게 한다.
- 공통 helper는 활성 대화상자 찾기, 현재 열린 popup 닫힘 대기, 반복 입력 같은 저수준 동작에만 사용한다.
- 테스트는 사용자가 보는 role, label, text, link/button name을 우선 사용한다. `data-testid`는 접근성 기반 selector로 표현하기 어려운 스크롤 sentinel 같은 보조 표면에만 둔다.
- 검증은 내부 React state, query key, CSS class, DOM 깊이, 구현 함수 호출 여부가 아니라 화면에 남는 결과로 쓴다.

상태별 권장 검증:

| 상태 | 권장 성공 조건 |
|---|---|
| 초기 화면 | 제목, 주요 입력, 주요 동작, 안내 영역이 보인다 |
| 빈 목록 | 빈 상태 안내와 다음 행동 버튼이 보인다 |
| 조회 실패 | 빈 상태와 구분되는 실패 안내가 보인다 |
| 입력 오류 | 해당 입력 아래 오류 문구가 보이고 입력값은 유지된다 |
| 제출 중 | 제출 버튼이 처리 중 이름으로 바뀌고 비활성화된다 |
| 서버 거절 | 같은 대화상자/양식 안에 재시도 가능한 오류 안내가 남는다 |
| 성공 제출 | 대화상자가 닫히고 목록/경로/상태 문구가 바뀐다 |
| 재오픈 | 성공 후 다시 여는 대화상자의 버튼과 초기값이 이전 제출 중 상태에 묶여 있지 않다 |

대화상자, alert dialog, menu처럼 portal로 렌더링되는 표면은 `canvasElement`만 보지 않는다. 현재 열린 `role`과 접근 가능한 이름을 기준으로 범위를 좁혀 검증한다.

```ts
const dialog = await withinCurrentDialog("새 할 일")
await userEvent.type(dialog.getByLabelText("제목"), "Code review")
await userEvent.click(dialog.getByRole("button", { name: "만들기" }))
await expectCurrentPopupClosed("dialog", "새 할 일")
await expect(await canvas.findByText("Code review")).toBeVisible()
```

비동기 제출 테스트에서는 다음 순서를 지킨다.

1. 사용자가 누르는 버튼을 `userEvent.click`으로 조작한다. DOM `form.requestSubmit(...)`처럼 정상 사용자 경로를 우회하지 않는다.
2. 성공 흐름은 닫힘, 목록 반영, 경로 변경, 상태 문구 변경 중 사용자가 관찰하는 최종 결과를 기다린다.
3. 실패 흐름은 같은 입력 표면에 오류가 남고 재시도 가능한 버튼 상태로 돌아오는지 본다.
4. 제출 중 흐름은 의도적으로 끝나지 않는 promise를 주입해 버튼의 처리 중/비활성 상태만 확인한다.
5. 성공 후 곧바로 수정/삭제 같은 다음 작업을 이어 가는 route-level story는 이전 대화상자의 submitting 상태가 다음 대화상자에 남지 않는지 확인한다.

route-level story는 단일 컴포넌트의 prop 상태보다 사용자 여정을 검증한다. 생성, 수정, 완료 전환, 삭제처럼 같은 화면 안에서 이어지는 AC는 필요한 경우 하나의 route story가 여러 `covers`를 가질 수 있다. 이때 각 AC의 관찰 결과가 테스트 본문 안에 실제 assertion으로 드러나야 한다.

component-level dialog story는 입력 항목, 오류, 제출 중, 서버 거절처럼 단일 표면의 상태를 검증한다. 성공 후 닫힘과 목록 반영은 그 컴포넌트를 사용하는 route-level story에서 확인한다.

### 상위 요건 live 통합 스모크

상위 요건의 `(E2E)` AC는 여러 원자 요건이 결합될 때만 확인되는 제품 성과다. 이 AC는 API mock으로 닫지 않고 실 백엔드와 실 프런트엔드를 함께 띄운 live Playwright smoke가 커버한다.

- 위치: `tests/e2e/live/**/*.live.spec.ts`
- 설정: `playwright.live.config.ts`
- 실행: `npm run e2e:live` 또는 루트 `npm run app:e2e:live`
- 결과 파일: 루트 runner 실행 중에는 run root의 `test-results/e2e-live-results.json`, 성공 publish 후에는 `app/front-end/test-results/e2e-live-results.json`
- 대상: `명세 역할: 상위 요건`이고 `검증 수준: e2e`이며 `(E2E)` AC만 가진 카드.
- 연결: live spec의 `Requirement`는 상위 REQ를 직접 가리키고, `Covers`는 상위 카드의 `(E2E)` AC 문장과 정확히 일치한다.
- 범위: 상위 AC 하나에 필요한 최소 정상 흐름 스모크만 둔다. 하위 원자 요건의 입력 검증, 실패 분기, 접근성, 세부 화면 상태는 각 원자 요건의 Storybook Vitest story 또는 백엔드 Acceptance Test가 소유한다.
- 네트워크: live spec에서는 `page.route(...)`나 API mock helper를 사용하지 않는다. FE origin의 Vite proxy를 통해 실 백엔드 API를 호출하고, 인증은 브라우저 Cookie 흐름으로 검증한다.
- 데이터: 각 live test는 고유 이메일/고유 이름처럼 충돌하지 않는 데이터를 만들고, 다른 테스트 순서나 이전 실행 데이터에 의존하지 않는다.
- 실행 안정성: 루트 runner는 실행마다 Spring Boot와 Vite dev server가 쓸 포트를 할당해 `E2E_BACKEND_PORT`, `E2E_FRONTEND_PORT`, `E2E_BASE_URL`, `VITE_BACKEND_ORIGIN`으로 주입하고, live config는 그 값을 소비한다. 직접 `npm run e2e:live`를 실행해 env가 없을 때만 8080/5173 fallback을 쓴다. 명시한 포트가 점유돼 있으면 기존 프로세스를 자동 종료하지 않고 fail-fast 진단으로 중단한다.
- 자동 검증: `validate-front-end-standards`는 상위 요건 `(E2E)` AC를 커버하는 FE 테스트가 `tests/e2e/live/**/*.live.spec.ts` 밖에 있으면 error로 보고한다. 또한 live spec이 API mock helper를 import하면 error로 보고한다.

할 일 관리처럼 화면 본문이 아직 별도 원자 요건 범위 밖이면, 브라우저에서 가입/로그인해 HttpOnly Cookie 세션을 만든 뒤 `page.evaluate(() => fetch("/todos", { credentials: "include" }))`처럼 FE origin proxy 경유 API 생명주기를 검증할 수 있다. 이 방식은 UI 본문을 검증하는 것이 아니라 브라우저 세션, Vite proxy, Cookie 인증, 백엔드 API 결합을 검증하는 상위 성과 smoke다.

Storybook Vitest story는 상위 요건의 같은 `(E2E)` `Covers`를 반복해서 붙이지 않는다. 상위 통합 성과는 live smoke가 소유하고, story는 원자 요건의 `(UI)` AC 또는 세부 화면 상태만 커버한다.

### 실행 결과 파일

Storybook Vitest 실행 결과는 루트 runner 실행 중에는 run root의 `test-results/storybook-junit.xml`로 남기고, 성공 후 `app/front-end/test-results/storybook-junit.xml`로 publish한다. 상위 요건 live smoke 실행 결과도 run root에 먼저 쓰고, 성공 후 `app/front-end/test-results/e2e-live-results.json`과 관련 artifact/report를 publish한다. `npm run app:trace`와 `npm run app:validate`는 현재 실행의 run root 결과를 읽어 프런트엔드 BDD 테스트 상태를 병합한다.

루트 `npm run app:e2e`는 Storybook Vitest 결과와 manifest를 run root에 생성한 뒤 성공 시 canonical 결과 파일과 manifest를 함께 publish한다. 루트 `npm run app:e2e:live`는 live Playwright 결과와 manifest를 같은 방식으로 publish한다. 루트 `npm run app:validate`는 백엔드 Acceptance Test, Storybook Vitest, live smoke를 모두 실행한 뒤 trace/gate를 판정하고 성공한 실행만 canonical 결과와 manifest로 publish한다.

원자 요건의 `(UI)` AC 검증 전에는 루트 `npm run app:e2e`로 Storybook Vitest 결과를 새로 갱신한다. 상위 요건의 live `(E2E)` AC 검증 전에는 루트 `npm run app:e2e:live`를 실행한다.

`npm run app:trace`는 테스트를 재실행하지 않고 직전 성공 canonical 결과를 현재 run root로 복사해 읽는다. 테스트 코드나 서버 동작을 바꾼 뒤에는 stale PASS를 피하기 위해 `npm run app:validate`, `npm run app:e2e`, 또는 `npm run app:e2e:live`로 해당 결과 파일과 manifest를 먼저 갱신한다. 프런트엔드 패키지에서 직접 실행하는 `npm run test:storybook`, `npm run e2e`, `npm run e2e:live`는 freshness manifest를 만들지 않으므로 canonical stale 해소 명령으로 쓰지 않는다.

### 실행 결과 freshness

canonical 결과(Storybook Vitest JUnit, live Playwright JSON)는 각 결과 파일 옆 sidecar manifest(`*.manifest.json`)에 실행 시점 FE BDD source fingerprint를 함께 기록한다. `npm run app:trace`는 manifest fingerprint가 현재 FE BDD source fingerprint와 일치하는 결과만 AC 커버 결과로 인정한다.

- 테스트의 `Requirement`/`Covers`/식별자를 바꾼 뒤에는 결과를 재실행해야 stale이 해소된다. 원자 요건 `(UI)` AC는 `npm run app:e2e`, 상위 요건 `(E2E)` AC는 `npm run app:e2e:live`로 재실행한다. 루트 runner가 결과 파일과 manifest를 한 단위로 새로 publish한다.
- stale 또는 manifest가 없는 결과는 AC 커버 PASS로 인정되지 않고, 해당 FE BDD 결과는 trace에서 `NOT_RUN`/`MISSING`으로 계산되며 `FE-TEST-RESULT-STALE` error가 보고된다. 최초 적용 후에는 canonical E2E를 한 번 재실행해 manifest를 만든다.
- fingerprint는 line을 제거한 stable 식별자(`resultKeys`)·`Requirement`·`Covers`만 쓴다. 따라서 story/spec 본문이나 렌더 코드 편집, 위쪽 줄 이동만으로는 stale이 되지 않고, AC `target` 마커 편집도 stale을 만들지 않는다.
- `npm run app:validate`는 두 결과와 manifest를 항상 새로 만든 뒤 trace/gate를 판정하므로 stale이 생기지 않는다. 테스트가 실패해도 결과 파일과 manifest는 같은 실행에서 생성되어 최신 `FAIL`이 trace에 반영된다.
- `e2e-results.partial.json`은 빠른 디버깅용 잔재이며 canonical trace/gate 입력이 아니다.

이 정책의 정의·검사기·manifest 형식은 하네스 표준 [`acceptance-test.md`](../../../harness/docs/standards/acceptance-test.md)와 [`data-contracts.md`](../../../harness/docs/data-contracts.md)가 소유한다.

### live E2E 네트워크 경계

live Playwright는 통합 smoke이므로 API를 mock하지 않는다. `page.route(...)` 사용은 ESLint `bdd-workflow/no-raw-page-route`가 차단한다. 화면 상태별 API 응답은 Storybook/MSW 또는 컴포넌트 주입 데이터로 표현하고, live smoke는 Vite proxy를 통해 실 백엔드를 호출한다.

### 비동기와 캐시 신선도

Playwright의 web-first assertion은 계속 렌더되는 DOM 변화에 사용한다. 반대로 대화상자 초기값처럼 "열 때 한 번 snapshot되는" surface는 mutation 직후 오래된 Query cache를 읽을 수 있으므로, 다시 열기 전에 재조회 완료 신호를 기다린다.

- 계속 렌더되는 목록/버튼/상태 문구: `await expect(locator).toBeVisible()` 같은 자동 재시도를 사용한다.
- 변경 요청 후 다시 여는 대화상자/드로어/입력 양식 초기값: 저장 클릭 전에 `page.waitForResponse(...)` 또는 도메인별 재조회 완료 promise를 등록하고, 재조회가 끝난 뒤 다시 연다.
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
- 보임 / 숨김
- 비활성화 / 활성화
- aria-invalid
- 오류 메시지 연결
- 로딩 표시
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
- 포커스 표시가 보이는가
- 위험 강조/주요 동작 같은 핵심 variant가 적용되는가
```

과도하게 고정하지 않을 항목:

```text
- 모든 margin/padding
- 모든 font-size
- 모든 color token 값
- 내부 class 이름
```

## 화면 캡처 / 시각 회귀

시각 회귀 테스트는 실제 브라우저 렌더링 결과를 확인하는 가장 강한 검증이다. 전 화면에 적용하지 않고, 공통 컴포넌트와 핵심 화면에 제한한다.

우선순위:

1. 공통 컴포넌트: Button, Input, Select, Checkbox, Dialog, Alert, Toast, Table, Pagination, Tabs
2. 업무 핵심 화면: 가입, 로그인, 목록, 상세, 등록/수정
3. 데스크톱 취약 화면: 테이블, 차트, 사이드바, 대화상자
4. 테마 화면: 다크모드, 고객사 테마, 고대비 모드

운영 규칙:

- 브라우저, 데스크톱 화면 크기, 글꼴, OS 환경을 고정한다.
- 허용 차이 기준을 둔다.
- 화면 캡처 기준선 변경은 코드 리뷰에서 의도된 디자인 변경인지 확인한다.
- 애니메이션, 현재 시각, 랜덤 값은 고정한다.

## Storybook 기반 시각 검증

Storybook story는 시각 회귀의 기본 대상이다.

```text
BDD Scenario
  -> Storybook 상태
  -> 시각 회귀
  -> E2E 화면 캡처
```

- Storybook story는 상태 카탈로그이며, 경로가 있는 화면은 경로 화면 모의 story로 첫 화면을 확인한다.
- UI가 있는 요건의 Skeleton 단계에서는 Storybook을 사용자 검토 표면으로 먼저 작성한다. 테스트 코드와 구현은 이 상태 카탈로그를 기준으로 이어간다.
- E2E는 사용자 흐름 검증이다.
- Storybook story 이름은 요건 추적 ID가 아니다.
- 요건 추적은 `Requirement` 값(`REQ-XXX`)과 `Covers`만 사용한다.

### Storybook Docs 설명

Storybook은 화면 캡처 목록이 아니라 사용자가 직접 검토할 상태 카탈로그다. Storybook Docs 설명에는 화면을 여는 이유와 사용자가 어떤 순서로 조작해야 하는지가 함께 보여야 한다.

- `parameters.docs.description.component`에는 컴포넌트 또는 화면의 책임, 주요 표시 요소, 연결된 사용자 결과를 적는다.
- `parameters.docs.description.story`에는 해당 이름 붙은 story가 보여주는 상태, 사용자가 수행할 흐름, 조작 후 관찰할 상태 변화를 적는다.
- 설명 문장은 한국어 업무 용어를 우선 사용한다. 예를 들어 대화상자, 여는 버튼, 동작, 입력 항목, 양식 전체 경고 안내처럼 사용자가 읽는 말로 적고, 코드/API 용어가 꼭 필요할 때만 백틱으로 남긴다.
- 전역 Storybook preview는 Docs 개요에 `Title`, 컴포넌트 `Description`, 대표 story `Description`, `Primary`, `Controls`를 렌더링해 대표 화면과 설명에 집중하게 한다.
- 열린 대화상자처럼 대표 캔버스가 Docs 본문을 덮는 story는 `parameters.harness.docs.omitPrimaryCanvas = true`와 `parameters.harness.docs.omitComponentProperties = true`로 Docs 개요의 대표 캔버스와 컴포넌트 속성을 생략한다. 해당 상태 화면은 좌측 story 목록 또는 상태 설명 링크에서 직접 확인한다.
- 하위 상태 story를 Docs 개요에 모두 캔버스로 펼쳐 렌더링하지 않는다.
- 상태 설명은 Docs 개요의 텍스트 목록에서 확인하고, 상태별 화면은 좌측 story 목록의 이름 붙은 story로 직접 진입해 확인한다.
- 설명은 Markdown 문자열로 작성할 수 있다. 긴 설명은 `화면 목적`, `주요 요소`, `사용자 흐름`, `관찰 포인트` 같은 사용자 관찰 중심의 짧은 제목을 사용한다.
- Storybook Docs 전용 스타일은 Markdown `ol`/`ul` 목록 표시를 보존해야 한다. 사용자 흐름의 순서 번호와 주요 요소의 글머리표가 Tailwind reset 때문에 사라지지 않게 한다.
- Storybook Docs 설명에는 단계/범위 섹션을 두지 않는다. 검토 범위와 승인 조건은 요건 카드의 `UI Skeleton`, `Storybook 계약`, Change Set에 둔다.
- 경로/화면 모의 story는 진입 경로, 필요한 감싸기 구성, 모의 데이터 범위, 사용자가 직접 클릭해 볼 수 있는 생성/수정/삭제/검증/성공 흐름을 적는다.
- 입력 대화상자 story는 입력 조건, 제출 동작, 입력 항목 오류, 제출 중 상태, 서버 거절, 성공 후 닫힘을 어디에서 확인하는지 적는다.
- 목록 story는 데이터 개수, 빈 상태/로딩/오류/추가 묶음 존재 상태, 스크롤 또는 항목별 동작 진입점을 적는다.
- 공통 기본 컴포넌트 story는 업무 흐름을 억지로 만들지 않고, 어떤 제품 화면 상태를 대표하는지와 키보드/포커스/비활성화/오류 같은 관찰 포인트를 적는다.
- 설명은 사용자가 보는 화면과 상태를 말한다. 내부 React hook 이름, 테스트 구현 세부, 하네스 수집 방식은 필요한 경우에만 짧게 언급한다.

예:

```ts
export const RouteTodos: Story = {
  name: "Route /todos",
  parameters: {
    docs: {
      description: {
        story: `
### 화면 목적

\`/todos\`로 진입했을 때 인증된 사용자가 할 일 목록을 확인하고 새 할 일을 만들 수 있는 화면이다.

### 사용자 흐름

1. 목록에서 제목, 우선순위, 기한, 카테고리, 완료 상태를 확인한다.
2. 만들기 버튼으로 입력 대화상자를 연다.
3. 필수 입력과 선택 값을 채운 뒤 저장한다.
4. 저장 후 새 항목이 목록에 반영되는지 확인한다.

### 관찰 포인트

이 story는 실제 API 대신 메모리 안에서 동작하는 모의 데이터를 사용한다. Storybook 안에서 생성, 수정, 삭제, 제출 중 상태를 직접 클릭해 볼 수 있다.
        `,
      },
    },
  },
}
```

## 데스크톱 화면 테스트

표준 검증 viewport:

```text
desktop: 1440 x 900
```

BDD 또는 visual 대상이 되는 화면은 데스크톱 기준 화면만 확인한다. 모바일/태블릿 대응은 기본 표준에서 제외하고, 별도 요건이 승인된 경우에만 해당 요건의 수용 기준과 테스트로 다룬다.

## 접근성 테스트

자동 접근성 검사는 axe smoke test를 기본으로 한다.

함께 확인할 항목:

- 키보드 Tab 이동 순서
- 포커스 표시
- 레이블과 입력 컨트롤 연결
- 오류 메시지와 입력 연결
- 아이콘만 있는 버튼의 접근 가능한 이름
- 색 대비
- 대화상자 안에 포커스가 머무르는지

자동 검사만으로 접근성이 완료됐다고 보지 않는다. 키보드 조작과 스크린 리더 의미는 수동 리뷰 대상이다.

## 검증 명령

```bash
cd app/front-end

npm run test          # Vitest
npm run test:storybook # Storybook Vitest
npm run source-index  # FE source index
npm run e2e           # Storybook Vitest alias
npm run e2e:live      # 상위 요건 live 통합 스모크
npm run build-storybook
npm run validate
npm run validate:full
```

## 금지 사항

- 모든 CSS 속성을 테스트로 고정
- 모든 화면을 화면 캡처 기준선으로 관리
- E2E에서 세부 스타일을 대량 검증
- class 이름 기반으로 기능 테스트 작성
- BDD 테스트에 카드 AC와 다른 `Covers` 문장 사용
- 별도 시나리오 ID 생성

## 자동 검증 항목

- `npm run test`: TDD/컴포넌트 테스트.
- `npm run test:storybook` 또는 `npm run e2e`: Storybook Vitest 사용자 흐름, 상태별 화면, 접근성 스모크.
- `npm run e2e:live`: 상위 요건 live 통합 스모크.
- 루트 `npm run app:validate`: 백엔드 Acceptance Test, Storybook Vitest, live smoke 결과를 모두 갱신하고 앱 trace/gate를 판정한다.
- `npm run validate:full`: FE 전체 기준선.
- `npm run source-index` 또는 루트 `npm run app:front-end-source-index`: Storybook Vitest `requirements`/`covers`, live E2E `Requirement`/`Covers`, page/route/story 메타데이터 추출.
- `npm run lint`: live E2E의 직접 `page.route(...)` 사용을 차단한다.
- 통합 trace report: AC 마커에 따라 API/UI/E2E/STATIC 검증 채널별 테스트 결과 병합.

## 수동 리뷰 항목

- 테스트가 사용자 결과를 검증하는가, 구현 세부를 과도하게 고정하지 않는가
- Storybook story가 공통 컴포넌트의 주요 상태를 포함하는가
- Storybook Vitest가 핵심 UI 상태와 사용자 행위를 검증하고 세부 스타일 테스트로 변질되지 않았는가
- 상위 요건의 `(E2E)` AC가 모의 API가 아니라 live smoke로 커버되는가
- live smoke가 상위 성과 정상 흐름에 머물고 하위 원자 요건의 분기 테스트를 복제하지 않는가
- redirect/화이트리스트/기본값 분기가 비-기본 신뢰 값과 거절 값을 모두 검증하는가
- 시각 기준선 변경이 의도된 디자인 변경인가
