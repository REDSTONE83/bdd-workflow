import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"
import { expect, fn, userEvent, within } from "storybook/test"

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
  tags: ["autodocs", "test"],
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

const assertRouteSignup = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole("heading", { name: "회원 가입" })).toBeVisible()
  await expect(canvas.getByLabelText("사용자 이름")).toBeVisible()
  await expect(canvas.getByLabelText("이메일")).toBeVisible()
  await expect(canvas.getByLabelText("비밀번호")).toBeVisible()
  await expect(canvas.getByRole("button", { name: "회원 가입" })).toBeVisible()
  await expect(canvas.getByRole("link", { name: /로그인/ })).toBeVisible()
}

const assertSignupErrors = (expectedMessages: string[]) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "회원 가입" }))
    for (const message of expectedMessages) {
      await expect(canvas.getByText(message)).toBeVisible()
    }
  }

const assertSignupSubmitting = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getByRole("button", { name: "회원 가입" }))
  await expect(canvas.getByRole("button", { name: "가입 처리 중..." })).toBeDisabled()
}

const assertDuplicateEmail = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getByRole("button", { name: "회원 가입" }))
  await expect(await canvas.findByText("이미 등록된 이메일입니다")).toBeVisible()
  await expect(canvas.getByLabelText("사용자 이름")).toHaveValue("홍길동")
  await expect(canvas.getByLabelText("이메일")).toHaveValue("exists@example.com")
  await expect(canvas.getByLabelText("비밀번호")).toHaveValue("")
}

const assertSignupSuccess = async ({
  args,
  canvasElement,
}: {
  args: { onNavigateAfterSuccess?: () => void }
  canvasElement: HTMLElement
}) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getByRole("button", { name: "회원 가입" }))
  await expect(args.onNavigateAfterSuccess).toHaveBeenCalled()
}

export const RouteSignup: Story = {
  name: "Route /signup",
  parameters: {
    harness: {
      covers: [
        "`/signup` 경로에 접근하면 사용자 이름, 이메일, 비밀번호를 입력하고 회원 가입을 제출할 수 있는 화면이 보인다",
        "회원 가입 화면은 화면 가운데에 하나의 회원 가입 카드를 표시하고, 카드는 제목, 사용자 이름 입력, 이메일 입력, 비밀번호 입력, 회원 가입 버튼, 로그인 화면으로 돌아가는 링크로 구성된다",
        "회원 가입 화면에는 로그인 화면으로 돌아갈 수 있는 링크가 있다",
        "데스크톱 화면에서 회원 가입 카드의 주요 입력과 버튼이 화면 밖으로 넘치지 않는다",
        "회원 가입 화면은 자동 접근성 검사에서 위반이 없어야 한다",
      ],
    },
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
  play: assertRouteSignup,
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
    harness: {
      covers: [
        "사용자 이름, 이메일 또는 비밀번호를 비워 둔 채 회원 가입을 시도하면 해당 입력 아래에 입력이 필요하다는 안내가 보인다",
      ],
    },
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
  play: assertSignupErrors([
    "사용자 이름을 입력해 주세요.",
    "이메일을 입력해 주세요.",
    "비밀번호를 입력해 주세요.",
  ]),
}

export const NameTooLongError: Story = {
  parameters: {
    harness: {
      covers: [
        "사용자 이름이 100자를 초과하면 사용자 이름이 너무 길다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

이름이 100자를 초과한 상태로 회원 가입을 시도해 이름 입력 아래에 길이 안내가 표시된 상태다.

### 사용자 흐름

사용자는 이름을 줄인 뒤 같은 화면에서 다시 가입을 시도한다.

### 관찰 포인트

길이 오류는 이름 입력과 연결되어야 하며, 이메일과 비밀번호 입력 상태는 유지되어야 한다.
        `.trim(),
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
    defaultValues: {
      name: "가".repeat(101),
      email: "hong@example.com",
      password: "Password123!",
    },
  },
  play: assertSignupErrors(["사용자 이름은 100자 이하여야 합니다."]),
}

export const EmailFormatError: Story = {
  parameters: {
    harness: {
      covers: [
        "이메일 형식이 아닌 값을 입력하고 회원 가입을 시도하면 이메일 입력 아래에 형식 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

이메일 형식이 아닌 값으로 회원 가입을 시도해 이메일 입력 아래에 형식 안내가 표시된 상태다.

### 사용자 흐름

사용자는 이메일 형식을 고친 뒤 같은 화면에서 다시 가입을 시도한다.

### 관찰 포인트

형식 오류는 이메일 입력과 연결되어야 하며 다른 입력값은 유지되어야 한다.
        `.trim(),
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
    defaultValues: {
      name: "홍길동",
      email: "not-email",
      password: "Password123!",
    },
  },
  play: assertSignupErrors(["이메일 형식으로 입력해 주세요."]),
}

export const PasswordTooShortError: Story = {
  parameters: {
    harness: {
      covers: [
        "비밀번호가 8자 미만이면 비밀번호가 너무 짧다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

비밀번호가 8자 미만인 상태로 회원 가입을 시도해 비밀번호 입력 아래에 길이 안내가 표시된 상태다.

### 사용자 흐름

사용자는 비밀번호를 보강한 뒤 같은 화면에서 다시 가입을 시도한다.

### 관찰 포인트

비밀번호 오류는 입력 아래에 표시되고, 다른 입력값은 그대로 유지되어야 한다.
        `.trim(),
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
    defaultValues: {
      name: "홍길동",
      email: "hong@example.com",
      password: "short",
    },
  },
  play: assertSignupErrors(["비밀번호는 8자 이상이어야 합니다."]),
}

export const PasswordInvalidCharacterError: Story = {
  parameters: {
    harness: {
      covers: [
        "비밀번호가 72자를 초과하거나 허용되지 않는 문자를 포함하면 사용할 수 없는 비밀번호라는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

허용되지 않는 문자가 포함된 비밀번호로 회원 가입을 시도해 사용할 수 없다는 안내가 표시된 상태다.

### 사용자 흐름

사용자는 허용되는 문자만 사용해 비밀번호를 다시 입력한다.

### 관찰 포인트

보안 입력의 실제 값은 화면에 드러나지 않고, 오류 안내만 입력과 연결되어야 한다.
        `.trim(),
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
    defaultValues: {
      name: "홍길동",
      email: "hong@example.com",
      password: "Password123!한",
    },
  },
  play: assertSignupErrors(["사용할 수 없는 비밀번호입니다."]),
}

export const PasswordTooLongError: Story = {
  parameters: {
    harness: {
      covers: [
        "비밀번호가 72자를 초과하거나 허용되지 않는 문자를 포함하면 사용할 수 없는 비밀번호라는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: `
### 상태 설명

72자를 초과한 비밀번호로 회원 가입을 시도해 사용할 수 없다는 안내가 표시된 상태다.

### 사용자 흐름

사용자는 비밀번호 길이를 줄인 뒤 같은 화면에서 다시 가입을 시도한다.

### 관찰 포인트

길이 제한은 서버 요청 전에 입력 항목 안내로 확인되어야 한다.
        `.trim(),
      },
    },
  },
  args: {
    onSubmit: okSubmit,
    onNavigateAfterSuccess: noop,
    defaultValues: {
      name: "홍길동",
      email: "hong@example.com",
      password: "A".repeat(73),
    },
  },
  play: assertSignupErrors(["사용할 수 없는 비밀번호입니다."]),
}

export const Submitting: Story = {
  parameters: {
    harness: {
      covers: [
        "회원 가입 버튼을 누른 뒤 응답을 기다리는 동안 회원 가입 버튼은 다시 누를 수 없는 상태로 표시된다",
        "회원 가입 응답을 기다리는 동안 같은 폼을 다시 제출해도 추가 회원 가입 요청이 서버로 전송되지 않는다",
      ],
    },
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
  play: assertSignupSubmitting,
}

export const ServerRejectionDuplicateEmail: Story = {
  name: "ServerRejection — Duplicate Email",
  parameters: {
    harness: {
      covers: [
        "이미 등록된 이메일로 회원 가입이 거절되면 중복 이메일 안내가 보이고 입력했던 사용자 이름과 이메일은 유지된다",
        "서버 응답으로 회원 가입이 거절되면 비밀번호 입력은 비워진다",
      ],
    },
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
  play: assertDuplicateEmail,
}

export const Success: Story = {
  parameters: {
    harness: {
      covers: [
        "회원 가입에 성공하면 사용자는 `/login` 화면으로 이동한다",
        "이미 인증된 사용자가 회원 가입 화면에 접근하면 자신의 할 일 목록 화면으로 이동한다",
      ],
    },
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
    onNavigateAfterSuccess: fn(),
    defaultValues: {
      name: "홍길동",
      email: "newuser@example.com",
      password: "Password123!",
    },
  },
  play: assertSignupSuccess,
}
