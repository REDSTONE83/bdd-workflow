import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"
import { userEvent, within } from "storybook/test"

import { SignupPage, type SignupResult } from "./SignupPage"

const noop = () => {}
const okSubmit = async (): Promise<SignupResult> => ({ status: "ok" })
const duplicateSubmit = async (): Promise<SignupResult> => ({
  status: "duplicate-email",
})
const hangingSubmit = (): Promise<SignupResult> => new Promise(() => {})

const meta = {
  title: "Routes/SignupPage",
  component: SignupPage,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-001"],
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/signup"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof SignupPage>

export default meta

type Story = StoryObj<typeof meta>

export const RouteSignup: Story = {
  name: "Route /signup",
  parameters: {
    docs: {
      description: {
        story:
          "/signup 진입 화면. Storybook 안에서 직접 입력해 클라이언트 검증과 제출 흐름을 확인할 수 있다.",
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
  },
}

export const Initial: Story = {
  parameters: {
    docs: {
      description: {
        story: "값을 아직 입력하지 않은 초기 화면.",
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
  },
}

export const FieldErrors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "빈 폼으로 회원 가입을 시도했을 때 각 입력 아래에 안내가 표시되는 상태.",
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "회원 가입" }))
  },
}

export const Submitting: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "정상 정보를 입력해 제출한 뒤 서버 응답을 기다리는 동안 회원 가입 버튼이 비활성화되는 상태.",
      },
    },
  },
  args: {
    onSubmit: hangingSubmit,
    onNavigateAfterSuccess: noop,
    defaultValues: {
      name: "홍길동",
      email: "hong@example.com",
      password: "Password123!",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "회원 가입" }))
  },
}

export const ServerRejectionDuplicateEmail: Story = {
  name: "ServerRejection — Duplicate Email",
  parameters: {
    docs: {
      description: {
        story:
          "서버가 이미 등록된 이메일로 거절했을 때 폼 상단 안내가 보이고 비밀번호 입력이 비워지는 상태.",
      },
    },
  },
  args: {
    onSubmit: duplicateSubmit,
    onNavigateAfterSuccess: noop,
    defaultValues: {
      name: "홍길동",
      email: "exists@example.com",
      password: "Password123!",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "회원 가입" }))
  },
}

export const Success: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "가입에 성공해 onNavigateAfterSuccess 콜백이 호출되는 상태. 구현 단계에서는 /login?signupCompleted=1 로 이동한다.",
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
    defaultValues: {
      name: "홍길동",
      email: "newuser@example.com",
      password: "Password123!",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "회원 가입" }))
  },
}
