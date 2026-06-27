/**
 * @Requirement REQ-022, REQ-023, REQ-024, REQ-025, REQ-027, REQ-040
 * @Page TodosPage
 */
import { AlertCircle, Plus, RotateCcw } from "lucide-react"
import { useState } from "react"

import { ProtectedLayout } from "@/components/ProtectedLayout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { CategoryView } from "@/features/categories/types"

import { TodoDeleteDialog } from "../components/TodoDeleteDialog"
import { TodoFilterPanel } from "../components/TodoFilterPanel"
import { TodoFormDialog } from "../components/TodoFormDialog"
import { TodoList } from "../components/TodoList"
import type { TodoFilters } from "../filters"
import type { TodoInput, TodoPatch, TodoView } from "../types"

type TodosPageProps = {
  todos: TodoView[]
  categories: CategoryView[]
  categoriesLoading?: boolean
  isLoading?: boolean
  isError?: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  filters: TodoFilters
  hasActiveFilters?: boolean
  onLoadMore?: () => void
  onApplyFilters: (filters: TodoFilters) => void
  onResetFilters: () => void
  onCreate: (input: TodoInput) => Promise<void>
  onUpdate: (id: string, input: TodoPatch) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

type FormState =
  | { mode: "create" }
  | { mode: "edit"; todo: TodoView }
  | null

function toInput(todo: TodoView): TodoInput {
  return {
    title: todo.title,
    description: todo.description,
    dueDate: todo.dueDate,
    priority: todo.priority,
    categoryId: todo.category?.id ?? null,
  }
}

export function TodosPage({
  todos,
  categories,
  categoriesLoading,
  isLoading,
  isError,
  hasMore,
  isLoadingMore,
  filters,
  hasActiveFilters,
  onLoadMore,
  onApplyFilters,
  onResetFilters,
  onCreate,
  onUpdate,
  onDelete,
}: TodosPageProps) {
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<TodoView | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleSubmit = async (input: TodoInput) => {
    setActionError(null)
    if (form?.mode === "edit") {
      await onUpdate(form.todo.id, input)
    } else {
      await onCreate(input)
    }
  }

  const handleToggleComplete = async (todo: TodoView, completed: boolean) => {
    setActionError(null)
    try {
      await onUpdate(todo.id, { completed })
    } catch {
      setActionError("완료 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      throw new Error("toggle failed")
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">할 일</h1>
            <p className="text-sm text-muted-foreground">
              해야 할 일을 만들고 상태와 분류를 관리합니다.
            </p>
          </div>
          <Button onClick={() => setForm({ mode: "create" })}>
            <Plus aria-hidden="true" />새 할 일
          </Button>
        </header>

        {actionError && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <TodoFilterPanel
          key={filterPanelKey(filters)}
          filters={filters}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onApply={onApplyFilters}
          onReset={onResetFilters}
        />

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>
              할 일 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </AlertDescription>
          </Alert>
        ) : (
          <TodoList
            todos={todos}
            isLoading={isLoading}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            emptyMessage={
              hasActiveFilters
                ? "조건에 맞는 할 일이 없습니다. 필터를 초기화해 보세요."
                : undefined
            }
            emptyAction={
              hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={onResetFilters}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  필터 초기화
                </Button>
              ) : undefined
            }
            onLoadMore={onLoadMore}
            onEdit={(todo) => setForm({ mode: "edit", todo })}
            onDelete={(todo) => setDeleting(todo)}
            onToggleComplete={handleToggleComplete}
          />
        )}
      </div>

      <TodoFormDialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) setForm(null)
        }}
        mode={form?.mode ?? "create"}
        categories={categories}
        categoriesLoading={categoriesLoading}
        initialValue={form?.mode === "edit" ? toInput(form.todo) : undefined}
        onSubmit={handleSubmit}
      />

      <TodoDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        todoTitle={deleting?.title ?? ""}
        onConfirm={async () => {
          if (deleting) await onDelete(deleting.id)
        }}
      />
    </ProtectedLayout>
  )
}

export default TodosPage

function filterPanelKey(filters: TodoFilters): string {
  return [
    filters.search,
    filters.completed,
    filters.priority,
    filters.categoryId ?? "",
    filters.uncategorized ? "uncategorized" : "",
    filters.dueDateFrom,
    filters.dueDateTo,
  ].join("|")
}
