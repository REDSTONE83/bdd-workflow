import type { Meta, StoryObj } from "@storybook/react-vite";
import { RecommendedCommand } from "./RecommendedCommand";
import { commands } from "../../lib/harness-data/fixtures";

const meta = {
  title: "Harness/Requirements/RecommendedCommand",
  component: RecommendedCommand,
  parameters: {
    harness: { requirements: ["REQ-035"] },
    docs: {
      description: {
        component: "요건 카드 상태 단계에 맞는 권장 검증 명령 안내를 검토한다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RecommendedCommand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DraftRequirement: Story = {
  args: { cardStatus: "초안", commands },
  parameters: {
    docs: {
      description: {
        story: "초안 단계 요건의 권장 명령 상태다. 단일 요건 trace 명령이 기본 다음 행동으로 안내되는지 확인한다.",
      },
    },
  },
};

export const SkeletonRequirement: Story = {
  args: { cardStatus: "Skeleton 검토중", commands },
  parameters: {
    docs: {
      description: {
        story: "Skeleton 검토중 단계 요건의 권장 명령 상태다. 하네스 UI source index 갱신 명령이 안내되는지 확인한다.",
      },
    },
  },
};

export const VerificationRequirement: Story = {
  args: { cardStatus: "검증중", commands },
  parameters: {
    docs: {
      description: {
        story: "검증중 단계 요건의 권장 명령 상태다. 전체 하네스 검증 명령이 다음 행동으로 안내되는지 확인한다.",
      },
    },
  },
};
