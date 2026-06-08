# Front-end State / TanStack Query 표준

프런트엔드 상태는 성격에 따라 source of truth를 분리한다. TanStack Query는 서버 상태 전용 도구로 쓰며, 클라이언트 전역 상태 관리 도구로 사용하지 않는다.

## 상태 분류

```text
local UI state      폼 입력, 토글, 대화상자, focused/selected, field error
URL query state     목록의 page, size, sort, filter, 검색어처럼 딥링크가 필요한 값
auth state          현재 로그인 사용자, 인증 확인 중/인증됨/미인증 상태
server state        API에서 가져오고 서버가 소유하며 재조회/캐시/무효화가 필요한 데이터
client global state URL에도 서버에도 속하지 않고 여러 화면이 공유하는 순수 클라이언트 상태
```

- local UI state는 컴포넌트나 가까운 custom hook의 `useState`/`useReducer`로 둔다.
- URL query state는 React Router search params를 source of truth로 둔다. 같은 값을 별도 React state나 Query cache에 중복 저장하지 않는다.
- auth state는 현재 구조처럼 `AuthProvider`와 Context로 관리할 수 있다. TanStack Query를 도입하더라도 인증 흐름의 단일 source of truth가 무엇인지 파일 안에서 명확히 유지한다.
- server state는 TanStack Query로 조회, 캐시, background refetch, mutation 후 invalidation을 관리한다.
- client global state가 실제로 커지기 전까지 Zustand/Redux 같은 별도 store는 도입하지 않는다.

## 도입 기준

TanStack Query는 다음 중 하나 이상이 생긴 구현 단위에서 도입한다.

- 같은 서버 데이터를 여러 컴포넌트나 route가 읽는다.
- 생성/수정/삭제 후 목록/상세 캐시를 무효화해야 한다.
- hard loading, empty, error, background refetching 상태를 일관되게 표현해야 한다.
- 페이지네이션, 필터, 정렬이 URL query와 결합된 서버 조회로 동작한다.
- 요청 중복 제거, stale data, retry, reconnect refetch 정책이 화면 품질에 영향을 준다.

인증 화면 하나, 단일 submit form 하나, mockup skeleton만 있는 단계에서는 TanStack Query를 먼저 도입하지 않는다.

## 앱 구성

TanStack Query를 도입하면 앱 조립 계층에만 provider를 둔다.

```text
src/app/queryClient.ts
src/app/AppRouter.tsx
```

`queryClient.ts`는 singleton 객체를 직접 export하지 않고 factory를 export한다. 테스트와 Storybook에서 cache가 새지 않도록 매번 새 client를 만들 수 있어야 한다.

```ts
import { QueryClient } from "@tanstack/react-query"

const DEFAULT_STALE_TIME_MS = 30_000
const DEFAULT_GC_TIME_MS = 5 * 60_000

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}
```

- `staleTime` 기본값은 업무 화면에서 불필요한 즉시 재조회와 깜박임을 줄이기 위한 기본값이다. 실시간성이 필요한 화면은 카드 결정 또는 화면 훅에서 더 짧게 조정한다.
- `refetchOnWindowFocus`는 예측 가능한 업무 화면과 E2E 안정성을 위해 기본 비활성화한다. 최신성이 더 중요한 화면은 query 단위로 켠다.
- mutation은 쓰기 요청이므로 기본 재시도하지 않는다. 멱등성이 확인된 mutation만 명시적으로 retry를 켠다.
- public reference data처럼 앱 실행 중 거의 변하지 않는 데이터는 query 단위로 `staleTime: Infinity`를 둘 수 있다. 사용자별 업무 데이터에 무기한 staleTime을 두지 않는다.

Provider는 `AppRouter` 또는 그보다 안쪽의 앱 shell에서 한 번만 감싼다. route/page/component 내부에서 새 `QueryClient`를 만들지 않는다.

## Query Key

도메인별 query key factory를 둔다.

```text
src/features/{domain}/queryKeys.ts
src/features/{domain}/hooks/useXxxQuery.ts
```

```ts
export const todoQueryKeys = {
  all: ["todos"] as const,
  lists: () => [...todoQueryKeys.all, "list"] as const,
  list: (params: TodoListParams) => [...todoQueryKeys.lists(), params] as const,
  details: () => [...todoQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...todoQueryKeys.details(), id] as const,
}
```

- query key는 배열로 작성한다.
- key에는 조회 결과를 바꾸는 모든 source of truth 값을 포함한다.
- URL query에서 온 값은 먼저 기본값, 숫자 범위, 정렬 키를 정규화한 뒤 query key에 넣는다.
- `URLSearchParams`, `Date`, class instance, 함수, DOM 객체처럼 직렬화 의미가 불안정한 값을 query key에 넣지 않는다.
- view-only toggle, modal open 여부, field focus처럼 서버 조회 결과를 바꾸지 않는 값은 query key에 넣지 않는다.

## Query Hook

page와 컴포넌트는 TanStack Query를 직접 조립하지 않고 도메인 hook을 사용한다.

```text
src/api/todo.ts                         OpenAPI client 호출과 view model 변환
src/features/todos/hooks/useTodos.ts    useQuery/useMutation 조립
src/features/todos/pages/TodoListPage.tsx
```

- `queryFn`과 `mutationFn`은 `src/api/{domain}.ts`의 도메인 API 함수만 호출한다.
- page/component에서 `apiClient`나 generated OpenAPI client를 직접 호출하지 않는다.
- API 함수가 지원하면 TanStack Query가 넘기는 `AbortSignal`을 요청에 전달한다.
- hook은 서버 DTO를 그대로 노출하지 않고 화면이 쓰는 view model 타입을 반환한다.
- normal click/submit으로 서버에 쓰는 행위는 `useMutation`으로 표현한다. `enabled: false`와 수동 `refetch()`를 submit 대체물로 쓰지 않는다.
- dependent query는 선행 값이 없을 때만 `enabled`로 막는다.

## Mutation / Invalidation

mutation 성공 후에는 영향받는 query key를 명시적으로 무효화한다.

```ts
const queryClient = useQueryClient()

useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() })
  },
})
```

- create/update/delete가 목록과 상세 양쪽에 영향을 주면 둘 다 무효화하거나, mutation 응답으로 cache를 갱신하는 이유를 코드에서 분명히 한다.
- optimistic update는 사용자가 그 임시 상태를 관찰해야 하는 요건이 있거나 UX상 이득이 명확할 때만 쓴다.
- 서버 검증 오류는 form field/form alert로 매핑한다. 원시 오류 코드 문자열을 사용자 문구로 그대로 노출하지 않는다.
- logout 성공 시 사용자별 query cache를 제거한다. 기본 정책은 `queryClient.clear()`이며, public reference cache를 보존해야 하면 명시적 예외를 문서화한다.

## 인증 상태와 Query

현재 인증 상태는 `AuthProvider`가 source of truth다. `/auth/me`를 TanStack Query로 옮기는 경우에도 다음 원칙을 지킨다.

- 로그인 성공 후 `/auth/me` query를 invalidate/refetch 하거나 인증 Context를 같은 흐름에서 갱신한다.
- 로그아웃 성공 후 인증 Context를 `unauthenticated`로 바꾸고 사용자별 query cache를 제거한다.
- 보호 route의 redirect 판단은 `checking/authenticated/unauthenticated` 상태로 표현한다. query 내부 상태 이름을 route guard의 공개 계약으로 삼지 않는다.
- 인증 실패가 아닌 일시적 `/auth/me` 조회 실패를 무조건 로그인 만료로 해석할지 여부는 인증 요건의 결정으로 남긴다.

## URL Query와 Pagination

목록 화면의 page/filter/sort는 URL query를 source of truth로 둔다.

- URL query를 읽어 정규화한 view model을 만든 뒤 query key와 API parameter에 같은 값을 사용한다.
- 화면 state와 URL query를 따로 두고 동기화하지 않는다.
- 페이지 크기, 정렬 기본값, 잘못된 query fallback/거절 정책은 요건 카드의 범위 또는 의사결정 로그에 둔다.
- Query cache는 URL query 조합별 서버 결과 캐시일 뿐, URL state의 대체물이 아니다.

## 무한 로드 / 가상 스크롤 목록

목록 조회 API가 묶음(page) 단위 응답이고 화면이 명시적 페이지 이동 컨트롤(이전/다음, 페이지 번호) 대신 스크롤로 더 불러오는 UX를 쓰면, 서버 상태는 `useInfiniteQuery`로 둔다. 렌더링 쪽 규칙은 `front-end-ui.md`의 "목록 가상 스크롤"을 따른다.

- `queryFn`은 `src/api/{domain}.ts`의 묶음 조회 함수를 호출하고, `getNextPageParam`은 응답의 묶음 메타(현재 묶음 번호, 전체 묶음 수)로 다음 묶음 파라미터를 계산한다. 마지막 묶음이면 `undefined`를 반환해 더 부르지 않는다.
- query key는 일반 list와 같은 factory(`lists()`/`list(params)`)를 쓰되, 무한 목록은 `list(params)` 아래 하나의 캐시 엔트리로 둔다. 묶음 번호는 query key에 넣지 않는다. 같은 무한 쿼리가 여러 묶음을 누적한다.
- 화면은 누적된 묶음을 평탄화한 항목 배열을 view model로 받는다. 컴포넌트가 묶음 경계를 직접 다루지 않는다.
- 스크롤이 끝에 가까워지면 `fetchNextPage()`를 호출한다. 호출 트리거(센티넬 관찰, 스크롤 임계값 등)는 `front-end-ui.md` 가상 스크롤 표준을 따른다.
- 다음 묶음 로딩 상태(`isFetchingNextPage`)와 더 받을 묶음 유무(`hasNextPage`)를 화면 상태로 노출해 로딩/끝 표시를 일관되게 한다.
- 생성/수정/삭제 mutation 성공 후에는 일반 list와 동일하게 `lists()`를 무효화한다. 무한 쿼리도 같은 key 접두로 무효화되어 첫 묶음부터 다시 받는다.
- 누적 전체 개수 숫자 표시는 화면 요건이 명시적으로 요구할 때만 둔다. 무한 로드 목록은 묶음 크기·다음 묶음·빈 묶음을 관찰 가능한 결과로 두는 것으로 충분하며, 전체 개수 표시를 기본으로 강제하지 않는다.

## Storybook / Test

Storybook과 테스트는 cache 격리를 우선한다.

- route/page story는 story별 새 `QueryClient`를 제공한다.
- MSW 또는 주입 가능한 fake API로 서버 응답을 통제한다. Storybook이 실제 백엔드 상태에 의존하지 않게 한다.
- Vitest helper는 테스트마다 새 `QueryClient`를 만들고 query retry를 `0`으로 낮춰 실패를 빠르게 드러낸다.
- FE BDD/E2E는 사용자 관찰 상태를 검증한다. Query cache 내부 상태, query key 문자열, TanStack Query 구현 세부는 테스트 표현에 고정하지 않는다.

## ESLint / Devtools

TanStack Query를 도입하는 구현 단위에서 다음 패키지도 함께 검토한다.

```bash
npm install @tanstack/react-query
npm install -D @tanstack/eslint-plugin-query
```

- `@tanstack/eslint-plugin-query`의 stable query client, no unstable deps 계열 규칙을 lint에 연결한다.
- Devtools는 개발 환경 전용으로만 둔다. production bundle에 항상 포함하지 않는다.

## 금지 사항

- 서버 응답 데이터를 Zustand/Redux/Context/localStorage에 별도 캐시로 복제
- TanStack Query를 modal open, input value, selected tab 같은 local UI state 저장소로 사용
- URL query state와 React state를 중복 관리
- page/component에서 generated OpenAPI client 직접 호출
- mutable 업무 데이터에 근거 없는 `staleTime: Infinity` 적용
- route/page/component render 경로에서 `new QueryClient()` 생성
- 테스트와 Storybook에서 production singleton query client 공유
- 일반 submit 처리를 `enabled: false` query와 `refetch()`로 구현

## 자동 검증 항목

- `npm run typecheck`: query hook, API view model, generated OpenAPI 타입 정합성을 확인한다.
- `npm run lint`: React hooks와 TanStack Query ESLint 규칙을 확인한다. TanStack Query 도입 전에는 해당 규칙이 없어도 위반으로 보지 않는다.
- `npm run test`: loading/error/empty/success, mutation validation error, invalidation 후 UI 전환을 검증한다.
- `npm run e2e`: route 진입, URL query 기반 목록 조회, 주요 mutation 사용자 흐름을 검증한다.
- `npm run app:validate`: FE BDD 테스트 결과와 `@UsesApi`/OpenAPI 정합성을 앱 게이트에 반영한다.

## 수동 리뷰 항목

- TanStack Query가 server state에만 쓰였는가
- query key가 조회 결과를 바꾸는 모든 값을 포함하는가
- mutation 후 invalidation 범위가 충분한가
- URL query와 Query cache의 책임이 섞이지 않았는가
- logout 때 사용자별 cache가 제거되는가
- Storybook/test가 query cache를 격리하는가
