import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthContext"

import { LoginPage } from "./LoginPage"

const unauthenticatedAuth: AuthContextValue = {
  state: { status: "unauthenticated" },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

const meta = {
  title: "Routes/LoginPage",
  component: LoginPage,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-011"],
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/login"]}>
        <AuthContext.Provider value={unauthenticatedAuth}>
          <Story />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LoginPage>

export default meta

type Story = StoryObj<typeof meta>

export const RouteLogin: Story = {}
