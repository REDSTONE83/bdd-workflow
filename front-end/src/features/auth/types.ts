// REQ-011: 인증 도메인의 view-level 타입 Skeleton.
// 실제 필드 채움(예: createdAt 등)은 GREEN 단계에서 BE 응답 계약과 함께 정한다.

export type AuthenticatedUser = {
  id: string
  email: string
}

export type LoginInput = {
  email: string
  password: string
}

export type AuthStatus = "checking" | "authenticated" | "unauthenticated"

export type AuthState =
  | { status: "checking" }
  | { status: "authenticated"; user: AuthenticatedUser }
  | { status: "unauthenticated" }
