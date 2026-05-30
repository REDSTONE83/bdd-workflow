/**
 * @Requirement REQ-014
 *
 * 카테고리 목록. 각 항목은 이름과 색상을 함께 표시하고, 항목마다 수정/삭제 진입을 둔다.
 * 목록이 비면 빈 상태 안내를 보여준다. 페이징 API 위의 가상 스크롤 동작은 prop 콜백
 * (hasMore / isLoadingMore / onLoadMore)으로 시뮬레이션한다(Skeleton 단계). 구현 단계에서
 * useInfiniteQuery + @tanstack/react-virtual + IntersectionObserver 로 실제 결합한다.
 */
import { Pencil, Trash2 } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"

import type { CategoryView } from "../types"

type CategoryListProps = {
  categories: CategoryView[]
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  onEdit: (category: CategoryView) => void
  onDelete: (category: CategoryView) => void
}

const NEAR_BOTTOM_PX = 96

export function CategoryList({
  categories,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onEdit,
  onDelete,
}: CategoryListProps) {
  const requestedRef = useRef(false)

  if (categories.length === 0) {
    return (
      <div
        data-testid="category-empty"
        className="rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground"
      >
        아직 카테고리가 없습니다. 새 카테고리를 만들어 보세요.
      </div>
    )
  }

  // 스크롤이 끝에 가까워지면 다음 묶음을 요청한다. 구현 단계에서 IntersectionObserver 로 대체한다.
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore || !onLoadMore) return
    const el = event.currentTarget
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
    if (nearBottom && !requestedRef.current) {
      requestedRef.current = true
      onLoadMore()
    } else if (!nearBottom) {
      requestedRef.current = false
    }
  }

  return (
    <div
      onScroll={handleScroll}
      aria-busy={isLoadingMore}
      className="max-h-[60vh] overflow-y-auto rounded-lg border"
    >
      <ul role="list" className="divide-y">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            {category.color ? (
              <span
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
        ))}
      </ul>
      {hasMore && (
        <div
          data-testid="category-list-sentinel"
          className="px-4 py-3 text-center text-xs text-muted-foreground"
        >
          {isLoadingMore ? "다음 묶음을 불러오는 중..." : "스크롤하면 더 불러옵니다"}
        </div>
      )}
    </div>
  )
}

export default CategoryList
