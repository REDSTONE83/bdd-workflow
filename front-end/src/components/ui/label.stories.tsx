import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"
import { Label } from "./label"

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
  },
  tags: ["autodocs"],
  args: {
    children: "Email",
    htmlFor: "label-default",
  },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Label {...args} />,
}

export const WithInput: Story = {
  render: () => (
    <div className="grid w-[320px] gap-2">
      <Label htmlFor="label-with-input">Email</Label>
      <Input id="label-with-input" type="email" placeholder="name@example.com" />
    </div>
  ),
}
export const Disabled: Story = {
  render: () => (
    <div className="grid w-[320px] gap-2" data-disabled="true">
      <Label htmlFor="label-disabled">Email</Label>
      <Input
        id="label-disabled"
        type="email"
        defaultValue="name@example.com"
        disabled
      />
    </div>
  ),
}
