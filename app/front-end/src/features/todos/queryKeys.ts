import type { TodoFilters } from "./filters"

export type TodoListParams = {
  size: number
  filters: TodoFilters
}

export const todoQueryKeys = {
  all: ["todos"] as const,
  lists: () => [...todoQueryKeys.all, "list"] as const,
  list: (params: TodoListParams) => [...todoQueryKeys.lists(), params] as const,
}
