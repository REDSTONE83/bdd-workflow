import { apiClient } from "./client"
import type { AuthenticatedUser, LoginInput } from "@/features/auth/types"

// REQ-011: 인증 도메인 API 모듈.
// AuthProvider 가 apiClient 의 OpenAPI 타입을 직접 다루지 않도록, FE view model 로 정규화한다.

export async function fetchCurrentUser(): Promise<AuthenticatedUser | null> {
  const { data, response } = await apiClient.GET("/auth/me", {})
  if (!response.ok || !data) {
    return null
  }
  return { id: data.id ?? "", email: data.email ?? "" }
}

export async function loginWithCredentials(input: LoginInput): Promise<void> {
  const { error, response } = await apiClient.POST("/auth/login", {
    body: { email: input.email, password: input.password },
  })
  if (!response.ok) {
    throw error ?? new Error("login_failed")
  }
}

export async function logout(): Promise<void> {
  const { error, response } = await apiClient.POST("/auth/logout", {})
  if (!response.ok) {
    throw error ?? new Error("logout_failed")
  }
}
