import createClient from "openapi-fetch"

import type { paths } from "./generated"

export const harness = {
  requirements: ["REQ-011"],
}

// REQ-011: 모든 백엔드 호출은 HttpOnly Cookie (ACCESS_TOKEN) 를 자동 전달해야 한다.
// fetch 기본값은 same-origin 이므로, dev proxy 사용 환경에서도 명시적으로 include 로 둔다.
const cookieAwareFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, credentials: "include" })

export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  fetch: cookieAwareFetch,
})

export type ApiClient = typeof apiClient
export type { components, operations, paths } from "./generated"
