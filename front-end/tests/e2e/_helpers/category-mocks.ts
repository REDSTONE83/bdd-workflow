import type { Page } from "@playwright/test"

import { routeApi } from "./apiRoute"

// REQ-014: 카테고리 API(REQ-003 계약)를 in-memory 상태로 mock 한다.
// GET /categories(page/size 페이징), POST /categories(201/중복 409),
// PATCH /categories/{id}(부분 수정/중복 409), DELETE /categories/{id}(204).
// 생성/수정/삭제 후 다시 GET 하면 갱신된 목록이 보이도록 store 를 유지한다.

export type SeedCategory = {
  id?: string
  name: string
  color?: string | null
  description?: string | null
}

type StoredCategory = {
  categoryId: string
  name: string
  color: string | null
  description: string | null
  displayOrder: number
}

export type CategoryRoutesController = {
  createCount: () => number
  updateCount: () => number
  deleteCount: () => number
  pauseWrites: () => void
  resumeWrites: () => void
}

// path 가 /categories 로 끝나거나 query 만 붙은 경우(목록/생성)
const COLLECTION_RE = /\/categories(\?.*)?$/
// path 가 /categories/{id} 인 경우(수정/삭제)
const ITEM_RE = /\/categories\/[^/?]+(\?.*)?$/

function apiError(status: number, code: string, message: string, path: string) {
  return { code, status, message, path, timestamp: new Date().toISOString() }
}

export async function installCategoryRoutes(
  page: Page,
  options: { initial?: SeedCategory[]; pageSize?: number } = {},
): Promise<CategoryRoutesController> {
  const pageSize = options.pageSize ?? 20
  const store: StoredCategory[] = (options.initial ?? []).map((category, i) => ({
    categoryId: category.id ?? `seed-${i + 1}`,
    name: category.name,
    color: category.color ?? null,
    description: category.description ?? null,
    displayOrder: (i + 1) * 1024,
  }))
  let nextOrder = store.length * 1024 + 1024
  let createSeq = 0
  let createCount = 0
  let updateCount = 0
  let deleteCount = 0

  let writesPaused = false
  let release = () => {}
  let gate: Promise<void> = Promise.resolve()
  const waitIfPaused = async () => {
    if (writesPaused) await gate
  }

  const sorted = () =>
    [...store].sort(
      (a, b) =>
        a.displayOrder - b.displayOrder ||
        a.categoryId.localeCompare(b.categoryId),
    )
  const isDuplicate = (name: string, exceptId?: string) =>
    store.some(
      (category) =>
        category.categoryId !== exceptId &&
        category.name.trim().toLowerCase() === name.trim().toLowerCase(),
    )

  await routeApi(page, COLLECTION_RE, async (route, request) => {
    const method = request.method()

    if (method === "GET") {
      const url = new URL(request.url())
      const pageIndex = Number(url.searchParams.get("page") ?? "0")
      const size = Number(url.searchParams.get("size") ?? String(pageSize))
      const all = sorted()
      const content = all.slice(pageIndex * size, pageIndex * size + size)
      await route.fulfill({
        status: 200,
        json: {
          content,
          page: pageIndex,
          size,
          totalElements: all.length,
          totalPages: Math.max(1, Math.ceil(all.length / size)),
        },
      })
      return
    }

    if (method === "POST") {
      createCount += 1
      await waitIfPaused()
      const body = request.postDataJSON() as {
        name: string
        color: string | null
        description: string | null
      }
      if (isDuplicate(body.name)) {
        await route.fulfill({
          status: 409,
          json: apiError(
            409,
            "DUPLICATE_CATEGORY_NAME",
            "이미 사용 중인 이름입니다.",
            "/categories",
          ),
        })
        return
      }
      createSeq += 1
      const created: StoredCategory = {
        categoryId: `new-${createSeq}`,
        name: body.name,
        color: body.color ?? null,
        description: body.description ?? null,
        displayOrder: nextOrder,
      }
      nextOrder += 1024
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

    if (method === "PATCH") {
      updateCount += 1
      await waitIfPaused()
      const body = request.postDataJSON() as {
        name?: string
        color?: string | null
        description?: string | null
      }
      if (body.name != null && isDuplicate(body.name, id)) {
        await route.fulfill({
          status: 409,
          json: apiError(
            409,
            "DUPLICATE_CATEGORY_NAME",
            "이미 사용 중인 이름입니다.",
            `/categories/${id}`,
          ),
        })
        return
      }
      const target = store.find((category) => category.categoryId === id)
      if (!target) {
        await route.fulfill({
          status: 404,
          json: apiError(404, "NOT_FOUND", "대상을 찾을 수 없습니다.", `/categories/${id}`),
        })
        return
      }
      if (body.name !== undefined) target.name = body.name
      if (body.color !== undefined) target.color = body.color
      if (body.description !== undefined) target.description = body.description
      await route.fulfill({ status: 200, json: target })
      return
    }

    if (method === "DELETE") {
      deleteCount += 1
      await waitIfPaused()
      const index = store.findIndex((category) => category.categoryId === id)
      if (index >= 0) store.splice(index, 1)
      await route.fulfill({ status: 204, body: "" })
      return
    }

    await route.fallback()
  })

  return {
    createCount: () => createCount,
    updateCount: () => updateCount,
    deleteCount: () => deleteCount,
    pauseWrites: () => {
      writesPaused = true
      gate = new Promise((resolve) => {
        release = resolve
      })
    },
    resumeWrites: () => {
      writesPaused = false
      release()
    },
  }
}
