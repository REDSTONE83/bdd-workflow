/**
 * @Requirement REQ-022, REQ-023, REQ-024, REQ-025, REQ-027, REQ-040
 * @Route /todos
 * @Page TodosPageContainer
 * @UsesApi GET /todos mount
 * @UsesApi POST /todos submit
 * @UsesApi PATCH /todos/{todoId} submit
 * @UsesApi DELETE /todos/{todoId} submit
 * @UsesApi GET /categories mount
 */
import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import { TodosPage } from "./TodosPage"
import {
  hasActiveTodoFilters,
  todoFiltersFromSearchParams,
  todoFiltersToSearchParams,
  type TodoFilters,
} from "../filters"
import {
  useCreateTodo,
  useDeleteTodo,
  useTodoCategoryOptions,
  useTodosInfinite,
  useUpdateTodo,
} from "../hooks/useTodos"

export function TodosPageContainer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => todoFiltersFromSearchParams(searchParams),
    [searchParams],
  )
  const list = useTodosInfinite(filters)
  const categories = useTodoCategoryOptions()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const hasActiveFilters = hasActiveTodoFilters(filters)

  const applyFilters = (next: TodoFilters) => {
    setSearchParams(todoFiltersToSearchParams(next))
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  return (
    <TodosPage
      todos={list.todos}
      categories={categories.data ?? []}
      categoriesLoading={categories.isLoading}
      isLoading={list.isLoading}
      isError={list.isError}
      hasMore={list.hasNextPage}
      isLoadingMore={list.isFetchingNextPage}
      filters={filters}
      hasActiveFilters={hasActiveFilters}
      onLoadMore={list.fetchNextPage}
      onApplyFilters={applyFilters}
      onResetFilters={resetFilters}
      onCreate={(input) => createTodo.mutateAsync(input).then(() => undefined)}
      onUpdate={(id, input) =>
        updateTodo.mutateAsync({ id, input }).then(() => undefined)
      }
      onDelete={(id) => deleteTodo.mutateAsync(id)}
    />
  )
}

export default TodosPageContainer
