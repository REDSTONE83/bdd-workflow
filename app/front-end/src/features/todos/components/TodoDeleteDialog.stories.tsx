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
      docs: {
        omitComponentProperties: true,
        omitPrimaryCanvas: true,
      },
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

할 일 삭제처럼 되돌릴 수 없는 작업을 실행하기 전에 사용자의 명시적 확인을 받는다.

### 주요 요소

- 삭제 대상 할 일 제목
- 목록에서 사라지고 되돌릴 수 없다는 결과 설명
- 취소 버튼과 삭제 버튼
- 삭제 실패 시 양식 전체 경고 안내

        `.trim(),
      },
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
        story: `
### 상태 설명

할 일 삭제 확인 대화상자가 열린 초기 상태다.

### 사용자 흐름

1. 사용자는 삭제 대상 제목을 확인한다.
2. 삭제하면 목록에서 사라지고 되돌릴 수 없다는 안내를 읽는다.
3. 취소하거나 삭제 버튼으로 확정한다.

### 관찰 포인트

삭제 버튼은 취소 버튼과 명확히 구분되어야 한다. 사용자가 어떤 항목을 삭제하는지 제목으로 확인할 수 있어야 한다.
        `.trim(),
      },
    },
  },
}

export const Submitting: Story = {
  args: { onConfirm: hangingConfirm },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

삭제를 확정한 뒤 응답을 기다리는 상태다.

### 사용자 흐름

1. 사용자는 삭제 버튼을 누른다.
2. 요청이 끝날 때까지 중복 삭제를 시도할 수 없다.

### 관찰 포인트

삭제 버튼은 비활성화와 처리 중 상태를 드러내야 한다. 진행 중 상태에서 삭제 대상 제목과 결과 설명이 유지되는지 확인한다.
        `.trim(),
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
        story: `
### 상태 설명

삭제 요청이 실패해 같은 확인 대화상자 안에 재시도 안내가 표시된 상태다.

### 사용자 흐름

1. 사용자는 실패 안내를 읽는다.
2. 삭제를 다시 시도하거나 취소로 대화상자를 닫는다.

### 관찰 포인트

실패해도 대화상자는 닫히지 않아야 한다. 오류는 화면 안에 남아 사용자가 재시도와 취소 중 하나를 고를 수 있어야 한다.
        `.trim(),
      },
    },
  },
  play: confirmDelete,
}
