import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password"],
    },
  },
  args: {
    placeholder: "Enter text",
    type: "text",
  },
  render: (args) => <Input {...args} className="w-[320px]" />,
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Error: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "invalid@example",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Disabled value",
  },
}
