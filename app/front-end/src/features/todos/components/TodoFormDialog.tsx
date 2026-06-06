/**
 * @Requirement REQ-022, REQ-024
 */
import { AlertCircle } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { CategoryView } from "@/features/categories/types"

import {
  TODO_DESCRIPTION_MAX,
  TODO_PRIORITIES,
  TODO_PRIORITY_LABELS,
  TODO_TITLE_MAX,
  type TodoInput,
} from "../types"

type FieldErrors = {
  title?: string
  description?: string
}

type TodoFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  categories: CategoryView[]
  categoriesLoading?: boolean
  initialValue?: TodoInput
  onSubmit: (input: TodoInput) => Promise<void>
}

const EMPTY: TodoInput = {
  title: "",
  description: null,
  dueDate: null,
  priority: "MEDIUM",
  categoryId: null,
}

export function TodoFormDialog({
  open,
  onOpenChange,
  mode,
  categories,
  categoriesLoading,
  initialValue,
  onSubmit,
}: TodoFormDialogProps) {
  const base = initialValue ?? EMPTY
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "새 할 일" : "할 일 수정"}</DialogTitle>
          <DialogDescription>
            제목은 필수이고 설명, 마감일, 카테고리는 비울 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <TodoForm
          mode={mode}
          base={base}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onSubmit={onSubmit}
          onSubmitted={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function TodoForm({
  mode,
  base,
  categories,
  categoriesLoading,
  onSubmit,
  onSubmitted,
}: {
  mode: "create" | "edit"
  base: TodoInput
  categories: CategoryView[]
  categoriesLoading?: boolean
  onSubmit: (input: TodoInput) => Promise<void>
  onSubmitted: () => void
}) {
  const [title, setTitle] = useState(base.title)
  const [description, setDescription] = useState(base.description ?? "")
  const [dueDate, setDueDate] = useState(base.dueDate ?? "")
  const [priority, setPriority] = useState(base.priority)
  const [categoryId, setCategoryId] = useState(base.categoryId ?? "")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      errors.title = "제목을 입력해 주세요."
    } else if (trimmedTitle.length > TODO_TITLE_MAX) {
      errors.title = `제목은 ${TODO_TITLE_MAX}자를 넘을 수 없습니다.`
    }
    if (description.length > TODO_DESCRIPTION_MAX) {
      errors.description = `설명은 ${TODO_DESCRIPTION_MAX}자를 넘을 수 없습니다.`
    }
    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const errors = validate()
    setFieldErrors(errors)
    setFormError(null)
    if (errors.title || errors.description) return

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        dueDate: dueDate || null,
        priority,
        categoryId: categoryId || null,
      })
      onSubmitted()
    } catch {
      setFormError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      setSubmitting(false)
    }
  }

  const submitLabel = mode === "create" ? "만들기" : "저장"
  const submittingLabel = mode === "create" ? "만드는 중..." : "저장 중..."

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="todo-title">제목</Label>
        <Input
          id="todo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "todo-title-error" : undefined}
          autoComplete="off"
        />
        {fieldErrors.title && (
          <p id="todo-title-error" className="text-sm text-destructive">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="todo-description">설명</Label>
        <Textarea
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택)"
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={
            fieldErrors.description ? "todo-description-error" : undefined
          }
        />
        {fieldErrors.description && (
          <p id="todo-description-error" className="text-sm text-destructive">
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="todo-due-date">마감일</Label>
          <Input
            id="todo-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="todo-priority">우선순위</Label>
          <select
            id="todo-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoInput["priority"])}
            className={cn(
              "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            )}
          >
            {TODO_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {TODO_PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="todo-category">카테고리</Label>
        <select
          id="todo-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={categoriesLoading}
          className={cn(
            "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          )}
        >
          <option value="">미분류</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" />}
          disabled={submitting}
        >
          취소
        </DialogClose>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default TodoFormDialog
