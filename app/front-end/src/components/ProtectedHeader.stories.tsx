import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter, useLocation } from "react-router-dom"
import { expect, userEvent, waitFor, within } from "storybook/test"

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

const logoutFailureAuth: AuthContextValue = {
  ...authenticatedAuth,
  logout: async () => {
    throw new Error("logout failed")
  },
}

function LocationProbe() {
  const location = useLocation()
  return (
    <output aria-label="현재 경로" className="sr-only">
      {location.pathname}
    </output>
  )
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
  tags: ["autodocs", "test"],
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={["/todos"]}>
        <AuthContext.Provider value={parameters.auth ?? authenticatedAuth}>
          <Story />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof ProtectedHeader>

export default meta

type Story = StoryObj<typeof meta>

const assertDefaultHeader = async () => {
  const body = within(document.body)
  await expect(body.getByText("BDD Workflow")).toBeVisible()
  await expect(body.getByRole("button", { name: "사용자 메뉴 열기" })).toHaveTextContent("user@example.com")
}

const assertMenuOpen = async () => {
  const body = within(document.body)
  await userEvent.click(body.getByRole("button", { name: "사용자 메뉴 열기" }))
  await waitFor(() => expect(body.getByRole("menuitem", { name: "로그아웃" })).toBeVisible())
}

const assertLogoutSuccess = async () => {
  const body = within(document.body)
  await userEvent.click(body.getByRole("button", { name: "사용자 메뉴 열기" }))
  await userEvent.click(await body.findByRole("menuitem", { name: "로그아웃" }))
  await expect(body.getByLabelText("현재 경로")).toHaveTextContent("/login")
}

const assertLogoutFailure = async () => {
  const body = within(document.body)
  await userEvent.click(body.getByRole("button", { name: "사용자 메뉴 열기" }))
  await userEvent.click(await body.findByRole("menuitem", { name: "로그아웃" }))
  await expect(await body.findByText("로그아웃을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")).toBeVisible()
  await expect(body.getByLabelText("현재 경로")).toHaveTextContent("/todos")
}

export const Default: Story = {
  parameters: {
    harness: {
      covers: [
        "보호 화면에는 공통 상단 헤더가 있고, 헤더 우측에 현재 사용자의 이메일이 표시된다",
      ],
    },
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
  play: assertDefaultHeader,
}

export const MenuOpen: Story = {
  parameters: {
    harness: {
      covers: [
        "보호 화면 상단 헤더의 사용자 이메일을 선택하면 사용자 메뉴가 펼쳐지고, 그 안에 로그아웃 항목이 있다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

사용자 이메일을 선택해 사용자 메뉴가 열린 상태다.

### 사용자 흐름

사용자는 메뉴에서 로그아웃 항목을 확인하고 세션 종료를 선택할 수 있다.

### 관찰 포인트

메뉴는 헤더 우측 이메일과 연결되어 열리고, 로그아웃 항목의 접근 이름이 명확해야 한다.
        `.trim(),
      },
    },
  },
  play: assertMenuOpen,
}

export const LogoutSuccess: Story = {
  parameters: {
    harness: {
      covers: [
        "사용자 메뉴에서 로그아웃 항목을 선택해 로그아웃 호출이 성공하면 화면에서 사용자 정보가 사라지고 로그인 화면으로 이동한다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

로그아웃 항목 선택이 성공해 로그인 화면 이동을 시작하는 흐름이다.

### 사용자 흐름

사용자는 사용자 메뉴에서 로그아웃을 선택하고 세션 종료 결과를 기다린다.

### 관찰 포인트

성공 흐름은 오류 안내를 남기지 않고 로그인 경로로 이동해야 한다.
        `.trim(),
      },
    },
  },
  play: assertLogoutSuccess,
}

export const LogoutFailure: Story = {
  parameters: {
    auth: logoutFailureAuth,
    harness: {
      covers: [
        "사용자 메뉴에서 로그아웃 항목을 선택해 로그아웃 호출이 실패하면 현재 화면에 그대로 머무르고 상단에 재시도를 안내하는 오류 표시가 노출된다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

로그아웃 요청이 실패해 헤더 아래에 재시도 안내가 표시된 상태다.

### 사용자 흐름

사용자는 실패 안내를 확인하고 잠시 후 다시 로그아웃을 시도한다.

### 관찰 포인트

실패해도 현재 보호 화면 맥락은 유지되어야 한다.
        `.trim(),
      },
    },
  },
  play: assertLogoutFailure,
}
