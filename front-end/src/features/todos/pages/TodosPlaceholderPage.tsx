/**
 * @Requirement REQ-011
 * @Route /todos
 * @Page TodosPlaceholderPage
 *
 * /todos 보호 화면의 placeholder. 헤더에 사용자 이메일이 표시되고 본문은 비어 있다.
 * 실제 할 일 목록 본문은 REQ-002 FE 후속 카드가 채운다.
 */
import { ProtectedHeader } from "@/components/ProtectedHeader"
export function TodosPlaceholderPage() {
  return (
    <div className="min-h-svh bg-background">
      <ProtectedHeader />
      <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">
        할 일 목록이 여기 표시됩니다.
      </main>
    </div>
  )
}

export default TodosPlaceholderPage
