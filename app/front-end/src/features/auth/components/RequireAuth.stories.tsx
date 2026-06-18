import type { Meta, StoryObj } from "@storybook/react-vite"
import { Route, Routes, useLocation, MemoryRouter } from "react-router-dom"
import { expect, within } from "storybook/test"

import { AuthContext, type AuthContextValue } from "../AuthContext"
import { RequireAuth } from "./RequireAuth"

const unauthenticatedAuth: AuthContextValue = {
  state: { status: "unauthenticated" },
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

function LoginMarker() {
  const location = useLocation()
  return (
    <div>
      <h1>로그인 화면</h1>
      <p>{location.search}</p>
    </div>
  )
}

function ProtectedRouteFixture() {
  return (
    <Routes>
      <Route
        path="/categories"
        element={(
          <RequireAuth>
            <div>보호 화면</div>
          </RequireAuth>
        )}
      />
      <Route path="/login" element={<LoginMarker />} />
    </Routes>
  )
}

const meta = {
  title: "Features/Auth/RequireAuth",
  component: RequireAuth,
  parameters: {
    harness: {
      requirements: ["REQ-011"],
    },
  },
  tags: ["autodocs", "test"],
  decorators: [
    (Story) => (
      <AuthContext.Provider value={unauthenticatedAuth}>
        <MemoryRouter initialEntries={["/categories"]}>
          <Story />
        </MemoryRouter>
      </AuthContext.Provider>
    ),
  ],
} satisfies Meta<typeof RequireAuth>

export default meta

type Story = StoryObj<typeof meta>

const assertRedirectsToLogin = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole("heading", { name: "로그인 화면" })).toBeVisible()
  await expect(canvas.getByText("?loginRedirect=%2Fcategories")).toBeVisible()
}

export const RedirectsUnauthenticatedUser: Story = {
  args: {
    children: null,
  },
  render: () => <ProtectedRouteFixture />,
  parameters: {
    harness: {
      covers: [
        "비인증 사용자가 보호 화면에 접근하면 로그인 화면으로 이동한다",
      ],
    },
  },
  play: assertRedirectsToLogin,
}
