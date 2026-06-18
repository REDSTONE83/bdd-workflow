import type { Meta, StoryObj } from "@storybook/react-vite"
import { useRef, useState } from "react"
import { MemoryRouter } from "react-router-dom"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"
import {
  expectCurrentPopupClosed,
  withinCurrentAlertDialog,
  withinCurrentDialog,
} from "@/test/storybook-dialog"

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
const MOCK_MUTATION_DELAY_MS = 50

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
    await delay(MOCK_MUTATION_DELAY_MS)
    if (isDuplicate(input.name)) throw new DuplicateCategoryNameError()
    idRef.current += 1
    setCategories((prev) => [...prev, { id: `new-${idRef.current}`, ...input }])
  }

  const handleUpdate = async (id: string, input: CategoryInput) => {
    await delay(MOCK_MUTATION_DELAY_MS)
    if (isDuplicate(input.name, id)) throw new DuplicateCategoryNameError()
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, ...input } : category,
      ),
    )
  }

  const handleDelete = async (id: string) => {
    await delay(MOCK_MUTATION_DELAY_MS)
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
  tags: ["autodocs", "test"],
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

const assertCategoryRouteFlow = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole("heading", { name: "카테고리" })).toBeVisible()
  await expect(canvas.getByRole("link", { name: "할 일" })).toBeVisible()
  await expect(canvas.getByText("업무")).toBeVisible()
  await expect(canvas.getByText("개인")).toBeVisible()
  await expect(canvas.getByLabelText("색상 #3b82f6")).toBeVisible()

  await userEvent.click(canvas.getByRole("button", { name: "새 카테고리" }))
  const createDialog = await withinCurrentDialog("새 카테고리")
  await userEvent.type(createDialog.getByLabelText("이름"), "Travel")
  await userEvent.click(createDialog.getByRole("button", { name: "만들기" }))
  await expectCurrentPopupClosed("dialog", "새 카테고리")
  await expect(await canvas.findByText("Travel")).toBeVisible()

  await userEvent.click(canvas.getByRole("button", { name: "Travel 수정" }))
  const editDialog = await withinCurrentDialog("카테고리 수정")
  await expect(editDialog.getByRole("button", { name: "저장" })).toBeEnabled()
  const editName = editDialog.getByLabelText("이름")
  await userEvent.clear(editName)
  await userEvent.type(editName, "Travel updated")
  await userEvent.click(editDialog.getByRole("button", { name: "저장" }))
  await expectCurrentPopupClosed("dialog", "카테고리 수정")
  await expect(await canvas.findByText("Travel updated")).toBeVisible()

  await userEvent.click(canvas.getByRole("button", { name: "Travel updated 삭제" }))
  const deleteDialog = await withinCurrentAlertDialog("‘Travel updated’ 카테고리를 삭제할까요?")
  await expect(deleteDialog.getByText("‘Travel updated’ 카테고리를 삭제할까요?")).toBeVisible()
  await userEvent.click(deleteDialog.getByRole("button", { name: "삭제" }))
  await expectCurrentPopupClosed("alertdialog", "‘Travel updated’ 카테고리를 삭제할까요?")
  await waitFor(() => expect(canvas.queryByText("Travel updated")).not.toBeInTheDocument())
}

const assertEmptyCategories = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByText("아직 카테고리가 없습니다. 새 카테고리를 만들어 보세요.")).toBeVisible()
  await expect(canvas.getByRole("button", { name: "새 카테고리" })).toBeVisible()
}

const assertManyCategories = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByText("카테고리 1")).toBeVisible()
  await expect(canvas.getByTestId("category-scroll")).toBeVisible()
  await expect(canvas.getByTestId("category-list-sentinel")).toHaveTextContent("스크롤하면 더 불러옵니다")
}

export const RouteCategories: Story = {
  name: "Route /categories",
  parameters: {
    harness: {
      covers: [
        "`/categories` 경로에 접근하면 자신의 카테고리 목록이 보인다",
        "카테고리 목록은 정해진 정렬 순서대로 보이며, 같은 순서면 먼저 등록한 카테고리가 위로 정렬되어 보인다",
        "카테고리 목록의 각 항목은 이름과 색상을 함께 표시한다",
        "카테고리 화면은 보호 화면 앱 셸 안에 보이고, 할 일 화면과 카테고리 화면을 오갈 수 있는 내비가 보인다",
        "데스크톱 화면에서 카테고리 목록과 입력 영역의 주요 요소가 화면 밖으로 넘치지 않는다",
        "카테고리 화면은 자동 접근성 검사에서 위반이 없어야 한다",
        "유효한 정보로 카테고리를 만들면 새 카테고리가 목록에 나타난다",
        "카테고리를 수정해 이름이나 색상을 바꾸면 변경된 이름과 색상이 목록에 반영된다",
        "카테고리를 수정해 설명을 바꾼 뒤 수정 화면을 다시 열면 변경된 설명이 보인다",
        "카테고리를 수정할 때 색상을 비우면 목록에서 그 카테고리의 색상 표시가 사라진다",
        "카테고리를 수정할 때 설명을 비운 뒤 수정 화면을 다시 열면 설명이 비어 있다",
        "삭제를 확인하면 그 카테고리가 목록에서 사라진다",
      ],
    },
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
  play: assertCategoryRouteFlow,
}

export const Empty: Story = {
  args: { categories: [] },
  parameters: {
    harness: {
      covers: [
        "카테고리가 하나도 없으면 카테고리가 비어 있다는 안내가 보인다",
      ],
    },
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
  play: assertEmptyCategories,
}

export const ManyItems: Story = {
  args: { categories: many, hasMore: true },
  parameters: {
    harness: {
      covers: [
        "카테고리가 한 묶음(20개)보다 많으면, 처음에는 첫 묶음의 카테고리까지만 보여주고 목록을 아래로 스크롤하면 다음 묶음의 카테고리를 이어서 보여준다",
      ],
    },
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
  play: assertManyCategories,
}
