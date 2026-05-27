/**
 * @Requirement REQ-005
 * @Route /
 * @Page RootRedirect
 */
import { Navigate } from "react-router-dom"

import { DEFAULT_LOGIN_REDIRECT } from "@/features/auth/loginRedirect"
import { useAuth } from "@/features/auth/useAuth"

// `/` 는 자체 화면을 가지지 않고 인증 상태에 따라 보호 진입점 또는 로그인 화면으로 보낸다.
// checking 단계에서는 깜빡임을 줄이기 위해 빈 화면을 잠시 둔다.
export function RootRedirect() {
  const { state } = useAuth()
  if (state.status === "checking") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="min-h-svh"
      />
    )
  }
  const target = state.status === "authenticated" ? DEFAULT_LOGIN_REDIRECT : "/login"
  return <Navigate to={target} replace />
}

export default RootRedirect
