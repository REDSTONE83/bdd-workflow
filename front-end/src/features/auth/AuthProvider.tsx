/**
 * @Requirement REQ-011
 * @UsesApi GET /auth/me auth-state
 * @UsesApi POST /auth/login login
 * @UsesApi POST /auth/logout logout
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

import {
  fetchCurrentUser,
  loginWithCredentials,
  logout as logoutRequest,
} from "@/api/auth"

import { AuthContext, type AuthContextValue } from "./AuthContext"
import type { AuthState, LoginInput } from "./types"

// AuthProvider 가 부팅 시 /auth/me 로 인증 상태를 결정하고,
// login/logout/refresh mutation 으로 상태 전이를 일으킨다.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "checking" })

  const syncFromServer = useCallback(async () => {
    const user = await fetchCurrentUser()
    setState(user ? { status: "authenticated", user } : { status: "unauthenticated" })
  }, [])

  useEffect(() => {
    // 부팅 시 1회 /auth/me 호출로 외부(BE 세션) 상태와 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void syncFromServer()
  }, [syncFromServer])

  const login = useCallback<AuthContextValue["login"]>(
    async (input: LoginInput) => {
      await loginWithCredentials(input)
      await syncFromServer()
    },
    [syncFromServer],
  )

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    await logoutRequest()
    setState({ status: "unauthenticated" })
  }, [])

  const refresh = useCallback<AuthContextValue["refresh"]>(async () => {
    await syncFromServer()
  }, [syncFromServer])

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, logout, refresh }),
    [state, login, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
