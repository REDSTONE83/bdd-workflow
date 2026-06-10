import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"

import { ProtectedHeader } from "./ProtectedHeader"

const authenticatedAuth: AuthContextValue = {
  state: {
    status: "authenticated",
    user: {
      id: "user-1",
      email: "user@example.com",
    },
  },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const meta = {
  title: "Components/ProtectedHeader",
  component: ProtectedHeader,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-011"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

인증된 사용자가 보호 화면 상단에서 현재 계정을 확인하고 로그아웃 흐름으로 진입하게 하는 상단 영역이다.

### 주요 요소

- 서비스/앱 식별 영역
- 인증된 사용자 이메일
- 로그아웃 진입점

        `.trim(),
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/todos"]}>
        <AuthContext.Provider value={authenticatedAuth}>
          <Story />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof ProtectedHeader>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

보호 화면에 진입한 인증 사용자가 보는 기본 상단 영역 상태다.

### 사용자 흐름

1. 사용자는 현재 로그인된 이메일을 확인한다.
2. 보호 화면을 사용하다가 로그아웃 동작으로 세션 종료를 시작한다.

### 관찰 포인트

헤더는 보호 화면 본문을 밀어내거나 가리지 않아야 한다. 로그아웃 버튼은 화면 상단에서 명확한 접근 이름을 가져야 한다.
        `.trim(),
      },
    },
  },
}
