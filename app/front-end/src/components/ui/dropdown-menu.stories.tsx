import type { Meta, StoryObj } from "@storybook/react-vite"
import { LogOut, MoreHorizontal, Settings, User } from "lucide-react"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

좁은 공간에서 여러 보조 동작을 메뉴로 묶어 제공한다.

### 주요 상태

- 닫힌 여는 버튼
- 열린 메뉴
- 비활성 항목
- 아이콘과 문구 조합

### 관찰 포인트

여는 버튼은 접근 가능한 이름을 가져야 한다. 메뉴 항목은 키보드로 탐색 가능해야 하며 비활성 항목은 선택되지 않아야 한다.
        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
} satisfies Meta<typeof DropdownMenu>

export default meta

type Story = StoryObj<typeof meta>

function AccountMenu({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" />}
        aria-label="계정 메뉴 열기"
      >
        <MoreHorizontal aria-hidden="true" />
        계정
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem>
          <User aria-hidden="true" />
          프로필
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings aria-hidden="true" />
          설정
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogOut aria-hidden="true" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

계정 메뉴 여는 버튼만 보이는 닫힌 상태다.

### 사용자 흐름

사용자는 여는 버튼을 눌러 프로필, 설정, 로그아웃 같은 보조 동작을 연다.

### 관찰 포인트

여는 버튼은 아이콘만으로 의미를 숨기지 않고 텍스트와 접근 이름을 함께 제공한다.
        `.trim(),
      },
    },
  },
  render: () => <AccountMenu />,
}

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

계정 메뉴가 열린 상태다.

### 사용자 흐름

1. 사용자는 메뉴 항목을 위에서 아래로 훑는다.
2. 원하는 동작을 선택하거나 바깥 영역으로 닫는다.

### 관찰 포인트

메뉴는 여는 버튼과 가까운 위치에 열리고, 항목 아이콘은 텍스트 의미를 보강한다. 키보드 포커스 이동이 자연스러운지 확인한다.
        `.trim(),
      },
    },
  },
  render: () => <AccountMenu defaultOpen />,
}

export const DisabledItem: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

메뉴 안에 실행할 수 없는 비활성 항목이 포함된 상태다.

### 사용자 흐름

사용자는 가능한 동작과 현재 막힌 동작을 구분하고, 비활성 항목은 건너뛴다.

### 관찰 포인트

비활성 항목은 흐린 스타일뿐 아니라 실제 선택 불가 상태여야 한다. 메뉴 높이와 항목 간격이 유지되는지 확인한다.
        `.trim(),
      },
    },
  },
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" />}
        aria-label="동작 메뉴 열기"
      >
        <MoreHorizontal aria-hidden="true" />
        동작
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem>수정</DropdownMenuItem>
        <DropdownMenuItem disabled>보관</DropdownMenuItem>
        <DropdownMenuItem>삭제</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
