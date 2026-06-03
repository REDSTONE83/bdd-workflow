/**
 * @Requirement REQ-011, REQ-016
 */
import type { ReactNode } from "react"
import { Navigate, useSearchParams } from "react-router-dom"

import { resolveLoginRedirect } from "../loginRedirect"
import { useAuth } from "../useAuth"

// REQ-011 GREEN: 이미 인증된 사용자가 /login 등 공개 화면 접근 시 보호 진입점으로 이동.
// REQ-016: 신뢰 가능한 loginRedirect(예: /categories 딥링크) 가 있으면 그 화면으로 보낸다.
// 로그인 직후 authenticated 로 바뀌는 전이에서도 LoginPage 의 이동 대상과 일치시켜, 신뢰 대상으로
// 진입했던 사용자가 기본 진입점이 아니라 원래 가려던 보호 화면으로 돌아오게 한다. 신뢰 목록 정확 일치만
// 통과하므로 open redirect 방어는 그대로 유지된다(비신뢰 값은 기본 진입점으로).
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const [searchParams] = useSearchParams()
  if (state.status === "checking") {
    return null
  }
  if (state.status === "authenticated") {
    return (
      <Navigate
        to={resolveLoginRedirect(searchParams.get("loginRedirect"))}
        replace
      />
    )
  }
  return <>{children}</>
}
