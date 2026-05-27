import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"

import { TodosPlaceholderPage } from "./TodosPlaceholderPage"

const authenticatedAuth: AuthContextValue = {
  state: {
    status: "authenticated",
    user: {
      id: "user-1",
      email: "user@example.com",
    },
  },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const meta = {
  title: "Routes/TodosPlaceholderPage",
  component: TodosPlaceholderPage,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-011"],
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/todos"]}>
        <AuthContext.Provider value={authenticatedAuth}>
          <Story />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TodosPlaceholderPage>

export default meta

type Story = StoryObj<typeof meta>

export const RouteTodos: Story = {}
