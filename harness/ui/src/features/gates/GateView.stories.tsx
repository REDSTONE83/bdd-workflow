import type { Meta, StoryObj } from "@storybook/react-vite";
import { GateView } from "./GateViewPage";
import { findingRows, gateCategories } from "../../lib/harness-data/fixtures";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const meta = {
  title: "Harness/Gates/GateView",
  component: GateView,
  parameters: {
    harness: { requirements: ["REQ-033"] },
    docs: {
      description: {
        component: "통합 게이트 도구가 만든 카테고리 판정과 검사 결과 목록을 화면에서 검토한다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GateView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Passing: Story = {
  args: { categories: gateCategories.map((category) => ({ ...category, blocked: false, errors: 0 })), findings: [] },
  parameters: {
    docs: {
      description: {
        story: "모든 게이트 카테고리가 통과한 상태다. 8개 카테고리의 통과 라벨과 0건 결과가 조용하게 스캔되는지 확인한다.",
      },
    },
  },
};

export const CategoryBlocked: Story = {
  args: { categories: gateCategories, findings: findingRows },
  parameters: {
    docs: {
      description: {
        story: "하나 이상의 게이트 카테고리가 차단된 상태다. 차단 라벨과 검사 결과 수가 카테고리 카드에 함께 표시되는지 확인한다.",
      },
    },
  },
};

export const FindingExpanded: Story = {
  args: { categories: gateCategories, findings: findingRows },
  parameters: {
    docs: {
      description: {
        story: "검사 결과의 상세 근거와 권고 조치가 펼쳐진 상태다. 메시지, 파일 경로, 근거, 권고가 서로 구분되어 보여야 한다.",
      },
    },
  },
};

export const Filtered: Story = {
  args: { categories: gateCategories, findings: findingRows.filter((finding) => finding.ruleId === "TRACE-AC-MISSING") },
  parameters: {
    docs: {
      description: {
        story: "검사 결과가 특정 규칙으로 좁혀진 상태다. 필터 영역과 결과 목록이 같은 규칙을 기준으로 읽히는지 확인한다.",
      },
    },
  },
};

export const Loading: Story = {
  args: { categories: [], findings: [] },
  render: () => <LoadingState label="게이트 결과를 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "게이트 리포트 조회 대기 상태다. 카테고리 요약을 임의 기본값으로 표시하지 않고 로딩 상태를 제공한다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { categories: [], findings: [] },
  render: () => <ErrorState message="게이트 리포트를 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "게이트 리포트 조회 실패 상태다. 오류 메시지와 다시 시도 진입점이 표시되는지 확인한다.",
      },
    },
  },
};
