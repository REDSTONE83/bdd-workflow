import { apiClient, type components } from "./client"
import {
  type CategoryInput,
  type CategoryView,
  DuplicateCategoryNameError,
} from "@/features/categories/types"

import {
  nullablePatchBody,
  pageableQuery,
  pageableQueryString,
} from "./wire"

// REQ-016~REQ-019: 카테고리 도메인 API 모듈. 카테고리 계약(목록/생성/수정/삭제)을
// FE view model 로 정규화하고, 중복 이름 409 를 DuplicateCategoryNameError 로 매핑한다.
// 화면/훅이 generated OpenAPI client 를 직접 다루지 않도록 경계를 둔다.

type CategoryResponse = components["schemas"]["CategoryResponse"]

const GENERIC_LIST_ERROR = "카테고리 목록을 불러오지 못했습니다."
const GENERIC_WRITE_ERROR = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."

export type CategoryPage = {
  items: CategoryView[]
  page: number
  totalPages: number
}

function toView(category: CategoryResponse): CategoryView {
  return {
    id: category.categoryId ?? "",
    name: category.name ?? "",
    color: category.color ?? null,
    description: category.description ?? null,
  }
}

export async function listCategories(
  params: { page: number; size: number },
  signal?: AbortSignal,
): Promise<CategoryPage> {
  const { data, response } = await apiClient.GET("/categories", {
    params: { query: pageableQuery(params) },
    querySerializer: () => pageableQueryString(params),
    signal,
  })
  if (!response.ok || !data) {
    throw new Error(GENERIC_LIST_ERROR)
  }
  const content = (data.content ?? []) as CategoryResponse[]
  return {
    items: content.map(toView),
    page: data.page ?? params.page,
    totalPages: data.totalPages ?? 0,
  }
}

export async function createCategory(input: CategoryInput): Promise<void> {
  const { response } = await apiClient.POST("/categories", {
    body: {
      name: input.name,
      color: input.color,
      description: input.description,
    },
  })
  if (response.status === 409) throw new DuplicateCategoryNameError()
  if (!response.ok) throw new Error(GENERIC_WRITE_ERROR)
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<void> {
  const { response } = await apiClient.PATCH("/categories/{categoryId}", {
    params: { path: { categoryId: id } },
    body: nullablePatchBody<components["schemas"]["UpdateCategoryRequest"]>({
      name: input.name,
      color: input.color,
      description: input.description,
    }),
  })
  if (response.status === 409) throw new DuplicateCategoryNameError()
  if (!response.ok) throw new Error(GENERIC_WRITE_ERROR)
}

export async function deleteCategory(id: string): Promise<void> {
  const { response } = await apiClient.DELETE("/categories/{categoryId}", {
    params: { path: { categoryId: id } },
  })
  if (!response.ok) throw new Error(GENERIC_WRITE_ERROR)
}
