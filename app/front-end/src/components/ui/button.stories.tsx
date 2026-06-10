import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowRight, Loader2 } from "lucide-react"

import { Button } from "./button"

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

제품 화면의 주요 동작, 보조 동작, 삭제 같은 위험 동작, 링크형 동작을 일관된 크기와 상태로 표현한다.

### 주요 상태

- 기본, 보조, 외곽선
- 비활성화
- 아이콘 포함
- 처리 중/제출 중

### 관찰 포인트

버튼 텍스트와 아이콘은 좁은 폭에서도 겹치지 않아야 한다. 비활성화와 처리 중 상태는 사용자가 중복 동작을 시도하지 못하도록 실제 비활성 상태를 사용한다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
  },
  args: {
    children: "버튼",
    size: "default",
    variant: "default",
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

기본 주요 버튼 상태다.

### 관찰 포인트

양식 제출, 생성, 저장처럼 화면의 주 동작에 사용한다. 마우스를 올리거나 포커스가 있을 때도 텍스트와 배경 대비가 유지되어야 한다.
        `.trim(),
      },
    },
  },
}

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "보조",
  },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

보조 동작에 쓰는 버튼 상태다.

### 관찰 포인트

주요 버튼과 같은 화면에 있을 때 시각 위계가 낮아야 한다. 보조 동작이 주 작업처럼 보이지 않는지 확인한다.
        `.trim(),
      },
    },
  },
}

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "외곽선",
  },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

취소, 닫기, 덜 강조된 동작에 쓰는 외곽선 버튼 상태다.

### 관찰 포인트

대화상자 하단 버튼 영역에서 주요 버튼 또는 삭제 버튼과 함께 놓였을 때 취소 동작으로 읽히는지 확인한다.
        `.trim(),
      },
    },
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "비활성",
  },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

사용자가 현재 실행할 수 없는 동작 상태다.

### 관찰 포인트

비활성화는 시각 표현뿐 아니라 실제 버튼 비활성 상태여야 한다. 키보드와 포인터로 실행되지 않는지 확인한다.
        `.trim(),
      },
    },
  },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        계속
        <ArrowRight aria-hidden="true" />
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

텍스트와 방향 아이콘을 함께 쓰는 버튼 상태다.

### 관찰 포인트

아이콘은 텍스트 의미를 보강하므로 \`aria-hidden\`으로 둔다. 텍스트와 아이콘 간격이 버튼 높이를 불필요하게 키우지 않는지 확인한다.
        `.trim(),
      },
    },
  },
}

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="animate-spin" aria-hidden="true" />
        처리 중
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

요청 제출 후 응답을 기다리는 처리 중 버튼 상태다.

### 관찰 포인트

버튼은 비활성 상태로 중복 제출을 막는다. 회전 아이콘은 장식이므로 보조 기술에 중복으로 읽히지 않게 숨긴다.
        `.trim(),
      },
    },
  },
}
