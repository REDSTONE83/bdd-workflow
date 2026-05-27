import { useContext } from "react"

import { AuthContext, type AuthContextValue } from "./AuthContext"

export const harness = {
  requirements: ["REQ-011"],
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>")
  }
  return ctx
}
