import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequirementBoard } from "./RequirementBoardPage";
import { RequirementDetailPage } from "./RequirementDetailPage";
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
        component: "선택한 범위의 요건 목록형 카드, 상위/하위 요건 구조, 추적 상태 요약, 필터, 상세 이동 흐름을 검토한다.",
      },
    },
  },
  tags: ["autodocs", "test"],
  decorators: [
    (Story, context) => {
      const router = context.parameters.router as { initialEntries?: string[] } | undefined;

      return (
        <MemoryRouter initialEntries={router?.initialEntries ?? ["/requirements"]}>
          <Story />
        </MemoryRouter>
      );
    },
  ],
} satisfies Meta<typeof RequirementBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllRequirements: Story = {
  args: { rows: requirementRows, summary: requirementSummary },
  parameters: {
    harness: {
      covers: ["요건 보드는 선택한 scope의 모든 요건을 요건 ID, 제목, 카드 상태, 제품 영역, 우선순위, 명세 역할, 상위 요건 ID, 하위 요건 수가 한 줄에 있고 추적 상태 뱃지가 우측 끝에 있는 목록형 카드로 표시하며, 카드 상태, 제품 영역, 우선순위는 제목 바로 오른쪽에 접두 문자 없는 종류별 색상의 작은 뱃지로 표시한다"],
    },
    docs: {
      description: {
        story: "선택한 범위의 요건 목록 전체를 보여주는 상태다. 요건 ID, 제목, 접두 문자 없는 종류별 색상의 작은 메타 뱃지, 구조 뱃지가 한 줄에 있고 추적 상태 뱃지가 우측 끝에 있는지 확인한다.",
      },
    },
  },
};

export const Hierarchy: Story = {
  args: { rows: requirementRows.filter((row) => row.id === "REQ-021" || row.parentRequirementIds.includes("REQ-021")), summary: requirementSummary },
  parameters: {
    harness: {
      covers: ["하위 요건 카드는 좌측 들여쓰기와 세로선으로 하위 관계가 구분된다"],
    },
    docs: {
      description: {
        story: "상위 요건과 하위 원자 요건이 함께 있는 상태다. 한 줄 카드 안에서 제목 바로 오른쪽의 작은 메타 뱃지와 명세 역할, 상위 요건, 하위 요건 수가 구분되고 하위 카드가 좌측 들여쓰기와 세로선으로 표시되는지 확인한다.",
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

export const FilteredByTitle: Story = {
  args: { rows: requirementRows, summary: requirementSummary, initialTitleQuery: "요건 추적" },
  parameters: {
    harness: {
      covers: ["제목 검색어, 추적 상태, 카드 상태, 제품 영역으로 목록을 좁힐 수 있고 필터 상태는 URL query에 반영된다"],
    },
    docs: {
      description: {
        story: "요건 제목 검색어가 입력된 상태다. 제목에 검색어가 포함된 요건 카드만 목록에 남는지 확인한다.",
      },
    },
  },
};

export const EmptyResult: Story = {
  args: { rows: [], summary: requirementSummary },
  parameters: {
    docs: {
      description: {
        story: "필터 조건에 맞는 요건이 없는 상태다. 빈 결과 메시지가 목록 영역에 표시되고 필터 영역은 유지되어야 한다.",
      },
    },
  },
};

export const StateSummary: Story = {
  args: { rows: requirementRows, summary: requirementSummary },
  parameters: {
    harness: {
      covers: ["보드 상단에 추적 상태별 요건 수 요약이 표시된다"],
    },
    docs: {
      description: {
        story: "추적 상태별 요약 카드 검토 상태다. RED/GREEN/BLUE/INACTIVE 수치가 목록 위에서 빠르게 스캔되는지 확인한다.",
      },
    },
  },
};

export const DetailNavigation: Story = {
  args: { rows: requirementRows.filter((row) => row.id === "REQ-031"), summary: requirementSummary },
  render: (args) => (
    <Routes>
      <Route path="/" element={<RequirementBoard {...args} />} />
      <Route path="/requirements" element={<RequirementBoard {...args} />} />
      <Route path="/requirements/:requirementId" element={<RequirementDetailPage />} />
    </Routes>
  ),
  parameters: {
    harness: {
      covers: ["목록에서 요건 ID를 선택하면 현재 필터 query를 유지한 채 그 요건의 상세 화면 route로 이동한다"],
    },
    router: {
      initialEntries: ["/requirements?title=요건&traceState=RED&cardStatus=초안&productArea=harness"],
    },
    docs: {
      description: {
        story: "요건 보드에서 요건 상세로 이동하는 상태다. REQ-031 ID 버튼을 선택하면 같은 Storybook 캔버스에서 현재 필터 query를 유지한 /requirements/REQ-031 route가 열리고, 상세 헤더의 요건 목록 버튼으로 필터 query가 유지된 목록으로 돌아오는지 확인한다.",
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
