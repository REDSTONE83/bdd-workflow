import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

단일 행 텍스트, 이메일, 비밀번호 입력을 제품 화면에서 일관된 크기와 상태로 표현한다.

### 주요 상태

- 기본 입력
- 입력 항목 오류와 \`aria-invalid\` 접근성 표시
- 비활성화

### 관찰 포인트

입력은 항상 label 또는 접근 가능한 이름과 연결되어야 한다. 오류 상태는 입력 자체와 오류 문구의 연결이 함께 있어야 완성된다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password"],
    },
  },
  args: {
    placeholder: "텍스트 입력",
    type: "text",
  },
  render: (args) => <Input {...args} className="w-[320px]" />,
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

사용자가 값을 입력하기 전의 기본 입력 상태다.

### 관찰 포인트

자리표시자는 예시일 뿐 입력 이름을 대체하지 않는다. 포커스 표시와 텍스트 높이가 양식 행 안에서 안정적인지 확인한다.
        `.trim(),
      },
    },
  },
}

export const Error: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "invalid@example",
  },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

입력값이 입력 항목 검증을 통과하지 못한 오류 상태다.

### 관찰 포인트

\`aria-invalid\`가 실제 입력에 적용되어야 한다. 업무 화면에서는 이 상태와 함께 입력 아래 오류 문구를 연결한다.
        `.trim(),
      },
    },
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "수정할 수 없는 값",
  },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

사용자가 현재 수정할 수 없는 비활성 입력 상태다.

### 관찰 포인트

비활성 값은 읽히되 수정되지 않아야 한다. 흐린 색만으로 상태를 전달하지 않고 실제 비활성 속성을 사용한다.
        `.trim(),
      },
    },
  },
}
