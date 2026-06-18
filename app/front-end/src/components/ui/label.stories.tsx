import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"
import { Label } from "./label"

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

입력, 선택, 스위치 같은 조작 요소의 의미를 사용자와 보조 기술에 연결한다.

### 주요 상태

- 단독 입력 이름
- 입력과 연결된 입력 이름
- 비활성 조작 요소 맥락

### 관찰 포인트

입력 이름은 대상 입력의 \`id\`와 맞춰야 한다. 자리표시자나 주변 문장이 입력 이름을 대체하지 않는다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
  args: {
    children: "이메일",
    htmlFor: "label-default",
  },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

텍스트 입력 이름만 렌더링된 상태다.

### 관찰 포인트

실제 양식에서는 연결 대상 조작 요소와 함께 사용한다. 텍스트 크기와 줄 높이가 입력 행에 맞는지 확인한다.
        `.trim(),
      },
    },
  },
  render: (args) => <Label {...args} />,
}

export const WithInput: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

이메일 입력과 입력 이름이 연결된 상태다.

### 사용자 흐름

사용자는 입력 이름으로 목적을 파악하고 이메일 값을 입력한다.

### 관찰 포인트

입력 이름을 누르면 입력 포커스로 이어져야 한다. 입력 이름과 입력 사이 간격이 양식 밀도를 해치지 않는지 확인한다.
        `.trim(),
      },
    },
  },
  render: () => (
    <div className="grid w-[320px] gap-2">
      <Label htmlFor="label-with-input">이메일</Label>
      <Input id="label-with-input" type="email" placeholder="name@example.com" />
    </div>
  ),
}
export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

비활성 입력과 입력 이름이 함께 보이는 상태다.

### 관찰 포인트

입력 이름과 조작 요소가 같은 비활성 맥락으로 읽혀야 한다. 값은 보이지만 수정할 수 없다는 상태가 분명해야 한다.
        `.trim(),
      },
    },
  },
  render: () => (
    <div className="grid w-[320px] gap-2" data-disabled="true">
      <Label htmlFor="label-disabled">이메일</Label>
      <Input
        id="label-disabled"
        type="email"
        defaultValue="name@example.com"
        disabled
      />
    </div>
  ),
}
