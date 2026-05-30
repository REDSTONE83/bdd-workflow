/**
 * @Requirement REQ-014
 *
 * 카테고리 목록. 각 항목은 이름과 색상을 함께 표시하고, 항목마다 수정/삭제 진입을 둔다.
 * 목록이 비면 빈 상태 안내를, 첫 조회 중이면 로딩 안내를 보여준다. 페이징 API 위의 가상 스크롤은
 * @tanstack/react-virtual 로 보이는 항목만 렌더링하고, 스크롤이 끝에 가까워지면 onLoadMore 로
 * 다음 묶음을 이어 받는다(렌더링 규칙은 docs/standards/front-end-ui.md "목록 가상 스크롤").
 */
import { useVirtualizer } from "@tanstack/react-virtual"
import { Pencil, Trash2 } from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"

import type { CategoryView } from "../types"

type CategoryListProps = {
  categories: CategoryView[]
  isLoading?: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  onEdit: (category: CategoryView) => void
  onDelete: (category: CategoryView) => void
}

const ROW_HEIGHT_PX = 57

export function CategoryList({
  categories,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onEdit,
  onDelete,
}: CategoryListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  // @tanstack/react-virtual 의 useVirtualizer 는 React Compiler 가 memoize 할 수 없는 함수를 반환한다.
  // 이 컴포넌트는 compiler 자동 memo 대상에서 빠지지만 동작은 정상이다(가상 스크롤 표준 권장 라이브러리).
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: categories.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 8,
  })
  const virtualItems = virtualizer.getVirtualItems()

  // 스크롤이 마지막 항목에 가까워지면 다음 묶음을 요청한다.
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1]
    if (!last) return
    if (hasMore && !isLoadingMore && last.index >= categories.length - 1) {
      onLoadMore?.()
    }
  }, [virtualItems, hasMore, isLoadingMore, categories.length, onLoadMore])

  if (categories.length === 0) {
    if (isLoading) {
      return (
        <div
          role="status"
          aria-busy="true"
          className="rounded-lg border px-6 py-16 text-center text-sm text-muted-foreground"
        >
          카테고리를 불러오는 중입니다...
        </div>
      )
    }
    return (
      <div
        data-testid="category-empty"
        className="rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground"
      >
        아직 카테고리가 없습니다. 새 카테고리를 만들어 보세요.
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      data-testid="category-scroll"
      aria-busy={isLoadingMore}
      className="max-h-[60vh] overflow-y-auto rounded-lg border"
    >
      <ul
        role="list"
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => {
          const category = categories[virtualItem.index]
          return (
            <li
              key={category.id}
              data-index={virtualItem.index}
              className="absolute top-0 left-0 flex w-full items-center gap-3 border-b px-4"
              style={{
                height: ROW_HEIGHT_PX,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {category.color ? (
                <span
                  role="img"
                  aria-label={`색상 ${category.color}`}
                  className="size-4 shrink-0 rounded-full border"
                  style={{ backgroundColor: category.color }}
                />
              ) : (
                <span className="size-4 shrink-0" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {category.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(category)}
                aria-label={`${category.name} 수정`}
              >
                <Pencil className="size-4" aria-hidden="true" />
                수정
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(category)}
                aria-label={`${category.name} 삭제`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                삭제
              </Button>
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <div
          data-testid="category-list-sentinel"
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

export default CategoryList
