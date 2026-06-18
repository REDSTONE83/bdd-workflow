import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor } from "storybook/test"

import type { CategoryView } from "@/features/categories/types"
import {
  type StoryScope,
  withinCurrentDialog,
} from "@/test/storybook-dialog"

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
      docs: {
        omitComponentProperties: true,
        omitPrimaryCanvas: true,
      },
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

할 일 생성과 수정을 같은 입력 대화상자에서 처리한다. 사용자는 제목을 필수로 입력하고 설명, 마감일, 우선순위, 카테고리를 필요에 맞게 정한다.

### 주요 요소

- 제목 입력과 입력 항목 검증 안내
- 설명, 마감일, 우선순위 입력
- 카테고리 선택과 선택지 로딩 상태
- 취소와 저장/만들기 버튼
- 저장 실패를 알리는 양식 전체 경고 안내

        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
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

const expectVisibleText = async (
  dialog: StoryScope,
  message: string,
) => {
  await waitFor(() => expect(dialog.getByText(message)).toBeVisible())
}

const assertCreateForm = async () => {
  const dialog = await withinCurrentDialog("새 할 일")
  await waitFor(() => expect(dialog.getByRole("heading", { name: "새 할 일" })).toBeVisible())
  await waitFor(() => expect(dialog.getByLabelText("제목")).toBeVisible())
  await expect(dialog.getByLabelText("설명")).toBeVisible()
  await expect(dialog.getByLabelText("마감일")).toBeVisible()
  await expect(dialog.getByLabelText("우선순위")).toBeVisible()
  await expect(dialog.getByLabelText("카테고리")).toBeVisible()
  await expect(dialog.getByRole("button", { name: "만들기" })).toBeVisible()
}

const assertEditForm = async () => {
  const dialog = await withinCurrentDialog("할 일 수정")
  await waitFor(() => expect(dialog.getByRole("heading", { name: "할 일 수정" })).toBeVisible())
  await expect(dialog.getByLabelText("제목")).toHaveValue("분기 보고서 초안")
  await expect(dialog.getByLabelText("설명")).toHaveValue("목차와 주요 지표를 정리합니다.")
  await expect(dialog.getByLabelText("마감일")).toHaveValue("2026-06-12")
  await expect(dialog.getByLabelText("우선순위")).toHaveValue("HIGH")
  await expect(dialog.getByLabelText("카테고리")).toHaveValue("cat-work")
}

const assertSubmitResult = (name: string, expectedMessages: string[]) => async () => {
  const dialog = await withinCurrentDialog(name === "저장" ? "할 일 수정" : "새 할 일")
  await userEvent.click(dialog.getByRole("button", { name }))
  for (const message of expectedMessages) {
    await expectVisibleText(dialog, message)
  }
}

const formStory = (
  state: string,
  flow: string,
  observation: string,
) => `
### 상태 설명

${state}

### 사용자 흐름

${flow}

### 관찰 포인트

${observation}
`.trim()

export const Create: Story = {
  parameters: {
    harness: {
      covers: [
        "새 할 일 만들기를 열면 제목, 설명, 마감일, 우선순위, 카테고리를 입력하는 입력 영역과 만들기 버튼이 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "새 할 일 만들기 대화상자가 열린 초기 상태다.",
          "사용자는 제목을 입력하고, 필요하면 설명, 마감일, 우선순위, 카테고리를 고른 뒤 만들기를 누른다.",
          "제목은 필수이고 나머지 값은 선택할 수 있다. 저장 성공 후 닫힘과 목록 반영은 경로 화면 모의 스토리에서 확인한다.",
        ),
      },
    },
  },
  play: assertCreateForm,
}

export const Edit: Story = {
  args: { mode: "edit", initialValue: editValue },
  parameters: {
    harness: {
      requirements: ["REQ-024"],
      covers: [
        "할 일 수정을 열면 기존 제목, 설명, 마감일, 우선순위, 카테고리가 입력 영역에 채워져 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "기존 할 일 수정 대화상자가 열린 상태이며 현재 값이 입력 영역에 채워져 있다.",
          "사용자는 기존 제목, 설명, 기한, 우선순위, 카테고리를 확인한 뒤 필요한 값만 바꾸고 저장한다.",
          "수정 모드에서는 제목과 제출 버튼 문구가 만들기 모드와 달라야 한다. 검증과 저장 실패 표시는 생성 모드와 같은 위치에 남는다.",
        ),
      },
    },
  },
  play: assertEditForm,
}

export const CategoriesLoading: Story = {
  args: { categoriesLoading: true },
  parameters: {
    docs: {
      description: {
        story: formStory(
          "카테고리 선택지를 불러오는 동안 카테고리 선택 입력이 비활성화된 상태다.",
          "사용자는 제목과 다른 값은 먼저 입력할 수 있고, 카테고리 선택은 로딩이 끝날 때까지 기다린다.",
          "카테고리 로딩은 폼 전체 제출 중 상태와 구분되어야 한다. 카테고리 외 입력이 불필요하게 막히지 않는지 확인한다.",
        ),
      },
    },
  },
}

export const TitleRequiredError: Story = {
  parameters: {
    harness: {
      covers: [
        "할 일을 만들거나 수정할 때 제목을 비우거나 공백만 입력하면 제목 입력 아래에 입력이 필요하다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "생성 입력 양식에서 제목을 비운 채 만들기를 눌러 입력 항목 오류가 표시된 상태다.",
          "사용자는 제목 입력 아래 안내를 확인하고 같은 대화상자에서 값을 수정한다.",
          "브라우저에서 먼저 확인하는 검증 오류이므로 서버 요청 흐름으로 넘어가지 않는다. 오류는 경고 안내가 아니라 제목 입력 아래에 남아야 한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", ["제목을 입력해 주세요."]),
}

export const TitleTooLongError: Story = {
  args: { initialValue: longTitle },
  parameters: {
    docs: {
      description: {
        story: formStory(
          `생성 입력 양식에서 제목이 ${TODO_TITLE_MAX}자를 초과해 길이 오류가 표시된 상태다.`,
          "사용자는 긴 제목을 줄인 뒤 다시 만들기를 시도한다.",
          "오류 문구는 제목 입력과 연결되어야 하며, 설명과 선택 값은 유지되어야 한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", [`제목은 ${TODO_TITLE_MAX}자를 넘을 수 없습니다.`]),
}

export const DescriptionTooLongError: Story = {
  args: { initialValue: longDescription },
  parameters: {
    harness: {
      covers: [
        "할 일을 만들거나 수정할 때 설명이 1000자를 넘으면 설명 입력 아래에 길이 제한 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          `생성 입력 양식에서 설명이 ${TODO_DESCRIPTION_MAX}자를 초과해 길이 오류가 표시된 상태다.`,
          "사용자는 설명을 줄인 뒤 다시 만들기를 시도한다.",
          "설명은 선택 입력이지만 값이 있으면 제한을 지킨다. 오류는 설명 입력 아래에 표시된다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", [`설명은 ${TODO_DESCRIPTION_MAX}자를 넘을 수 없습니다.`]),
}

export const Submitting: Story = {
  args: { initialValue: validValue, onSubmit: hangingSubmit },
  parameters: {
    docs: {
      description: {
        story: formStory(
          "유효한 생성 정보로 제출한 뒤 응답을 기다리는 상태다.",
          "사용자는 만들기 버튼을 누른 뒤 중복 제출을 시도하지 못하고 응답을 기다린다.",
          "확인 버튼은 비활성화와 처리 중 상태를 드러내야 한다. 입력값이 제출 중에도 안정적으로 남는지 확인한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", []),
}

export const SaveFailure: Story = {
  args: { initialValue: validValue, onSubmit: failingSubmit },
  parameters: {
    harness: {
      covers: [
        "할 일 생성 요청이 실패하면 실패 안내가 보이고 사용자가 다시 시도할 수 있다",
        "할 일 수정 요청이 실패하면 실패 안내가 보이고 사용자가 다시 시도할 수 있다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "저장 요청이 실패해 양식 전체 경고 안내가 표시된 상태다.",
          "사용자는 경고 안내를 읽고 같은 대화상자에서 값을 확인한 뒤 다시 제출하거나 취소한다.",
          "저장 실패는 대화상자를 닫지 않는다. 입력값은 유지되어야 하며, 실패 안내는 잠깐 보였다 사라지는 알림이 아니라 입력 양식 안에 남아야 한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", ["저장하지 못했습니다. 잠시 후 다시 시도해 주세요."]),
}
