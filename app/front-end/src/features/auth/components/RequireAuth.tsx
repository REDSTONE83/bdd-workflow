/**
 * @Requirement REQ-011
 */
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "../useAuth"

// REQ-011 GREEN: 보호 라우트 가드.
// - checking 단계: 헤더/본문 자리만 보이는 스켈레톤
// - unauthenticated: /login 으로 이동하며 현재 경로를 loginRedirect query 로 전달
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === "checking") {
    return (
      <div
        data-testid="auth-skeleton"
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="min-h-svh"
      >
        <div className="h-12 border-b" />
        <div className="px-6 py-6 text-sm text-muted-foreground">불러오는 중...</div>
      </div>
    )
  }
  if (state.status === "unauthenticated") {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?loginRedirect=${redirect}`} replace />
  }
  return <>{children}</>
}
