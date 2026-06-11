import type { Meta, StoryObj } from "@storybook/react-vite";
import { RequirementDetailView } from "./RequirementDetailPage";
import { requirementDetail } from "../../lib/harness-data/fixtures";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const meta = {
  title: "Harness/Requirements/RequirementDetail",
  component: RequirementDetailView,
  parameters: {
    harness: { requirements: ["REQ-032"] },
    docs: {
      description: {
        component: "요건 하나의 메타데이터 아래에서 개요, AC, 시나리오, UI, API 계약, Entity, 산출물/소스 탭으로 AC 카드 목록, 시나리오별 테스트 정보, UI 표면 목록형 카드, API Request/Response, Entity 목록형 카드, 요건 카드/시나리오 연결 산출물과 UI 접두 뱃지가 있는 소스 위치 카드를 확인한다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RequirementDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteCoverage: Story = {
  args: {
    detail: {
      ...requirementDetail,
      traceState: "BLUE",
      redReasons: [],
      blueBlockedBy: [],
      acceptanceCriteria: requirementDetail.acceptanceCriteria.map((row) => ({ ...row, status: "PASS" })),
      scenarios: requirementDetail.scenarios.map((scenario) => ({ ...scenario, status: "연결됨" })),
      coverage: requirementDetail.coverage.map((row) => ({ ...row, status: "PASS", tests: ["harness/ui/tests/e2e/requirements.spec.ts"] })),
    },
  },
  parameters: {
    docs: {
      description: {
        story: "모든 AC 커버리지가 PASS이고 RED/BLUE 차단 사유가 없는 상태다. 메타데이터, AC 항목 카드의 연결 테스트와 시나리오 항목의 테스트 정보가 BLUE 상태와 일관되는지 확인한다.",
      },
    },
  },
};

export const RedReasons: Story = {
  args: { detail: requirementDetail },
  parameters: {
    docs: {
      description: {
        story: "추적 산출물에 RED 사유가 있는 상태다. 규칙 ID와 메시지가 누락 없이 표시되는지 확인한다.",
      },
    },
  },
};

export const BlueBlocked: Story = {
  args: { detail: { ...requirementDetail, redReasons: [], traceState: "GREEN" } },
  parameters: {
    docs: {
      description: {
        story: "GREEN이지만 BLUE 승인을 막는 조건이 남은 상태다. 차단 사유 목록이 별도 영역에서 읽히는지 확인한다.",
      },
    },
  },
};

export const LinkedArtifacts: Story = {
  args: { detail: requirementDetail },
  parameters: {
    docs: {
      description: {
        story: "카드 원본과 시나리오 산출물 링크가 표시되는 상태다. 산출물/소스 탭의 연결 산출물에는 요건 카드와 시나리오만 보이고, 소스 위치에는 산출물 파일 없이 API/Data/UI 구현 표면이 종류 뱃지가 있는 목록형 카드로 보이는지 확인한다.",
      },
    },
  },
};

export const AcceptanceAndScenarios: Story = {
  args: { detail: requirementDetail },
  parameters: {
    docs: {
      description: {
        story: "AC 탭과 시나리오 탭에서 수용 기준 원문 카드 목록과 BDD Scenario 목록을 각각 확인하는 상태다. 각 AC의 검증 채널, 판정, 연결 테스트와 시나리오, 각 시나리오의 Covers, 커버리지 판정, 연결 테스트, 번호 없는 GWT, feature 위치가 보여야 한다.",
      },
    },
  },
};

export const SkeletonContracts: Story = {
  args: { detail: requirementDetail },
  parameters: {
    docs: {
      description: {
        story: "API 계약 탭에서 요건에 연결된 API 작업 목록형 카드, Request/Response 펼침, Request/Response 필드의 참조 객체 펼침을 확인하고, Entity 탭에서 Entity 목록형 카드와 속성 목록 펼침을 확인하는 상태다. UI 표면은 UI 탭에서 description이 있는 목록형 카드로 표시되고 Storybook 링크와 구현 위치 링크를 제공해야 한다.",
      },
    },
  },
};

export const Loading: Story = {
  args: { detail: requirementDetail },
  render: () => <LoadingState label="요건 상세를 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "요건 상세 조회 대기 상태다. 상세 표나 finding 영역을 미리 표시하지 않고 로딩 상태만 보여준다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { detail: requirementDetail },
  render: () => <ErrorState message="요건 상세 산출물을 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "요건 상세 산출물 조회 실패 상태다. 오류 메시지와 다시 시도 진입점이 같은 패널 안에 표시되어야 한다.",
      },
    },
  },
};
