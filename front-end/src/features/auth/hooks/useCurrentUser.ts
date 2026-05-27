import { useAuth } from "../useAuth"
import type { AuthenticatedUser } from "../types"

export function useCurrentUser(): AuthenticatedUser | null {
  const { state } = useAuth()
  return state.status === "authenticated" ? state.user : null
}
