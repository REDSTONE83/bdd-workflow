import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/api/categories"

import { categoryQueryKeys } from "../queryKeys"
import { CATEGORY_PAGE_SIZE, type CategoryInput, type CategoryView } from "../types"

// REQ-014: 카테고리 서버 상태 훅. docs/standards/front-end-state.md 의 무한 로드/invalidation 규약을 따른다.
// - 목록: useInfiniteQuery 로 묶음 크기 20 의 묶음을 이어 받고, 누적 묶음을 평탄화해 view model 로 반환한다.
// - 생성/수정/삭제: useMutation, 성공 시 lists() 를 무효화해 첫 묶음부터 다시 받는다.

export type CategoriesInfinite = {
  categories: CategoryView[]
  isLoading: boolean
  isError: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

export function useCategoriesInfinite(): CategoriesInfinite {
  const query = useInfiniteQuery({
    queryKey: categoryQueryKeys.list({ size: CATEGORY_PAGE_SIZE }),
    queryFn: ({ pageParam, signal }) =>
      listCategories({ page: pageParam, size: CATEGORY_PAGE_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })

  return {
    categories: (query.data?.pages ?? []).flatMap((page) => page.items),
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage()
      }
    },
  }
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      updateCategory(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() })
    },
  })
}
