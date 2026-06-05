// 카테고리 화면 view model 과 입력 모델. 카테고리 API 계약을 따른다.
// 구현 단계에서 OpenAPI 생성 타입(@/api/generated)으로 매핑한다.

export type CategoryView = {
  id: string
  name: string
  color: string | null
  description: string | null
}

export type CategoryInput = {
  name: string
  color: string | null
  description: string | null
}

// 서버가 중복 이름으로 생성/수정을 거절했음을 모달에 알리는 신호.
// 구현 단계에서 카테고리 API 클라이언트가 이 오류로 매핑한다.
export class DuplicateCategoryNameError extends Error {
  constructor(message = "이미 사용 중인 이름입니다.") {
    super(message)
    this.name = "DuplicateCategoryNameError"
  }
}

// 입력 한계값과 형식. 카테고리 검증 정책과 동일하게 둔다.
export const CATEGORY_NAME_MAX = 50
export const CATEGORY_DESCRIPTION_MAX = 500
export const CATEGORY_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

// 한 묶음 크기. 백엔드 카테고리 목록 기본 페이지 크기와 같다.
export const CATEGORY_PAGE_SIZE = 20

// 색상 직접 입력 대신 빠르게 고르도록 제공하는 추천 색상 스와치.
export const CATEGORY_COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
] as const
