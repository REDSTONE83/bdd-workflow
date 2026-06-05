import type { Meta, StoryObj } from "@storybook/react-vite"
import { useRef, useState } from "react"
import { MemoryRouter } from "react-router-dom"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"

import { CategoriesPage } from "./CategoriesPage"
import {
  CATEGORY_COLOR_PRESETS,
  type CategoryInput,
  type CategoryView,
  DuplicateCategoryNameError,
} from "../types"

const authenticatedAuth: AuthContextValue = {
  state: {
    status: "authenticated",
    user: { id: "user-1", email: "user@example.com" },
  },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const okAsync = async (): Promise<void> => {}

const sample: CategoryView[] = [
  { id: "1", name: "업무", color: "#3b82f6", description: "회사 업무 관련 할 일" },
  { id: "2", name: "개인", color: "#22c55e", description: "개인 일정" },
  { id: "3", name: "기타", color: null, description: null },
]

const many: CategoryView[] = Array.from({ length: 20 }, (_, i) => ({
  id: `cat-${i + 1}`,
  name: `카테고리 ${i + 1}`,
  color: CATEGORY_COLOR_PRESETS[i % CATEGORY_COLOR_PRESETS.length],
  description: null,
}))

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Skeleton 단계 page mock 의 상호작용 검토용 in-memory 호스트.
// 구현 단계에서 이 콜백들이 카테고리 API + TanStack Query mutation 으로 대체된다.
function CategoriesPageMock({ initial }: { initial: CategoryView[] }) {
  const [categories, setCategories] = useState<CategoryView[]>(initial)
  const idRef = useRef(initial.length)

  const isDuplicate = (name: string, exceptId?: string) =>
    categories.some(
      (category) =>
        category.id !== exceptId &&
        category.name.trim().toLowerCase() === name.trim().toLowerCase(),
    )

  const handleCreate = async (input: CategoryInput) => {
    await delay(400)
    if (isDuplicate(input.name)) throw new DuplicateCategoryNameError()
    idRef.current += 1
    setCategories((prev) => [...prev, { id: `new-${idRef.current}`, ...input }])
  }

  const handleUpdate = async (id: string, input: CategoryInput) => {
    await delay(400)
    if (isDuplicate(input.name, id)) throw new DuplicateCategoryNameError()
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, ...input } : category,
      ),
    )
  }

  const handleDelete = async (id: string) => {
    await delay(400)
    setCategories((prev) => prev.filter((category) => category.id !== id))
  }

  return (
    <CategoriesPage
      categories={categories}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  )
}

const meta = {
  title: "Routes/CategoriesPage",
  component: CategoriesPage,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-016", "REQ-017", "REQ-018", "REQ-019"],
    },
  },
  tags: ["autodocs"],
  args: {
    categories: sample,
    onCreate: okAsync,
    onUpdate: okAsync,
    onDelete: okAsync,
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/categories"]}>
        <AuthContext.Provider value={authenticatedAuth}>
          <Story />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof CategoriesPage>

export default meta

type Story = StoryObj<typeof meta>

export const RouteCategories: Story = {
  name: "Route /categories",
  parameters: {
    docs: {
      description: {
        story:
          "/categories 진입 화면. Storybook 안에서 직접 만들기·수정·삭제·검증·중복 이름 흐름을 클릭해 볼 수 있는 in-memory mock.",
      },
    },
  },
  render: () => <CategoriesPageMock initial={sample} />,
}

export const Empty: Story = {
  args: { categories: [] },
  parameters: {
    docs: {
      description: {
        story: "카테고리가 하나도 없을 때의 빈 상태 화면.",
      },
    },
  },
}

export const ManyItems: Story = {
  args: { categories: many, hasMore: true },
  parameters: {
    docs: {
      description: {
        story:
          "한 묶음(20개)을 채운 상태. 목록을 아래로 스크롤하면 다음 묶음을 이어 불러온다(가상 스크롤).",
      },
    },
  },
}
