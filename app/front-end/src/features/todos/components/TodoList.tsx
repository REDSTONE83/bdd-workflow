/**
 * @Requirement REQ-023, REQ-027
 */
import { useVirtualizer } from "@tanstack/react-virtual"
import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  TODO_PRIORITY_LABELS,
  type TodoView,
} from "../types"

type TodoListProps = {
  todos: TodoView[]
  isLoading?: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  onEdit: (todo: TodoView) => void
  onDelete: (todo: TodoView) => void
  onToggleComplete: (todo: TodoView, completed: boolean) => Promise<void>
}

const ROW_HEIGHT_PX = 130

export function TodoList({
  todos,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onEdit,
  onDelete,
  onToggleComplete,
}: TodoListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  // @tanstack/react-virtual 의 반환 함수는 React Compiler memo 대상이 아니므로 이 컴포넌트만 제외한다.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: todos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 6,
  })
  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1]
    if (!last) return
    if (hasMore && !isLoadingMore && last.index >= todos.length - 1) {
      onLoadMore?.()
    }
  }, [virtualItems, hasMore, isLoadingMore, todos.length, onLoadMore])

  const handleToggle = async (todo: TodoView, completed: boolean) => {
    if (pendingToggleId) return
    setPendingToggleId(todo.id)
    try {
      await onToggleComplete(todo, completed)
    } finally {
      setPendingToggleId(null)
    }
  }

  if (todos.length === 0) {
    if (isLoading) {
      return (
        <div
          role="status"
          aria-busy="true"
          className="rounded-lg border px-6 py-16 text-center text-sm text-muted-foreground"
        >
          할 일을 불러오는 중입니다...
        </div>
      )
    }
    return (
      <div
        data-testid="todo-empty"
        className="rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground"
      >
        아직 할 일이 없습니다. 새 할 일을 만들어 보세요.
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      data-testid="todo-scroll"
      aria-busy={isLoadingMore}
      className="max-h-[64vh] overflow-y-auto rounded-lg border bg-card"
    >
      <ul
        role="list"
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => {
          const todo = todos[virtualItem.index]
          const category = todo.category
          return (
            <li
              key={todo.id}
              data-index={virtualItem.index}
              className="absolute top-0 left-0 w-full border-b px-4 py-3"
              style={{
                height: ROW_HEIGHT_PX,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  disabled={pendingToggleId === todo.id}
                  onChange={(event) => void handleToggle(todo, event.target.checked)}
                  aria-label={`${todo.title} 완료`}
                  className="mt-1 size-4 rounded border-input accent-primary"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm font-semibold",
                        todo.completed && "text-muted-foreground line-through",
                      )}
                    >
                      {todo.title}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                      {todo.completed ? (
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Circle className="size-3.5" aria-hidden="true" />
                      )}
                      {todo.completed ? "완료" : "미완료"}
                    </span>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      우선순위 {TODO_PRIORITY_LABELS[todo.priority]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {todo.dueDate && <span>마감 {todo.dueDate}</span>}
                    <span className="inline-flex items-center gap-1.5">
                      {category?.color ? (
                        <span
                          role="img"
                          aria-label={`색상 ${category.color}`}
                          className="size-3 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                      ) : (
                        <span className="size-3" aria-hidden="true" />
                      )}
                      {category?.name ?? "미분류"}
                    </span>
                  </div>
                  {todo.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {todo.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(todo)}
                    aria-label={`${todo.title} 수정`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(todo)}
                    aria-label={`${todo.title} 삭제`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    삭제
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <div
          data-testid="todo-list-sentinel"
          className="px-4 py-3 text-center text-xs text-muted-foreground"
        >
          {isLoadingMore
            ? "다음 묶음을 불러오는 중..."
            : "스크롤하면 더 불러옵니다"}
        </div>
      )}
    </div>
  )
}

export default TodoList
