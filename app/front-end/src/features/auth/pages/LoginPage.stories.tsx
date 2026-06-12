import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter, useLocation } from "react-router-dom"
import { expect, userEvent, within } from "storybook/test"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated"

import { LoginPage } from "./LoginPage"

const unauthenticatedAuth: AuthContextValue = {
  state: { status: "unauthenticated" },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const authenticatedAuth: AuthContextValue = {
  state: {
    status: "authenticated",
    user: { id: "user-1", email: "user@example.com" },
  },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const pendingLoginAuth: AuthContextValue = {
  ...unauthenticatedAuth,
  login: () => new Promise(() => {}),
}

const rejectedLoginAuth: AuthContextValue = {
  ...unauthenticatedAuth,
  login: async () => {
    throw new Error("invalid credentials")
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
  tags: ["autodocs", "test"],
  // Router 는 meta 데코레이터 하나만 둔다. 스토리별 진입 경로는 parameters.initialEntries 로 주입한다.
  // (스토리 레벨에 두 번째 MemoryRouter 데코레이터를 더하면 Router 가 중첩되어 react-router 가 오류를 던진다.)
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={parameters.initialEntries ?? ["/login"]}>
        <AuthContext.Provider value={parameters.auth ?? unauthenticatedAuth}>
          <Story />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LoginPage>

export default meta

type Story = StoryObj<typeof meta>

const assertInitialLogin = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole("heading", { name: "로그인" })).toBeVisible()
  await expect(canvas.getByLabelText("이메일")).toHaveFocus()
  await expect(canvas.getByLabelText("비밀번호")).toHaveAttribute("type", "password")
  await expect(canvas.getByRole("button", { name: "로그인" })).toBeVisible()
  await expect(canvas.getByRole("link", { name: /가입하기/ })).toBeVisible()
}

const assertEmptyErrors = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getByRole("button", { name: "로그인" }))
  await expect(canvas.getByText("이메일을 입력해 주세요.")).toBeVisible()
  await expect(canvas.getByText("비밀번호를 입력해 주세요.")).toBeVisible()
}

const assertEmailFormatError = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await userEvent.type(canvas.getByLabelText("이메일"), "not-email")
  await userEvent.type(canvas.getByLabelText("비밀번호"), "Password123!")
  await userEvent.click(canvas.getByRole("button", { name: "로그인" }))
  await expect(canvas.getByText("이메일 형식으로 입력해 주세요.")).toBeVisible()
}

const assertSubmitWith = (email: string, password: string, expectedPath?: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText("이메일"), email)
    await userEvent.type(canvas.getByLabelText("비밀번호"), password)
    await userEvent.click(canvas.getByRole("button", { name: "로그인" }))
    if (expectedPath) {
      await expect(canvas.getByLabelText("현재 경로")).toHaveTextContent(expectedPath)
    }
  }

const assertPendingSubmitWith = (email: string, password: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText("이메일"), email)
    await userEvent.type(canvas.getByLabelText("비밀번호"), password)
    await userEvent.click(canvas.getByRole("button", { name: "로그인" }))
    await expect(canvas.getByRole("button", { name: "로그인 중..." })).toBeDisabled()
  }

const assertPasswordToggle = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  const password = canvas.getByLabelText("비밀번호")
  await userEvent.type(password, "Password123!")
  await expect(password).toHaveAttribute("type", "password")
  await userEvent.click(canvas.getByRole("button", { name: "비밀번호 보이기" }))
  await expect(password).toHaveAttribute("type", "text")
  await expect(canvas.getByRole("button", { name: "비밀번호 가리기" })).toHaveAttribute("aria-pressed", "true")
}

const assertEnterSubmit = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await userEvent.type(canvas.getByLabelText("이메일"), "user@example.com")
  await userEvent.type(canvas.getByLabelText("비밀번호"), "Password123!")
  await userEvent.keyboard("{Enter}")
  await expect(canvas.getByRole("button", { name: "로그인 중..." })).toBeDisabled()
}

const assertLoginFailure = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await userEvent.type(canvas.getByLabelText("이메일"), "user@example.com")
  await userEvent.type(canvas.getByLabelText("비밀번호"), "WrongPassword123!")
  await userEvent.click(canvas.getByRole("button", { name: "로그인" }))
  await expect(await canvas.findByText("로그인 정보를 확인해 주세요")).toBeVisible()
  await expect(canvas.getByLabelText("이메일")).toHaveValue("user@example.com")
  await expect(canvas.getByLabelText("비밀번호")).toHaveValue("")
}

const assertAlreadyAuthenticated = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByLabelText("현재 경로")).toHaveTextContent("/todos")
}

const assertSignupCompletedNotice = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByText("회원 가입이 완료되었습니다")).toBeVisible()
  await expect(canvas.getByText("이제 이메일과 비밀번호로 로그인해 주세요.")).toBeVisible()
  await expect(canvas.getByLabelText("현재 경로")).toHaveTextContent("/login")
}

export const RouteLogin: Story = {
  parameters: {
    harness: {
      requirements: ["REQ-005", "REQ-011"],
      covers: [
        "애플리케이션 기본 앱 셸이 표시된다",
        "데스크톱 화면에서 앱 셸의 핵심 요소가 화면 밖으로 넘치지 않는다",
        "자동 접근성 검사에서 위반이 없어야 한다",
        "로그인 화면은 화면 가운데에 하나의 로그인 카드를 표시하고, 카드는 이메일 입력, 비밀번호 입력, 로그인 버튼으로 구성된다",
        "로그인 카드 하단에는 가입 화면으로 이동하는 텍스트 링크가 있다",
        "로그인 화면을 열면 이메일 입력에 자동으로 입력 포커스가 간다",
        "로그인 화면의 비밀번호 입력은 처음에는 입력값이 화면에 그대로 보이지 않게 가려진다",
      ],
    },
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
  play: assertInitialLogin,
}

export const PasswordVisible: Story = {
  parameters: {
    harness: {
      covers: [
        "로그인 화면의 비밀번호 입력 옆에는 입력값을 보이거나 다시 가릴 수 있는 토글 버튼이 있다",
        "비밀번호 토글을 보이기로 바꾸면 입력값이 화면에 그대로 보이고, 다시 가리기로 바꾸면 다시 가려진다",
        "비밀번호 토글은 키보드로 조작할 수 있고, 현재 보이기와 가리기 상태가 보조 기술에 안내된다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

비밀번호 값을 입력한 뒤 보이기 토글을 눌러 입력값을 확인할 수 있는 상태다.

### 사용자 흐름

사용자는 비밀번호 입력 옆 토글을 눌러 입력값 표시 여부를 바꾼다.

### 관찰 포인트

토글은 버튼으로 노출되고 현재 상태가 보조 기술에 전달되어야 한다.
        `.trim(),
      },
    },
  },
  play: assertPasswordToggle,
}

export const FieldErrors: Story = {
  parameters: {
    harness: {
      covers: [
        "이메일을 비워둔 채 로그인을 시도하면 이메일 입력 아래에 입력이 필요하다는 안내가 보인다",
        "비밀번호를 비워둔 채 로그인을 시도하면 비밀번호 입력 아래에 입력이 필요하다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

빈 입력으로 로그인을 시도해 이메일과 비밀번호 입력 아래에 안내가 표시된 상태다.

### 사용자 흐름

사용자는 각 입력 아래 오류를 확인하고 같은 폼에서 값을 보완한다.

### 관찰 포인트

필수 입력 오류는 폼 상단 공통 경고가 아니라 각 입력 항목 아래에 표시되어야 한다.
        `.trim(),
      },
    },
  },
  play: assertEmptyErrors,
}

export const EmailFormatError: Story = {
  parameters: {
    harness: {
      covers: [
        "이메일 형식이 아닌 값을 입력하고 로그인을 시도하면 이메일 입력 아래에 형식 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

이메일 형식이 아닌 값으로 로그인을 시도해 이메일 입력 아래에 형식 안내가 표시된 상태다.

### 사용자 흐름

사용자는 이메일 입력값을 올바른 형식으로 고친 뒤 다시 로그인을 시도한다.

### 관찰 포인트

형식 오류는 이메일 입력과 연결되고 비밀번호 입력값은 유지되어야 한다.
        `.trim(),
      },
    },
  },
  play: assertEmailFormatError,
}

export const EnterSubmit: Story = {
  parameters: {
    auth: pendingLoginAuth,
    harness: {
      covers: [
        "키보드 Enter 입력으로 로그인을 제출할 수 있다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

키보드 Enter 입력으로 로그인 제출이 시작된 상태다.

### 사용자 흐름

사용자는 입력을 채운 뒤 마우스 대신 Enter 키로 폼을 제출한다.

### 관찰 포인트

제출 후 버튼은 대기 상태로 바뀌어야 한다.
        `.trim(),
      },
    },
  },
  play: assertEnterSubmit,
}

export const Submitting: Story = {
  parameters: {
    auth: pendingLoginAuth,
    harness: {
      covers: [
        "로그인 버튼을 누른 뒤 응답을 기다리는 동안 로그인 버튼은 다시 누를 수 없는 상태로 표시된다",
        "로그인 응답을 기다리는 동안 같은 폼을 다시 제출해도 추가 로그인 요청이 서버로 전송되지 않는다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

정상 입력으로 로그인을 제출한 뒤 인증 응답을 기다리는 상태다.

### 사용자 흐름

사용자는 응답이 끝날 때까지 같은 폼을 다시 제출할 수 없다.

### 관찰 포인트

로그인 버튼은 비활성화와 처리 중 상태를 표시해야 한다.
        `.trim(),
      },
    },
  },
  play: assertPendingSubmitWith("user@example.com", "Password123!"),
}

export const LoginFailure: Story = {
  parameters: {
    auth: rejectedLoginAuth,
    harness: {
      covers: [
        "로그인 화면에서 인증에 실패하면 폼 상단에 어느 쪽이 잘못됐는지 구분하지 않는 공통 안내가 보이고, 입력했던 이메일은 그대로 유지되며 비밀번호 입력은 비워진다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

서버 인증 실패로 폼 상단 공통 안내가 표시된 상태다.

### 사용자 흐름

사용자는 이메일 또는 비밀번호가 잘못되었을 수 있음을 확인하고 비밀번호를 다시 입력한다.

### 관찰 포인트

안내는 어느 필드가 틀렸는지 특정하지 않아야 하며 이메일은 유지되어야 한다.
        `.trim(),
      },
    },
  },
  play: assertLoginFailure,
}

export const RedirectAfterLogin: Story = {
  parameters: {
    initialEntries: ["/login?loginRedirect=/categories"],
    harness: {
      covers: [
        "로그인 화면에서 인증에 성공하면 원래 가려고 했던 보호 화면이 있으면 그 화면으로, 없으면 자신의 할 일 목록 화면으로 이동한다",
        "비인증 사용자가 보호 화면에 접근했다가 로그인에 성공하면 원래 가려고 했던 보호 화면으로 돌아온다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

보호 화면 진입 후 로그인으로 돌아온 사용자가 인증에 성공해 원래 보호 화면으로 이동하는 흐름이다.

### 사용자 흐름

사용자는 로그인 성공 후 기본 화면이 아니라 원래 요청했던 보호 화면으로 돌아간다.

### 관찰 포인트

신뢰 가능한 보호 경로만 이동 대상으로 인정되어야 한다.
        `.trim(),
      },
    },
  },
  play: assertSubmitWith("user@example.com", "Password123!", "/categories"),
}

export const RedirectAfterLoginToTodos: Story = {
  parameters: {
    initialEntries: ["/login?loginRedirect=/todos"],
    harness: {
      requirements: ["REQ-023"],
      covers: [
        "할 일 화면 경로로 진입했다가 로그인하면 할 일 화면으로 돌아온다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

할 일 화면 진입 후 로그인으로 돌아온 사용자가 인증에 성공해 할 일 화면으로 이동하는 흐름이다.

### 사용자 흐름

사용자는 로그인 성공 후 기본 화면이 아니라 원래 요청했던 할 일 화면으로 돌아간다.

### 관찰 포인트

로그인 redirect는 할 일 보호 경로를 신뢰 대상으로 인정해야 한다.
        `.trim(),
      },
    },
  },
  play: assertSubmitWith("user@example.com", "Password123!", "/todos"),
}

export const UnsafeRedirectIgnored: Story = {
  parameters: {
    initialEntries: ["/login?loginRedirect=https%3A%2F%2Fevil.example"],
    harness: {
      covers: [
        "로그인 성공 후 이동 대상이 본 애플리케이션의 보호 라우트 경로가 아니거나 외부 사이트로 가는 값이면 그 값은 무시되고 할 일 목록 화면으로 이동한다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

비신뢰 loginRedirect 값이 들어온 로그인 화면이다.

### 사용자 흐름

사용자는 로그인에 성공해도 외부 주소가 아니라 기본 보호 화면으로 이동한다.

### 관찰 포인트

외부 URL 또는 허용되지 않은 내부 경로는 무시되어야 한다.
        `.trim(),
      },
    },
  },
  play: assertSubmitWith("user@example.com", "Password123!", "/todos"),
}

export const AlreadyAuthenticated: Story = {
  parameters: {
    auth: authenticatedAuth,
    harness: {
      covers: [
        "이미 인증된 사용자가 로그인 화면에 접근하면 할 일 목록 화면으로 이동한다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

이미 인증된 사용자가 로그인 경로에 진입한 상태다.

### 사용자 흐름

사용자는 로그인 폼을 다시 보지 않고 기본 보호 화면으로 이동한다.

### 관찰 포인트

이 story는 인증 상태별 공개 화면 접근 정책을 문서화한다.
        `.trim(),
      },
    },
  },
  render: () => (
    <RedirectIfAuthenticated>
      <LoginPage />
    </RedirectIfAuthenticated>
  ),
  play: assertAlreadyAuthenticated,
}

export const SignupCompletedNotice: Story = {
  name: "Signup Completed Notice",
  parameters: {
    // meta 데코레이터가 이 진입 경로로 MemoryRouter 를 구성한다. 별도 Router 데코레이터를 더하지 않는다.
    initialEntries: ["/login?signupCompleted=1"],
    // 회원 가입 성공 후 /login 으로 이동했을 때의 안내 상태는 REQ-001 책임이다.
    harness: {
      requirements: ["REQ-001"],
      covers: [
        "회원 가입에 성공해 `/login`으로 이동하면 가입이 완료되었다는 안내가 보인다",
      ],
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
  play: assertSignupCompletedNotice,
}
