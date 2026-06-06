/**
 * @Requirement REQ-022, REQ-023, REQ-024, REQ-025, REQ-027
 * @Route /todos
 * @Page TodosPageContainer
 * @UsesApi GET /todos mount
 * @UsesApi POST /todos submit
 * @UsesApi PATCH /todos/{todoId} submit
 * @UsesApi DELETE /todos/{todoId} submit
 * @UsesApi GET /categories mount
 */
import { TodosPage } from "./TodosPage"
import {
  useCreateTodo,
  useDeleteTodo,
  useTodoCategoryOptions,
  useTodosInfinite,
  useUpdateTodo,
} from "../hooks/useTodos"

export function TodosPageContainer() {
  const list = useTodosInfinite()
  const categories = useTodoCategoryOptions()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()

  return (
    <TodosPage
      todos={list.todos}
      categories={categories.data ?? []}
      categoriesLoading={categories.isLoading}
      isLoading={list.isLoading}
      isError={list.isError}
      hasMore={list.hasNextPage}
      isLoadingMore={list.isFetchingNextPage}
      onLoadMore={list.fetchNextPage}
      onCreate={(input) => createTodo.mutateAsync(input).then(() => undefined)}
      onUpdate={(id, input) =>
        updateTodo.mutateAsync({ id, input }).then(() => undefined)
      }
      onDelete={(id) => deleteTodo.mutateAsync(id)}
    />
  )
}

export default TodosPageContainer
