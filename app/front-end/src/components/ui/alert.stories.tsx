import type { Meta, StoryObj } from "@storybook/react-vite"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "./alert"

const meta = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
  args: {
    variant: "default",
  },
  render: (args) => (
    <div className="w-[420px]">
      <Alert {...args}>
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>
          Your changes are available to the workspace.
        </AlertDescription>
      </Alert>
    </div>
  ),
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
  render: (args) => (
    <div className="w-[420px]">
      <Alert {...args}>
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Unable to save</AlertTitle>
        <AlertDescription>
          Review the highlighted fields and try again.
        </AlertDescription>
      </Alert>
    </div>
  ),
}
