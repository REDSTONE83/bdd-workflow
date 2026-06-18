import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { GateView } from "./GateViewPage";
import { findingRows, gateCategories } from "../../lib/harness-data/fixtures";
import type { FindingRow } from "../../lib/harness-data/types";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const filterableFindingRows: FindingRow[] = [
  ...findingRows,
  {
    ruleId: "CARD-STATUS-INVALID",
    severity: "warning",
    requirement: "REQ-030",
    file: "harness/docs/requirements/REQ-030-harness-ui-app-shell.md",
    message: "요건 카드 상태가 허용 목록에 없다.",
    evidence: "cardStatus=검토필요",
    recommendation: "카드 상태를 허용 목록 값으로 맞춘다.",
  },
];

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
  tags: ["autodocs", "test"],
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
    harness: {
      covers: ["게이트 화면은 8개 카테고리별 차단 여부와 검사 결과 수를 표시한다"],
    },
    docs: {
      description: {
        story: "하나 이상의 게이트 카테고리가 차단된 상태다. 차단 라벨과 검사 결과 수가 카테고리 카드에 함께 표시되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const category of ["TRACE", "CARD", "REF", "TRC", "BE", "FE", "SCN", "TRM"]) {
      await expect(canvas.getByText(category)).toBeVisible();
    }
    await expect(canvas.getByText("검사 결과 7")).toBeVisible();
    await expect(canvas.getByText("차단")).toBeVisible();
    await expect(canvas.getAllByText("통과")[0]).toBeVisible();
  },
};

export const FindingExpanded: Story = {
  args: { categories: gateCategories, findings: findingRows },
  parameters: {
    harness: {
      covers: ["각 검사 결과는 메시지와 파일 위치를 표시하고 근거와 권고 조치를 펼쳐 볼 수 있다"],
    },
    docs: {
      description: {
        story: "검사 결과의 상세 근거와 권고 조치가 펼쳐진 상태다. 메시지, 파일 경로, 근거, 권고가 서로 구분되어 보여야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const findingToggle = canvas.getByRole("button", { name: /TRACE-AC-MISSING/ });
    // 메시지와 파일 위치는 펼침 여부와 무관하게 항상 보인다.
    await expect(canvas.getByText(/요건 추적 보드 UI 테스트가 아직 연결되지 않았다/)).toBeVisible();
    await expect(canvas.getByText("REQ-031")).toBeVisible();
    await expect(canvas.getByText("harness/docs/requirements/REQ-031-harness-ui-requirement-board.md")).toBeVisible();
    // 첫 검사 결과는 펼쳐진 채로 열려 근거와 권고 조치가 보인다.
    await expect(canvas.getByText("requiredChecks ui=MISSING")).toBeVisible();
    await expect(canvas.getByText("harness/ui Storybook Vitest story 테스트를 작성한다.")).toBeVisible();
    // 펼친 검사 결과를 다시 누르면 근거와 권고 조치가 접힌다.
    await userEvent.click(findingToggle);
    await waitFor(() => expect(canvas.queryByText("requiredChecks ui=MISSING")).not.toBeInTheDocument());
    await expect(canvas.queryByText("harness/ui Storybook Vitest story 테스트를 작성한다.")).not.toBeInTheDocument();
    // 접힌 검사 결과를 누르면 근거와 권고 조치를 다시 펼쳐 볼 수 있다.
    await userEvent.click(findingToggle);
    await expect(await canvas.findByText("requiredChecks ui=MISSING")).toBeVisible();
    await expect(canvas.getByText("harness/ui Storybook Vitest story 테스트를 작성한다.")).toBeVisible();
    await expect(canvas.getByText(/요건 추적 보드 UI 테스트가 아직 연결되지 않았다/)).toBeVisible();
    await expect(canvas.getByText("harness/docs/requirements/REQ-031-harness-ui-requirement-board.md")).toBeVisible();
  },
};

export const Filtered: Story = {
  args: { categories: gateCategories, findings: filterableFindingRows },
  parameters: {
    harness: {
      covers: ["검사 결과 목록은 규칙, 심각도, 요건, 파일 경로로 좁힐 수 있다"],
    },
    docs: {
      description: {
        story: "검사 결과가 특정 규칙으로 좁혀진 상태다. 필터 영역과 결과 목록이 같은 규칙을 기준으로 읽히는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filterInput = canvas.getByPlaceholderText("규칙, 심각도, 요건, 파일 경로");
    const applyButton = canvas.getByRole("button", { name: "필터 적용" });
    await expect(filterInput).toBeVisible();
    await expect(canvas.getByText(/CARD-STATUS-INVALID/)).toBeVisible();

    // 규칙 ID로 좁힌다: TRACE-AC-MISSING만 남고 CARD-STATUS-INVALID는 사라진다.
    await userEvent.type(filterInput, "TRACE-AC-MISSING");
    await userEvent.click(applyButton);
    await expect(canvas.getByText(/TRACE-AC-MISSING/)).toBeVisible();
    await expect(canvas.getByText("REQ-031")).toBeVisible();
    await expect(canvas.getByText("harness/docs/requirements/REQ-031-harness-ui-requirement-board.md")).toBeVisible();
    await waitFor(() => expect(canvas.queryByText(/CARD-STATUS-INVALID/)).not.toBeInTheDocument());

    // 심각도로 좁힌다: warning인 CARD-STATUS-INVALID만 남고 error인 TRACE-AC-MISSING는 사라진다.
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, "warning");
    await userEvent.click(applyButton);
    await expect(canvas.getByText(/CARD-STATUS-INVALID/)).toBeVisible();
    await waitFor(() => expect(canvas.queryByText(/TRACE-AC-MISSING/)).not.toBeInTheDocument());

    // 요건 ID로 좁힌다: REQ-031의 TRACE-AC-MISSING만 남고 REQ-030의 CARD-STATUS-INVALID는 사라진다.
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, "REQ-031");
    await userEvent.click(applyButton);
    await expect(canvas.getByText(/TRACE-AC-MISSING/)).toBeVisible();
    await waitFor(() => expect(canvas.queryByText(/CARD-STATUS-INVALID/)).not.toBeInTheDocument());

    // 파일 경로로 좁힌다: app-shell 경로의 CARD-STATUS-INVALID만 남고 TRACE-AC-MISSING는 사라진다.
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, "app-shell");
    await userEvent.click(applyButton);
    await expect(canvas.getByText(/CARD-STATUS-INVALID/)).toBeVisible();
    await expect(canvas.getByText("harness/docs/requirements/REQ-030-harness-ui-app-shell.md")).toBeVisible();
    await waitFor(() => expect(canvas.queryByText(/TRACE-AC-MISSING/)).not.toBeInTheDocument());
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
