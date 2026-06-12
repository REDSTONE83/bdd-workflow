import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

반복 항목, 요약 패널, 대화상자 내부처럼 명확한 테두리가 필요한 정보 묶음을 표현한다.

### 주요 상태

- 상단 영역, 제목, 설명
- 본문
- 선택적으로 붙는 하단 동작

### 관찰 포인트

카드는 화면 구역을 띄우는 장식으로 남용하지 않는다. 카드 안에 또 다른 카드를 중첩하지 않는다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
  render: (args) => (
    <Card {...args} className="w-[360px]">
      <CardHeader>
        <CardTitle>작업 공간 요약</CardTitle>
        <CardDescription>오늘의 할 일 활동</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">진행 중</dt>
            <dd className="font-medium">12</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">완료</dt>
            <dd className="font-medium">8</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  ),
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

작업 현황 요약을 담은 기본 카드 상태다.

### 사용자 흐름

사용자는 제목과 설명으로 카드의 목적을 이해하고, 본문 수치로 현재 상태를 훑는다.

### 관찰 포인트

제목, 설명, 본문 사이 위계가 분명해야 한다. 좁은 카드 폭에서도 수치와 이름이 겹치지 않는지 확인한다.
        `.trim(),
      },
    },
  },
}

export const WithFooter: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

본문 아래 하단 동작을 포함한 카드 상태다.

### 사용자 흐름

사용자는 설명을 읽고 취소하거나 초대 전송 동작을 실행한다.

### 관찰 포인트

하단 버튼은 본문과 분리되어 보여야 한다. 취소와 주 동작의 시각 위계가 명확한지 확인한다.
        `.trim(),
      },
    },
  },
  render: (args) => (
    <Card {...args} className="w-[360px]">
      <CardHeader>
        <CardTitle>구성원 초대</CardTitle>
        <CardDescription>현재 작업 공간에 접근 권한을 보냅니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          새 구성원은 초대를 수락한 뒤 배정된 할 일을 볼 수 있습니다.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">취소</Button>
        <Button>초대 보내기</Button>
      </CardFooter>
    </Card>
  ),
}
