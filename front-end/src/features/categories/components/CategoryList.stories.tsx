import type { Meta, StoryObj } from "@storybook/react-vite"

import { CategoryList } from "./CategoryList"
import { CATEGORY_COLOR_PRESETS, type CategoryView } from "../types"

const noop = () => {}

const sample: CategoryView[] = [
  { id: "1", name: "업무", color: "#3b82f6", description: "회사 업무" },
  { id: "2", name: "개인", color: "#22c55e", description: null },
  { id: "3", name: "기타", color: null, description: "분류 없는 항목" },
]

const many: CategoryView[] = Array.from({ length: 20 }, (_, i) => ({
  id: `cat-${i + 1}`,
  name: `카테고리 ${i + 1}`,
  color: CATEGORY_COLOR_PRESETS[i % CATEGORY_COLOR_PRESETS.length],
  description: null,
}))

const meta = {
  title: "Categories/CategoryList",
  component: CategoryList,
  parameters: {
    layout: "padded",
    harness: {
      requirements: ["REQ-014"],
    },
  },
  tags: ["autodocs"],
  args: {
    onEdit: noop,
    onDelete: noop,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { categories: sample },
  parameters: {
    docs: {
      description: {
        story: "정렬 순서대로 보이는 카테고리 목록. 각 항목은 이름과 색상을 함께 표시한다.",
      },
    },
  },
}

export const Empty: Story = {
  args: { categories: [] },
  parameters: {
    docs: {
      description: {
        story: "카테고리가 하나도 없을 때 보이는 빈 상태 안내.",
      },
    },
  },
}

export const ManyItemsLoadingMore: Story = {
  args: { categories: many, hasMore: true, isLoadingMore: true, onLoadMore: noop },
  parameters: {
    docs: {
      description: {
        story:
          "한 묶음(20개)을 채운 뒤 다음 묶음을 불러오는 중인 상태. 스크롤이 끝에 가까워지면 다음 묶음을 이어 불러온다.",
      },
    },
  },
}
