import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { terminologyBrowser } from "../../lib/harness-data/fixtures";
import { TerminologyBrowser } from "./TerminologyBrowserPage";

const meta = {
  title: "Harness/Terminology/TerminologyBrowser",
  component: TerminologyBrowser,
  parameters: {
    harness: { requirements: ["REQ-036"] },
    docs: {
      description: {
        component: "선택한 scope의 terminology.index.json 산출물을 기준으로 전체 표준 용어 목록, 검색, 필터, 상세 정보를 검토한다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TerminologyBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTerms: Story = {
  args: { model: terminologyBrowser },
  parameters: {
    docs: {
      description: {
        story: "전체 표준 용어 목록 상태다. term key, 승인 상태, 한국어 이름, 영어 이름, 의미, source file이 목록에서 함께 읽히는지 확인한다.",
      },
    },
  },
};

export const SearchResults: Story = {
  args: { model: terminologyBrowser, initialQuery: "traceState" },
  parameters: {
    docs: {
      description: {
        story: "코드 이름 검색 결과 상태다. names에 포함된 값으로도 목록이 좁혀지는지 확인한다.",
      },
    },
  },
};

export const FilteredByDomain: Story = {
  args: { model: terminologyBrowser, initialDomain: "ui" },
  parameters: {
    docs: {
      description: {
        story: "도메인 필터 적용 상태다. 선택한 도메인의 표준 용어만 남고 결과 수가 함께 표시되어야 한다.",
      },
    },
  },
};

export const FilteredByStatus: Story = {
  args: { model: terminologyBrowser, initialStatus: "draft" },
  parameters: {
    docs: {
      description: {
        story: "승인 상태 필터 적용 상태다. draft 용어만 남고 상태 뱃지가 명확히 보여야 한다.",
      },
    },
  },
};

export const TermDetail: Story = {
  args: { model: terminologyBrowser, initialSelectedKey: "ui.dialog" },
  parameters: {
    docs: {
      description: {
        story: "표준 용어 상세 상태다. 의미, 허용 표현, 금지 표현, 코드 이름, note, reason, source file을 한 화면에서 확인한다.",
      },
    },
  },
};

export const EmptyResult: Story = {
  args: { model: terminologyBrowser, initialQuery: "no-matching-term" },
  parameters: {
    docs: {
      description: {
        story: "검색 결과가 없는 상태다. 목록 영역에 빈 결과 안내가 표시되고 상세 영역은 선택 없음으로 남아야 한다.",
      },
    },
  },
};

export const Loading: Story = {
  args: { model: terminologyBrowser },
  render: () => <LoadingState label="표준 용어 목록을 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "표준 용어 산출물 조회 대기 상태다. 빈 목록을 먼저 보여주지 않고 로딩 상태를 명확히 표시한다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { model: terminologyBrowser },
  render: () => <ErrorState message="표준 용어 산출물을 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "terminology.index.json 조회 실패 상태다. 실패 메시지와 다시 시도 진입점이 함께 표시되는지 확인한다.",
      },
    },
  },
};
