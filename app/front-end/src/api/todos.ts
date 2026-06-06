import { apiClient, type components } from "./client"
import type {
  TodoCategoryView,
  TodoInput,
  TodoPatch,
  TodoPriority,
  TodoView,
} from "@/features/todos/types"

import {
  nullablePatchBody,
  pageableQuery,
  pageableQueryString,
} from "./wire"

// REQ-022~REQ-027: 할 일 화면 API 경계. 기존 할 일 API 계약을 FE view model 로
// 정규화하고 화면/훅이 generated OpenAPI client 를 직접 다루지 않게 한다.

type TodoResponse = components["schemas"]["TodoResponse"]
type TodoCategoryInfo = NonNullable<components["schemas"]["TodoCategoryInfo"]>

const GENERIC_LIST_ERROR = "할 일 목록을 불러오지 못했습니다."
const GENERIC_WRITE_ERROR = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."

export type TodoPage = {
  items: TodoView[]
  page: number
  totalPages: number
}

function toCategoryView(category: TodoCategoryInfo | null | undefined): TodoCategoryView | null {
  if (!category) return null
  return {
    id: category.categoryId ?? "",
    name: category.name ?? "",
    color: category.color ?? null,
  }
}

function toView(todo: TodoResponse): TodoView {
  return {
    id: todo.todoId ?? "",
    title: todo.title ?? "",
    description: todo.description ?? null,
    dueDate: todo.dueDate ?? null,
    priority: (todo.priority ?? "MEDIUM") as TodoPriority,
    completed: todo.completed ?? false,
    category: toCategoryView(todo.category),
  }
}

export async function listTodos(
  params: { page: number; size: number },
  signal?: AbortSignal,
): Promise<TodoPage> {
  const { data, response } = await apiClient.GET("/todos", {
    params: { query: pageableQuery(params) },
    querySerializer: () => pageableQueryString(params),
    signal,
  })
  if (!response.ok || !data) {
    throw new Error(GENERIC_LIST_ERROR)
  }
  const content = (data.content ?? []) as TodoResponse[]
  return {
    items: content.map(toView),
    page: data.page ?? params.page,
    totalPages: data.totalPages ?? 0,
  }
}

export async function createTodo(input: TodoInput): Promise<TodoView> {
  const { data, response } = await apiClient.POST("/todos", {
    body: {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      priority: input.priority,
      categoryId: input.categoryId,
    },
  })
  if (!response.ok || !data) throw new Error(GENERIC_WRITE_ERROR)
  return toView(data as TodoResponse)
}

export async function updateTodo(
  id: string,
  input: TodoPatch,
): Promise<TodoView> {
  const { data, response } = await apiClient.PATCH("/todos/{todoId}", {
    params: { path: { todoId: id } },
    body: nullablePatchBody<components["schemas"]["UpdateTodoRequest"]>({
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      priority: input.priority,
      completed: input.completed,
      categoryId: input.categoryId,
    }),
  })
  if (!response.ok || !data) throw new Error(GENERIC_WRITE_ERROR)
  return toView(data as TodoResponse)
}

export async function deleteTodo(id: string): Promise<void> {
  const { response } = await apiClient.DELETE("/todos/{todoId}", {
    params: { path: { todoId: id } },
  })
  if (!response.ok) throw new Error(GENERIC_WRITE_ERROR)
}
