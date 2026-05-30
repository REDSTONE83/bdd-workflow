import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { nullablePatchBody } from "./wire"

const API_BASE = "http://api.test"

type CapturedRequest = {
  url: URL
  body?: unknown
}

const captured: CapturedRequest[] = []

const server = setupServer(
  http.get(`${API_BASE}/categories`, ({ request }) => {
    captured.push({ url: new URL(request.url) })
    return HttpResponse.json({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    })
  }),
  http.patch(`${API_BASE}/categories/:categoryId`, async ({ request }) => {
    captured.push({ url: new URL(request.url), body: await request.json() })
    return HttpResponse.json({
      categoryId: "category-1",
      name: "회의",
      color: null,
      description: "",
      displayOrder: 1024,
    })
  }),
)

async function importCategoriesApi() {
  vi.resetModules()
  vi.stubEnv("VITE_API_BASE_URL", API_BASE)
  return import("./categories")
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  captured.length = 0
  vi.unstubAllEnvs()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe("categories API wire format", () => {
  it("serializes Spring Pageable as flat page/size query parameters", async () => {
    const { listCategories } = await importCategoriesApi()

    await listCategories({ page: 2, size: 30 })

    expect(captured).toHaveLength(1)
    expect(captured[0].url.pathname).toBe("/categories")
    expect(captured[0].url.searchParams.get("page")).toBe("2")
    expect(captured[0].url.searchParams.get("size")).toBe("30")
    expect(captured[0].url.searchParams.has("pageable")).toBe(false)
    expect(captured[0].url.searchParams.has("pageable[page]")).toBe(false)
  })

  it("serializes JsonNullable PATCH fields as raw value, null, or omission", async () => {
    const { updateCategory } = await importCategoriesApi()

    await updateCategory("category-1", {
      name: "회의",
      color: null,
      description: "",
    })

    expect(captured).toHaveLength(1)
    expect(captured[0].url.pathname).toBe("/categories/category-1")
    expect(captured[0].body).toEqual({
      name: "회의",
      color: null,
      description: "",
    })
    expect(captured[0].body).not.toHaveProperty("name.present")
    expect(captured[0].body).not.toHaveProperty("color.present")
    expect(captured[0].body).not.toHaveProperty("description.present")
  })

  it("omits undefined JsonNullable PATCH fields", () => {
    const body = nullablePatchBody<Record<string, unknown>>({
      name: "회의",
      color: null,
      description: undefined,
    })

    expect(body).toEqual({ name: "회의", color: null })
    expect(body).not.toHaveProperty("description")
  })
})
