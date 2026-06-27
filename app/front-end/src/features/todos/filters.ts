import {
  TODO_PRIORITIES,
  type TodoPriority,
  type TodoView,
} from "./types"

export type TodoCompletedFilter = "all" | "active" | "completed"
export type TodoPriorityFilter = "all" | TodoPriority

export type TodoFilters = {
  search: string
  completed: TodoCompletedFilter
  priority: TodoPriorityFilter
  categoryId: string | null
  uncategorized: boolean
  dueDateFrom: string
  dueDateTo: string
}

export type TodoListApiFilters = {
  search?: string
  completed?: boolean
  priority?: TodoPriority
  categoryId?: string
  uncategorized?: boolean
  dueDateFrom?: string
  dueDateTo?: string
}

export const EMPTY_TODO_FILTERS: TodoFilters = {
  search: "",
  completed: "all",
  priority: "all",
  categoryId: null,
  uncategorized: false,
  dueDateFrom: "",
  dueDateTo: "",
}

const CATEGORY_UNCATEGORIZED = "uncategorized"

export function normalizeTodoFilters(filters: TodoFilters): TodoFilters {
  const search = filters.search.trim()
  const priority = TODO_PRIORITIES.includes(filters.priority as TodoPriority)
    ? filters.priority
    : "all"
  const completed: TodoCompletedFilter =
    filters.completed === "active" || filters.completed === "completed"
      ? filters.completed
      : "all"
  return {
    search,
    completed,
    priority,
    categoryId: filters.uncategorized ? null : filters.categoryId || null,
    uncategorized: Boolean(filters.uncategorized),
    dueDateFrom: filters.dueDateFrom,
    dueDateTo: filters.dueDateTo,
  }
}

export function hasActiveTodoFilters(filters: TodoFilters): boolean {
  const normalized = normalizeTodoFilters(filters)
  return (
    normalized.search.length > 0 ||
    normalized.completed !== "all" ||
    normalized.priority !== "all" ||
    normalized.categoryId !== null ||
    normalized.uncategorized ||
    normalized.dueDateFrom.length > 0 ||
    normalized.dueDateTo.length > 0
  )
}

export function todoFiltersFromSearchParams(params: URLSearchParams): TodoFilters {
  const completedParam = params.get("completed")
  const priorityParam = params.get("priority")
  const uncategorized = params.get("uncategorized") === "true"

  return normalizeTodoFilters({
    search: params.get("search") ?? "",
    completed:
      completedParam === "true"
        ? "completed"
        : completedParam === "false"
          ? "active"
          : "all",
    priority: TODO_PRIORITIES.includes(priorityParam as TodoPriority)
      ? (priorityParam as TodoPriority)
      : "all",
    categoryId: uncategorized ? null : params.get("categoryId"),
    uncategorized,
    dueDateFrom: params.get("dueDateFrom") ?? "",
    dueDateTo: params.get("dueDateTo") ?? "",
  })
}

export function todoFiltersToSearchParams(filters: TodoFilters): URLSearchParams {
  const normalized = normalizeTodoFilters(filters)
  const params = new URLSearchParams()
  if (normalized.search) params.set("search", normalized.search)
  if (normalized.completed === "completed") params.set("completed", "true")
  if (normalized.completed === "active") params.set("completed", "false")
  if (normalized.priority !== "all") params.set("priority", normalized.priority)
  if (normalized.uncategorized) {
    params.set("uncategorized", "true")
  } else if (normalized.categoryId) {
    params.set("categoryId", normalized.categoryId)
  }
  if (normalized.dueDateFrom) params.set("dueDateFrom", normalized.dueDateFrom)
  if (normalized.dueDateTo) params.set("dueDateTo", normalized.dueDateTo)
  return params
}

export function todoFiltersToApiParams(filters: TodoFilters): TodoListApiFilters {
  const normalized = normalizeTodoFilters(filters)
  return {
    ...(normalized.search ? { search: normalized.search } : {}),
    ...(normalized.completed === "completed" ? { completed: true } : {}),
    ...(normalized.completed === "active" ? { completed: false } : {}),
    ...(normalized.priority !== "all" ? { priority: normalized.priority } : {}),
    ...(normalized.categoryId ? { categoryId: normalized.categoryId } : {}),
    ...(normalized.uncategorized ? { uncategorized: true } : {}),
    ...(normalized.dueDateFrom ? { dueDateFrom: normalized.dueDateFrom } : {}),
    ...(normalized.dueDateTo ? { dueDateTo: normalized.dueDateTo } : {}),
  }
}

export function todoCategoryFilterValue(filters: TodoFilters): string {
  if (filters.uncategorized) return CATEGORY_UNCATEGORIZED
  return filters.categoryId ?? "all"
}

export function todoFiltersWithCategoryValue(
  filters: TodoFilters,
  value: string,
): TodoFilters {
  if (value === "all") {
    return { ...filters, categoryId: null, uncategorized: false }
  }
  if (value === CATEGORY_UNCATEGORIZED) {
    return { ...filters, categoryId: null, uncategorized: true }
  }
  return { ...filters, categoryId: value, uncategorized: false }
}

export function todoMatchesFilters(todo: TodoView, filters: TodoFilters): boolean {
  const normalized = normalizeTodoFilters(filters)
  const search = normalized.search.toLowerCase()
  if (
    search &&
    !todo.title.toLowerCase().includes(search) &&
    !(todo.description ?? "").toLowerCase().includes(search)
  ) {
    return false
  }
  if (normalized.completed === "completed" && !todo.completed) return false
  if (normalized.completed === "active" && todo.completed) return false
  if (normalized.priority !== "all" && todo.priority !== normalized.priority) {
    return false
  }
  if (normalized.uncategorized && todo.category !== null) return false
  if (normalized.categoryId && todo.category?.id !== normalized.categoryId) {
    return false
  }
  if (normalized.dueDateFrom && (!todo.dueDate || todo.dueDate < normalized.dueDateFrom)) {
    return false
  }
  if (normalized.dueDateTo && (!todo.dueDate || todo.dueDate > normalized.dueDateTo)) {
    return false
  }
  return true
}
