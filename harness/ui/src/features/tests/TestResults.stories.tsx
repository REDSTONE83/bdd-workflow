import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { testResults } from "../../lib/harness-data/fixtures";
import { TestResults } from "./TestResultsPage";

const emptyResults = {
  ...testResults,
  generatedAt: null,
  sourceGeneratedAt: null,
  resultGeneratedAt: null,
  summary: testResults.summary.map((entry) => ({ ...entry, count: 0 })),
  typeSummary: testResults.typeSummary.map((entry) => ({ ...entry, count: 0 })),
  tests: [],
  issues: [],
};

const cleanResults = {
  ...testResults,
  issues: [],
};

const meta = {
  title: "Harness/Tests/TestResults",
  component: TestResults,
  parameters: {
    harness: { requirements: ["REQ-039"] },
    docs: {
      description: {
        component: "선택한 범위의 테스트 정의와 수행 결과를 한 목록에서 검토한다.",
      },
    },
  },
  tags: ["autodocs", "test"],
} satisfies Meta<typeof TestResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SummaryAndList: Story = {
  args: { model: cleanResults },
  parameters: {
    harness: {
      covers: [
        "테스트 결과 화면은 선택한 scope의 테스트 총수와 PASS, FAIL, SKIP, NOT_RUN 수를 요약하고 테스트 목록을 표시한다",
        "각 테스트 행은 테스트 구분, 런타임, 수행 상태, 연결 요건 ID와 제목, 구현 위치, Cover 문구와 연결된 요건 ID와 제목을 표시한다",
      ],
    },
    docs: {
      description: {
        story: "테스트 결과 기본 상태다. 상태별 요약과 각 테스트의 런타임, 상태, 요건, 구현 위치가 함께 보여야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("전체 테스트")).toBeVisible();
    await expect(canvas.getAllByText("PASS")[0]).toBeVisible();
    await expect(canvas.getAllByText("FAIL")[0]).toBeVisible();
    await expect(canvas.getAllByText("SKIP")[0]).toBeVisible();
    await expect(canvas.getAllByText("NOT_RUN")[0]).toBeVisible();
    await expect(canvas.getByText("Harness/Tests/TestResults / SummaryAndList")).toBeVisible();
    await expect(canvas.getAllByText("UI")[0]).toBeVisible();
    await expect(canvas.getAllByText("storybook-vitest")[0]).toBeVisible();
    await expect(canvas.getAllByText("REQ-039 - 하네스 UI 테스트 결과 조회")[0]).toBeVisible();
    await expect(canvas.getAllByText("harness/ui/src/features/tests/TestResults.stories.tsx:42")[0]).toBeVisible();
    await expect(canvas.getAllByText("구현 위치 없음")[0]).toBeVisible();
    await expect(canvas.queryByText("build/app/test-results/e2e-live-results.json")).not.toBeInTheDocument();
    await expect(canvas.queryByText("수행 결과")).not.toBeInTheDocument();
    await expect(canvas.queryByText("구현 위치와 동일")).not.toBeInTheDocument();
    await expect(canvas.queryByText("식별자 상세")).not.toBeInTheDocument();
    await expect(canvas.queryByText("테스트 식별자")).not.toBeInTheDocument();
    await expect(canvas.queryByText("결과 식별자")).not.toBeInTheDocument();
    await userEvent.click(canvas.getAllByRole("button", { name: /Cover/ })[0]);
    await expect(canvas.getByText(/Cover 문구와 연결된 요건 ID와 제목/)).toBeVisible();
    await expect(canvas.getAllByText("REQ-039 - 하네스 UI 테스트 결과 조회")[0]).toBeVisible();
  },
};

export const Filtered: Story = {
  args: { model: testResults },
  parameters: {
    harness: {
      covers: ["검색어, 테스트 구분, 런타임, 수행 상태로 테스트 목록을 좁힐 수 있다"],
    },
    docs: {
      description: {
        story: "검색어, 상태, 런타임으로 테스트 목록을 좁힌 상태다. 남은 목록은 세 조건을 모두 만족해야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("테스트 검색"), "GateView");
    await userEvent.click(canvas.getByRole("combobox", { name: "수행 상태 필터" }));
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("option", { name: "FAIL" }));
    await userEvent.click(canvas.getByRole("combobox", { name: "테스트 구분 필터" }));
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("option", { name: "UI" }));
    await userEvent.click(canvas.getByRole("combobox", { name: "런타임 필터" }));
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("option", { name: "storybook-vitest" }));

    await expect(canvas.getByText("Harness/Gates/GateView / Filtered")).toBeVisible();
    await expect(canvas.getAllByText("UI")[0]).toBeVisible();
    await expect(canvas.getAllByText("FAIL")[0]).toBeVisible();
    await expect(canvas.queryByText("Harness/Tests/TestResults / SummaryAndList")).not.toBeInTheDocument();
    await expect(canvas.queryByText("하네스 UI 서버는 테스트 정의와 수행 결과를 DTO로 보존한다")).not.toBeInTheDocument();
  },
};

export const FreshnessIssues: Story = {
  args: { model: testResults },
  parameters: {
    harness: {
      covers: ["테스트 결과 인덱스에 freshness 이슈가 있으면 화면에 이슈 목록을 표시한다"],
    },
    docs: {
      description: {
        story: "테스트 결과 인덱스에 freshness 이슈가 있는 상태다. 이슈 종류, 런타임, 사유가 목록 위에서 확인되어야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("테스트 결과 이슈")).toBeVisible();
    await expect(canvas.getByText("FE_TEST_RESULT_STALE")).toBeVisible();
    await expect(canvas.getByText("fingerprint-mismatch")).toBeVisible();
    await expect(canvas.queryByText("Harness/Gates/GateView > Filtered")).not.toBeInTheDocument();
    await expect(canvas.queryByText("build/harness/test-results/storybook-junit.xml")).not.toBeInTheDocument();
  },
};

export const EmptyScope: Story = {
  args: { model: emptyResults },
  parameters: {
    docs: {
      description: {
        story: "선택한 scope에 조회 가능한 테스트 정의나 수행 결과가 없는 상태다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("조건에 맞는 테스트 결과가 없다.")).toBeVisible();
  },
};

export const Loading: Story = {
  args: { model: testResults },
  render: () => <LoadingState label="테스트 결과를 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "테스트 결과 조회 대기 상태다. 부분 목록 대신 로딩 상태를 표시한다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { model: testResults },
  render: () => <ErrorState message="테스트 결과 산출물을 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "테스트 결과 조회 실패 상태다. 실패 메시지와 재시도 진입점을 확인한다.",
      },
    },
  },
};
