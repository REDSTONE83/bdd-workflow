import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within } from "storybook/test"

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
    },
  },
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: noop,
    onSubmit: okSubmit,
  },
} satisfies Meta<typeof CategoryFormDialog>

export default meta

type Story = StoryObj<typeof meta>

const submit = (name: string) => async () => {
  const body = within(document.body)
  await userEvent.click(body.getByRole("button", { name }))
}

export const Create: Story = {
  args: { mode: "create" },
  parameters: {
    docs: {
      description: {
        story: "새 카테고리 만들기 폼 대화상자. 이름은 필수, 색상·설명은 비울 수 있다.",
      },
    },
  },
}

export const Edit: Story = {
  args: { mode: "edit", initialValue: editValue },
  parameters: {
    docs: {
      description: {
        story: "기존 카테고리 수정 폼 대화상자. 현재 값이 입력 영역에 채워진다.",
      },
    },
  },
}

export const NameRequiredError: Story = {
  args: { mode: "create" },
  parameters: {
    docs: {
      description: {
        story: "이름을 비운 채 만들기를 눌러 이름 입력 아래에 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("만들기"),
}

export const NameTooLongError: Story = {
  args: { mode: "create", initialValue: longName },
  parameters: {
    docs: {
      description: {
        story: "이름이 50자를 초과해 이름이 너무 길다는 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("만들기"),
}

export const DescriptionTooLongError: Story = {
  args: { mode: "create", initialValue: longDescription },
  parameters: {
    docs: {
      description: {
        story: "설명이 500자를 초과해 설명이 너무 길다는 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("만들기"),
}

export const ColorFormatError: Story = {
  args: { mode: "create", initialValue: badColor },
  parameters: {
    docs: {
      description: {
        story: "색상을 직접 입력하며 형식이 맞지 않아 색상 입력 아래에 형식 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("만들기"),
}

export const Submitting: Story = {
  args: { mode: "create", initialValue: validValue, onSubmit: hangingSubmit },
  parameters: {
    docs: {
      description: {
        story: "유효한 정보로 제출한 뒤 응답을 기다리는 동안 확인 버튼이 비활성화되는 상태.",
      },
    },
  },
  play: submit("만들기"),
}

export const DuplicateNameRejection: Story = {
  args: { mode: "create", initialValue: validValue, onSubmit: duplicateSubmit },
  parameters: {
    docs: {
      description: {
        story: "서버가 이미 사용 중인 이름으로 거절했을 때 같은 폼 대화상자에 중복 이름 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("만들기"),
}

export const EditNameRequiredError: Story = {
  args: { mode: "edit", initialValue: blankEditValue },
  parameters: {
    docs: {
      description: {
        story: "수정 폼 대화상자에서 이름을 비운 채 저장을 눌러 이름 입력 아래에 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("저장"),
}

export const EditNameTooLongError: Story = {
  args: { mode: "edit", initialValue: { ...editValue, name: longName.name } },
  parameters: {
    docs: {
      description: {
        story: "수정 폼 대화상자에서 이름이 50자를 초과해 이름이 너무 길다는 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("저장"),
}

export const EditDescriptionTooLongError: Story = {
  args: {
    mode: "edit",
    initialValue: { ...editValue, description: longDescription.description },
  },
  parameters: {
    docs: {
      description: {
        story: "수정 폼 대화상자에서 설명이 500자를 초과해 설명이 너무 길다는 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("저장"),
}

export const EditColorFormatError: Story = {
  args: { mode: "edit", initialValue: { ...editValue, color: badColor.color } },
  parameters: {
    docs: {
      description: {
        story: "수정 폼 대화상자에서 색상 형식이 맞지 않아 색상 입력 아래에 형식 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("저장"),
}

export const EditSubmitting: Story = {
  args: { mode: "edit", initialValue: editValue, onSubmit: hangingSubmit },
  parameters: {
    docs: {
      description: {
        story: "수정 폼 대화상자에서 저장 요청을 기다리는 동안 저장 버튼이 비활성화되는 상태.",
      },
    },
  },
  play: submit("저장"),
}

export const EditDuplicateNameRejection: Story = {
  args: { mode: "edit", initialValue: editValue, onSubmit: duplicateSubmit },
  parameters: {
    docs: {
      description: {
        story: "수정 폼 대화상자에서 서버가 이미 사용 중인 이름으로 거절했을 때 중복 이름 안내가 표시되는 상태.",
      },
    },
  },
  play: submit("저장"),
}
