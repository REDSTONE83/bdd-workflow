import { createContext } from "react"

import type { AuthState, LoginInput } from "./types"

export type AuthContextValue = {
  state: AuthState
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

// REQ-011 Skeleton: AuthProvider 가 주입할 context. provider/hook 파일을 분리하기 위해 별도 모듈로 둔다.
export const AuthContext = createContext<AuthContextValue | null>(null)
