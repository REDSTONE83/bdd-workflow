import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
    harness: {
      requirements: ["REQ-005"],
    },
  },
  tags: ["autodocs"],
  render: (args) => (
    <Card {...args} className="w-[360px]">
      <CardHeader>
        <CardTitle>Workspace summary</CardTitle>
        <CardDescription>Today&apos;s task activity</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Open</dt>
            <dd className="font-medium">12</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Done</dt>
            <dd className="font-medium">8</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  ),
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithFooter: Story = {
  render: (args) => (
    <Card {...args} className="w-[360px]">
      <CardHeader>
        <CardTitle>Invite member</CardTitle>
        <CardDescription>Send access to the current workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          New members can view assigned work after accepting the invite.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Send invite</Button>
      </CardFooter>
    </Card>
  ),
}
