import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

import { NotFoundPage } from "./NotFoundPage"

const meta = {
  title: "Routes/NotFoundPage",
  component: NotFoundPage,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-005"],
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/unknown"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof NotFoundPage>

export default meta

type Story = StoryObj<typeof meta>

export const RouteNotFound: Story = {}
