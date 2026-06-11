import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { RequirementBoard } from "./RequirementBoardPage";
import { requirementRows, requirementSummary } from "../../lib/harness-data/fixtures";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const meta = {
  title: "Harness/Requirements/RequirementBoard",
  component: RequirementBoard,
  parameters: {
    harness: { requirements: ["REQ-031"] },
    docs: {
      description: {
        component: "선택한 scope의 요건 목록, 추적 상태 요약, 필터, 상세 이동 흐름을 검토한다.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof RequirementBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllRequirements: Story = {
  args: { rows: requirementRows, summary: requirementSummary },
  parameters: {
    docs: {
      description: {
        story: "선택한 scope의 요건 목록 전체를 보여주는 상태다. 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위가 같은 행에서 읽히는지 확인한다.",
      },
    },
  },
};

export const Filtered: Story = {
  args: { rows: requirementRows.filter((row) => row.traceState === "RED"), summary: requirementSummary },
  parameters: {
    docs: {
      description: {
        story: "RED 요건만 남긴 필터 적용 상태다. 필터 조작 영역과 결과 목록이 같은 기준을 말하는지 확인한다.",
      },
    },
  },
};

export const EmptyResult: Story = {
  args: { rows: [], summary: requirementSummary },
  parameters: {
    docs: {
      description: {
        story: "필터 조건에 맞는 요건이 없는 상태다. 빈 결과 메시지가 표 아래에 표시되고 필터 영역은 유지되어야 한다.",
      },
    },
  },
};

export const StateSummary: Story = {
  args: { rows: requirementRows, summary: requirementSummary },
  parameters: {
    docs: {
      description: {
        story: "추적 상태별 요약 카드 검토 상태다. RED/GREEN/BLUE/INACTIVE 수치가 목록 위에서 빠르게 스캔되는지 확인한다.",
      },
    },
  },
};

export const Loading: Story = {
  args: { rows: [], summary: [] },
  render: () => <LoadingState label="요건 목록을 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "요건 목록 조회 대기 상태다. 데이터가 없을 때 빈 표를 먼저 보여주지 않고 로딩 상태를 명확히 표시한다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { rows: [], summary: [] },
  render: () => <ErrorState message="요건 추적 산출물을 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "요건 추적 산출물 조회 실패 상태다. 실패 메시지와 다시 시도 진입점이 함께 표시되는지 확인한다.",
      },
    },
  },
};
