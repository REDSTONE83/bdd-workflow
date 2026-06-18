import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { requirementRows } from "../../lib/harness-data/fixtures";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { RequirementPickerDialog } from "./RequirementPickerDialog";

const dialogHandlers = {
  onOpenChange: () => undefined,
  onSelect: () => undefined,
  onClear: () => undefined,
};

const scrollableRequirementRows = Array.from({ length: 6 }, (_, groupIndex) => {
  const suffix = String(groupIndex + 1).padStart(2, "0");
  return requirementRows.map((row) => ({
    ...row,
    id: `${row.id}-${suffix}`,
    title: `${row.title} ${suffix}`,
    parentRequirementIds: row.parentRequirementIds.map((id) => `${id}-${suffix}`),
    childRequirementIds: row.childRequirementIds.map((id) => `${id}-${suffix}`),
    relatedRequirementIds: row.relatedRequirementIds.map((id) => `${id}-${suffix}`),
  }));
}).flat();

function RequirementPickerDialogStoryFrame({
  args,
  docsMode,
}: {
  args: ComponentProps<typeof RequirementPickerDialog>;
  docsMode: boolean;
}) {
  const [open, setOpen] = useState(!docsMode && args.open);
  const [selectedRequirement, setSelectedRequirement] = useState(args.selectedRequirement);

  return (
    <section className="space-y-3">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">호출 화면 컨텐츠</div>
            <div className="mt-1 text-sm text-muted-foreground">
              선택 요건: {selectedRequirement ? `${selectedRequirement.id} ${selectedRequirement.title}` : "미선택"}
            </div>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            요건 검색/선택
          </Button>
        </div>
      </Card>
      <RequirementPickerDialog
        {...args}
        open={open}
        selectedRequirement={selectedRequirement}
        onOpenChange={setOpen}
        onSelect={(requirement) => setSelectedRequirement(requirement)}
        onClear={() => setSelectedRequirement(undefined)}
      />
    </section>
  );
}

function renderRequirementPickerDialog(
  args: ComponentProps<typeof RequirementPickerDialog>,
  context: { viewMode?: string },
) {
  return <RequirementPickerDialogStoryFrame args={args} docsMode={context.viewMode === "docs"} />;
}

const meta = {
  title: "Harness/Requirements/RequirementPickerDialog",
  component: RequirementPickerDialog,
  render: renderRequirementPickerDialog,
  parameters: {
    harness: { requirements: ["REQ-037"] },
    docs: {
      description: {
        component: "여러 하네스 화면에서 재사용하는 요건 검색/선택 대화상자의 밀도 높은 후보 카드, 상위/하위 요건 구조, 검색, 단일 선택, 선택 해제, 빈 결과 상태를 검토한다. Docs에서는 문서 본문을 가리지 않도록 닫힌 호출 화면 프레임으로 렌더링하고, Canvas에서는 열린 대화상자 상태를 검토한다.",
      },
    },
  },
  tags: ["autodocs", "test"],
} satisfies Meta<typeof RequirementPickerDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function dialogCanvas(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

function dialogPopup(canvasElement: HTMLElement) {
  const popup = canvasElement.ownerDocument.body.querySelector('[data-slot="dialog-popup"]');
  if (!(popup instanceof HTMLElement)) {
    throw new Error("dialog popup is not rendered");
  }
  return popup;
}

function candidateList(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body).getByLabelText("요건 후보 목록");
}

async function searchRequirement(canvasElement: HTMLElement, value: string) {
  const body = dialogCanvas(canvasElement);
  const input = body.getByLabelText("실행 대상 요건 검색");
  await userEvent.clear(input);
  await userEvent.type(input, value);
  await expect(input).toHaveValue(value);
}

export const Open: Story = {
  args: {
    open: true,
    requirements: requirementRows,
    selectedRequirement: undefined,
    ...dialogHandlers,
  },
  parameters: {
    harness: {
      covers: ["요건 검색/선택 대화상자는 후보 요건 목록을 요건 ID와 제목이 한 줄에 있고 추적 상태 뱃지가 우측 끝에 있는 밀도 높은 목록형 카드로 표시한다"],
    },
    docs: {
      description: {
        story: "Canvas에서는 기본으로 열린 상태다. Docs에서는 호출 화면 컨텐츠를 가리지 않도록 닫힌 상태로 시작하며, 후보 요건 카드에 요건 ID와 제목이 한 줄로 표시되고 추적 상태 뱃지는 우측 끝에 배치되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const body = dialogCanvas(canvasElement);
    await expect(await body.findByRole("heading", { name: "요건 검색/선택" })).toBeVisible();
    const list = within(candidateList(canvasElement));
    await expect(list.getByRole("button", { name: /REQ-030/ })).toBeVisible();
    await expect(list.getByText("하네스 UI 앱셸")).toBeVisible();
    await expect(list.getAllByText("RED")[0]).toBeVisible();
    await expect(list.getByLabelText("REQ-030 요건 구조")).toHaveTextContent("원자 요건");
  },
};

export const DocsClosedFrame: Story = {
  args: {
    open: true,
    requirements: requirementRows,
    selectedRequirement: undefined,
    ...dialogHandlers,
  },
  render: (args) => <RequirementPickerDialogStoryFrame args={args} docsMode />,
  parameters: {
    harness: {
      covers: ["Storybook Docs에서 요건 검색/선택 대화상자 story는 닫힌 호출 화면 프레임으로 렌더링되어 문서 본문을 가리지 않고 Canvas에서는 열린 대화상자 상태를 검토할 수 있다"],
    },
    docs: {
      description: {
        story: "Docs 렌더링을 대리하는 닫힌 호출 화면 프레임이다. 문서 본문을 가리는 portal 없이 호출 화면 컨텐츠가 먼저 보이고, 사용자가 열면 같은 대화상자를 검토할 수 있다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialogCanvas(canvasElement);
    await expect(canvas.getByText("호출 화면 컨텐츠")).toBeVisible();
    await expect(canvas.getByText("선택 요건: 미선택")).toBeVisible();
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "요건 검색/선택" }));
    await expect(await body.findByRole("heading", { name: "요건 검색/선택" })).toBeVisible();
  },
};

export const SearchResults: Story = {
  args: {
    open: true,
    requirements: requirementRows,
    selectedRequirement: undefined,
    initialQuery: "앱셸",
    ...dialogHandlers,
  },
  parameters: {
    harness: {
      covers: ["요건 검색/선택 대화상자는 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위, 명세 역할, 상위 요건 ID로 후보 요건을 검색할 수 있다"],
    },
    docs: {
      description: {
        story: "검색어가 입력된 상태다. ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위, 명세 역할, 상위 요건 ID 중 검색어와 일치하는 후보가 남는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const list = within(candidateList(canvasElement));
    await expect(list.getByRole("button", { name: /REQ-030/ })).toBeVisible();
    await expect(list.queryByRole("button", { name: /REQ-031/ })).not.toBeInTheDocument();

    // For each searchable field, type a value that matches one specific candidate
    // and assert a known non-matching candidate is absent. Values are taken from the
    // requirementRows fixture and exercise the matchesSearch fields directly.
    const fieldCases: Array<{ field: string; query: string; present: RegExp; absent: RegExp }> = [
      { field: "요건 ID", query: "REQ-010", present: /REQ-010/, absent: /REQ-030/ },
      { field: "추적 상태", query: "BLUE", present: /REQ-010/, absent: /REQ-030/ },
      { field: "카드 상태", query: "초안", present: /REQ-030/, absent: /REQ-010/ },
      { field: "제품 영역", query: "todo", present: /REQ-021/, absent: /REQ-030/ },
      { field: "우선순위", query: "중간", present: /REQ-028/, absent: /REQ-030/ },
      { field: "명세 역할", query: "상위 요건", present: /REQ-021/, absent: /REQ-030/ },
      // 상위 요건 ID: REQ-022's parentRequirementIds includes REQ-021, so a parent-id
      // search surfaces that child row; REQ-030 has no such parent and stays absent.
      { field: "상위 요건 ID", query: "REQ-021", present: /REQ-022/, absent: /REQ-030/ },
    ];

    for (const { query, present, absent } of fieldCases) {
      await searchRequirement(canvasElement, query);
      const results = within(candidateList(canvasElement));
      await expect(results.getByRole("button", { name: present })).toBeVisible();
      await expect(results.queryByRole("button", { name: absent })).not.toBeInTheDocument();
    }

    // 제목 검색도 동일하게 후보를 좁힌다.
    await searchRequirement(canvasElement, "앱셸");
    const titleResults = within(candidateList(canvasElement));
    await expect(titleResults.getByRole("button", { name: /REQ-030/ })).toBeVisible();
    await expect(titleResults.queryByRole("button", { name: /REQ-031/ })).not.toBeInTheDocument();
  },
};

export const ParentSearchIncludesChildren: Story = {
  args: {
    open: true,
    requirements: requirementRows,
    selectedRequirement: undefined,
    initialQuery: "개인별",
    ...dialogHandlers,
  },
  parameters: {
    harness: {
      covers: ["상위 요건이 검색어와 직접 일치하면 직계 하위 후보 요건도 목록에 표시되고 상위 검색 포함으로 구분된다"],
    },
    docs: {
      description: {
        story: "상위 요건 제목이 검색된 상태다. 직접 매칭된 상위 요건과 직계 하위 후보가 함께 보이고, 하위 후보에는 상위 검색 포함 뱃지가 표시되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const list = within(candidateList(canvasElement));
    await expect(list.getByRole("button", { name: /REQ-021/ })).toBeVisible();
    await expect(list.getByRole("button", { name: /REQ-022/ })).toBeVisible();
    await expect(list.getByRole("button", { name: /REQ-023/ })).toBeVisible();
    await expect(list.getAllByText("상위 검색 포함").length).toBeGreaterThanOrEqual(2);
  },
};

export const Hierarchy: Story = {
  args: {
    open: true,
    requirements: requirementRows.filter((row) => row.id === "REQ-021" || row.parentRequirementIds.includes("REQ-021")),
    selectedRequirement: requirementRows.find((row) => row.id === "REQ-023"),
    ...dialogHandlers,
  },
  parameters: {
    harness: {
      covers: ["하위 후보 요건 카드는 좌측 들여쓰기와 세로선으로 하위 관계가 구분된다"],
    },
    docs: {
      description: {
        story: "상위 요건과 하위 원자 요건 후보가 함께 있는 상태다. 후보 카드의 구조 뱃지 의미가 일관되고 하위 후보 카드가 좌측 들여쓰기와 세로선으로 표시되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const listElement = candidateList(canvasElement);
    const list = within(listElement);
    await expect(list.getByLabelText("REQ-021 요건 구조")).toHaveTextContent("상위 요건");
    await expect(list.getByLabelText("REQ-021 요건 구조")).toHaveTextContent("하위 5");
    await expect(list.getByLabelText("REQ-023 요건 구조")).toHaveTextContent("상위 REQ-021");

    // 하위 후보 요건은 별도 영역으로 구분되어 노출된다(REQ-022, REQ-023).
    const childRows = list.getAllByLabelText("하위 후보 요건");
    await expect(childRows).toHaveLength(2);
    const childButton = list.getByRole("button", { name: /REQ-023/ });
    await expect(childRows.some((row) => row.contains(childButton))).toBe(true);
    // 상위 요건 후보는 하위 후보 영역에 들어가지 않는다.
    const parentButton = list.getByRole("button", { name: /REQ-021/ });
    await expect(childRows.some((row) => row.contains(parentButton))).toBe(false);
  },
};

export const WithSelection: Story = {
  args: {
    open: true,
    requirements: requirementRows,
    selectedRequirement: undefined,
    ...dialogHandlers,
  },
  parameters: {
    harness: {
      covers: ["요건 검색/선택 대화상자는 별도 현재 선택 요약 영역 없이 후보 목록에서 선택된 요건을 구분하고 단일 요건 선택과 선택 해제를 지원한다"],
    },
    docs: {
      description: {
        story: "미선택에서 시작하는 상태다. 별도 현재 선택 요약 없이 한 줄 후보 카드에서 하나를 선택하면 그 요건만 선택으로 구분되고 호출 화면에 반영되며, 검색 입력 안의 선택 해제 아이콘으로 다시 미선택으로 돌아가는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialogCanvas(canvasElement);

    // 미선택 상태에서는 호출 화면이 미선택을 표시하고 해제 컨트롤도 없다.
    await expect(canvas.getByText("선택 요건: 미선택")).toBeVisible();
    await expect(body.queryByRole("button", { name: "선택 해제" })).not.toBeInTheDocument();

    // 후보 하나를 선택하면 대화상자가 닫히고 호출 화면에 선택 요건이 반영된다.
    await userEvent.click(within(candidateList(canvasElement)).getByRole("button", { name: /REQ-031/ }));
    await expect(canvas.getByText(/선택 요건: REQ-031/)).toBeVisible();

    // 다시 열면 선택된 후보만 단일 선택으로 구분된다(별도 현재 선택 요약 없음).
    await userEvent.click(canvas.getByRole("button", { name: "요건 검색/선택" }));
    await expect(await body.findByRole("heading", { name: "요건 검색/선택" })).toBeVisible();
    const reopened = within(candidateList(canvasElement));
    const selectedButton = reopened.getByRole("button", { name: /REQ-031/ });
    await expect(selectedButton).toHaveAttribute("aria-selected", "true");
    await expect(reopened.getByRole("button", { name: /REQ-030/ })).toHaveAttribute("aria-selected", "false");
    const selectedButtons = reopened
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-selected") === "true");
    await expect(selectedButtons).toHaveLength(1);
    await expect(dialogPopup(canvasElement)).not.toHaveTextContent("현재 선택");

    // 검색 입력 안의 선택 해제 컨트롤로 다시 미선택으로 돌아간다.
    await userEvent.click(body.getByRole("button", { name: "선택 해제" }));
    await expect(canvas.getByText("선택 요건: 미선택")).toBeVisible();
  },
};

export const ScrollableList: Story = {
  args: {
    open: true,
    requirements: scrollableRequirementRows,
    selectedRequirement: undefined,
    ...dialogHandlers,
  },
  parameters: {
    harness: {
      covers: ["요건 검색/선택 대화상자는 검색 결과 수와 무관하게 viewport 기준 고정 높이를 유지하고 후보 목록 영역만 상하 스크롤된다"],
    },
    docs: {
      description: {
        story: "후보 요건이 많은 상태다. 대화상자는 viewport 기준 고정 높이를 유지하고, 검색 결과 수가 달라져도 제목과 검색 입력은 흔들리지 않은 채 후보 목록 영역만 빈 상태 또는 상하 스크롤 상태로 바뀌는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const popup = dialogPopup(canvasElement);
    const list = candidateList(canvasElement);
    // 후보가 많을 때 목록 영역만 실제로 스크롤 가능한 상태인지(내용이 영역을 넘는지) 확인한다.
    await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    const beforeHeight = Math.round(popup.getBoundingClientRect().height);

    await searchRequirement(canvasElement, "REQ-030-01");
    await expect(within(candidateList(canvasElement)).getByRole("button", { name: /REQ-030-01/ })).toBeVisible();
    // 검색으로 결과 수가 줄어도 대화상자 전체 높이는 viewport 기준으로 고정된다.
    const afterHeight = Math.round(popup.getBoundingClientRect().height);
    await expect(afterHeight).toBe(beforeHeight);
  },
};

export const EmptyResult: Story = {
  args: {
    open: true,
    requirements: requirementRows,
    selectedRequirement: undefined,
    initialQuery: "존재하지 않는 요건",
    ...dialogHandlers,
  },
  parameters: {
    harness: {
      covers: ["검색 결과가 없으면 빈 결과 안내를 표시한다"],
    },
    docs: {
      description: {
        story: "검색 결과가 없는 상태다. 후보 목록 대신 빈 결과 안내가 표시되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const body = dialogCanvas(canvasElement);
    await expect(body.getByLabelText("실행 대상 요건 검색")).toHaveValue("존재하지 않는 요건");
    await expect(within(candidateList(canvasElement)).getByText("조건에 맞는 요건이 없다.")).toBeVisible();
  },
};
