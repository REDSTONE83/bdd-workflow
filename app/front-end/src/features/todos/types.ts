export type TodoPriority = "HIGH" | "MEDIUM" | "LOW"

export type TodoCategoryView = {
  id: string
  name: string
  color: string | null
}

export type TodoView = {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  priority: TodoPriority
  completed: boolean
  category: TodoCategoryView | null
}

export type TodoInput = {
  title: string
  description: string | null
  dueDate: string | null
  priority: TodoPriority
  categoryId: string | null
}

export type TodoPatch = Partial<TodoInput> & {
  completed?: boolean
}

export const TODO_TITLE_MAX = 100
export const TODO_DESCRIPTION_MAX = 1000
export const TODO_PAGE_SIZE = 20
export const TODO_CATEGORY_OPTION_LIMIT = 100

export const TODO_PRIORITIES: TodoPriority[] = ["HIGH", "MEDIUM", "LOW"]

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
}
