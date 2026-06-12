import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor } from "storybook/test"

import { withinCurrentAlertDialog } from "@/test/storybook-dialog"

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
  tags: ["autodocs", "test"],
  args: {
    open: true,
    onOpenChange: noop,
    categoryName: "업무",
    onConfirm: okConfirm,
  },
} satisfies Meta<typeof CategoryDeleteDialog>

export default meta

type Story = StoryObj<typeof meta>

const activeDeleteDialog = async () => {
  return withinCurrentAlertDialog("‘업무’ 카테고리를 삭제할까요?")
}

const assertDefaultDeleteDialog = async () => {
  const dialog = await activeDeleteDialog()
  await waitFor(() => expect(dialog.getByText("‘업무’ 카테고리를 삭제할까요?")).toBeVisible())
  await expect(dialog.getByText(/미분류로 바뀝니다/)).toBeVisible()
  await expect(dialog.getByRole("button", { name: "삭제" })).toBeVisible()
}

const assertDeleteSubmitting = async () => {
  const dialog = await activeDeleteDialog()
  await userEvent.click(dialog.getByRole("button", { name: "삭제" }))
  await expect(dialog.getByRole("button", { name: "삭제 중..." })).toBeDisabled()
}

const assertDeleteFailure = async () => {
  const dialog = await activeDeleteDialog()
  await userEvent.click(dialog.getByRole("button", { name: "삭제" }))
  await waitFor(() => expect(dialog.getByText("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.")).toBeVisible())
}

export const Default: Story = {
  parameters: {
    harness: {
      covers: [
        "카테고리를 삭제하려고 하면 삭제를 확인받는 안내와 함께, 그 카테고리에 묶였던 할 일이 미분류로 바뀐다는 설명이 보인다",
      ],
    },
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
  play: assertDefaultDeleteDialog,
}

export const Submitting: Story = {
  args: { onConfirm: hangingConfirm },
  parameters: {
    harness: {
      covers: [
        "카테고리를 삭제하는 요청을 기다리는 동안 삭제 버튼은 다시 누를 수 없는 상태로 표시된다",
      ],
    },
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
  play: assertDeleteSubmitting,
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
  play: assertDeleteFailure,
}
