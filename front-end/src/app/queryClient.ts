import { QueryClient } from "@tanstack/react-query"

// 서버 상태 도구(TanStack Query) 기본 정책. docs/standards/front-end-state.md 의 factory 규약을 따른다.
// singleton 을 export 하지 않고 factory 를 둬, 테스트/Storybook 이 매번 새 client 로 cache 격리를 한다.
const DEFAULT_STALE_TIME_MS = 30_000
const DEFAULT_GC_TIME_MS = 5 * 60_000

export function createQueryClient(): QueryClient {
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
