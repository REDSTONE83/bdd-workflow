import type { components } from "./generated"

export type PageRequestQuery = {
  page: number
  size: number
  sort?: string[]
}

export type GeneratedPageableQuery = components["schemas"]["Pageable"]

// Spring MVC binds Pageable from flat page/size query params even when generated
// OpenAPI types expose a nested pageable object.
export function pageableQuery(params: PageRequestQuery): GeneratedPageableQuery {
  const query = {
    page: params.page,
    size: params.size,
    ...(params.sort ? { sort: params.sort } : {}),
  }
  return query as unknown as GeneratedPageableQuery
}

export function pageableQueryString(params: PageRequestQuery): string {
  const search = new URLSearchParams()
  search.set("page", String(params.page))
  search.set("size", String(params.size))
  for (const sort of params.sort ?? []) {
    search.append("sort", sort)
  }
  return search.toString()
}

// JsonNullable<T> PATCH fields are raw JSON on the wire: value, null, or omitted.
export function nullablePatchBody<TGeneratedBody>(
  fields: Record<string, unknown>,
): TGeneratedBody {
  const body: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      body[key] = value
    }
  }
  return body as TGeneratedBody
}
