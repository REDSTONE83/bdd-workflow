# Front-end 프로젝트 구조 표준

프런트엔드는 `front-end/` 아래의 React/Vite/TypeScript 애플리케이션으로 둔다. UI 컴포넌트는 shadcn/ui 규약을 따른다. 백엔드와 같은 요건 카드, 같은 `.feature` 시나리오, 같은 수용 기준 문장을 공유하되, 화면/라우팅/컴포넌트/FE 테스트는 프런트엔드 소스 인덱서가 별도로 수집한다.

## 표준 구조

```text
front-end/
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
        routes.tsx
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
- feature 내부 컴포넌트는 해당 도메인에서만 재사용한다.
- 도메인 간 공유가 확인된 뒤에만 `src/components/` 또는 `src/lib/`로 이동한다.

### `src/components/ui/`

shadcn/ui CLI 또는 shadcn/ui 규약으로 생성한 primitive 컴포넌트를 둔다.

- 직접 수정은 허용하지만, 수정 이유가 디자인 시스템 규칙인지 단일 화면 임시 대응인지 구분한다.
- `button.tsx`, `input.tsx`, `dialog.tsx`처럼 shadcn/ui 파일 단위를 유지한다.
- 공통 variant는 `class-variance-authority`와 `cn()`으로 표현한다.

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
- 출력은 `build/harness/indexes/front-end.source-index.json`이다.
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

신규 카드에는 구현 대상을 명시한다.

```text
구현 대상: back-end | front-end | full-stack
```

- 기존 카드에 구현 대상이 없으면 `back-end`로 본다.
- `front-end`: API/DB 변경 없이 화면, 라우팅, 클라이언트 상태, 데스크톱 시각/접근성 품질을 구현한다.
- `full-stack`: 같은 수용 기준을 API와 화면 양쪽에서 검증한다.

화면/route/story가 요건에 연결되어야 하는 경우 파일 상단 JSDoc 또는 exported metadata를 사용한다.

```ts
export const harness = {
  requirements: ["REQ-002"],
  route: "/todos",
  page: "TodoListPage",
}
```

지원하는 필드:

- `requirements` 또는 `requirementIds`: `REQ-XXX` 배열.
- `route`, `path`, `routePath`: 화면 route.
- `page`, `screen`, `name`: 화면 이름.

Storybook story는 default export 또는 story export의 `parameters.harness.requirements`로 요건을 연결할 수 있다.

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
front-end/dist/
front-end/storybook-static/
front-end/playwright-report/
front-end/test-results/
front-end/coverage/
front-end/.cache/
build/harness/indexes/front-end.source-index.json
```

## 검증 명령

```bash
cd front-end

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
- `npm run source-index` 또는 `./gradlew generateFrontEndSourceIndex`: route, page, story, FE BDD 테스트의 `Requirement`/`Covers` 메타데이터를 수집한다.
- 통합 `validateHarness`: 구현 대상이 `front-end` 또는 `full-stack`인 카드의 FE BDD 커버리지와 테스트 결과를 RED/GREEN/BLUE 판정에 반영한다.

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

제안: 당장은 ESLint와 기존 `source-index`/`validateHarness` 조합을 유지한다. 직접 `fetch` 금지처럼 명확한 파일 단위 규칙은 ESLint에 추가하고, OpenAPI 생성물/Storybook 상태/요건 연결처럼 교차 파일 검사가 필요한 항목은 `tools/harness`에 `validate-front-end-standards.mjs` 형태의 별도 검사로 확장한다.

## 수동 리뷰 항목

- feature 경계가 업무 단위와 맞는가
- 도메인 전용 컴포넌트를 조기에 공통화하지 않았는가
- 화면/라우팅 Skeleton이 요건 카드 승인 이력에 남아 있는가
- 생성 산출물이 커밋 대상에 섞이지 않았는가
