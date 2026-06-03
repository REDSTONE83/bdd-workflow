import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog"
import { Button } from "./button"

const meta = {
  title: "UI/AlertDialog",
  component: AlertDialog,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-019"],
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AlertDialog>

export default meta

type Story = StoryObj<typeof meta>

function ExampleAlertDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        삭제
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>카테고리를 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            이 카테고리에 묶였던 할 일은 미분류로 바뀝니다. 이 동작은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>
            취소
          </AlertDialogClose>
          <Button variant="destructive">삭제</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Default: Story = {
  render: () => <ExampleAlertDialog />,
}

export const Open: Story = {
  render: () => <ExampleAlertDialog defaultOpen />,
}
