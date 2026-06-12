import type { Meta, StoryObj } from "@storybook/react-vite"

import { Label } from "./label"
import { Textarea } from "./textarea"

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-017", "REQ-018"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

설명처럼 여러 줄 텍스트를 입력하는 필드를 제품 화면에서 일관된 크기와 상태로 표현한다.

### 주요 상태

- 기본 입력
- 입력 항목 오류
- 비활성화

### 관찰 포인트

여러 줄 입력은 이름과 연결되어야 하며, 긴 값과 오류 문구가 양식 배치를 밀어내지 않는지 확인한다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

선택 설명 입력으로 쓰는 기본 여러 줄 입력 상태다.

### 관찰 포인트

자리표시자는 입력 예시만 제공한다. 입력 이름과 입력 영역의 간격, 기본 높이, 포커스 표시를 확인한다.
        `.trim(),
      },
    },
  },
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label htmlFor="textarea-default">설명</Label>
      <Textarea id="textarea-default" placeholder="카테고리 설명 (선택)" />
    </div>
  ),
}

export const WithError: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

설명 값이 길이 제한을 초과해 입력 항목 오류가 표시된 상태다.

### 관찰 포인트

오류 문구는 여러 줄 입력 바로 아래에 남아야 한다. 긴 오류 문구가 대화상자 폭을 밀어내지 않는지 확인한다.
        `.trim(),
      },
    },
  },
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label htmlFor="textarea-error">설명</Label>
      <Textarea
        id="textarea-error"
        aria-invalid
        defaultValue="너무 긴 설명 예시..."
      />
      <p className="text-sm text-destructive">설명은 500자를 넘을 수 없습니다.</p>
    </div>
  ),
}

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

제출 중이거나 수정할 수 없는 설명 입력 상태다.

### 관찰 포인트

값은 보이지만 수정되지 않아야 한다. 비활성 스타일이 입력 이름과 함께 상태를 자연스럽게 전달하는지 확인한다.
        `.trim(),
      },
    },
  },
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label htmlFor="textarea-disabled">설명</Label>
      <Textarea id="textarea-disabled" disabled defaultValue="수정 중..." />
    </div>
  ),
}
