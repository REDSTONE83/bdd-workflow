/**
 * @Requirement REQ-011
 */
import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { DEFAULT_LOGIN_REDIRECT } from "../loginRedirect"
import { useAuth } from "../useAuth"

// REQ-011 GREEN: 이미 인증된 사용자가 /login 등 공개 화면 접근 시 보호 진입점으로 이동.
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  if (state.status === "checking") {
    return null
  }
  if (state.status === "authenticated") {
    return <Navigate to={DEFAULT_LOGIN_REDIRECT} replace />
  }
  return <>{children}</>
}
