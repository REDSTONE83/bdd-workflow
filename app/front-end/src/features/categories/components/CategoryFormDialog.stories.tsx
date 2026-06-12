import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor } from "storybook/test"

import {
  type StoryScope,
  withinCurrentDialog,
} from "@/test/storybook-dialog"

import { CategoryFormDialog } from "./CategoryFormDialog"
import { type CategoryInput, DuplicateCategoryNameError } from "../types"

const noop = () => {}
const okSubmit = async (): Promise<void> => {}
const hangingSubmit = (): Promise<void> => new Promise(() => {})
const duplicateSubmit = async (): Promise<void> => {
  throw new DuplicateCategoryNameError()
}

const editValue: CategoryInput = {
  name: "업무",
  color: "#3b82f6",
  description: "회사 업무 관련 할 일",
}
const longName: CategoryInput = {
  name: "가".repeat(51),
  color: null,
  description: null,
}
const blankEditValue: CategoryInput = {
  ...editValue,
  name: "   ",
}
const longDescription: CategoryInput = {
  name: "유효한 이름",
  color: null,
  description: "설".repeat(501),
}
const badColor: CategoryInput = {
  name: "유효한 이름",
  color: "not-a-color",
  description: null,
}
const validValue: CategoryInput = {
  name: "업무",
  color: "#3b82f6",
  description: null,
}

const meta = {
  title: "Categories/CategoryFormDialog",
  component: CategoryFormDialog,
  parameters: {
    layout: "fullscreen",
    harness: {
      requirements: ["REQ-017", "REQ-018"],
      docs: {
        omitComponentProperties: true,
        omitPrimaryCanvas: true,
      },
    },
    docs: {
      description: {
        component: `
### 컴포넌트 책임

카테고리 생성과 수정을 같은 입력 대화상자에서 처리한다. 사용자는 이름을 필수로 입력하고, 색상과 설명은 필요할 때만 채운다.

### 주요 요소

- 이름 입력과 입력 항목 검증 안내
- 색상 선택 또는 직접 입력
- 설명 입력
- 취소와 저장/만들기 버튼
- 서버 거절을 알리는 양식 전체 경고 안내

        `.trim(),
      },
    },
  },
  tags: ["autodocs", "test"],
  args: {
    open: true,
    onOpenChange: noop,
    onSubmit: okSubmit,
  },
} satisfies Meta<typeof CategoryFormDialog>

export default meta

type Story = StoryObj<typeof meta>

const expectVisibleText = async (
  dialog: StoryScope,
  message: string,
) => {
  await waitFor(() => expect(dialog.getByText(message)).toBeVisible())
}

const assertCreateForm = async () => {
  const dialog = await withinCurrentDialog("새 카테고리")
  await waitFor(() => expect(dialog.getByRole("heading", { name: "새 카테고리" })).toBeVisible())
  await waitFor(() => expect(dialog.getByLabelText("이름")).toBeVisible())
  await expect(dialog.getByLabelText("색상")).toBeVisible()
  await expect(dialog.getByLabelText("설명")).toBeVisible()
  await expect(dialog.getByRole("button", { name: "만들기" })).toBeVisible()
}

const assertSubmitResult = (
  submitName: string,
  expectedMessages: string[],
  disabledButtonName?: string,
) => async () => {
  const dialog = await withinCurrentDialog(submitName === "저장" ? "카테고리 수정" : "새 카테고리")
  await userEvent.click(dialog.getByRole("button", { name: submitName }))
  for (const message of expectedMessages) {
    await expectVisibleText(dialog, message)
  }
  if (disabledButtonName) {
    await waitFor(() => expect(dialog.getByRole("button", { name: disabledButtonName })).toBeDisabled())
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
  args: { mode: "create" },
  parameters: {
    harness: {
      covers: [
        "새 카테고리 만들기를 열면 이름, 색상, 설명을 입력하는 입력 영역과 만들기 버튼이 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "새 카테고리 만들기 입력 대화상자가 열린 초기 상태다.",
          "사용자는 이름을 입력하고, 필요하면 색상과 설명을 채운 뒤 만들기를 누른다.",
          "이름은 필수이고 색상과 설명은 비울 수 있다. 저장 성공 후 닫힘과 목록 반영은 경로 화면 모의 스토리에서 확인한다.",
        ),
      },
    },
  },
  play: assertCreateForm,
}

export const Edit: Story = {
  args: { mode: "edit", initialValue: editValue },
  parameters: {
    docs: {
      description: {
        story: formStory(
          "기존 카테고리 수정 입력 대화상자가 열린 상태이며 현재 값이 입력 영역에 채워져 있다.",
          "사용자는 기존 이름, 색상, 설명을 확인한 뒤 필요한 값만 바꾸고 저장을 누른다.",
          "수정 모드에서는 제목과 제출 버튼 문구가 만들기 모드와 달라야 한다. 검증과 서버 거절 표시는 생성 모드와 같은 위치에 남는다.",
        ),
      },
    },
  },
}

export const NameRequiredError: Story = {
  args: { mode: "create" },
  parameters: {
    harness: {
      covers: [
        "카테고리를 만들거나 수정할 때 이름을 비우거나 공백만 입력하면 이름 입력 아래에 입력이 필요하다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "생성 입력 양식에서 이름을 비운 채 만들기를 누른 뒤 입력 항목 오류가 표시된 상태다.",
          "사용자는 이름 입력 아래 안내를 확인하고 같은 대화상자에서 값을 수정한다.",
          "브라우저에서 먼저 확인하는 검증 오류이므로 서버 요청 흐름으로 넘어가지 않는다. 오류는 경고 안내가 아니라 해당 입력 아래에 남아야 한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", ["이름을 입력해 주세요."]),
}

export const NameTooLongError: Story = {
  args: { mode: "create", initialValue: longName },
  parameters: {
    harness: {
      covers: [
        "카테고리를 만들거나 수정할 때 이름이 50자를 초과하면 이름이 너무 길다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "생성 입력 양식에서 이름이 50자를 초과해 길이 오류가 표시된 상태다.",
          "사용자는 긴 이름을 줄인 뒤 다시 만들기를 시도한다.",
          "오류 문구는 이름 입력과 연결되어야 하며, 색상과 설명 입력 상태는 유지되어야 한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", ["이름은 50자를 넘을 수 없습니다."]),
}

export const DescriptionTooLongError: Story = {
  args: { mode: "create", initialValue: longDescription },
  parameters: {
    harness: {
      covers: [
        "카테고리를 만들거나 수정할 때 설명이 500자를 초과하면 설명이 너무 길다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "생성 입력 양식에서 설명이 500자를 초과해 길이 오류가 표시된 상태다.",
          "사용자는 설명을 줄인 뒤 다시 만들기를 시도한다.",
          "선택 입력인 설명도 값이 들어오면 길이 제한을 적용한다. 오류는 설명 입력 아래에 표시된다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", ["설명은 500자를 넘을 수 없습니다."]),
}

export const ColorFormatError: Story = {
  args: { mode: "create", initialValue: badColor },
  parameters: {
    harness: {
      covers: [
        "카테고리를 만들거나 수정할 때 색상 형식이 올바르지 않으면 색상 입력 아래에 형식 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "생성 입력 양식에서 색상을 직접 입력했지만 색상 코드 형식이 맞지 않아 오류가 표시된 상태다.",
          "사용자는 색상 프리셋을 선택하거나 올바른 형식으로 값을 고친다.",
          "색상은 선택 입력이지만 입력된 값은 형식 검증을 통과해야 한다. 오류는 색상 입력 아래에 남는다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", ["색상은 #RRGGBB 형식으로 입력해 주세요."]),
}

export const Submitting: Story = {
  args: { mode: "create", initialValue: validValue, onSubmit: hangingSubmit },
  parameters: {
    harness: {
      covers: [
        "카테고리를 만드는 요청을 기다리는 동안 만들기 버튼은 다시 누를 수 없는 상태로 표시된다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "유효한 생성 정보로 제출한 뒤 응답을 기다리는 상태다.",
          "사용자는 만들기 버튼을 누른 뒤 중복 제출을 시도하지 못하고 응답을 기다린다.",
          "확인 버튼은 비활성화와 처리 중 상태를 드러내야 한다. 취소/닫기 정책도 제출 중 상태에서 어색하지 않은지 확인한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", [], "만드는 중..."),
}

export const DuplicateNameRejection: Story = {
  args: { mode: "create", initialValue: validValue, onSubmit: duplicateSubmit },
  parameters: {
    harness: {
      covers: [
        "이미 사용 중인 이름으로 카테고리를 만들려고 하면 중복 이름 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "서버가 이미 사용 중인 이름으로 거절해 양식 전체 경고 안내가 표시된 상태다.",
          "사용자는 경고 안내를 읽고 이름을 바꾼 뒤 같은 대화상자에서 다시 제출한다.",
          "서버 거절은 대화상자를 닫지 않는다. 입력값은 유지되어야 하며, 오류 코드는 사용자 문구로 변환되어야 한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("만들기", ["같은 이름의 카테고리가 이미 있습니다. 다른 이름을 입력해 주세요."]),
}

export const EditNameRequiredError: Story = {
  args: { mode: "edit", initialValue: blankEditValue },
  parameters: {
    harness: {
      requirements: ["REQ-018"],
      covers: [
        "카테고리를 만들거나 수정할 때 이름을 비우거나 공백만 입력하면 이름 입력 아래에 입력이 필요하다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "수정 입력 양식에서 이름을 비운 채 저장을 눌러 입력 항목 오류가 표시된 상태다.",
          "사용자는 기존 카테고리 값을 유지한 채 이름만 다시 입력하고 저장한다.",
          "수정 모드에서도 생성 모드와 같은 검증 위치와 문구 체계를 사용한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("저장", ["이름을 입력해 주세요."]),
}

export const EditNameTooLongError: Story = {
  args: { mode: "edit", initialValue: { ...editValue, name: longName.name } },
  parameters: {
    harness: {
      requirements: ["REQ-018"],
      covers: [
        "카테고리를 만들거나 수정할 때 이름이 50자를 초과하면 이름이 너무 길다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "수정 입력 양식에서 이름이 50자를 초과해 길이 오류가 표시된 상태다.",
          "사용자는 긴 이름을 줄인 뒤 저장을 다시 시도한다.",
          "기존 색상과 설명은 유지되어야 하며, 오류는 이름 입력 아래에만 표시된다.",
        ),
      },
    },
  },
  play: assertSubmitResult("저장", ["이름은 50자를 넘을 수 없습니다."]),
}

export const EditDescriptionTooLongError: Story = {
  args: {
    mode: "edit",
    initialValue: { ...editValue, description: longDescription.description },
  },
  parameters: {
    harness: {
      requirements: ["REQ-018"],
      covers: [
        "카테고리를 만들거나 수정할 때 설명이 500자를 초과하면 설명이 너무 길다는 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "수정 입력 양식에서 설명이 500자를 초과해 길이 오류가 표시된 상태다.",
          "사용자는 설명을 줄인 뒤 저장을 다시 시도한다.",
          "설명은 선택 입력이지만 값이 있으면 제한을 지킨다. 다른 입력의 현재 값은 그대로 남아야 한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("저장", ["설명은 500자를 넘을 수 없습니다."]),
}

export const EditColorFormatError: Story = {
  args: { mode: "edit", initialValue: { ...editValue, color: badColor.color } },
  parameters: {
    harness: {
      requirements: ["REQ-018"],
      covers: [
        "카테고리를 만들거나 수정할 때 색상 형식이 올바르지 않으면 색상 입력 아래에 형식 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "수정 입력 양식에서 색상 형식이 맞지 않아 입력 항목 오류가 표시된 상태다.",
          "사용자는 색상 프리셋을 다시 고르거나 올바른 색상 코드를 입력한다.",
          "색상 오류는 입력 항목 안내로 남고, 서버 거절 경고 안내와 섞이지 않는다.",
        ),
      },
    },
  },
  play: assertSubmitResult("저장", ["색상은 #RRGGBB 형식으로 입력해 주세요."]),
}

export const EditSubmitting: Story = {
  args: { mode: "edit", initialValue: editValue, onSubmit: hangingSubmit },
  parameters: {
    harness: {
      requirements: ["REQ-018"],
      covers: [
        "카테고리를 수정하는 요청을 기다리는 동안 저장 버튼은 다시 누를 수 없는 상태로 표시된다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "수정 입력 양식에서 저장 요청을 기다리는 상태다.",
          "사용자는 저장을 누른 뒤 응답이 올 때까지 중복 저장을 할 수 없다.",
          "저장 버튼은 비활성화와 처리 중 상태를 보여야 한다. 입력값이 흔들리거나 초기값으로 되돌아가지 않는지 확인한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("저장", [], "저장 중..."),
}

export const EditDuplicateNameRejection: Story = {
  args: { mode: "edit", initialValue: editValue, onSubmit: duplicateSubmit },
  parameters: {
    harness: {
      requirements: ["REQ-018"],
      covers: [
        "카테고리를 수정할 때 이미 사용 중인 다른 이름으로 바꾸려고 하면 중복 이름 안내가 보인다",
      ],
    },
    docs: {
      description: {
        story: formStory(
          "수정 입력 양식에서 서버가 이미 사용 중인 이름으로 거절해 양식 전체 경고 안내가 표시된 상태다.",
          "사용자는 현재 입력값을 확인하고 이름을 바꾼 뒤 다시 저장한다.",
          "서버 거절 후에도 대화상자는 열린 채 유지된다. 기존 카테고리와 새 입력값의 구분이 화면에서 혼동되지 않는지 확인한다.",
        ),
      },
    },
  },
  play: assertSubmitResult("저장", ["같은 이름의 카테고리가 이미 있습니다. 다른 이름을 입력해 주세요."]),
}
