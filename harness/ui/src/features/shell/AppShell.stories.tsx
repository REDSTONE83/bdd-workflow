import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { appShellDefault, appShellMissing, appShellStale } from "../../lib/harness-data/fixtures";

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
};

export const ScopeSwitch: Story = {
  args: { model: { ...appShellDefault, scope: "application", autoRefresh: "updated" }, children: body },
  parameters: {
    harness: {
      covers: ["scope 전환으로 애플리케이션과 하네스 산출물을 오갈 수 있고, 현재 선택한 scope가 화면에 표시된다"],
    },
    docs: {
      description: {
        story: "범위 전환 후 application 범위가 선택된 상태다. 현재 범위 라벨과 자동 갱신 상태가 충돌 없이 표시되어야 한다.",
      },
    },
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
