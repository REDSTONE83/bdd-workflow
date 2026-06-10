import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { Input } from "./input"
import { Label } from "./label"

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-017", "REQ-018"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

사용자가 현재 화면 맥락을 유지한 채 보조 입력, 생성, 수정 작업을 수행하는 대화상자다.

### 주요 요소

- 여는 버튼
- 제목과 설명
- 입력 양식 본문
- 취소와 제출을 배치하는 하단 버튼 영역

### 관찰 포인트

대화상자는 열린 뒤 포커스를 내부로 옮기고, 사용자가 취소하거나 제출할 수 있는 명확한 하단 버튼 영역을 제공해야 한다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

function ExampleDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        대화상자 열기
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 카테고리</DialogTitle>
          <DialogDescription>
            이름, 색상, 설명을 입력하고 만들기를 누르세요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dialog-example-name">이름</Label>
          <Input id="dialog-example-name" placeholder="예: 업무" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
          <Button>만들기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

여는 버튼만 보이는 닫힌 대화상자 상태다.

### 사용자 흐름

사용자는 대화상자 열기 버튼을 눌러 현재 화면 위에서 입력 양식 흐름을 시작한다.

### 관찰 포인트

여는 버튼 문구는 열리는 작업의 목적을 알려야 한다. 닫힌 상태에서 본문 배치를 밀지 않는지 확인한다.
        `.trim(),
      },
    },
  },
  render: () => <ExampleDialog />,
}

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

카테고리 생성 입력 양식 예시가 열린 대화상자 상태다.

### 사용자 흐름

1. 사용자는 제목과 설명으로 작업 목적을 확인한다.
2. 이름을 입력한다.
3. 취소하거나 만들기로 제출한다.

### 관찰 포인트

대화상자 제목/설명, 입력 이름 연결, 하단 버튼 배치, 포커스가 대화상자 안에 머무르는지 확인한다. 내용이 좁은 화면에서 잘리지 않아야 한다.
        `.trim(),
      },
    },
  },
  render: () => <ExampleDialog defaultOpen />,
}
