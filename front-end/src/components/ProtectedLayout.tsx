/**
 * @Requirement REQ-014
 *
 * 보호 화면 공통 앱 셸. 상단 헤더(ProtectedHeader) + 좌측 1차 내비(할 일 / 카테고리)로
 * 구성하고, 화면 본문은 children 으로 받는다. 내비로 할 일 화면과 카테고리 화면을 오갈 수 있다.
 *
 * 구현 단계에서 기존 /todos placeholder 도 같은 앱 셸을 쓰도록 갱신해 두 화면의 내비를 일관시킨다.
 */
import { ListTodo, Tags } from "lucide-react"
import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"

import { ProtectedHeader } from "@/components/ProtectedHeader"
import { cn } from "@/lib/utils"

type NavItem = {
  to: string
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { to: "/todos", label: "할 일", icon: <ListTodo className="size-4" aria-hidden="true" /> },
  { to: "/categories", label: "카테고리", icon: <Tags className="size-4" aria-hidden="true" /> },
]

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <ProtectedHeader />
      <div className="mx-auto flex w-full max-w-6xl">
        <aside className="w-48 shrink-0 border-r px-3 py-6">
          <nav aria-label="주요 화면 내비게이션" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  )
}

export default ProtectedLayout
