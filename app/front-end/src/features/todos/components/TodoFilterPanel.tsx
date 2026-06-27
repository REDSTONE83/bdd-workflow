/**
 * @Requirement REQ-040
 */
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CategoryView } from "@/features/categories/types"
import { cn } from "@/lib/utils"

import {
  normalizeTodoFilters,
  todoCategoryFilterValue,
  todoFiltersWithCategoryValue,
  type TodoCompletedFilter,
  type TodoFilters,
} from "../filters"
import {
  TODO_PRIORITIES,
  TODO_PRIORITY_LABELS,
  type TodoPriority,
} from "../types"

type TodoFilterPanelProps = {
  filters: TodoFilters
  categories: CategoryView[]
  categoriesLoading?: boolean
  onApply: (filters: TodoFilters) => void
  onReset: () => void
}

const COMPLETED_LABELS: Record<TodoCompletedFilter, string> = {
  all: "전체",
  active: "미완료",
  completed: "완료",
}

export function TodoFilterPanel({
  filters,
  categories,
  categoriesLoading,
  onApply,
  onReset,
}: TodoFilterPanelProps) {
  const [draft, setDraft] = useState<TodoFilters>(filters)
  const hasDateRangeError = Boolean(
    draft.dueDateFrom && draft.dueDateTo && draft.dueDateFrom > draft.dueDateTo,
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (hasDateRangeError) return
    onApply(normalizeTodoFilters(draft))
  }

  return (
    <form
      aria-label="할 일 검색 및 필터"
      className="rounded-lg border bg-background p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold">검색 및 필터</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            초기화
          </Button>
          <Button type="submit" disabled={hasDateRangeError}>
            <Search className="size-4" aria-hidden="true" />
            필터 적용
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(14rem,1.5fr)_repeat(3,minmax(9rem,1fr))]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="todo-filter-search">필터 검색어</Label>
          <Input
            id="todo-filter-search"
            value={draft.search}
            onChange={(event) => setDraft((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="제목 또는 설명"
            autoComplete="off"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="todo-filter-completed">필터 완료 상태</Label>
          <select
            id="todo-filter-completed"
            value={draft.completed}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                completed: event.target.value as TodoCompletedFilter,
              }))
            }
            className={selectClassName}
          >
            {Object.entries(COMPLETED_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="todo-filter-priority">필터 우선순위</Label>
          <select
            id="todo-filter-priority"
            value={draft.priority}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                priority:
                  event.target.value === "all"
                    ? "all"
                    : (event.target.value as TodoPriority),
              }))
            }
            className={selectClassName}
          >
            <option value="all">전체</option>
            {TODO_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {TODO_PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="todo-filter-category">필터 카테고리</Label>
          <select
            id="todo-filter-category"
            value={todoCategoryFilterValue(draft)}
            onChange={(event) =>
              setDraft((prev) => todoFiltersWithCategoryValue(prev, event.target.value))
            }
            disabled={categoriesLoading}
            className={selectClassName}
          >
            <option value="all">전체</option>
            <option value="uncategorized">미분류</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="todo-filter-due-from">필터 마감 시작일</Label>
          <Input
            id="todo-filter-due-from"
            type="date"
            value={draft.dueDateFrom}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, dueDateFrom: event.target.value }))
            }
            aria-invalid={hasDateRangeError}
            aria-describedby={hasDateRangeError ? "todo-filter-date-error" : undefined}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="todo-filter-due-to">필터 마감 종료일</Label>
          <Input
            id="todo-filter-due-to"
            type="date"
            value={draft.dueDateTo}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, dueDateTo: event.target.value }))
            }
            aria-invalid={hasDateRangeError}
            aria-describedby={hasDateRangeError ? "todo-filter-date-error" : undefined}
          />
        </div>
      </div>

      {hasDateRangeError && (
        <p id="todo-filter-date-error" className="mt-2 text-sm text-destructive">
          마감 시작일은 종료일보다 늦을 수 없습니다.
        </p>
      )}
    </form>
  )
}

const selectClassName = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:cursor-not-allowed disabled:opacity-50",
)

export default TodoFilterPanel
