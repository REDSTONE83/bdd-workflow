import type { Meta, StoryObj } from "@storybook/react-vite"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "./alert"

const meta = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

사용자가 알아야 하는 상태 변화, 저장 결과, 양식 전체 오류를 화면 안에 남기는 안내 영역이다.

### 주요 상태

- 기본 안내
- 위험하거나 중요한 오류
- 제목과 설명 조합
- 의미를 보강하는 아이콘

### 관찰 포인트

입력별 오류는 입력 아래 안내로 표시하고, 경고 안내는 화면 또는 양식 전체에 영향을 주는 상태에 사용한다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
  args: {
    variant: "default",
  },
  render: (args) => (
    <div className="w-[420px]">
      <Alert {...args}>
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>저장됨</AlertTitle>
        <AlertDescription>
          변경 사항을 화면에서 사용할 수 있습니다.
        </AlertDescription>
      </Alert>
    </div>
  ),
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

저장 완료처럼 사용자가 알아야 하는 일반 안내 상태다.

### 관찰 포인트

제목은 상태를 요약하고 본문은 다음에 사용자가 기대할 결과를 설명한다. 아이콘은 의미를 보강하되 중복으로 읽히지 않아야 한다.
        `.trim(),
      },
    },
  },
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

저장 실패나 서버 거절처럼 사용자가 행동을 정해야 하는 오류 안내 상태다.

### 관찰 포인트

오류는 잠깐 보였다 사라지는 알림에만 의존하지 않고 화면 안에 남아야 한다. 본문은 사용자가 다음에 할 일을 설명해야 한다.
        `.trim(),
      },
    },
  },
  render: (args) => (
    <div className="w-[420px]">
      <Alert {...args}>
        <AlertCircle aria-hidden="true" />
        <AlertTitle>저장할 수 없음</AlertTitle>
        <AlertDescription>
          표시된 입력 항목을 확인한 뒤 다시 시도하세요.
        </AlertDescription>
      </Alert>
    </div>
  ),
}
