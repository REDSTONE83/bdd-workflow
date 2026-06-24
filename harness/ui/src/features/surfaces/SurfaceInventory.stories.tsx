import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { surfaceInventory } from "../../lib/harness-data/fixtures";
import { SurfaceInventory } from "./SurfaceInventoryPage";

const emptyInventory = {
  ...surfaceInventory,
  generatedAt: null,
  apis: [],
  entities: [],
  uiSurfaces: [],
};

const meta = {
  title: "Harness/Surfaces/SurfaceInventory",
  component: SurfaceInventory,
  parameters: {
    harness: { requirements: ["REQ-038"] },
    docs: {
      description: {
        component: "선택한 범위의 API, Entity, UI 표면을 탭별 목록형 카드로 검토한다.",
      },
    },
  },
  tags: ["autodocs", "test"],
} satisfies Meta<typeof SurfaceInventory>;

export default meta;
type Story = StoryObj<typeof meta>;

function visibleText(canvas: ReturnType<typeof within>, text: string | RegExp) {
  const element = canvas.getAllByText(text).find((candidate: HTMLElement) => !candidate.closest("[hidden], [data-hidden], [aria-hidden='true']"));
  if (!element) throw new Error(`Visible text not found: ${text.toString()}`);
  return element;
}

export const ApiTab: Story = {
  args: { model: surfaceInventory },
  parameters: {
    harness: {
      covers: [
        "표면 조회 화면은 API, Entity, UI 표면 수를 요약하고 세 표면을 탭별 목록형 카드로 조회할 수 있다",
        "API 탭은 method, path, operationId, 연결 요건, 구현 위치, 응답 코드와 Request/Response 구성을 카드 펼침으로 표시한다",
      ],
    },
    docs: {
      description: {
        story: "API 탭 기본 상태다. 표면 종류별 수, 탭, API 카드의 요청/응답 정보를 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(visibleText(canvas, "API")).toBeVisible();
    await expect(visibleText(canvas, "Entity")).toBeVisible();
    await expect(visibleText(canvas, "UI 표면")).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "API" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "Entity" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "UI" })).toBeVisible();
    await expect(canvas.getAllByText("POST")[0]).toBeVisible();
    await expect(canvas.getAllByText("/todos")[0]).toBeVisible();
    await expect(canvas.getByText(/TodoController\.createTodo/)).toBeVisible();
    await expect(canvas.getAllByText("REQ-022")[0]).toBeVisible();
    await expect(visibleText(canvas, "CreateTodoRequest")).toBeVisible();
    await expect(visibleText(canvas, "TodoResponse")).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: /Request/ })[0]);
    await expect(visibleText(canvas, "title")).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: /Response/ })[0]);
    await expect(visibleText(canvas, "todoId")).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: /참조 객체/ })[0]);
    await expect(visibleText(canvas, "TodoCategoryInfo")).toBeVisible();
    await expect(canvas.getByText("201")).toBeVisible();
  },
};

export const EntityTab: Story = {
  args: { model: surfaceInventory, initialTab: "entity" },
  parameters: {
    harness: {
      covers: ["Entity 탭은 className, table, 연결 요건, 구현 위치, listener, 컬럼 정보를 카드에 표시한다"],
    },
    docs: {
      description: {
        story: "Entity 탭 상태다. Entity 목록형 카드의 listener, 컬럼 정보가 보이는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "Entity" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getAllByText("todo")[0]).toBeVisible();
    await expect(canvas.getAllByText("Todo")[0]).toBeVisible();
    await expect(canvas.getByText(/AuditingEntityListener/)).toBeVisible();
    await expect(canvas.getByText("컬럼 목록")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /컬럼 목록/ }));
    await expect(visibleText(canvas, "title")).toBeVisible();
    await expect(visibleText(canvas, "String")).toBeVisible();
  },
};

export const UiTab: Story = {
  args: { model: surfaceInventory, initialTab: "ui" },
  parameters: {
    harness: {
      covers: ["UI 탭은 Page, Route, Story, route 또는 Storybook 식별자, 연결 요건, 구현 위치, Storybook 검토 링크, play/assertion 여부를 카드에 표시한다"],
    },
    docs: {
      description: {
        story: "UI 탭 상태다. Page, Route, Story 목록과 Storybook 검토 링크, play/assertion 여부를 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "UI" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getAllByText("Page")[0]).toBeVisible();
    await expect(canvas.getAllByText("Route")[0]).toBeVisible();
    await expect(canvas.getAllByText("Story")[0]).toBeVisible();
    await expect(visibleText(canvas, "TodoListView")).toBeVisible();
    await expect(visibleText(canvas, "/todos")).toBeVisible();
    await expect(canvas.getByText("Storybook 검토")).toBeVisible();
    await expect(visibleText(canvas, "있음")).toBeVisible();
  },
};

export const SearchResults: Story = {
  args: { model: surfaceInventory, initialQuery: "listTodos" },
  parameters: {
    harness: {
      covers: ["검색어로 현재 탭의 표면 목록을 이름, 경로, 파일, 연결 요건, 주요 식별자 기준으로 좁힐 수 있다"],
    },
    docs: {
      description: {
        story: "검색어가 적용된 상태다. 현재 탭 목록이 주요 식별자 기준으로 좁혀지는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("표면 검색")).toHaveValue("listTodos");
    await expect(canvas.getByText(/TodoController\.listTodos/)).toBeVisible();
    await expect(canvas.queryByText("TodoController.createTodo")).not.toBeInTheDocument();
  },
};

export const EmptyScope: Story = {
  args: { model: emptyInventory },
  parameters: {
    docs: {
      description: {
        story: "선택한 scope에 조회 가능한 표면이 없는 상태다. 목록 대신 빈 결과 안내가 보여야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("조건에 맞는 API가 없다.")).toBeVisible();
  },
};

export const Loading: Story = {
  args: { model: surfaceInventory },
  render: () => <LoadingState label="표면 목록을 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "표면 조회 산출물 대기 상태다. 부분 목록을 보여주지 않고 로딩 상태를 표시한다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { model: surfaceInventory },
  render: () => <ErrorState message="표면 조회 산출물을 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "표면 조회 산출물 실패 상태다. 실패 메시지와 재시도 진입점을 확인한다.",
      },
    },
  },
};
