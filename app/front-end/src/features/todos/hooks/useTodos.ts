import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodo,
} from "@/api/todos"
import { listCategories } from "@/api/categories"
import { categoryQueryKeys } from "@/features/categories/queryKeys"

import {
  EMPTY_TODO_FILTERS,
  normalizeTodoFilters,
  todoFiltersToApiParams,
  type TodoFilters,
} from "../filters"
import { todoQueryKeys } from "../queryKeys"
import {
  TODO_CATEGORY_OPTION_LIMIT,
  TODO_PAGE_SIZE,
  type TodoInput,
  type TodoPatch,
  type TodoView,
} from "../types"

export type TodosInfinite = {
  todos: TodoView[]
  isLoading: boolean
  isError: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

export function useTodosInfinite(filters: TodoFilters = EMPTY_TODO_FILTERS): TodosInfinite {
  const normalizedFilters = normalizeTodoFilters(filters)
  const query = useInfiniteQuery({
    queryKey: todoQueryKeys.list({ size: TODO_PAGE_SIZE, filters: normalizedFilters }),
    queryFn: ({ pageParam, signal }) =>
      listTodos({
        page: pageParam,
        size: TODO_PAGE_SIZE,
        ...todoFiltersToApiParams(normalizedFilters),
      }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })

  return {
    todos: (query.data?.pages ?? []).flatMap((page) => page.items),
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

export function useTodoCategoryOptions() {
  return useQuery({
    queryKey: categoryQueryKeys.list({ size: TODO_CATEGORY_OPTION_LIMIT }),
    queryFn: ({ signal }) =>
      listCategories({ page: 0, size: TODO_CATEGORY_OPTION_LIMIT }, signal),
    select: (page) => page.items,
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TodoInput) => createTodo(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() })
    },
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TodoPatch }) =>
      updateTodo(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() })
    },
  })
}
