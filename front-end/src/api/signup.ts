import { apiClient } from "./client"
import type { SignupInput, SignupResult } from "@/features/signup/types"

// REQ-001: 회원 가입 도메인 API 모듈.
// REQ-001 의 가입 계약(201/400/409)을 FE view model(SignupResult)로 정규화한다.
// SignupPageContainer 가 apiClient 의 OpenAPI 타입을 직접 다루지 않도록 경계를 둔다.

const GENERIC_ERROR_MESSAGE =
  "회원 가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."

export async function signup(input: SignupInput): Promise<SignupResult> {
  const { error, response } = await apiClient.POST("/users/signup", {
    body: { name: input.name, email: input.email, password: input.password },
  })
  if (response.ok) {
    return { status: "ok" }
  }
  if (response.status === 409) {
    return { status: "duplicate-email" }
  }
  const message =
    (error as { message?: string } | undefined)?.message ?? GENERIC_ERROR_MESSAGE
  return { status: "error", message }
}
