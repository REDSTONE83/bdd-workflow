/**
 * @Requirement REQ-011
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

import { apiClient } from "@/api/client"

import { AuthContext, type AuthContextValue } from "./AuthContext"
import type { AuthState, AuthenticatedUser, LoginInput } from "./types"

// REQ-011 GREEN: AuthProvider 가 부팅 시 /auth/me 로 인증 상태를 결정하고,
// login/logout/refresh mutation 으로 상태 전이를 일으킨다.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "checking" })

  const fetchMe = useCallback(async () => {
    const { data, error, response } = await apiClient.GET("/auth/me", {})
    if (data && response.ok) {
      const user: AuthenticatedUser = {
        id: data.id ?? "",
        email: data.email ?? "",
      }
      setState({ status: "authenticated", user })
      return
    }
    // 401, 네트워크 오류 등 모두 unauthenticated 로 본다. checking 단계는 끝낸다.
    void error
    setState({ status: "unauthenticated" })
  }, [])

  useEffect(() => {
    // 부팅 시 1회 /auth/me 호출로 외부(BE 세션) 상태와 동기화한다.
    // 비동기 fetchMe 내부 setState 는 마이크로태스크 이후라 cascading render 가 아니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMe()
  }, [fetchMe])

  const login = useCallback<AuthContextValue["login"]>(
    async (input: LoginInput) => {
      const { error, response } = await apiClient.POST("/auth/login", {
        body: { email: input.email, password: input.password },
      })
      if (!response.ok) {
        throw error ?? new Error("login_failed")
      }
      await fetchMe()
    },
    [fetchMe],
  )

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    const { error, response } = await apiClient.POST("/auth/logout", {})
    if (!response.ok) {
      throw error ?? new Error("logout_failed")
    }
    setState({ status: "unauthenticated" })
  }, [])

  const refresh = useCallback<AuthContextValue["refresh"]>(async () => {
    await fetchMe()
  }, [fetchMe])

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, logout, refresh }),
    [state, login, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
