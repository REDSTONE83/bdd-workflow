import type { Meta, StoryObj } from "@storybook/react-vite"
import { useRef, useState } from "react"
import { MemoryRouter } from "react-router-dom"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"
import type { CategoryView } from "@/features/categories/types"

import { TodosPage } from "./TodosPage"
import type { TodoInput, TodoPatch, TodoView } from "../types"

const authenticatedAuth: AuthContextValue = {
  state: {
    status: "authenticated",
    user: { id: "user-1", email: "user@example.com" },
  },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const categories: CategoryView[] = [
  { id: "cat-work", name: "업무", color: "#3b82f6", description: null },
  { id: "cat-home", name: "개인", color: "#22c55e", description: null },
]

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
]

const many: TodoView[] = Array.from({ length: 20 }, (_, i) => ({
  id: `todo-${i + 1}`,
  title: `할 일 ${i + 1}`,
  description: i % 3 === 0 ? "반복 검토 항목" : null,
  dueDate: i % 2 === 0 ? "2026-06-15" : null,
  priority: i % 3 === 0 ? "HIGH" : i % 3 === 1 ? "MEDIUM" : "LOW",
  completed: i % 4 === 0,
  category: i % 2 === 0 ? { id: "cat-work", name: "업무", color: "#3b82f6" } : null,
}))

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function TodosPageMock({ initial }: { initial: TodoView[] }) {
  const [todos, setTodos] = useState<TodoView[]>(initial)
  const idRef = useRef(initial.length)

  const categoryFor = (categoryId: string | null) => {
    const category = categories.find((candidate) => candidate.id === categoryId)
    return category
      ? { id: category.id, name: category.name, color: category.color }
      : null
  }

  const handleCreate = async (input: TodoInput) => {
    await delay(300)
    idRef.current += 1
    setTodos((prev) => [
      ...prev,
      {
        id: `todo-new-${idRef.current}`,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        priority: input.priority,
        completed: false,
        category: categoryFor(input.categoryId),
      },
    ])
  }

  const handleUpdate = async (id: string, input: TodoPatch) => {
    await delay(300)
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              ...input,
              category:
                input.categoryId !== undefined
                  ? categoryFor(input.categoryId)
                  : todo.category,
            }
          : todo,
      ),
    )
  }

  const handleDelete = async (id: string) => {
    await delay(300)
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  return (
    <TodosPage
      todos={todos}
      categories={categories}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  )
}

const meta = {
  title: "Routes/TodosPage",
  component: TodosPage,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-022", "REQ-023", "REQ-024", "REQ-025", "REQ-027"],
    },
    docs: {
      description: {
        component: `
### 화면 책임

\`/todos\` 보호 경로에서 사용자가 본인의 할 일을 조회하고, 같은 화면에서 생성·수정·삭제·완료 전환 흐름으로 진입하는 화면이다.

### 주요 요소

- 할 일 목록과 제목, 설명, 기한, 우선순위, 카테고리, 완료 상태
- 새 할 일 만들기 진입점
- 항목별 수정·삭제 동작
- 완료 상태 토글
- 빈 목록과 추가 묶음 로딩 상태

        `.trim(),
      },
    },
  },
  tags: ["autodocs"],
  args: {
    todos: sample,
    categories,
    onCreate: async () => {},
    onUpdate: async () => {},
    onDelete: async () => {},
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/todos"]}>
        <AuthContext.Provider value={authenticatedAuth}>
          <Story />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TodosPage>

export default meta

type Story = StoryObj<typeof meta>

export const RouteTodos: Story = {
  name: "Route /todos",
  parameters: {
    docs: {
      description: {
        story: `
### 화면 목적

\`/todos\`로 진입했을 때 할 일 목록을 확인하고 오늘 처리할 항목을 추가·수정·완료 처리하는 상태다.

### 사용자 흐름

1. 목록에서 제목, 설명, 기한, 우선순위, 카테고리, 완료 상태를 확인한다.
2. 만들기 버튼으로 입력 대화상자를 열고 새 할 일을 저장한다.
3. 항목 동작에서 수정 대화상자를 열어 값을 바꾼다.
4. 완료 체크를 눌러 완료 상태가 즉시 반영되는지 본다.
5. 삭제 동작으로 확인 대화상자를 열고 삭제 결과를 확인한다.

### 관찰 포인트

이 스토리는 메모리 안에서 동작하는 모의 데이터이므로 저장 결과가 Storybook 화면 안에서 바로 목록에 반영된다. API 응답 본문이 아니라 사용자가 보는 목록 변화와 버튼 상태를 검토한다.
        `.trim(),
      },
    },
  },
  render: () => <TodosPageMock initial={sample} />,
}

export const Empty: Story = {
  args: { todos: [] },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

할 일이 하나도 없을 때의 빈 목록 화면이다.

### 사용자 흐름

1. 사용자는 빈 상태 안내를 읽고 아직 등록된 할 일이 없음을 확인한다.
2. 만들기 진입점으로 새 할 일 등록을 시작한다.

### 관찰 포인트

빈 상태에서도 보호 앱 셸과 주 작업 진입점은 유지되어야 한다. 사용자가 다음 행동을 알 수 있는지 확인한다.
        `.trim(),
      },
    },
  },
}

export const ManyItems: Story = {
  args: { todos: many, hasMore: true },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

한 묶음 20개를 채운 할 일 목록이며 다음 묶음이 남아 있는 상태다.

### 사용자 흐름

1. 사용자는 목록을 스크롤하며 제목, 우선순위, 기한, 완료 상태를 비교한다.
2. 목록 끝에 가까워지면 다음 묶음 로딩 흐름을 확인한다.
3. 스크롤 중에도 완료 전환과 항목 동작이 조작 가능한지 본다.

### 관찰 포인트

가상 스크롤 목록에서 항목 높이와 하단 로딩 표시가 안정적으로 유지되어야 한다. 긴 목록에서도 본문이 보호 앱 셸 밖으로 밀리지 않는지 확인한다.
        `.trim(),
      },
    },
  },
}
