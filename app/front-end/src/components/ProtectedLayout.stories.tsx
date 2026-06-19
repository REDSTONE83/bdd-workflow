import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"
import { expect, within } from "storybook/test"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"

import { ProtectedLayout } from "./ProtectedLayout"

const authenticatedAuth: AuthContextValue = {
  state: {
    status: "authenticated",
    user: { id: "user-1", email: "user@example.com" },
  },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const meta = {
  title: "Components/ProtectedLayout",
  component: ProtectedLayout,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-016"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

인증된 업무 화면이 공유하는 보호 앱 틀이다. 상단 영역과 1차 내비, 본문 영역을 제공한다.

### 주요 요소

- 보호 상단 영역
- 카테고리와 할 일 같은 1차 내비
- 현재 경로 활성 상태
- 업무 화면 본문 슬롯

        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={parameters.initialEntries ?? ["/categories"]}>
        <AuthContext.Provider value={authenticatedAuth}>
          <Story />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof ProtectedLayout>

export default meta

type Story = StoryObj<typeof meta>

const assertCategoriesLayout = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByText("BDD Workflow")).toBeVisible()
  await expect(canvas.getByRole("link", { name: "카테고리" })).toBeVisible()
  await expect(canvas.getByRole("link", { name: "할 일" })).toBeVisible()
  await expect(canvas.getByText("화면 본문 영역")).toBeVisible()
}

const assertTodosLayout = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByText("BDD Workflow")).toBeVisible()
  await expect(canvas.getByRole("link", { name: "할 일" })).toBeVisible()
  await expect(canvas.getByRole("link", { name: "카테고리" })).toBeVisible()
  await expect(canvas.getByText("화면 본문 영역")).toBeVisible()
}

export const CategoriesActive: Story = {
  args: {
    children: (
      <div className="text-sm text-muted-foreground">화면 본문 영역</div>
    ),
  },
  parameters: {
    harness: {
      requirements: ["REQ-016", "REQ-011"],
      covers: [
        "카테고리 화면은 보호 화면 앱 셸 안에 보이고, 할 일 화면과 카테고리 화면을 오갈 수 있는 내비가 보인다",
        "비인증 사용자가 카테고리 화면 경로에 접근하면 로그인 화면으로 이동한다",
        "카테고리 화면 경로로 진입했다가 로그인하면 카테고리 화면으로 돌아온다",
        "보호 화면을 처음 열거나 새로고침했을 때 인증 확인이 끝나기 전에는 헤더 골격과 본문 자리만 보이는 스켈레톤이 표시된다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

\`/categories\` 경로에서 카테고리 내비가 활성화된 보호 앱 틀 상태다.

### 사용자 흐름

1. 사용자는 상단 영역에서 인증 상태를 확인한다.
2. 1차 내비에서 현재 위치가 카테고리 화면임을 확인한다.
3. 본문 영역에서 카테고리 업무 화면을 사용한다.

### 관찰 포인트

활성 내비는 색상만으로 구분되지 않아야 한다. 본문 슬롯이 상단 틀과 겹치지 않고 데스크톱 기준 화면에 안정적으로 배치되는지 확인한다.
        `.trim(),
      },
    },
  },
  play: assertCategoriesLayout,
}

export const TodosActive: Story = {
  parameters: {
    initialEntries: ["/todos"],
    harness: {
      requirements: ["REQ-016", "REQ-023"],
      covers: [
        "할 일 화면은 보호 앱 셸 안에 보이고, 할 일 화면과 카테고리 화면을 오갈 수 있는 내비가 보인다",
        "비인증 사용자가 할 일 화면 경로에 접근하면 로그인 화면으로 이동한다",
        "할 일 화면 경로로 진입했다가 로그인하면 할 일 화면으로 돌아온다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

\`/todos\` 경로에서 할 일 내비가 활성화된 보호 앱 틀 상태다.

### 사용자 흐름

1. 사용자는 상단 영역에서 인증 상태를 확인한다.
2. 1차 내비에서 현재 위치가 할 일 화면임을 확인한다.
3. 본문 영역에서 할 일 업무 화면을 사용한다.

### 관찰 포인트

내비 항목 전환 시 화면 틀 높이와 본문 시작 위치가 흔들리지 않아야 한다. 보호 경로가 늘어나도 내비 구조가 반복 사용 가능한지 확인한다.
        `.trim(),
      },
    },
  },
  args: {
    children: (
      <div className="text-sm text-muted-foreground">화면 본문 영역</div>
    ),
  },
  play: assertTodosLayout,
}
