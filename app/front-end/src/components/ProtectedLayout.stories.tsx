import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

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
  tags: ["autodocs"],
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

export const CategoriesActive: Story = {
  args: {
    children: (
      <div className="text-sm text-muted-foreground">화면 본문 영역</div>
    ),
  },
  parameters: {
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
}

export const TodosActive: Story = {
  parameters: {
    initialEntries: ["/todos"],
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
}
