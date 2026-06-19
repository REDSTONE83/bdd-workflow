import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { AppShell } from "./AppShell";
import { appShellDefault, appShellMissing, appShellStale } from "../../lib/harness-data/fixtures";
import type { ArtifactSummary } from "../../lib/harness-data/types";
import { Button } from "../../components/ui/button";

const meta = {
  title: "Harness/Shell/AppShell",
  component: AppShell,
  parameters: {
    harness: { requirements: ["REQ-030"] },
    docs: {
      description: {
        component: "하네스 UI의 공통 머리 영역, 범위 전환, 좌측 LNB, 산출물 상태를 검토한다.",
      },
    },
  },
  tags: ["autodocs", "test"],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/requirements"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = <div className="harness-panel p-6 text-sm text-slate-700">route content</div>;

function RouteProbe() {
  const location = useLocation();
  return <div aria-label="현재 route">{location.pathname}</div>;
}

function AutoRefreshFrame({ initialModel }: { initialModel: ArtifactSummary }) {
  const [model, setModel] = useState(initialModel);

  return (
    <AppShell model={model}>
      <div className="harness-panel p-6 text-sm text-slate-700">
        <div aria-label="산출물 버전">{model.generatedAt}</div>
        <Button
          size="sm"
          onClick={() =>
            setModel({
              ...model,
              generatedAt: "2026-06-10T14:31:20.000Z",
              autoRefresh: "updated",
            })
          }
        >
          산출물 파일 갱신 이벤트
        </Button>
      </div>
    </AppShell>
  );
}

function ScopeSwitchFrame() {
  const [scope, setScope] = useState<ArtifactSummary["scope"]>("harness");
  const model: ArtifactSummary =
    scope === "harness"
      ? appShellDefault
      : { ...appShellDefault, scope: "application", generatedAt: "2026-06-11T09:00:00.000Z" };

  return (
    <AppShell model={model} onScopeChange={setScope}>
      <div className="harness-panel p-6 text-sm text-slate-700">
        <div aria-label="현재 범위 본문">{scope}</div>
      </div>
    </AppShell>
  );
}

export const DefaultArtifacts: Story = {
  args: { model: appShellDefault, children: body },
  parameters: {
    harness: {
      covers: [
        "하네스 UI는 모든 화면에서 요건, 표준 용어, 게이트, Change Set, 실행 화면으로 이동하는 좌측 LNB를 표시한다",
        "화면은 표시 중인 산출물의 생성 시각을 표시한다",
      ],
    },
    docs: {
      description: {
        story: "산출물이 있는 기본 앱셸 상태다. 현재 범위, generatedAt, 좌측 LNB가 한 화면에서 읽히는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("요건 검증 하네스")).toBeVisible();
    for (const linkName of ["요건", "표준 용어", "게이트", "Change Set", "실행 화면"]) {
      await expect(canvas.getByRole("link", { name: new RegExp(linkName) })).toBeVisible();
    }
    await expect(canvas.getByText("generatedAt: 2026-06-10T14:25:52.986Z")).toBeVisible();
  },
};

export const TerminologyNavigation: Story = {
  args: {
    model: appShellDefault,
    children: (
      <div className="harness-panel p-6 text-sm text-slate-700">
        <RouteProbe />
      </div>
    ),
  },
  parameters: {
    harness: {
      requirements: ["REQ-036"],
      covers: ["AppShell 좌측 LNB에서 표준 용어 화면으로 이동할 수 있다"],
    },
    docs: {
      description: {
        story: "좌측 LNB의 표준 용어 메뉴가 /terminology route로 이동하는 상태다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("현재 route")).toHaveTextContent("/requirements");
    await userEvent.click(canvas.getByRole("link", { name: /표준 용어/ }));
    await expect(canvas.getByLabelText("현재 route")).toHaveTextContent("/terminology");
  },
};

export const MissingArtifacts: Story = {
  args: { model: appShellMissing, children: body },
  parameters: {
    harness: {
      covers: ["선택한 scope의 검증 산출물이 없으면 산출물 생성 명령 안내가 표시된다"],
    },
    docs: {
      description: {
        story: "선택한 범위의 산출물이 없을 때 생성 명령 안내가 표시되는 상태다. 빈 화면 대신 다음 검증 행동이 드러나야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/선택한 범위의 검증 산출물이 없다/)).toBeVisible();
    await expect(canvas.getByText(/npm run harness:validate/)).toBeVisible();
  },
};

export const StaleArtifacts: Story = {
  args: { model: appShellStale, children: body },
  parameters: {
    harness: {
      covers: ["산출물보다 늦게 바뀐 원본 문서가 있으면 오래된 데이터 경고가 표시된다"],
    },
    docs: {
      description: {
        story: "원본 문서가 산출물보다 늦게 바뀐 오래된 데이터 상태다. 경고 제목과 원본 파일 목록이 함께 표시되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("오래된 데이터 경고")).toBeVisible();
    await expect(canvas.getByText("harness/docs/requirements/REQ-030-harness-ui-app-shell.md")).toBeVisible();
  },
};

export const ScopeSwitch: Story = {
  args: { model: { ...appShellDefault, scope: "application" }, children: body },
  render: () => <ScopeSwitchFrame />,
  parameters: {
    harness: {
      covers: ["scope 전환으로 애플리케이션과 하네스 산출물을 오갈 수 있고, 현재 선택한 scope가 화면에 표시된다"],
    },
    docs: {
      description: {
        story: "범위 선택 컨트롤로 harness와 application 산출물을 오가는 상태다. 현재 선택한 범위와 그 범위의 산출물 생성 시각이 화면에 반영되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    // 현재 선택한 scope(harness)가 화면에 표시된다
    await expect(canvas.getByRole("combobox", { name: "범위 선택" })).toHaveTextContent("harness");
    await expect(canvas.getByLabelText("현재 범위 본문")).toHaveTextContent("harness");
    // scope 전환으로 application 산출물로 오간다
    await userEvent.click(canvas.getByRole("combobox", { name: "범위 선택" }));
    await userEvent.click(await documentBody.findByRole("option", { name: "application" }));
    await expect(canvas.getByRole("combobox", { name: "범위 선택" })).toHaveTextContent("application");
    await expect(canvas.getByLabelText("현재 범위 본문")).toHaveTextContent("application");
    await expect(canvas.getByText("generatedAt: 2026-06-11T09:00:00.000Z")).toBeVisible();
  },
};

export const AutoRefreshUpdated: Story = {
  args: { model: appShellDefault, children: body },
  render: (args) => <AutoRefreshFrame initialModel={args.model} />,
  parameters: {
    harness: {
      covers: ["산출물 파일이 바뀌면 새로 고침 없이 화면 내용이 갱신된다"],
    },
    docs: {
      description: {
        story: "산출물 파일 변경 이벤트가 들어온 뒤 같은 화면 안에서 generatedAt과 자동 갱신 상태가 갱신되는 상태다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("산출물 버전")).toHaveTextContent("2026-06-10T14:25:52.986Z");
    await expect(canvas.getByText("자동 갱신 대기")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "산출물 파일 갱신 이벤트" }));
    await expect(canvas.getByLabelText("산출물 버전")).toHaveTextContent("2026-06-10T14:31:20.000Z");
    await expect(canvas.getByText("generatedAt: 2026-06-10T14:31:20.000Z")).toBeVisible();
    await expect(canvas.getByText("자동 갱신됨")).toBeVisible();
  },
};

export const Loading: Story = {
  args: { model: appShellDefault, children: <div className="harness-panel p-6">불러오는 중</div> },
  parameters: {
    docs: {
      description: {
        story: "경로 본문이 로딩 중인 상태다. 앱셸의 전역 정보와 본문 로딩 상태가 분리되어 보이는지 확인한다.",
      },
    },
  },
};

export const ErrorState: Story = {
  args: { model: appShellDefault, children: <div className="harness-panel border-red-200 bg-red-50 p-6">조회 실패</div> },
  parameters: {
    docs: {
      description: {
        story: "경로 본문 조회가 실패한 상태다. 앱셸은 유지되고 실패 영역만 본문에 표시되는지 확인한다.",
      },
    },
  },
};
