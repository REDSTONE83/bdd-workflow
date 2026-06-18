import type { Meta, StoryObj } from "@storybook/react-vite"

import { TodoList } from "./TodoList"
import type { TodoView } from "../types"

const noop = () => {}
const okToggle = async (): Promise<void> => {}

const sample: TodoView[] = [
  {
    id: "todo-1",
    title: "분기 보고서 초안",
    description: "목차와 주요 지표를 정리합니다.",
    dueDate: "2026-06-12",
    priority: "HIGH",
    completed: false,
    category: { id: "cat-work", name: "업무", color: "#3b82f6" },
  },
  {
    id: "todo-2",
    title: "운동 예약",
    description: null,
    dueDate: null,
    priority: "MEDIUM",
    completed: true,
    category: null,
  },
  {
    id: "todo-3",
    title: "여름 휴가 일정 정리",
    description: "숙소 후보와 이동 시간을 비교합니다.",
    dueDate: "2026-06-20",
    priority: "LOW",
    completed: false,
    category: { id: "cat-home", name: "개인", color: "#22c55e" },
  },
]

const many: TodoView[] = Array.from({ length: 20 }, (_, i) => ({
  id: `todo-${i + 1}`,
  title: `할 일 ${i + 1}`,
  description: i % 3 === 0 ? "반복 검토 항목" : null,
  dueDate: i % 2 === 0 ? "2026-06-15" : null,
  priority: i % 3 === 0 ? "HIGH" : i % 3 === 1 ? "MEDIUM" : "LOW",
  completed: i % 4 === 0,
  category:
    i % 2 === 0
      ? { id: "cat-work", name: "업무", color: "#3b82f6" }
      : null,
}))

const meta = {
  title: "Todos/TodoList",
  component: TodoList,
  parameters: {
    layout: "padded",
    harness: {
      requirements: ["REQ-023", "REQ-027"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

할 일 목록을 표시하고, 각 항목에서 완료 토글·수정·삭제 흐름으로 진입하게 한다.

### 주요 요소

- 제목, 설명, 마감일, 우선순위, 완료 상태, 카테고리
- 완료 토글
- 항목별 수정·삭제 동작
- 빈 상태와 첫 로딩 상태
- 추가 묶음 로딩 상태

        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
  args: {
    onLoadMore: noop,
    onEdit: noop,
    onDelete: noop,
    onToggleComplete: okToggle,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TodoList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { todos: sample },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

할 일 3개가 서버 반환 순서대로 보이는 기본 목록이다.

### 사용자 흐름

1. 사용자는 제목, 설명, 마감일, 우선순위, 완료 상태, 카테고리를 비교한다.
2. 완료 토글로 처리 상태를 바꾼다.
3. 항목별 동작에서 수정 또는 삭제 흐름으로 진입한다.

### 관찰 포인트

완료된 항목과 미완료 항목의 차이가 색상만으로 전달되지 않는지 확인한다. 카테고리가 없는 항목도 정보 배치가 무너지지 않아야 한다.
        `.trim(),
      },
    },
  },
}

export const Empty: Story = {
  args: { todos: [] },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

할 일이 하나도 없을 때 보이는 빈 상태 안내다.

### 사용자 흐름

사용자는 목록에 표시할 항목이 없다는 사실을 확인하고, 상위 화면의 만들기 진입점으로 이동한다.

### 관찰 포인트

빈 상태는 스크롤 컨테이너만 비워 두지 않는다. 목록 영역 안에서 상태가 명확히 읽혀야 한다.
        `.trim(),
      },
    },
  },
}

export const Loading: Story = {
  args: { todos: [], isLoading: true },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

첫 할 일 묶음을 불러오는 중인 목록 상태다.

### 사용자 흐름

사용자는 목록 데이터가 도착하기 전까지 로딩 상태를 확인하고 기다린다.

### 관찰 포인트

첫 로딩은 빈 상태와 구분되어야 한다. 로딩 중 항목 동작이 잘못 표시되지 않는지 확인한다.
        `.trim(),
      },
    },
  },
}

export const ManyItemsLoadingMore: Story = {
  args: { todos: many, hasMore: true, isLoadingMore: true },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

한 묶음 20개를 채운 뒤 다음 묶음을 불러오는 중인 목록 상태다.

### 사용자 흐름

1. 사용자는 목록을 아래로 스크롤한다.
2. 끝에 가까워질 때 다음 묶음 로딩 표시를 확인한다.

### 관찰 포인트

하단 로딩 표시가 항목 동작과 겹치지 않아야 한다. 긴 제목과 여러 우선순위가 섞여도 목록 밀도가 유지되는지 확인한다.
        `.trim(),
      },
    },
  },
}
