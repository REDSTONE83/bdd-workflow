import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { ChangeSetView } from "./ChangeSetViewPage";
import { changeSetRows } from "../../lib/harness-data/fixtures";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const meta = {
  title: "Harness/ChangeSets/ChangeSetView",
  component: ChangeSetView,
  parameters: {
    harness: { requirements: ["REQ-034"] },
    docs: {
      description: {
        component: "Change Set 목록, 상세, 영향 요건 추적 상태와 상세 이동을 검토한다.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof ChangeSetView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {
  args: { rows: changeSetRows },
  parameters: {
    docs: {
      description: {
        story: "Change Set 목록과 선택된 상세가 함께 보이는 기본 상태다. 제목, 상태, 요청일, 영향 요건 수가 목록에서 읽히는지 확인한다.",
      },
    },
  },
};

export const Detail: Story = {
  args: { rows: changeSetRows },
  parameters: {
    docs: {
      description: {
        story: "선택된 Change Set 상세 상태다. 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의가 분리되어 보이는지 확인한다.",
      },
    },
  },
};

export const LinkedRequirements: Story = {
  args: { rows: changeSetRows },
  parameters: {
    docs: {
      description: {
        story: "영향 요건 링크 목록을 검토하는 상태다. 요건 ID, 제목, 추적 상태가 함께 표시되고 상세 화면 이동 링크로 동작해야 한다.",
      },
    },
  },
};

export const OpenDiscussions: Story = {
  args: { rows: [{ ...changeSetRows[0], openDiscussions: ["검증 명령 확장 범위 확인"] }] },
  parameters: {
    docs: {
      description: {
        story: "열린 논의가 남아 있는 Change Set 상태다. 논의가 없을 때의 '없음' 표시와 구분되어 실제 논의 문장이 보여야 한다.",
      },
    },
  },
};

export const Loading: Story = {
  args: { rows: changeSetRows },
  render: () => <LoadingState label="Change Set을 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "Change Set 리포트 조회 대기 상태다. 목록과 상세를 부분 데이터로 표시하지 않고 로딩 상태를 보여준다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { rows: changeSetRows },
  render: () => <ErrorState message="Change Set 리포트를 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "Change Set 리포트 조회 실패 상태다. 실패 메시지와 다시 시도 진입점이 표시되는지 확인한다.",
      },
    },
  },
};
