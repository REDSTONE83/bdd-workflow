import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

import { SignupPlaceholderPage } from "./SignupPlaceholderPage"

const meta = {
  title: "Routes/SignupPlaceholderPage",
  component: SignupPlaceholderPage,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-011"],
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/signup"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof SignupPlaceholderPage>

export default meta

type Story = StoryObj<typeof meta>

export const RouteSignup: Story = {}
