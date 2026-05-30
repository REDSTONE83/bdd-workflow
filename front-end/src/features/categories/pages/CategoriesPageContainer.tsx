/**
 * @Requirement REQ-014
 * @Route /categories
 * @Page CategoriesPageContainer
 * @UsesApi GET /categories mount
 * @UsesApi POST /categories submit
 * @UsesApi PATCH /categories/{categoryId} submit
 * @UsesApi DELETE /categories/{categoryId} submit
 *
 * REQ-014 카테고리 관리 화면 컨테이너.
 * 표현 컴포넌트 CategoriesPage 에 TanStack Query 서버 상태(무한 목록)와
 * 생성/수정/삭제 mutation(REQ-003 카테고리 API)을 결합한다.
 */
import { CategoriesPage } from "./CategoriesPage"
import {
  useCategoriesInfinite,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../hooks/useCategories"

export function CategoriesPageContainer() {
  const list = useCategoriesInfinite()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  return (
    <CategoriesPage
      categories={list.categories}
      isLoading={list.isLoading}
      isError={list.isError}
      hasMore={list.hasNextPage}
      isLoadingMore={list.isFetchingNextPage}
      onLoadMore={list.fetchNextPage}
      onCreate={(input) => createCategory.mutateAsync(input)}
      onUpdate={(id, input) => updateCategory.mutateAsync({ id, input })}
      onDelete={(id) => deleteCategory.mutateAsync(id)}
    />
  )
}

export default CategoriesPageContainer
