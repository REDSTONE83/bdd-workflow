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
    docs: {
      description: {
        component: `
### 화면 책임

\`/signup\` 경로에서 신규 사용자가 이름, 이메일, 비밀번호를 입력해 계정을 만들 수 있게 한다.

### 주요 요소

- 이름, 이메일, 비밀번호 입력
- 입력 항목 검증 안내
- 중복 이메일 서버 거절 경고 안내
- 가입 제출 버튼
- 가입 성공 후 로그인 화면 이동 콜백

        `.trim(),
      },
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
        story: `
### 화면 목적

\`/signup\`으로 진입했을 때 신규 사용자가 계정 생성을 시작하는 화면이다.

### 사용자 흐름

1. 사용자는 이름, 이메일, 비밀번호를 입력한다.
2. 회원 가입 버튼을 누른다.
3. 입력 오류가 있으면 각 입력 아래 안내를 확인하고 수정한다.
4. 제출이 성공하면 로그인 화면으로 이동하는 흐름을 기대한다.

### 관찰 포인트

Storybook 안에서 직접 입력해 브라우저 쪽 검증과 제출 중 상태를 확인할 수 있다. 서버 중복 이메일 거절은 별도 스토리에서 고정한다.
        `.trim(),
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
        story: `
### 상태 설명

값을 아직 입력하지 않은 가입 초기 화면이다.

### 사용자 흐름

사용자는 첫 입력부터 값을 채우며 가입 절차를 시작한다.

### 관찰 포인트

첫 번째 입력에 자동 포커스가 있고, 필수 입력이 비어 있어도 제출 전에는 오류가 먼저 노출되지 않는지 확인한다.
        `.trim(),
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
        story: `
### 상태 설명

빈 폼으로 회원 가입을 시도해 각 입력 아래에 안내가 표시된 상태다.

### 사용자 흐름

1. 사용자는 회원 가입 버튼을 누른다.
2. 이름, 이메일, 비밀번호 입력 아래 오류를 확인한다.
3. 같은 화면에서 값을 수정한다.

### 관찰 포인트

브라우저 쪽 검증 오류는 입력 항목 안내로 남는다. 오류가 양식 전체 경고 안내로 뭉치거나 원시 검증 코드처럼 보이지 않아야 한다.
        `.trim(),
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
        story: `
### 상태 설명

정상 정보를 입력해 제출한 뒤 서버 응답을 기다리는 상태다.

### 사용자 흐름

1. 사용자는 유효한 이름, 이메일, 비밀번호를 입력한다.
2. 회원 가입 버튼을 누른다.
3. 응답이 올 때까지 중복 제출을 시도할 수 없다.

### 관찰 포인트

회원 가입 버튼은 비활성화와 처리 중 상태를 드러내야 한다. 제출 중에도 사용자가 입력한 값이 화면에서 안정적으로 유지되는지 확인한다.
        `.trim(),
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
        story: `
### 상태 설명

서버가 이미 등록된 이메일로 거절해 양식 상단 경고 안내가 표시된 상태다.

### 사용자 흐름

1. 사용자는 중복 이메일 안내를 읽는다.
2. 본인 계정이면 로그인 화면으로 이동하거나 다른 이메일로 다시 시도한다.
3. 비밀번호는 다시 입력한다.

### 관찰 포인트

거절 안내는 양식 전체 경고 안내로 남고, 비밀번호 입력은 비워져야 한다. 이메일 입력은 사용자가 수정할 수 있도록 유지된다.
        `.trim(),
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
        story: `
### 상태 설명

가입에 성공해 \`onNavigateAfterSuccess\` 콜백이 호출되는 상태다.

### 사용자 흐름

1. 사용자는 유효한 가입 정보를 제출한다.
2. 서버 성공 응답 후 로그인 화면으로 이동한다.
3. 이동한 로그인 화면에서 가입 완료 안내를 확인한다.

### 관찰 포인트

이 story는 콜백 호출까지 고정한다. 구현 단계의 실제 이동과 가입 완료 안내는 \`Routes/LoginPage/Signup Completed Notice\`에서 확인한다.
        `.trim(),
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
