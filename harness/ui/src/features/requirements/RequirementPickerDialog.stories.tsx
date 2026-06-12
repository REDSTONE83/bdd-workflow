import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useState } from "react";
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
};

export const WithSelection: Story = {
  args: {
    open: true,
    requirements: requirementRows,
    selectedRequirement: requirementRows[1],
    ...dialogHandlers,
  },
  parameters: {
    harness: {
      covers: ["요건 검색/선택 대화상자는 별도 현재 선택 요약 영역 없이 후보 목록에서 선택된 요건을 구분하고 단일 요건 선택과 선택 해제를 지원한다"],
    },
    docs: {
      description: {
        story: "현재 선택이 있는 상태다. 별도 현재 선택 요약 없이 한 줄 후보 카드에서 선택된 요건이 구분되고 검색 입력 안의 선택 해제 아이콘으로 해제할 수 있는지 확인한다.",
      },
    },
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
};
