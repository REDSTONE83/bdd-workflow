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
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label htmlFor="textarea-default">설명</Label>
      <Textarea id="textarea-default" placeholder="카테고리 설명 (선택)" />
    </div>
  ),
}

export const WithError: Story = {
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
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label htmlFor="textarea-disabled">설명</Label>
      <Textarea id="textarea-disabled" disabled defaultValue="수정 중..." />
    </div>
  ),
}
