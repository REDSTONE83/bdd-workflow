// 카테고리 서버 상태 query key factory. docs/standards/front-end-state.md 규약을 따른다.
// 무한 목록은 list(params) 아래 하나의 캐시 엔트리로 두고, 묶음 번호는 key 에 넣지 않는다.

export type CategoryListParams = {
  size: number
}

export const categoryQueryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryQueryKeys.all, "list"] as const,
  list: (params: CategoryListParams) =>
    [...categoryQueryKeys.lists(), params] as const,
}
