import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within } from "storybook/test"

import { TodoDeleteDialog } from "./TodoDeleteDialog"

const noop = () => {}
const okConfirm = async (): Promise<void> => {}
const hangingConfirm = (): Promise<void> => new Promise(() => {})
const failingConfirm = async (): Promise<void> => {
  throw new Error("delete failed")
}

const meta = {
  title: "Todos/TodoDeleteDialog",
  component: TodoDeleteDialog,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-025"],
    },
  },
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: noop,
    todoTitle: "분기 보고서 초안",
    onConfirm: okConfirm,
  },
} satisfies Meta<typeof TodoDeleteDialog>

export default meta

type Story = StoryObj<typeof meta>

const confirmDelete = async () => {
  const body = within(document.body)
  await userEvent.click(body.getByRole("button", { name: "삭제" }))
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "할 일 삭제 확인 대화상자. 삭제하면 목록에서 사라지고 되돌릴 수 없다는 안내를 보여준다.",
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
  play: confirmDelete,
}

export const DeleteFailure: Story = {
  args: { onConfirm: failingConfirm },
  parameters: {
    docs: {
      description: {
        story:
          "삭제 요청이 실패했을 때 같은 대화상자 안에 실패 안내가 표시되고 다시 시도할 수 있는 상태.",
      },
    },
  },
  play: confirmDelete,
}
