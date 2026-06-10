import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within } from "storybook/test"

import { CategoryDeleteDialog } from "./CategoryDeleteDialog"

const noop = () => {}
const okConfirm = async (): Promise<void> => {}
const hangingConfirm = (): Promise<void> => new Promise(() => {})
const failingConfirm = async (): Promise<void> => {
  throw new Error("delete failed")
}

const meta = {
  title: "Categories/CategoryDeleteDialog",
  component: CategoryDeleteDialog,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-019"],
      docs: {
        omitComponentProperties: true,
        omitPrimaryCanvas: true,
      },
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

카테고리 삭제처럼 되돌릴 수 없는 작업을 실행하기 전에 사용자의 명시적 확인을 받는다.

### 주요 요소

- 삭제 대상 카테고리 이름
- 연결된 할 일이 미분류로 바뀐다는 결과 설명
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
        story: `
### 상태 설명

삭제 확인 대화상자가 열린 초기 상태다.

### 사용자 흐름

1. 사용자는 삭제 대상 이름을 확인한다.
2. 묶였던 할 일이 미분류로 바뀐다는 설명을 읽는다.
3. 취소하거나 삭제 버튼으로 확정한다.

### 관찰 포인트

영향 건수는 표시하지 않는다. 설명은 결과를 과장하지 않고, 삭제 버튼은 취소 버튼과 명확히 구분되어야 한다.
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

삭제 버튼은 비활성화와 처리 중 상태를 드러내야 한다. 진행 중 상태에서 대화상자 내용이 흔들리거나 삭제 대상 이름이 사라지지 않는지 확인한다.
        `.trim(),
      },
    },
  },
  play: async () => {
    const body = within(document.body)
    await userEvent.click(body.getByRole("button", { name: "삭제" }))
  },
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

실패해도 대화상자는 닫히지 않아야 한다. 오류는 잠깐 보였다 사라지는 알림으로만 처리하지 않고 사용자가 다음 행동을 선택할 때까지 화면 안에 남아야 한다.
        `.trim(),
      },
    },
  },
  play: async () => {
    const body = within(document.body)
    await userEvent.click(body.getByRole("button", { name: "삭제" }))
  },
}
