/**
 * @Requirement REQ-011
 */
import { ChevronDown, LogOut } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser"
import { useAuth } from "@/features/auth/useAuth"

// REQ-011 GREEN: 보호 화면 공통 상단 헤더.
// - 우측에 현재 사용자 이메일 trigger + dropdown 사용자 메뉴(로그아웃)
// - 로그아웃 실패 시 헤더 바로 아래 dismiss 가능한 알림 한 줄을 노출
export function ProtectedHeader() {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const handleLogout = async () => {
    setLogoutError(null)
    try {
      await logout()
      navigate("/login", { replace: true })
    } catch {
      setLogoutError(
        "로그아웃을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      )
    }
  }

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b px-6">
        <div className="text-sm font-medium">BDD Workflow</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="사용자 메뉴 열기">
              <span>{user?.email ?? ""}</span>
              <ChevronDown className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      {logoutError && (
        <div className="border-b bg-card px-6 py-2">
          <Alert variant="destructive" className="text-sm">
            <AlertDescription className="flex w-full items-center justify-between gap-3">
              <span>{logoutError}</span>
              <button
                type="button"
                onClick={() => setLogoutError(null)}
                className="text-xs underline-offset-2 hover:underline"
                aria-label="알림 닫기"
              >
                닫기
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}

export default ProtectedHeader
