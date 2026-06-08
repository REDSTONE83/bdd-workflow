import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within } from "storybook/test"

import type { CategoryView } from "@/features/categories/types"

import { TodoFormDialog } from "./TodoFormDialog"
import {
  TODO_DESCRIPTION_MAX,
  TODO_TITLE_MAX,
  type TodoInput,
} from "../types"

const noop = () => {}
const okSubmit = async (): Promise<void> => {}
const hangingSubmit = (): Promise<void> => new Promise(() => {})
const failingSubmit = async (): Promise<void> => {
  throw new Error("save failed")
}

const categories: CategoryView[] = [
  { id: "cat-work", name: "업무", color: "#3b82f6", description: null },
  { id: "cat-home", name: "개인", color: "#22c55e", description: null },
]

const editValue: TodoInput = {
  title: "분기 보고서 초안",
  description: "목차와 주요 지표를 정리합니다.",
  dueDate: "2026-06-12",
  priority: "HIGH",
  categoryId: "cat-work",
}

const longTitle: TodoInput = {
  title: "가".repeat(TODO_TITLE_MAX + 1),
  description: null,
  dueDate: null,
  priority: "MEDIUM",
  categoryId: null,
}

const longDescription: TodoInput = {
  title: "유효한 제목",
  description: "설".repeat(TODO_DESCRIPTION_MAX + 1),
  dueDate: null,
  priority: "MEDIUM",
  categoryId: null,
}

const validValue: TodoInput = {
  title: "새 할 일",
  description: "저장 대기 상태를 확인합니다.",
  dueDate: "2026-06-15",
  priority: "MEDIUM",
  categoryId: "cat-home",
}

const meta = {
  title: "Todos/TodoFormDialog",
  component: TodoFormDialog,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-022", "REQ-024"],
    },
  },
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: noop,
    mode: "create",
    categories,
    onSubmit: okSubmit,
  },
} satisfies Meta<typeof TodoFormDialog>

export default meta

type Story = StoryObj<typeof meta>

const submit = (name: string) => async () => {
  const body = within(document.body)
  await userEvent.click(body.getByRole("button", { name }))
}

export const Create: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "새 할 일 만들기 대화상자. 제목은 필수이고 설명, 마감일, 우선순위, 카테고리는 선택할 수 있다.",
      },
    },
  },
}

export const Edit: Story = {
  args: { mode: "edit", initialValue: editValue },
  parameters: {
    docs: {
      description: {
        story: "기존 할 일 수정 대화상자. 현재 값이 입력 영역에 채워진다.",
      },
    },
  },
}

export const CategoriesLoading: Story = {
  args: { categoriesLoading: true },
  parameters: {
    docs: {
      description: {
        story:
          "카테고리 선택지를 불러오는 동안 카테고리 선택 입력이 비활성화된 상태.",
      },
    },
  },
}

export const TitleRequiredError: Story = {
  parameters: {
    docs: {
      description: {
        story: "제목을 비운 채 만들기를 눌러 제목 입력 아래에 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("만들기"),
}

export const TitleTooLongError: Story = {
  args: { initialValue: longTitle },
  parameters: {
    docs: {
      description: {
        story: `제목이 ${TODO_TITLE_MAX}자를 초과해 제목이 너무 길다는 안내가 표시되는 상태.`,
      },
    },
  },
  play: submit("만들기"),
}

export const DescriptionTooLongError: Story = {
  args: { initialValue: longDescription },
  parameters: {
    docs: {
      description: {
        story: `설명이 ${TODO_DESCRIPTION_MAX}자를 초과해 설명이 너무 길다는 안내가 표시되는 상태.`,
      },
    },
  },
  play: submit("만들기"),
}

export const Submitting: Story = {
  args: { initialValue: validValue, onSubmit: hangingSubmit },
  parameters: {
    docs: {
      description: {
        story: "유효한 정보로 제출한 뒤 응답을 기다리는 동안 확인 버튼이 비활성화되는 상태.",
      },
    },
  },
  play: submit("만들기"),
}

export const SaveFailure: Story = {
  args: { initialValue: validValue, onSubmit: failingSubmit },
  parameters: {
    docs: {
      description: {
        story:
          "저장 요청이 실패했을 때 같은 대화상자 안에 실패 안내가 표시되고 다시 시도할 수 있는 상태.",
      },
    },
  },
  play: submit("만들기"),
}
