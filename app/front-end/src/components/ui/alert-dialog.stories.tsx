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
    docs: {
      description: {
        component: `
### 컴포넌트 책임

삭제처럼 되돌릴 수 없는 작업 전에 사용자의 명시적 확인을 받는 확인 대화상자다.

### 주요 요소

- 여는 버튼
- 삭제 대상과 결과를 설명하는 제목/설명
- 취소 버튼
- 삭제 확인 버튼

### 관찰 포인트

설명은 사용자가 확인 전에 알아야 할 결과를 말한다. 삭제 대상이 분명하지 않은 일반 문구만으로 확인 절차를 만들지 않는다.
        `.trim(),
      },
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
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

여는 버튼만 보이는 닫힌 확인 대화상자 상태다.

### 사용자 흐름

사용자는 삭제 버튼을 눌러 확인 대화상자를 열고, 실제 삭제 작업을 확정하기 전 설명을 확인한다.

### 관찰 포인트

닫힌 상태에서도 여는 버튼의 삭제 의미가 분명해야 한다. 버튼 문구는 어떤 작업을 시작하는지 말해야 한다.
        `.trim(),
      },
    },
  },
  render: () => <ExampleAlertDialog />,
}

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

확인 대화상자가 열린 상태다.

### 사용자 흐름

1. 사용자는 삭제 대상과 결과 설명을 읽는다.
2. 취소로 돌아가거나 삭제로 확정한다.

### 관찰 포인트

포커스가 대화상자 안에 머무르는지, 취소/삭제 버튼 순서, 삭제 버튼 강조를 확인한다. 제목과 설명은 대화상자 안에서 잘리지 않아야 한다.
        `.trim(),
      },
    },
  },
  render: () => <ExampleAlertDialog defaultOpen />,
}
