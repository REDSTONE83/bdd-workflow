import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommandRunner } from "./CommandRunnerPage";
import { commands, failedRun, readyRun, rejectedRun, runningRun, succeededRun } from "../../lib/harness-data/fixtures";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const meta = {
  title: "Harness/Runs/CommandRunner",
  component: CommandRunner,
  parameters: {
    harness: { requirements: ["REQ-035"] },
    docs: {
      description: {
        component: "허용된 검증 명령 선택, 단일 요건 인자, 실행 로그, 단일 실행 잠금, 서버 거절 상태를 검토한다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CommandRunner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  args: { commands, run: readyRun },
  parameters: {
    docs: {
      description: {
        story: "명령 실행 전 준비 상태다. 허용된 명령 목록, 단일 요건 입력, 실행 버튼이 같은 작업 흐름으로 보이는지 확인한다.",
      },
    },
  },
};

export const Running: Story = {
  args: { commands, run: runningRun },
  parameters: {
    docs: {
      description: {
        story: "명령 실행 중 상태다. 실행 버튼이 비활성화되고 로그가 진행 중인 상태로 표시되는지 확인한다.",
      },
    },
  },
};

export const Succeeded: Story = {
  args: { commands, run: succeededRun },
  parameters: {
    docs: {
      description: {
        story: "명령이 성공으로 종료된 상태다. 종료 코드와 성공 라벨, 로그 마지막 줄이 함께 확인되어야 한다.",
      },
    },
  },
};

export const Failed: Story = {
  args: { commands, run: failedRun },
  parameters: {
    docs: {
      description: {
        story: "명령이 실패로 종료된 상태다. 실패 라벨과 종료 코드, 로그가 다음 조치 판단에 충분히 표시되는지 확인한다.",
      },
    },
  },
};

export const Rejected: Story = {
  args: { commands, run: rejectedRun },
  parameters: {
    docs: {
      description: {
        story: "허용 목록 밖 명령 요청이 서버에서 거절된 상태다. 거절 사유가 로그와 별도 경고로 표시되는지 확인한다.",
      },
    },
  },
};

export const Loading: Story = {
  args: { commands, run: readyRun },
  render: () => <LoadingState label="명령 목록을 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "명령 목록 조회 대기 상태다. 빈 명령 목록을 표시하지 않고 로딩 상태를 명확히 보여준다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { commands, run: readyRun },
  render: () => <ErrorState message="명령 실행 상태를 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "명령 실행 상태 조회 실패 상태다. 오류 메시지와 다시 시도 진입점이 표시되는지 확인한다.",
      },
    },
  },
};
