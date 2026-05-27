import { useAuth } from "../useAuth"
import type { AuthenticatedUser } from "../types"

export const harness = {
  requirements: ["REQ-011"],
}

// REQ-011 Skeleton: 화면 컴포넌트가 현재 사용자 정보를 얻는 단일 진입점.
// GREEN 단계에서 AuthProvider 상태와 직접 연결한다.
export function useCurrentUser(): AuthenticatedUser | null {
  const { state } = useAuth()
  return state.status === "authenticated" ? state.user : null
}
