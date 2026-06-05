import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"

import { ProtectedLayout } from "./ProtectedLayout"

const authenticatedAuth: AuthContextValue = {
  state: {
    status: "authenticated",
    user: { id: "user-1", email: "user@example.com" },
  },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const meta = {
  title: "Components/ProtectedLayout",
  component: ProtectedLayout,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-016"],
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={parameters.initialEntries ?? ["/categories"]}>
        <AuthContext.Provider value={authenticatedAuth}>
          <Story />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof ProtectedLayout>

export default meta

type Story = StoryObj<typeof meta>

export const CategoriesActive: Story = {
  args: {
    children: (
      <div className="text-sm text-muted-foreground">화면 본문 영역</div>
    ),
  },
}

export const TodosActive: Story = {
  parameters: { initialEntries: ["/todos"] },
  args: {
    children: (
      <div className="text-sm text-muted-foreground">화면 본문 영역</div>
    ),
  },
}
