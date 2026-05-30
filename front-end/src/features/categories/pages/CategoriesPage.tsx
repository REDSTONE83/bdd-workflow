/**
 * @Requirement REQ-014
 * @Route /categories
 * @Page CategoriesPage
 *
 * 카테고리 관리 화면(Skeleton 인터랙션 mockup). 보호 앱 셸 안에서 카테고리 목록을 보여주고,
 * 생성/수정 모달과 삭제 확인 모달로 CRUD 흐름을 구성한다. 목록 데이터와 외부 API 호출,
 * 가상 스크롤 로드는 모두 콜백 prop 으로 받는다. 구현 단계에서 이 page 를 TanStack Query
 * (useInfiniteQuery + mutation) 와 REQ-003 카테고리 API 에 연결하고 routes.tsx 에 swap 한다.
 */
import { Plus } from "lucide-react"
import { useState } from "react"

import { ProtectedLayout } from "@/components/ProtectedLayout"
import { Button } from "@/components/ui/button"

import { CategoryDeleteDialog } from "../components/CategoryDeleteDialog"
import { CategoryFormDialog } from "../components/CategoryFormDialog"
import { CategoryList } from "../components/CategoryList"
import type { CategoryInput, CategoryView } from "../types"

type CategoriesPageProps = {
  categories: CategoryView[]
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  onCreate: (input: CategoryInput) => Promise<void>
  onUpdate: (id: string, input: CategoryInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

type FormState =
  | { mode: "create" }
  | { mode: "edit"; category: CategoryView }
  | null

export function CategoriesPage({
  categories,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onCreate,
  onUpdate,
  onDelete,
}: CategoriesPageProps) {
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<CategoryView | null>(null)

  const handleSubmit = async (input: CategoryInput) => {
    if (form?.mode === "edit") {
      await onUpdate(form.category.id, input)
    } else {
      await onCreate(input)
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">카테고리</h1>
            <p className="text-sm text-muted-foreground">
              할 일을 분류할 카테고리를 만들고 관리합니다.
            </p>
          </div>
          <Button onClick={() => setForm({ mode: "create" })}>
            <Plus aria-hidden="true" />새 카테고리
          </Button>
        </header>

        <CategoryList
          categories={categories}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={onLoadMore}
          onEdit={(category) => setForm({ mode: "edit", category })}
          onDelete={(category) => setDeleting(category)}
        />
      </div>

      <CategoryFormDialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) setForm(null)
        }}
        mode={form?.mode ?? "create"}
        initialValue={
          form?.mode === "edit"
            ? {
                name: form.category.name,
                color: form.category.color,
                description: form.category.description,
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />

      <CategoryDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        categoryName={deleting?.name ?? ""}
        onConfirm={async () => {
          if (deleting) await onDelete(deleting.id)
        }}
      />
    </ProtectedLayout>
  )
}

export default CategoriesPage
