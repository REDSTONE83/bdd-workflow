import type { Page } from "@playwright/test"

import { routeApi } from "./apiRoute"

// REQ-022~REQ-027: 할 일 화면용 in-memory API mock.
// GET /todos(page/size), POST /todos, PATCH /todos/{id}, DELETE /todos/{id} 를
// 실제 화면 여정에서 관찰 가능한 상태 변경으로 제공한다.

type MockCategory = {
  categoryId: string
  name: string
  color: string | null
}

export type SeedTodo = {
  id?: string
  title: string
  description?: string | null
  dueDate?: string | null
  priority?: "HIGH" | "MEDIUM" | "LOW"
  completed?: boolean
  category?: MockCategory | null
}

type StoredTodo = {
  todoId: string
  title: string
  description: string | null
  dueDate: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"
  completed: boolean
  category: MockCategory | null
}

export type TodoRoutesController = {
  failNextCreate: () => void
  failNextUpdate: () => void
  failNextDelete: () => void
}

const COLLECTION_RE = /\/todos(\?.*)?$/
const ITEM_RE = /\/todos\/[^/?]+(\?.*)?$/

function apiError(status: number, code: string, message: string, path: string) {
  return { code, status, message, path, timestamp: new Date().toISOString() }
}

export async function installTodoRoutes(
  page: Page,
  options: {
    initial?: SeedTodo[]
    categories?: MockCategory[]
    listError?: boolean
    pageSize?: number
  } = {},
): Promise<TodoRoutesController> {
  const pageSize = options.pageSize ?? 20
  const categories = new Map(
    (options.categories ?? []).map((category) => [category.categoryId, category]),
  )
  const categoryFor = (categoryId: string | null | undefined) => {
    if (!categoryId) return null
    return categories.get(categoryId) ?? { categoryId, name: "카테고리", color: null }
  }

  const store: StoredTodo[] = (options.initial ?? []).map((todo, i) => ({
    todoId: todo.id ?? `seed-${i + 1}`,
    title: todo.title,
    description: todo.description ?? null,
    dueDate: todo.dueDate ?? null,
    priority: todo.priority ?? "MEDIUM",
    completed: todo.completed ?? false,
    category: todo.category ?? null,
  }))
  let createSeq = 0
  let failCreate = false
  let failUpdate = false
  let failDelete = false

  await routeApi(page, COLLECTION_RE, async (route, request) => {
    const method = request.method()

    if (method === "GET") {
      if (options.listError) {
        await route.fulfill({
          status: 500,
          json: apiError(500, "INTERNAL_ERROR", "조회 실패", "/todos"),
        })
        return
      }
      const url = new URL(request.url())
      const pageIndex = Number(url.searchParams.get("page") ?? "0")
      const size = Number(url.searchParams.get("size") ?? String(pageSize))
      const content = store.slice(pageIndex * size, pageIndex * size + size)
      await route.fulfill({
        status: 200,
        json: {
          content,
          page: pageIndex,
          size,
          totalElements: store.length,
          totalPages: Math.max(1, Math.ceil(store.length / size)),
        },
      })
      return
    }

    if (method === "POST") {
      if (failCreate) {
        failCreate = false
        await route.fulfill({
          status: 500,
          json: apiError(500, "INTERNAL_ERROR", "저장 실패", "/todos"),
        })
        return
      }
      const body = request.postDataJSON() as {
        title: string
        description?: string | null
        dueDate?: string | null
        priority?: "HIGH" | "MEDIUM" | "LOW" | null
        categoryId?: string | null
      }
      createSeq += 1
      const created: StoredTodo = {
        todoId: `new-${createSeq}`,
        title: body.title,
        description: body.description ?? null,
        dueDate: body.dueDate ?? null,
        priority: body.priority ?? "MEDIUM",
        completed: false,
        category: categoryFor(body.categoryId),
      }
      store.push(created)
      await route.fulfill({ status: 201, json: created })
      return
    }

    await route.fallback()
  })

  await routeApi(page, ITEM_RE, async (route, request) => {
    const method = request.method()
    const url = new URL(request.url())
    const id = decodeURIComponent(url.pathname.split("/").pop() ?? "")
    const target = store.find((todo) => todo.todoId === id)

    if (method === "PATCH") {
      if (failUpdate) {
        failUpdate = false
        await route.fulfill({
          status: 500,
          json: apiError(500, "INTERNAL_ERROR", "수정 실패", `/todos/${id}`),
        })
        return
      }
      if (!target) {
        await route.fulfill({
          status: 404,
          json: apiError(404, "NOT_FOUND", "대상을 찾을 수 없습니다.", `/todos/${id}`),
        })
        return
      }
      const body = request.postDataJSON() as {
        title?: string
        description?: string | null
        dueDate?: string | null
        priority?: "HIGH" | "MEDIUM" | "LOW"
        completed?: boolean
        categoryId?: string | null
      }
      if (body.title !== undefined) target.title = body.title
      if (body.description !== undefined) target.description = body.description
      if (body.dueDate !== undefined) target.dueDate = body.dueDate
      if (body.priority !== undefined) target.priority = body.priority
      if (body.completed !== undefined) target.completed = body.completed
      if (body.categoryId !== undefined) target.category = categoryFor(body.categoryId)
      await route.fulfill({ status: 200, json: target })
      return
    }

    if (method === "DELETE") {
      if (failDelete) {
        failDelete = false
        await route.fulfill({
          status: 500,
          json: apiError(500, "INTERNAL_ERROR", "삭제 실패", `/todos/${id}`),
        })
        return
      }
      const index = store.findIndex((todo) => todo.todoId === id)
      if (index >= 0) store.splice(index, 1)
      await route.fulfill({ status: 204, body: "" })
      return
    }

    await route.fallback()
  })

  return {
    failNextCreate: () => {
      failCreate = true
    },
    failNextUpdate: () => {
      failUpdate = true
    },
    failNextDelete: () => {
      failDelete = true
    },
  }
}
