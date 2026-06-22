import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { RequirementDetailView } from "./RequirementDetailView";
import { appRequirementDetail, requirementDetail } from "../../lib/harness-data/fixtures";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const requirementDetailTestLocation = "harness/ui/src/features/requirements/RequirementDetail.stories.tsx:36 > Harness/Requirements/RequirementDetail / CompleteCoverage";
const requirementDetailWithPassingCoverage: typeof requirementDetail = {
  ...requirementDetail,
  traceState: "BLUE",
  redReasons: [],
  blueBlockedBy: [],
  acceptanceCriteria: requirementDetail.acceptanceCriteria.map((row) => ({ ...row, status: "PASS" })),
  scenarios: requirementDetail.scenarios.map((scenario) => ({ ...scenario, status: "연결됨" })),
  coverage: requirementDetail.coverage.map((row) => ({ ...row, status: "PASS", tests: [requirementDetailTestLocation] })),
};

function RequirementBoardReturnProbe() {
  const location = useLocation();
  return (
    <section>
      <h1>요건 보드 복귀</h1>
      <div aria-label="보존된 query">{location.search}</div>
    </section>
  );
}

function RequirementDetailRouteStory({ detail }: { detail: typeof requirementDetail }) {
  return (
    <Routes>
      <Route path="/requirements/:requirementId" element={<RequirementDetailView detail={detail} />} />
      <Route path="/requirements" element={<RequirementBoardReturnProbe />} />
    </Routes>
  );
}

async function openDetailTab(canvasElement: HTMLElement, tabName: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("tab", { name: tabName }));
  return canvas;
}

function visibleText(canvas: ReturnType<typeof within>, text: string | RegExp) {
  const element = canvas.getAllByText(text).find((candidate: HTMLElement) => !candidate.closest("[hidden], [aria-hidden='true']"));
  if (!element) throw new Error(`Visible text not found: ${text.toString()}`);
  return element;
}

const meta = {
  title: "Harness/Requirements/RequirementDetail",
  component: RequirementDetailView,
  parameters: {
    harness: { requirements: ["REQ-032"] },
    docs: {
      description: {
        component: "요건 하나의 메타데이터 아래에서 개요, AC, 수용 시나리오, UI 설계, API 설계, DB 설계, 산출물/소스 탭으로 사용자/목적, 범위, 표준 용어, 제외 범위, 의사결정 로그, AC 카드 목록, 수용 시나리오별 테스트 정보, UI 설계 목록형 카드, API Request/Response, DB 설계 목록형 카드, 요건 카드/수용 시나리오 연결 산출물과 UI 접두 뱃지가 있는 소스 위치 카드를 확인한다.",
      },
    },
  },
  tags: ["autodocs", "test"],
  decorators: [
    (Story, context) => {
      const router = context.parameters.router as { initialEntries?: string[] } | undefined;

      return (
        <MemoryRouter initialEntries={router?.initialEntries ?? ["/requirements/REQ-031"]}>
          <Story />
        </MemoryRouter>
      );
    },
  ],
} satisfies Meta<typeof RequirementDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteCoverage: Story = {
  args: {
    detail: requirementDetailWithPassingCoverage,
  },
  parameters: {
    harness: {
      covers: [
        "요건 상세는 요건 ID, 제목, 카드 상태, 우선순위, 대상 시스템, 제품 영역, 검증 수준과 추적 상태를 표시한다",
        "요건 상세의 주요 정보군은 개요, AC, 수용 시나리오, UI 설계, API 설계, DB 설계, 산출물/소스 탭으로 구분된다",
      ],
    },
    docs: {
      description: {
        story: "모든 AC 커버리지가 PASS이고 RED/BLUE 차단 사유가 없는 상태다. 메타데이터, AC 항목 카드의 채널 색상 뱃지, 연결 테스트/수용 시나리오 바로가기와 수용 시나리오 항목의 테스트 정보가 BLUE 상태와 일관되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "하네스 UI 요건 추적 보드" })).toBeVisible();
    await expect(canvas.getByText("REQ-031")).toBeVisible();
    await expect(canvas.getAllByText("카드 상태")[0]).toBeVisible();
    await expect(canvas.getAllByText("우선순위")[0]).toBeVisible();
    await expect(canvas.getAllByText("대상 시스템")[0]).toBeVisible();
    await expect(canvas.getAllByText("제품 영역")[0]).toBeVisible();
    await expect(canvas.getAllByText("검증 수준")[0]).toBeVisible();
    await expect(canvas.getAllByText("BLUE")[0]).toBeVisible();
    for (const tabName of ["개요", "AC", "수용 시나리오", "UI 설계", "API 설계", "DB 설계", "산출물 / 소스"]) {
      await expect(canvas.getByRole("tab", { name: tabName })).toBeVisible();
    }
  },
};

export const OverviewSections: Story = {
  args: { detail: requirementDetail },
  parameters: {
    harness: {
      covers: ["개요 탭은 요건 카드의 사용자/목적, 범위, 표준 용어 key와 한국어/영어 이름, 제외 범위, 의사결정 로그를 표시한다"],
    },
    docs: {
      description: {
        story: "개요 탭에서 요건 카드의 사용자/목적, 범위, 표준 용어 key와 한국어/영어 이름, 제외 범위, 의사결정 로그를 확인하는 상태다. 의사결정 로그는 결정일과 결정 요약을 먼저 보여주고 세부 항목을 펼쳐 볼 수 있어야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "사용자 / 목적" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "범위" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "제외 범위" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "표준 용어" })).toBeVisible();
    await expect(canvas.getByText("harness.requirementCard")).toBeVisible();
    await expect(canvas.getAllByText("요건 카드")[0]).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "의사결정 로그" })).toBeVisible();
    await expect(canvas.getByText("2026-06-10")).toBeVisible();
  },
};

export const RedReasons: Story = {
  args: { detail: requirementDetail },
  parameters: {
    harness: {
      covers: ["추적 산출물에 RED 사유가 있으면 규칙과 메시지가 표시된다"],
    },
    docs: {
      description: {
        story: "추적 산출물에 RED 사유가 있는 상태다. 규칙 ID와 메시지가 누락 없이 표시되는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await openDetailTab(canvasElement, "AC");
    await expect(canvas.getByRole("heading", { name: "RED 사유" })).toBeVisible();
    await expect(canvas.getByText("TRACE-AC-MISSING")).toBeVisible();
    await expect(canvas.getByText("요건 추적 보드 UI 테스트가 아직 연결되지 않았다.")).toBeVisible();
  },
};

export const BlueBlocked: Story = {
  args: { detail: { ...requirementDetail, redReasons: [], traceState: "GREEN" } },
  parameters: {
    harness: {
      covers: ["추적 산출물에 BLUE 차단 사유가 있으면 그대로 표시된다"],
    },
    docs: {
      description: {
        story: "GREEN이지만 BLUE 승인을 막는 조건이 남은 상태다. 차단 사유 목록이 별도 영역에서 읽히는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await openDetailTab(canvasElement, "AC");
    await expect(canvas.getByRole("heading", { name: "BLUE 차단 사유" })).toBeVisible();
    await expect(canvas.getByText("요건 카드 상태가 승인 아님: 초안")).toBeVisible();
  },
};

export const LinkedArtifacts: Story = {
  args: { detail: appRequirementDetail },
  parameters: {
    router: { initialEntries: ["/requirements/REQ-022"] },
    harness: {
      covers: [
        "연결 산출물은 요건 카드와 수용 시나리오 종류 뱃지와 파일 위치가 있는 목록형 카드로 표시된다",
        "소스코드 위치는 연결 산출물 파일을 제외하고 API 설계, Request, Response, DB 설계, UI Page, UI Story 종류 뱃지와 파일 위치가 있는 목록형 카드로 표시된다",
        "카드 원본 문서와 연결 항목의 파일 경로/라인 위치 자체는 로컬 에디터 바로가기 링크로 제공되고 별도 열기 버튼은 표시되지 않는다",
      ],
    },
    docs: {
      description: {
        story: "백엔드 표면이 실재하는 앱 요건 상세에서 산출물/소스 탭을 확인하는 상태다. 연결 산출물에는 요건 카드와 수용 시나리오만 보이고, 소스 위치에는 산출물 파일 없이 API 설계/Request/Response/DB 설계/UI 구현 표면이 종류 뱃지가 있는 목록형 카드로 보이는지 확인한다. 파일 경로와 라인은 별도 열기 버튼 없이 위치 텍스트 자체가 로컬 에디터 바로가기처럼 동작해야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await openDetailTab(canvasElement, "산출물 / 소스");
    await expect(canvas.getByRole("heading", { name: "연결 산출물" })).toBeVisible();
    await expect(visibleText(canvas, "요건 카드")).toBeVisible();
    await expect(visibleText(canvas, "수용 시나리오")).toBeVisible();
    await expect(canvas.getByText("app/docs/requirements/REQ-022-todo-create.md:1")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "소스코드 위치" })).toBeVisible();
    await expect(visibleText(canvas, "API 설계")).toBeVisible();
    await expect(visibleText(canvas, "Request")).toBeVisible();
    await expect(visibleText(canvas, "Response")).toBeVisible();
    await expect(visibleText(canvas, "DB 설계")).toBeVisible();
    await expect(visibleText(canvas, "UI Page")).toBeVisible();
    await expect(visibleText(canvas, "UI Story")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "열기" })).not.toBeInTheDocument();
  },
};

export const AcceptanceAndScenarios: Story = {
  args: { detail: requirementDetailWithPassingCoverage },
  parameters: {
    harness: {
      covers: [
        "수용 기준 원문 목록은 카드로 표시되고 수용 시나리오 목록은 번호 없는 Given/When/Then, 파일 위치, Covers 관계를 확인할 수 있다",
        "AC 목록 카드에서 AC ID는 한 단계 큰 글꼴로 표시되고 검증 채널은 ID 옆 유형별 색상 뱃지로 표시되며 판정 상태는 카드 우측에 표시된다",
        "AC 목록 카드에서 연결 테스트와 연결 수용 시나리오는 바로가기 링크로 제공되고 연결 테스트 라벨과 목록 컨텐츠는 상단 정렬된다",
        "수용 시나리오마다 Covers 기준으로 연결된 커버리지 판정과 테스트가 항목 안에 표시된다",
      ],
    },
    docs: {
      description: {
        story: "AC 탭과 수용 시나리오 탭에서 수용 기준 원문 카드 목록과 수용 시나리오 목록을 각각 확인하는 상태다. 각 AC의 ID, 채널 색상 뱃지, 판정, 연결 테스트/수용 시나리오 바로가기와 각 수용 시나리오의 표준 테스트 파일 링크, 강조된 Given/When/Then, feature 위치가 보여야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await openDetailTab(canvasElement, "AC");
    await expect(canvas.getByRole("heading", { name: "AC 목록" })).toBeVisible();
    await expect(canvas.getByText("AC-1")).toBeVisible();
    await expect(visibleText(canvas, "UI")).toBeVisible();
    await expect(canvas.getAllByText("PASS")[0]).toBeVisible();
    await expect(canvas.getAllByText("연결 테스트")[0]).toBeVisible();
    await expect(canvas.getAllByText("수용 시나리오")[0]).toBeVisible();
    await expect(visibleText(canvas, /RequirementDetail\.stories\.tsx:36/)).toBeVisible();
    await expect(canvas.getAllByText(/REQ-031-harness-ui-requirement-board\.feature/)[0]).toBeVisible();

    await userEvent.click(canvas.getByRole("tab", { name: "수용 시나리오" }));
    await expect(canvas.getByRole("heading", { name: "수용 시나리오" })).toBeVisible();
    await expect(canvas.getAllByText("Given/When/Then")[0]).toBeVisible();
    await expect(canvas.getAllByText("Given")[0]).toBeVisible();
    await expect(canvas.getAllByText("When")[0]).toBeVisible();
    await expect(canvas.getAllByText("Then")[0]).toBeVisible();
    await expect(visibleText(canvas, /RequirementDetail\.stories\.tsx:36/)).toBeVisible();
    // 수용 시나리오마다 커버리지 판정(연결됨)과 연결 테스트가 항목 안에 표시된다
    const scenarioList = within(canvas.getByRole("list", { name: "연결된 수용 시나리오" }));
    await expect(scenarioList.getAllByText("연결됨")[0]).toBeVisible();
    await expect(scenarioList.getAllByText("연결 테스트")[0]).toBeVisible();
  },
};

export const DesignSurfaces: Story = {
  args: { detail: appRequirementDetail },
  parameters: {
    router: { initialEntries: ["/requirements/REQ-022"] },
    harness: {
      covers: [
        "연결된 API 작업은 세로 목록형 카드로 표시되고 Request, Response 구성과 그 안의 중첩 객체 필드는 펼침으로 확인된다",
        "연결된 DB 설계는 DB 설계 탭에서 세로 목록형 카드로 표시되고 table과 컬럼 메타데이터는 펼침으로 확인된다",
        "연결된 UI 설계는 UI 설계 탭에서 세로 목록형 카드로 표시되고 카드별 설명과 Storybook 검토 링크와 구현 파일 위치가 제공된다",
      ],
    },
    docs: {
      description: {
        story: "백엔드 표면이 실재하는 앱 요건 상세에서, API 설계 탭의 API 작업 목록형 카드와 Request/Response 펼침, Request/Response 필드의 참조 객체 펼침을 확인하고, DB 설계 탭에서 DB 테이블과 컬럼 메타데이터 목록을 확인하는 상태다. dataShapes의 필드 구성은 라이브 buildRequirementDetailModel이 source index에서 채운 값과 동일하다. UI 설계는 description이 있는 목록형 카드로 표시되고 Storybook 검토 버튼과 구현 위치 링크를 제공해야 한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await openDetailTab(canvasElement, "API 설계");
    await expect(canvas.getByRole("heading", { name: "API 설계" })).toBeVisible();
    await expect(canvas.getByText("/todos")).toBeVisible();
    await expect(canvas.getByText("operationId: TodoController.createTodo")).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: /Request/ })[0]);
    await expect(canvas.getAllByText("CreateTodoRequest")[0]).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: /Response/ })[0]);
    await expect(canvas.getAllByText("TodoResponse")[0]).toBeVisible();
    // TodoResponse.category 필드가 TodoCategoryInfo를 참조하므로 중첩 객체 펼침이 보인다.
    await userEvent.click(canvas.getAllByRole("button", { name: /참조 객체/ })[0]);
    await expect(canvas.getAllByText("TodoCategoryInfo")[0]).toBeVisible();

    await userEvent.click(canvas.getByRole("tab", { name: "DB 설계" }));
    await expect(canvas.getByRole("heading", { name: "DB 설계" })).toBeVisible();
    await expect(canvas.getByText("JPA Entity")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /컬럼 목록/ }));
    await expect(visibleText(canvas, "user_id")).toBeVisible();
    await expect(visibleText(canvas, "NOT NULL")).toBeVisible();

    await userEvent.click(canvas.getByRole("tab", { name: "UI 설계" }));
    await expect(canvas.getByRole("heading", { name: "UI 설계" })).toBeVisible();
    await expect(visibleText(canvas, "TodoCreateDialog")).toBeVisible();
    await expect(canvas.getByText("할 일 생성 입력 대화상자 화면 표면이다.")).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Storybook 검토" })[0]).toBeVisible();
    await expect(visibleText(canvas, "app/front-end/src/features/todos/TodoCreateDialog.tsx:1")).toBeVisible();
  },
};

export const BackToBoardLink: Story = {
  args: { detail: requirementDetail },
  render: (args) => <RequirementDetailRouteStory detail={args.detail} />,
  parameters: {
    harness: {
      covers: ["요건 상세의 메타데이터 카드 바깥 상단 좌측에 있는 테두리 없는 요건 목록 버튼을 선택하면 기존 필터 query를 유지한 요건 보드 route로 이동한다"],
    },
    router: {
      initialEntries: ["/requirements/REQ-031?title=요건&traceState=RED&cardStatus=초안&productArea=harness"],
    },
    docs: {
      description: {
        story: "필터 query가 있는 상세 route 상태다. 메타데이터 카드 바깥 상단 좌측의 테두리 없는 요건 목록 버튼을 선택하면 현재 query를 유지한 /requirements route로 이동하는지 확인한다.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "요건 목록" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "요건 목록" }));
    await expect(await canvas.findByRole("heading", { name: "요건 보드 복귀" })).toBeVisible();
    await expect(canvas.getByLabelText("보존된 query")).toHaveTextContent("?title=요건&traceState=RED&cardStatus=초안&productArea=harness");
  },
};

export const Loading: Story = {
  args: { detail: requirementDetail },
  render: () => <LoadingState label="요건 상세를 불러오는 중" />,
  parameters: {
    docs: {
      description: {
        story: "요건 상세 조회 대기 상태다. 상세 표나 finding 영역을 미리 표시하지 않고 로딩 상태만 보여준다.",
      },
    },
  },
};

export const ErrorStateStory: Story = {
  args: { detail: requirementDetail },
  render: () => <ErrorState message="요건 상세 산출물을 읽지 못했다." />,
  parameters: {
    docs: {
      description: {
        story: "요건 상세 산출물 조회 실패 상태다. 오류 메시지와 다시 시도 진입점이 같은 패널 안에 표시되어야 한다.",
      },
    },
  },
};
