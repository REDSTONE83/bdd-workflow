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
    docs: {
      description: {
        component: `
### 화면 책임

알려지지 않은 경로로 진입했을 때 사용자가 길을 잃지 않고 안전한 진입점으로 돌아갈 수 있게 하는 대체 화면이다.

### 주요 요소

- 찾을 수 없는 화면 안내
- 홈 또는 기본 진입점으로 돌아가는 동작
- React Router 대체 화면 맥락

        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
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

export const RouteNotFound: Story = {
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

사용자가 알려지지 않은 경로로 진입해 대체 화면을 보는 상태다.

### 사용자 흐름

1. 사용자는 요청한 화면을 찾을 수 없다는 안내를 읽는다.
2. 제공된 동작으로 안전한 진입점으로 돌아간다.

### 관찰 포인트

대체 화면은 오류처럼 보이되 사용자를 막다른 상태에 두지 않아야 한다. 첫 화면 기준에서 안내와 복귀 동작이 모두 보여야 한다.
        `.trim(),
      },
    },
  },
}
