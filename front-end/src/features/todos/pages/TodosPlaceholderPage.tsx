/**
 * @Requirement REQ-011
 * @Route /todos
 * @Page TodosPlaceholderPage
 *
 * /todos 보호 화면의 placeholder. 공통 보호 앱 셸(ProtectedLayout)의 헤더와 1차 내비를 함께 써
 * 카테고리 화면과 내비가 일관되게 보이며, 본문은 비어 있다.
 * 실제 할 일 목록 본문은 REQ-002 FE 후속 카드가 채운다.
 */
import { ProtectedLayout } from "@/components/ProtectedLayout"
export function TodosPlaceholderPage() {
  return (
    <ProtectedLayout>
      <div className="text-sm text-muted-foreground">
        할 일 목록이 여기 표시됩니다.
      </div>
    </ProtectedLayout>
  )
}

export default TodosPlaceholderPage
