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
      requirements: ["REQ-016"],
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

카테고리 목록을 정렬 순서대로 표시하고, 각 항목에서 수정·삭제 흐름으로 진입하게 한다.

### 주요 요소

- 카테고리 이름, 색상, 설명
- 항목별 수정·삭제 동작
- 빈 상태 안내
- 추가 묶음 로딩 상태

        `.trim(),
      },
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
        story: `
### 상태 설명

카테고리 3개가 정렬 순서대로 보이는 기본 목록이다.

### 사용자 흐름

1. 사용자는 각 항목의 이름, 색상, 설명을 훑는다.
2. 항목별 동작에서 수정 또는 삭제 흐름으로 진입한다.

### 관찰 포인트

색상이 없는 항목도 목록 높이와 정보 위계가 깨지지 않아야 한다. 동작 버튼은 항목과 명확히 연결되어 보여야 한다.
        `.trim(),
      },
    },
  },
}

export const Empty: Story = {
  args: { categories: [] },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

카테고리가 하나도 없을 때 보이는 빈 상태 안내다.

### 사용자 흐름

사용자는 목록에 표시할 항목이 없다는 사실을 확인하고, 상위 화면의 만들기 진입점으로 이동한다.

### 관찰 포인트

빈 상태는 스크롤 컨테이너만 비워 두지 않는다. 목록 영역 안에서 상태가 명확히 읽혀야 한다.
        `.trim(),
      },
    },
  },
}

export const ManyItemsLoadingMore: Story = {
  args: { categories: many, hasMore: true, isLoadingMore: true, onLoadMore: noop },
  parameters: {
    docs: {
      description: {
        story: `
### 상태 설명

한 묶음 20개를 채운 뒤 다음 묶음을 불러오는 중인 목록 상태다.

### 사용자 흐름

1. 사용자는 목록을 아래로 스크롤한다.
2. 끝에 가까워질 때 다음 묶음 로딩 표시를 확인한다.

### 관찰 포인트

하단 로딩 표시가 항목 동작과 겹치지 않아야 한다. 가상 스크롤 영역이 데스크톱 기준 화면 안에서 안정적으로 유지되는지 확인한다.
        `.trim(),
      },
    },
  },
}
