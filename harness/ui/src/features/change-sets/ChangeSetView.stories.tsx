import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ChangeSetView } from "./ChangeSetViewPage";
import { changeSetRows } from "../../lib/harness-data/fixtures";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

function RequirementNavigationProbe() {
  const location = useLocation();
  return (
    <section>
      <h1>요건 상세 이동</h1>
      <div aria-label="이동한 route">{location.pathname}</div>
    </section>
  );
}

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
  tags: ["autodocs", "test"],
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof ChangeSetView>;

export default meta;
type Story = StoryObj<typeof meta>;

const terminologyRequirement = {
  ...changeSetRows[0].affectedRequirements[0],
  id: "REQ-036",
  title: "하네스 UI 표준 용어 조회",
  traceState: "RED" as const,
  cardStatus: "Skeleton 검토중",
  priority: "중간",
  relatedRequirementIds: ["REQ-029", "REQ-030"],
};

const filterableRows = [
  changeSetRows[0],
  {
    ...changeSetRows[0],
    title: "2026-06-12 표준 용어 브라우저",
    status: "대기",
    requestedDate: "2026-06-12",
    affectedRequirements: [terminologyRequirement],
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
    harness: {
      covers: ["Change Set 목록은 제목, 상태, 요청일, 영향 요건 수, 열린 논의 수를 표시한다"],
    },
    docs: {
      description: {
        story: "Change Set 카드 목록 기본 상태다. 제목, 우측 상단 상태 뱃지, 요청일, 영향 요건 수, 열린 논의 수가 카드 요약에서 읽히는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Change Set" })).toBeVisible();
    await expect(canvas.getByText("2026-06-10 하네스 로컬 웹 UI MVP")).toBeVisible();
    await expect(canvas.getByText("진행중")).toBeVisible();
    await expect(canvas.getByText("2026-06-10")).toBeVisible();
    await expect(canvas.getByText("영향 요건 3")).toBeVisible();
    await expect(canvas.getByText("열린 논의 0")).toBeVisible();
  },
};

export const Detail: Story = {
  args: { rows: changeSetRows },
  parameters: {
    harness: {
      covers: ["Change Set 카드를 펼치면 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의, 영향 요건과 영향 요건의 추적 상태를 확인할 수 있다"],
    },
    docs: {
      description: {
        story: "카드 내부 상세 펼침 상태다. 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의가 같은 카드 안에서 분리되어 보이는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const heading of ["요청 요약", "작업 범위", "완료 조건", "검증 명령", "열린 논의", "영향 요건"]) {
      await expect(canvas.getByRole("heading", { name: heading })).toBeVisible();
    }
    await expect(canvas.getAllByText("하네스 산출물을 로컬 웹 UI에서 조회하고 검증 명령을 실행한다.")[0]).toBeVisible();
    await expect(canvas.getByText("하네스 UI 요건")).toBeVisible();
    await expect(canvas.getByText("REQ-029~REQ-035 승인")).toBeVisible();
    await expect(canvas.getByText("npm run harness:validate")).toBeVisible();
    // 영향 요건 REQ-010 항목과 그 추적 상태 뱃지(BLUE)가 같은 행에서 함께 보인다.
    const affectedRequirementRow = canvas.getByRole("link", { name: /REQ-010/ });
    await expect(affectedRequirementRow).toBeVisible();
    await expect(within(affectedRequirementRow).getByText("BLUE")).toBeVisible();
  },
};

export const LinkedRequirements: Story = {
  args: { rows: changeSetRows },
  render: (args) => (
    <Routes>
      <Route path="/" element={<ChangeSetView {...args} />} />
      <Route path="/requirements/:requirementId" element={<RequirementNavigationProbe />} />
    </Routes>
  ),
  parameters: {
    harness: {
      covers: ["영향 요건에서 해당 요건의 상세 화면으로 이동할 수 있다"],
    },
    docs: {
      description: {
        story: "영향 요건 링크 목록을 검토하는 상태다. 요건 ID, 제목, 추적 상태가 함께 표시되고 상세 화면 이동 링크로 동작해야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("link", { name: /REQ-030/ }));
    await expect(await canvas.findByRole("heading", { name: "요건 상세 이동" })).toBeVisible();
    await expect(canvas.getByLabelText("이동한 route")).toHaveTextContent("/requirements/REQ-030");
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
  args: { rows: filterableRows },
  parameters: {
    harness: {
      covers: ["Change Set 목록은 제목, 상태, 선택한 영향 요건으로 필터링할 수 있고 선택된 영향 요건 필터는 요건 ID만 표시하며 돋보기 아이콘으로 검색/선택 대화상자를 연다"],
    },
    docs: {
      description: {
        story: "영향 요건 필터를 돋보기 대화상자로 직접 선택하는 상태다. 처음에는 필터가 비어 모든 Change Set이 보이고, 돋보기로 대화상자를 열어 영향 요건 하나를 선택하면 그 요건을 영향 범위에 포함한 Change Set만 남고 필터 막대에는 선택한 요건 ID만 한 줄로 표시되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 시작 상태: 영향 요건 필터가 비어 있어 모든 Change Set이 보인다.
    await expect(canvas.getByLabelText("선택된 영향 요건 필터")).toHaveTextContent("전체 영향 요건");
    await expect(canvas.getByText("2026-06-10 하네스 로컬 웹 UI MVP")).toBeVisible();
    await expect(canvas.getByText("2026-06-12 표준 용어 브라우저")).toBeVisible();

    // 돋보기 아이콘으로 영향 요건 검색/선택 대화상자를 연다.
    await userEvent.click(canvas.getByRole("button", { name: "영향 요건 검색/선택" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await expect(dialog.getByRole("heading", { name: "영향 요건 검색/선택" })).toBeVisible();

    // 대화상자 안에서 영향 요건 후보 하나를 선택한다.
    await userEvent.click(dialog.getByRole("button", { name: /REQ-036/ }));

    // 선택한 요건을 영향 범위에 포함한 Change Set만 목록에 남는다.
    await expect(canvas.getByText("2026-06-12 표준 용어 브라우저")).toBeVisible();
    await expect(canvas.queryByText("2026-06-10 하네스 로컬 웹 UI MVP")).not.toBeInTheDocument();

    // 영향 요건 필터 막대에는 선택한 요건 ID만 보인다.
    await expect(canvas.getByLabelText("선택된 영향 요건 필터")).toHaveTextContent("REQ-036");
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
