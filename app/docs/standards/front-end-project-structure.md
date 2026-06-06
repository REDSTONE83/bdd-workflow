# Front-end 프로젝트 구조 표준

프런트엔드는 `app/front-end/` 아래의 React/Vite/TypeScript 애플리케이션으로 둔다. UI 컴포넌트는 shadcn/ui 규약을 따른다. 백엔드와 같은 요건 카드, 같은 `.feature` 시나리오, 같은 수용 기준 문장을 공유하되, 화면/라우팅/컴포넌트/FE 테스트는 프런트엔드 소스 인덱서가 별도로 수집한다.

## 표준 구조

```text
app/front-end/
  package.json
  vite.config.ts
  components.json
  playwright.config.ts
  tools/
    source-index.mjs
  .storybook/
    main.ts
    preview.ts
  src/
    main.tsx
    App.tsx
    index.css
    api/
    app/
    components/
      ui/
    features/
      {domain}/
        components/
        hooks/
        pages/
        routes.tsx        # feature 가 노출하는 Route JSX 묶음 (AppRouter 가 모은다)
        types.ts
    lib/
    test/
  tests/
    e2e/
```

## 디렉터리 역할

### `src/app/`

애플리케이션 조립 코드를 둔다. 라우터, 전역 provider, 인증 상태 provider, query client 같은 앱 레벨 구성을 이곳에 둔다.

- 도메인 업무 로직을 두지 않는다.
- 전역 레이아웃은 route shell과 분리해 관리한다.
- 도메인에 속하지 않는 글로벌 라우트 — `/` 진입점 redirect, 404 fallback 등 — 도 이곳에 둔다.
- 라우트 합성은 `app/AppRouter.tsx` 에서 각 feature 의 `routes.tsx` 를 import 해 모은다.

### `src/features/{domain}/`

요건과 가장 가까운 업무 단위 코드를 둔다. 도메인 이름은 카드와 시나리오에서 쓰는 업무 용어와 맞춘다.

```text
src/features/todo/
  pages/
    TodoListPage.tsx
  components/
    TodoForm.tsx
    TodoList.tsx
  hooks/
    useTodos.ts
  routes.tsx
  types.ts
```

- page 컴포넌트는 route 진입점이다.
- page/route를 새로 만들거나 바꾸면 같은 구현 단위에서 `PageName.stories.tsx`를 추가하거나 갱신한다. 이 story는 실제 page 컴포넌트를 `MemoryRouter`와 필요한 mock provider로 감싸 route 기준 page mock을 보여준다.
- feature 내부 컴포넌트는 해당 도메인에서만 재사용한다.
- 도메인 간 공유가 확인된 뒤에만 `src/components/` 또는 `src/lib/`로 이동한다.
- `routes.tsx` 는 그 feature 가 노출하는 `<Route>` JSX 묶음을 named export 한다 (`export const todoRoutes = (<>...</>)`). 가드/wrapper(`RequireAuth` 등)도 같이 둔다. `AppRouter` 가 이 묶음을 `<Routes>` 안에 합성한다.
- 요건/경로/페이지명 추적 메타데이터(JSDoc `@Requirement` `@Route` `@Page`)는 page 파일 또는 `src/app/` 진입 파일에 둔다. `routes.tsx` 는 plumbing 이므로 metadata 를 다시 쓰지 않는다.

### `src/components/ui/`

shadcn/ui CLI 또는 shadcn/ui 규약으로 생성한 primitive 컴포넌트를 둔다.

- 직접 수정은 허용하지만, 수정 이유가 디자인 시스템 규칙인지 단일 화면 임시 대응인지 구분한다.
- `button.tsx`, `input.tsx`, `dialog.tsx`처럼 shadcn/ui 파일 단위를 유지한다.
- 공통 variant는 `class-variance-authority`와 `cn()`으로 표현한다.
- 공통 UI primitive를 추가하거나 동작/상태를 바꾸면 같은 구현 단위에서 `*.stories.tsx`를 추가하거나 갱신한다.

### `src/components/`

여러 feature에서 쓰는 조합 컴포넌트를 둔다. 도메인 의미가 강하면 이곳으로 올리지 않는다.

예:

```text
src/components/AppShell.tsx
src/components/EmptyState.tsx
src/components/PageHeader.tsx
```

### `src/api/`

백엔드 API 호출 함수와 생성 타입을 둔다.

- API 타입은 Spring Boot가 제공하는 OpenAPI JSON에서 생성하는 것을 기본으로 한다.
- 손으로 작성한 타입은 임시로만 허용하고, 요건 Skeleton 승인 이력에 생성 전환 필요성을 남긴다.
- API 호출 함수는 화면 컴포넌트에서 직접 `fetch`를 호출하지 않도록 경계를 만든다.

### `src/lib/`

도메인 중립 유틸리티를 둔다.

- `cn`, 날짜 포맷, 라우트 헬퍼, 공통 검증 유틸처럼 UI/도메인 양쪽에서 재사용 가능한 것만 둔다.
- 특정 feature에서만 쓰면 `src/features/{domain}/` 안에 둔다.

### `src/test/`

Vitest/Testing Library 공통 setup, fixture, test helper를 둔다.

- `setup.ts`: jest-dom matcher, cleanup, 전역 mock.
- `builders/`: 테스트 입력 builder.
- `fixtures/`: 도메인 중립 fixture.

### `tests/e2e/`

Playwright E2E와 접근성 smoke test를 둔다.

- 파일명은 사용자 흐름 단위로 `{feature}.spec.ts`를 쓴다.
- FE BDD 테스트는 이 위치에서 시작한다.
- BDD 커버리지 대상 테스트는 `Requirement`와 `Covers` 메타데이터를 남긴다. 실제 형식은 [`front-end-testing.md`](./front-end-testing.md)를 따른다.

### `tools/`

프런트엔드 하네스용 Node 도구를 둔다.

- `source-index.mjs`: TypeScript AST로 FE page/route/story와 Playwright BDD 테스트 메타데이터를 수집한다.
- 출력은 `build/app/indexes/front-end.source-index.json`이다.
- 사람이 출력 JSON을 직접 수정하지 않는다.

## 파일명 규칙

```text
PascalCase.tsx       # React component
camelCase.ts         # utility, hook 내부 helper
useSomething.ts      # hook
Something.test.tsx   # Vitest component/unit test
something.spec.ts    # Playwright E2E test
Something.stories.tsx # Storybook story
```

## 요건 연결 규칙

사람이 관리하는 ID는 계속 `REQ-XXX`만 둔다. 별도 화면 ID, 컴포넌트 ID, 시나리오 ID를 만들지 않는다.

요건 카드에는 구현 표면이 아니라 `대상 시스템`과 AC별 검증 채널 마커를 명시한다.

```text
대상 시스템: application | harness
- (UI) 화면/라우팅/FE BDD 테스트로 검증할 수용 기준
- (E2E) 여러 화면이나 기능을 관통하는 사용자 여정 수용 기준
```

화면, 라우팅, 클라이언트 상태, 데스크톱 시각/접근성 품질은 `(UI)` 또는 `(E2E)` AC와 FE source index 메타데이터로 추적한다.

화면 하나가 여러 업무 기능을 함께 다루면 화면 전용 REQ를 새로 만들지 않고 해당 기능 원자 요건들을 모두 연결한다. 예를 들어 목록 화면에서 생성, 수정, 삭제, 완료 상태 변경까지 조작하면 page/container와 Storybook metadata는 관련 원자 요건을 다중 `@Requirement`로 표시하고, FE BDD 테스트의 각 `Covers`는 실제 AC를 소유한 기능 요건을 가리킨다.

화면/route가 요건에 연결되어야 하는 경우 파일 상단 JSDoc 블록의 태그로 표시한다.
요건 메타데이터는 JSDoc 단일 방식으로 통일하며, 컴포넌트/훅/유틸 어느 파일에도 별도
`export const harness = {...}` 객체를 두지 않는다. React Fast Refresh 가 비-컴포넌트
export 를 경고하고, 하네스 소스 인덱서도 JSDoc 만 읽으므로 객체 표기는 dead metadata 다.
Storybook story 만 예외로 `parameters.harness.requirements` 객체를 사용한다.

```ts
/**
 * @Requirement REQ-002
 * @Route /todos
 * @Page TodoListPage
 * @UsesApi GET /todos mount
 */
export function TodoListPage() {
  // ...
}
```

지원하는 태그:

- `@Requirement REQ-XXX` (또는 `@Requirement REQ-XXX, REQ-YYY` 로 다중 연결): `REQ-XXX` 형식.
- `@Route /path`: 화면 route. 페이지 파일에만 의미가 있다.
- `@Page PageName`: 화면 이름. 페이지 파일에만 의미가 있다.
- `@UsesApi METHOD /path [trigger]`: 해당 파일/화면/route가 기대하는 백엔드 API 사용 계약. `METHOD`는 `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` 중 하나이고, `/path`는 OpenAPI paths 키와 같은 형식으로 query string을 포함하지 않는다. 마지막 `trigger`는 `mount`, `submit`, `click` 같은 짧은 호출 맥락이다.

JSDoc 블록은 파일 상단 60줄 안에 있어야 `source-index.mjs` 가 인식한다. import 보다 위에 두는 것을 권장한다.

Storybook story 는 컴포넌트가 아니므로 JSDoc 대신 default export 또는 story export 의 `parameters.harness.requirements` 객체 메타데이터로 요건을 연결한다.

```ts
export default {
  title: "Todo/TodoListPage",
  parameters: {
    harness: {
      requirements: ["REQ-002"],
    },
  },
}
```

## 생성 산출물

다음은 사람이 직접 수정하지 않는다.

```text
app/front-end/dist/
app/front-end/storybook-static/
app/front-end/playwright-report/
app/front-end/test-results/
app/front-end/coverage/
app/front-end/.cache/
build/app/indexes/front-end.source-index.json
```

## 검증 명령

```bash
cd app/front-end

npm run typecheck       # TypeScript 정적 검증
npm run lint            # ESLint
npm run test            # Vitest unit/component test
npm run build           # production build
npm run build-storybook # Storybook static build
npm run e2e             # Playwright E2E/accessibility smoke
npm run source-index    # FE source index 생성
npm run validate        # 빠른 FE 게이트
npm run validate:full   # Storybook/E2E 포함 전체 FE 게이트
```

## 자동 검증 항목

- `npm run validate`: typecheck, lint, Vitest, Vite build를 실행한다.
- `npm run validate:full`: 빠른 게이트에 Storybook build와 Playwright E2E를 더한다.
- `npm run source-index` 또는 루트 `npm run app:front-end-source-index`: route, page, story, FE BDD 테스트의 `Requirement`/`Covers` 메타데이터를 수집한다.
- 루트 `npm run app:validate`: `(UI)` 또는 `(E2E)` AC의 FE BDD 커버리지와 테스트 결과를 RED/GREEN/BLUE 판정에 반영한다.

## 정적 검사 정책

ESLint는 TypeScript/React 코드 품질, React Hooks 규칙, import/사용 금지 같은 파일 단위 정적 검사에 사용한다. 다음 항목은 ESLint로 충분하다.

- React Hooks 규칙
- 미사용 변수, 기본 TypeScript lint
- 화면 컴포넌트의 직접 `fetch` 금지 같은 import/API 사용 제한
- `src/components/ui/` 같은 특정 경로의 예외 규칙

다음 항목은 ESLint보다 하네스 또는 별도 Node 검사 도구가 맞다. 파일 하나의 AST만으로 판단하기 어렵고, 요건 카드/시나리오/source index/테스트 결과를 함께 봐야 하기 때문이다.

- `Requirement`/`Covers`와 카드 수용 기준의 정확 일치
- Storybook story와 route/page 메타데이터의 요건 연결
- Spring Boot OpenAPI JSON 기반 타입 생성 여부
- generated API 파일 직접 수정 여부
- 공통 UI primitive의 Storybook 상태 누락 여부

제안: 당장은 ESLint와 기존 `npm run app:front-end-source-index`/`npm run app:validate` 조합을 유지한다. 직접 `fetch` 금지처럼 명확한 파일 단위 규칙은 ESLint에 추가하고, OpenAPI 생성물/Storybook 상태/요건 연결처럼 교차 파일 검사가 필요한 항목은 `harness/tools`에 `validate-front-end-standards.mjs` 형태의 별도 검사로 확장한다.

## 수동 리뷰 항목

- feature 경계가 업무 단위와 맞는가
- 도메인 전용 컴포넌트를 조기에 공통화하지 않았는가
- 화면/라우팅 Skeleton이 요건 카드 승인 이력에 남아 있는가
- 생성 산출물이 커밋 대상에 섞이지 않았는가
