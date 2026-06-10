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
    docs: {
      description: {
        component: `
### 화면 책임

\`/login\` 경로에서 인증되지 않은 사용자가 이메일과 비밀번호로 로그인할 수 있게 한다.

### 주요 요소

- 이메일과 비밀번호 입력
- 로그인 제출 버튼
- 인증 실패 또는 안내 경고
- 회원 가입 성공 후 진입했을 때의 완료 안내

        `.trim(),
      },
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

export const RouteLogin: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 화면 목적

\`/login\`으로 진입했을 때 인증되지 않은 사용자가 로그인을 시작하는 화면이다.

### 사용자 흐름

1. 사용자는 이메일과 비밀번호를 입력한다.
2. 로그인 버튼을 눌러 인증을 요청한다.
3. 성공하면 원래 가려던 보호 화면 또는 기본 보호 화면으로 이동한다.

### 관찰 포인트

기본 진입 상태에서는 가입 완료 안내가 보이지 않아야 한다. 비인증 사용자가 보호 경로로 들어가기 전 거치는 첫 화면으로 배치가 안정적인지 확인한다.
        `.trim(),
      },
    },
  },
}

export const SignupCompletedNotice: Story = {
  name: "Signup Completed Notice",
  parameters: {
    // meta 데코레이터가 이 진입 경로로 MemoryRouter 를 구성한다. 별도 Router 데코레이터를 더하지 않는다.
    initialEntries: ["/login?signupCompleted=1"],
    // 회원 가입 성공 후 /login 으로 이동했을 때의 안내 상태는 REQ-001 책임이다.
    harness: {
      requirements: ["REQ-001"],
    },
    docs: {
      description: {
        story: `
### 상태 설명

회원 가입 성공 후 \`/login?signupCompleted=1\`로 이동해 로그인 카드 상단에 가입 완료 안내가 표시된 상태다.

### 사용자 흐름

1. 사용자는 가입 완료 안내를 확인한다.
2. 방금 만든 계정 이메일과 비밀번호로 로그인한다.
3. 안내가 중복 표시되지 않도록 주소의 조회 조건 정리 흐름을 기대한다.

### 관찰 포인트

이 상태는 가입 요건 \`REQ-001\`의 후속 안내 책임이다. 안내 표시 후 주소의 조회 조건은 방문 기록 교체로 정리되어 새로고침이나 재진입 때 반복 안내가 생기지 않아야 한다.
        `.trim(),
      },
    },
  },
}
