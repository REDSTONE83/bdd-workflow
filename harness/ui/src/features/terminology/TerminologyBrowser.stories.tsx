import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
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
        component: "선택한 범위의 terminology.index.json 산출물을 기준으로 전체 표준 용어 목록, 검색, 필터, 상세 정보를 검토한다.",
      },
    },
  },
  tags: ["autodocs", "test"],
} satisfies Meta<typeof TerminologyBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTerms: Story = {
  args: { model: terminologyBrowser },
  parameters: {
    harness: {
      covers: ["표준 용어 화면은 전체 term key 목록을 승인 상태, 한국어 이름, 영어 이름, 의미, source file과 함께 표시한다"],
    },
    docs: {
      description: {
        story: "전체 표준 용어 목록 상태다. term key, 승인 상태, 한국어 이름, 영어 이름, 의미, source file이 목록에서 함께 읽히는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("표준 용어 목록")).toBeVisible();
    await expect(canvas.getAllByText("harness.standardTerm")[0]).toBeVisible();
    await expect(canvas.getAllByText("approved")[0]).toBeVisible();
    await expect(canvas.getAllByText("표준 용어")[0]).toBeVisible();
    await expect(canvas.getAllByText(/standard term/)[0]).toBeVisible();
    await expect(canvas.getAllByText(/하네스 용어 사전에 등록되어/)[0]).toBeVisible();
    await expect(canvas.getAllByText("harness/docs/terminology/domains/harness.json")[0]).toBeVisible();
  },
};

export const SearchResults: Story = {
  args: { model: terminologyBrowser, initialQuery: "traceState" },
  parameters: {
    harness: {
      covers: ["term key, 한국어 이름, 영어 이름, 의미, 허용 표현, 금지 표현, 코드 이름으로 표준 용어 목록을 검색할 수 있다"],
    },
    docs: {
      description: {
        story: "term key 외 의미, 허용 표현, 금지 표현으로도 목록이 좁혀지는지 확인한다. 코드 이름을 포함한 7개 검색 대상이 모두 동작해야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByLabelText("표준 용어 검색");

    // term key로 검색: "traceState"는 harness.traceState key의 부분 문자열이다.
    await userEvent.clear(search);
    await userEvent.type(search, "traceState");
    await expect(search).toHaveValue("traceState");
    await expect(canvas.getAllByText("harness.traceState")[0]).toBeVisible();
    await expect(canvas.queryByText("ui.dialog")).not.toBeInTheDocument();

    // 허용 표현(allow)으로 검색: "표준어"는 harness.standardTerm의 allow에만 있고 key/이름에는 없다.
    await userEvent.clear(search);
    await userEvent.type(search, "표준어");
    await expect(search).toHaveValue("표준어");
    await expect(canvas.getAllByText("harness.standardTerm")[0]).toBeVisible();
    await expect(canvas.queryByText("harness.traceState")).not.toBeInTheDocument();

    // 금지 표현(ban)으로 검색: "데드라인"은 todo.dueDate의 ban에만 있고 key/이름에는 없다.
    await userEvent.clear(search);
    await userEvent.type(search, "데드라인");
    await expect(search).toHaveValue("데드라인");
    await expect(canvas.getAllByText("todo.dueDate")[0]).toBeVisible();
    await expect(canvas.queryByText("harness.standardTerm")).not.toBeInTheDocument();
  },
};

export const FilteredByDomain: Story = {
  args: { model: terminologyBrowser, initialDomain: "ui" },
  parameters: {
    harness: {
      covers: ["도메인과 승인 상태로 표준 용어 목록을 좁힐 수 있다"],
    },
    docs: {
      description: {
        story: "도메인 필터 적용 상태다. 선택한 도메인의 표준 용어만 남고 결과 수가 함께 표시되어야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox", { name: "도메인 필터" })).toHaveTextContent("ui");
    await expect(canvas.getByText(/결과 2개/)).toBeVisible();
    await expect(canvas.getAllByText("ui.appShell")[0]).toBeVisible();
    await expect(canvas.getAllByText("ui.dialog")[0]).toBeVisible();
    await expect(canvas.queryByText("harness.standardTerm")).not.toBeInTheDocument();
  },
};

export const FilteredByStatus: Story = {
  args: { model: terminologyBrowser, initialStatus: "draft" },
  parameters: {
    harness: {
      covers: ["도메인과 승인 상태로 표준 용어 목록을 좁힐 수 있다"],
    },
    docs: {
      description: {
        story: "승인 상태 필터 적용 상태다. draft 용어만 남고 상태 뱃지가 명확히 보여야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox", { name: "승인 상태 필터" })).toHaveTextContent("draft");
    await expect(canvas.getByText(/결과 1개/)).toBeVisible();
    await expect(canvas.getAllByText("todo.dueDate")[0]).toBeVisible();
    await expect(canvas.queryByText("harness.standardTerm")).not.toBeInTheDocument();
  },
};

export const TermDetail: Story = {
  args: { model: terminologyBrowser, initialSelectedKey: "ui.dialog" },
  parameters: {
    harness: {
      covers: ["표준 용어를 선택하면 의미, 허용 표현, 금지 표현, 코드 이름, note, reason을 확인할 수 있다"],
    },
    docs: {
      description: {
        story: "표준 용어 상세 상태다. 의미, 허용 표현, 금지 표현, 코드 이름, note, reason, source file을 한 화면에서 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "대화상자" })).toBeVisible();
    await expect(canvas.getAllByText("ui.dialog")[0]).toBeVisible();
    await expect(canvas.getAllByText(/dialog/)[0]).toBeVisible();
    await expect(canvas.getByText("모달")).toBeVisible();
    await expect(canvas.getByText(/본문 어휘 통제용 등록이다/)).toBeVisible();
    await expect(canvas.getByText(/요건 본문에서 대화상자 표현을 정규화/)).toBeVisible();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("조건에 맞는 표준 용어가 없다.")).toBeVisible();
    await expect(canvas.getByText("선택한 표준 용어가 없다.")).toBeVisible();
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
