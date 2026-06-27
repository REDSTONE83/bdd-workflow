import type { components } from "./generated"

export type PageRequestQuery = {
  page: number
  size: number
  sort?: string[]
} & Record<string, string | number | boolean | string[] | null | undefined>

export type GeneratedPageableQuery = components["schemas"]["Pageable"]

// Spring MVC binds Pageable from flat page/size query params even when generated
// OpenAPI types expose a nested pageable object.
export function pageableQuery(params: PageRequestQuery): GeneratedPageableQuery {
  const query: Record<string, string | number | boolean | string[]> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    query[key] = value
  }
  return query as unknown as GeneratedPageableQuery
}

export function pageableQueryString(params: PageRequestQuery): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, item)
      }
    } else {
      search.set(key, String(value))
    }
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
