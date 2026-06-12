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
        component: "Change Set 필터, 선택된 영향 요건 필터, 카드 목록, 카드 내부 펼침 상세, 펼침 안의 영향 요건 추적 상태와 상세 이동을 검토한다.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof ChangeSetView>;

export default meta;
type Story = StoryObj<typeof meta>;

const filterableRows = [
  changeSetRows[0],
  {
    ...changeSetRows[0],
    title: "2026-06-12 표준 용어 브라우저",
    status: "대기",
    requestedDate: "2026-06-12",
    affectedRequirements: changeSetRows[0].affectedRequirements.slice(2, 3),
    summary: "프로젝트 표준 용어 목록 조회와 검색 화면을 구성한다.",
    scopeItems: ["표준 용어 목록", "용어 상세", "검색 필터"],
    completionCriteria: ["REQ-036 Skeleton 검토", "Storybook 상태 확인"],
    verificationCommands: ["npm run harness:trace -- --requirement REQ-036"],
    openDiscussions: ["용어 상세 표시 밀도 확인"],
  },
];

export const List: Story = {
  args: { rows: changeSetRows },
  parameters: {
    docs: {
      description: {
        story: "Change Set 카드 목록 기본 상태다. 제목, 우측 상단 상태 뱃지, 요청일, 영향 요건 수, 열린 논의 수가 카드 요약에서 읽히는지 확인한다.",
      },
    },
  },
};

export const Detail: Story = {
  args: { rows: changeSetRows },
  parameters: {
    docs: {
      description: {
        story: "카드 내부 상세 펼침 상태다. 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의가 같은 카드 안에서 분리되어 보이는지 확인한다.",
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

export const FilteredByTitle: Story = {
  args: { rows: filterableRows, initialTitleQuery: "표준 용어" },
  parameters: {
    docs: {
      description: {
        story: "제목 검색이 적용된 상태다. 제목에 검색어가 포함된 Change Set만 남고 결과 수가 갱신되는지 확인한다.",
      },
    },
  },
};

export const FilteredByStatus: Story = {
  args: { rows: filterableRows, initialStatus: "대기" },
  parameters: {
    docs: {
      description: {
        story: "상태 필터가 적용된 상태다. 선택한 상태의 Change Set만 남는지 확인한다.",
      },
    },
  },
};

export const FilteredByAffectedRequirement: Story = {
  args: { rows: filterableRows, initialAffectedRequirement: "REQ-030" },
  parameters: {
    docs: {
      description: {
        story: "영향 요건 필터가 적용된 상태다. 필터 막대에는 선택한 요건 ID만 한 줄로 표시되고, 선택한 요건을 영향 범위에 포함한 Change Set만 남는지 확인한다.",
      },
    },
  },
};

export const EmptyResult: Story = {
  args: { rows: filterableRows, initialTitleQuery: "존재하지 않는 Change Set" },
  parameters: {
    docs: {
      description: {
        story: "필터 결과가 없는 상태다. 카드 목록 대신 빈 결과 안내가 표시되는지 확인한다.",
      },
    },
  },
};

export const EmptyAffectedRequirements: Story = {
  args: { rows: [{ ...changeSetRows[0], affectedRequirements: [] }] },
  parameters: {
    docs: {
      description: {
        story: "영향 요건이 없는 Change Set 상태다. 카드 요약의 영향 요건 수와 펼침 상세의 빈 상태가 명확히 보이는지 확인한다.",
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
