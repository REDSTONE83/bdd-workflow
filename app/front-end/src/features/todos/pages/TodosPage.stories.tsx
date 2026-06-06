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
  render: () => <TodosPageMock initial={sample} />,
}

export const Empty: Story = {
  args: { todos: [] },
}

export const ManyItems: Story = {
  args: { todos: many, hasMore: true },
}
