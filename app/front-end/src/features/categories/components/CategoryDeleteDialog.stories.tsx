import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within } from "storybook/test"

import { CategoryDeleteDialog } from "./CategoryDeleteDialog"

const noop = () => {}
const okConfirm = async (): Promise<void> => {}
const hangingConfirm = (): Promise<void> => new Promise(() => {})

const meta = {
  title: "Categories/CategoryDeleteDialog",
  component: CategoryDeleteDialog,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-019"],
    },
  },
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: noop,
    categoryName: "업무",
    onConfirm: okConfirm,
  },
} satisfies Meta<typeof CategoryDeleteDialog>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "삭제 확인 모달. 묶였던 할 일이 미분류로 바뀐다는 설명을 함께 보여준다. 영향 건수는 표시하지 않는다.",
      },
    },
  },
}

export const Submitting: Story = {
  args: { onConfirm: hangingConfirm },
  parameters: {
    docs: {
      description: {
        story: "삭제를 확정한 뒤 응답을 기다리는 동안 삭제 버튼이 비활성화되는 상태.",
      },
    },
  },
  play: async () => {
    const body = within(document.body)
    await userEvent.click(body.getByRole("button", { name: "삭제" }))
  },
}
