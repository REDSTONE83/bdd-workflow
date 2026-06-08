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
  },
  tags: ["autodocs"],
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
        story:
          "서버가 반환한 순서대로 보이는 할 일 목록. 제목, 설명, 마감일, 우선순위, 완료 상태, 카테고리를 함께 표시한다.",
      },
    },
  },
}

export const Empty: Story = {
  args: { todos: [] },
  parameters: {
    docs: {
      description: {
        story: "할 일이 하나도 없을 때 보이는 빈 상태 안내.",
      },
    },
  },
}

export const Loading: Story = {
  args: { todos: [], isLoading: true },
  parameters: {
    docs: {
      description: {
        story: "첫 할 일 묶음을 불러오는 중인 상태.",
      },
    },
  },
}

export const ManyItemsLoadingMore: Story = {
  args: { todos: many, hasMore: true, isLoadingMore: true },
  parameters: {
    docs: {
      description: {
        story:
          "한 묶음(20개)을 채운 뒤 다음 묶음을 불러오는 중인 상태. 스크롤이 끝에 가까워지면 다음 묶음을 이어 불러온다.",
      },
    },
  },
}
