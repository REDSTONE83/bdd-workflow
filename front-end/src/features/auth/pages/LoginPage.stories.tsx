import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"

import { LoginPage } from "./LoginPage"

const unauthenticatedAuth: AuthContextValue = {
  state: { status: "unauthenticated" },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const meta = {
  title: "Routes/LoginPage",
  component: LoginPage,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-011"],
    },
  },
  tags: ["autodocs"],
  // Router 는 meta 데코레이터 하나만 둔다. 스토리별 진입 경로는 parameters.initialEntries 로 주입한다.
  // (스토리 레벨에 두 번째 MemoryRouter 데코레이터를 더하면 Router 가 중첩되어 react-router 가 오류를 던진다.)
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={parameters.initialEntries ?? ["/login"]}>
        <AuthContext.Provider value={unauthenticatedAuth}>
          <Story />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LoginPage>

export default meta

type Story = StoryObj<typeof meta>

export const RouteLogin: Story = {}

export const SignupCompletedNotice: Story = {
  name: "Signup Completed Notice",
  parameters: {
    // meta 데코레이터가 이 진입 경로로 MemoryRouter 를 구성한다. 별도 Router 데코레이터를 더하지 않는다.
    initialEntries: ["/login?signupCompleted=1"],
    // 회원 가입 성공 후 /login 으로 이동했을 때의 안내 상태는 REQ-013 책임이다.
    harness: {
      requirements: ["REQ-013"],
    },
    docs: {
      description: {
        story:
          "회원 가입 성공 후 /login?signupCompleted=1 로 이동해 왔을 때 로그인 카드 상단에 가입 완료 안내가 표시되는 상태. 안내 표시 후 쿼리는 history replace 로 정리된다.",
      },
    },
  },
}
