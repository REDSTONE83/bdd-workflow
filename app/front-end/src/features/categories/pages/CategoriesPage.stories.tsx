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
    docs: {
      description: {
        component: `
### 화면 책임

\`/categories\` 보호 경로에서 사용자가 본인의 카테고리를 조회하고, 같은 화면에서 생성·수정·삭제 흐름으로 진입하는 화면이다.

### 주요 요소

- 카테고리 목록과 색상 표시
- 새 카테고리 만들기 진입점
- 항목별 수정·삭제 동작
- 빈 목록과 추가 묶음 로딩 상태

        `.trim(),
      },
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
        story: `
### 화면 목적

\`/categories\`로 진입했을 때 기존 카테고리 목록을 확인하고 새 카테고리 관리 작업을 시작하는 상태다.

### 사용자 흐름

1. 목록에서 카테고리 이름, 색상, 설명을 확인한다.
2. 만들기 버튼을 눌러 생성 입력 대화상자를 연다.
3. 이름, 색상, 설명을 입력하고 저장한다.
4. 항목 동작에서 수정 또는 삭제 대화상자로 이동한다.
5. 저장 또는 삭제 후 목록에 변경 결과가 반영되는지 확인한다.

### 관찰 포인트

중복 이름을 입력하면 같은 입력 대화상자 안에 서버 거절 안내가 남는다. 삭제는 확인 대화상자를 거치며, 성공하면 해당 항목이 목록에서 사라진다.
        `.trim(),
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
        story: `
### 상태 설명

카테고리가 하나도 없을 때의 빈 목록 화면이다.

### 사용자 흐름

1. 사용자는 빈 상태 안내를 읽고 아직 등록된 카테고리가 없음을 확인한다.
2. 만들기 진입점으로 새 카테고리 등록을 시작한다.

### 관찰 포인트

빈 상태에서도 화면의 주 작업은 막히지 않아야 한다. 빈 목록 컨테이너만 남기지 않고 다음 행동이 드러나는지 확인한다.
        `.trim(),
      },
    },
  },
}

export const ManyItems: Story = {
  args: { categories: many, hasMore: true },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

한 묶음 20개를 채운 카테고리 목록이며 다음 묶음이 남아 있는 상태다.

### 사용자 흐름

1. 사용자는 목록을 스크롤해 여러 카테고리를 훑는다.
2. 목록 끝에 가까워지면 다음 묶음을 이어 불러오는 흐름을 확인한다.
3. 스크롤 중에도 항목별 수정·삭제 동작이 유지되는지 본다.

### 관찰 포인트

가상 스크롤 목록이므로 화면 안에 보이는 항목 중심으로 렌더링된다. 목록 높이, 하단 로딩 위치, 긴 이름 표시가 데스크톱 기준 화면에서 무너지지 않는지 확인한다.
        `.trim(),
      },
    },
  },
}
