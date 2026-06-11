import type {
  ArtifactSummary,
  ChangeSetRow,
  CommandDefinition,
  CommandRunState,
  GateCategory,
  RequirementDetail,
  RequirementRow,
  RequirementSummary,
} from "./types";

export const appShellDefault: ArtifactSummary = {
  scope: "harness",
  generatedAt: "2026-06-10T14:25:52.986Z",
  missing: false,
  stale: false,
  staleSources: [],
  autoRefresh: "idle",
};

export const appShellMissing: ArtifactSummary = {
  ...appShellDefault,
  generatedAt: null,
  missing: true,
};

export const appShellStale: ArtifactSummary = {
  ...appShellDefault,
  stale: true,
  staleSources: ["harness/docs/requirements/REQ-030-harness-ui-app-shell.md"],
};

export const requirementRows: RequirementRow[] = [
  {
    id: "REQ-030",
    title: "하네스 UI 앱셸",
    traceState: "RED",
    cardStatus: "초안",
    productArea: "harness",
    priority: "높음",
  },
  {
    id: "REQ-031",
    title: "하네스 UI 요건 추적 보드",
    traceState: "RED",
    cardStatus: "초안",
    productArea: "harness",
    priority: "높음",
  },
  {
    id: "REQ-010",
    title: "통합 하네스 게이트",
    traceState: "BLUE",
    cardStatus: "승인",
    productArea: "harness",
    priority: "높음",
  },
  {
    id: "REQ-028",
    title: "단계 인식 TDD 워크플로우",
    traceState: "BLUE",
    cardStatus: "승인",
    productArea: "harness",
    priority: "중간",
  },
];

export const requirementSummary: RequirementSummary[] = [
  { state: "RED", count: 7 },
  { state: "GREEN", count: 0 },
  { state: "BLUE", count: 7 },
  { state: "INACTIVE", count: 0 },
];

export const requirementDetail: RequirementDetail = {
  id: "REQ-031",
  title: "하네스 UI 요건 추적 보드",
  cardStatus: "초안",
  priority: "높음",
  targetSystem: "harness",
  productArea: "harness",
  verificationLevel: "mixed",
  traceState: "RED",
  sourceFile: {
    kind: "card",
    file: "harness/docs/requirements/REQ-031-harness-ui-requirement-board.md",
    line: 1,
  },
  acceptanceCriteria: [
    {
      id: "AC-1",
      text: "요건 보드는 선택한 scope의 모든 요건을 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위와 함께 목록으로 표시한다",
      channel: "UI",
      status: "MISSING",
      file: "harness/docs/requirements/REQ-031-harness-ui-requirement-board.md",
      line: 51,
      scenarios: ["요건 보드는 선택한 scope의 요건과 상태 요약을 보여준다"],
    },
    {
      id: "AC-2",
      text: "하네스 UI 서버가 제공하는 요건 추적 데이터는 추적 산출물의 판정 값과 일치한다",
      channel: "STATIC",
      status: "MISSING",
      file: "harness/docs/requirements/REQ-031-harness-ui-requirement-board.md",
      line: 55,
      scenarios: ["UI 서버가 제공하는 보드 데이터는 추적 산출물과 같은 판정을 가진다"],
    },
  ],
  scenarios: [
    {
      title: "요건 보드는 선택한 scope의 요건과 상태 요약을 보여준다",
      status: "정의됨",
      file: "harness/docs/scenarios/REQ-031-harness-ui-requirement-board.feature",
      line: 4,
      covers: ["요건 보드는 선택한 scope의 모든 요건을 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위와 함께 목록으로 표시한다"],
      steps: [
        "Given 하네스 scope의 요건 추적 산출물이 생성되어 있다",
        "When 하네스 작업자가 요건 보드 화면을 연다",
        "Then 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위가 목록으로 보인다",
      ],
    },
    {
      title: "UI 서버가 제공하는 보드 데이터는 추적 산출물과 같은 판정을 가진다",
      status: "정의됨",
      file: "harness/docs/scenarios/REQ-031-harness-ui-requirement-board.feature",
      line: 30,
      covers: ["하네스 UI 서버가 제공하는 요건 추적 데이터는 추적 산출물의 판정 값과 일치한다"],
      steps: [
        "Given 하네스 trace state에 요건별 판정이 있다",
        "When 하네스 UI 서버가 보드 데이터를 제공한다",
        "Then 보드 데이터의 판정 값은 trace state의 판정 값과 같다",
      ],
    },
  ],
  coverage: [
    {
      criterion: "요건 보드는 선택한 scope의 모든 요건을 요건 ID, 제목, 추적 상태, 카드 상태, 제품 영역, 우선순위와 함께 목록으로 표시한다",
      channel: "UI",
      status: "MISSING",
      tests: [],
      scenarios: ["요건 보드는 선택한 scope의 요건과 상태 요약을 보여준다"],
    },
    {
      criterion: "하네스 UI 서버가 제공하는 요건 추적 데이터는 추적 산출물의 판정 값과 일치한다",
      channel: "STATIC",
      status: "MISSING",
      tests: [],
      scenarios: ["UI 서버가 제공하는 보드 데이터는 추적 산출물과 같은 판정을 가진다"],
    },
  ],
  redReasons: [
    {
      ruleId: "TRACE-AC-MISSING",
      severity: "error",
      requirement: "REQ-031",
      file: "harness/docs/requirements/REQ-031-harness-ui-requirement-board.md",
      message: "요건 추적 보드 UI 테스트가 아직 연결되지 않았다.",
      evidence: "requiredChecks ui=MISSING",
      recommendation: "harness/ui Playwright FE BDD 테스트를 작성한다.",
    },
  ],
  blueBlockedBy: ["요건 카드 상태가 승인 아님: 초안"],
  linkedArtifacts: [
    {
      kind: "scenario",
      file: "harness/docs/scenarios/REQ-031-harness-ui-requirement-board.feature",
      line: 1,
    },
  ],
  apiSurfaces: [
    {
      method: "GET",
      path: "/api/requirements",
      operationId: "listRequirementTrace",
      status: "Skeleton",
      file: "harness/ui/server/index.ts",
      line: 15,
      requests: ["RequirementBoardQuery"],
      responses: ["RequirementBoardResponse"],
      entities: ["RequirementRow", "RequirementSummary"],
    },
    {
      method: "GET",
      path: "/api/requirements/{requirementId}",
      operationId: "getRequirementDetail",
      status: "Skeleton",
      file: "harness/ui/server/index.ts",
      line: 15,
      requests: ["RequirementDetailParams"],
      responses: ["RequirementDetailResponse"],
      entities: ["AcceptanceCoverageRow", "FindingRow", "LinkedArtifact"],
    },
  ],
  dataShapes: [
    {
      kind: "Request",
      name: "RequirementBoardQuery",
      status: "Skeleton",
      file: "harness/ui/src/lib/harness-data/types.ts",
      line: 1,
      fields: [
        { name: "scope", type: "application | harness", required: true, description: "조회할 검증 scope" },
        { name: "traceState", type: "RED | GREEN | BLUE | INACTIVE | ALL", required: false, description: "요건 보드 필터" },
        { name: "cardStatus", type: "string | ALL", required: false, description: "카드 상태 필터" },
        { name: "productArea", type: "string | ALL", required: false, description: "제품 영역 필터" },
      ],
    },
    {
      kind: "Request",
      name: "RequirementDetailParams",
      status: "Skeleton",
      file: "harness/ui/src/lib/harness-data/types.ts",
      line: 106,
      fields: [
        { name: "requirementId", type: "string", required: true, description: "REQ-XXX 요건 ID" },
      ],
    },
    {
      kind: "Response",
      name: "RequirementBoardResponse",
      status: "Skeleton",
      file: "harness/ui/src/lib/harness-data/types.ts",
      line: 18,
      fields: [
        { name: "requirements", type: "RequirementRow[]", required: true, description: "요건 보드 행" },
        { name: "summary", type: "RequirementSummary[]", required: true, description: "추적 상태별 요약" },
        { name: "generatedAt", type: "string | null", required: true, description: "산출물 생성 시각" },
      ],
    },
    {
      kind: "Response",
      name: "RequirementDetailResponse",
      status: "Skeleton",
      file: "harness/ui/src/lib/harness-data/types.ts",
      line: 47,
      fields: [
        { name: "coverage", type: "AcceptanceCoverageRow[]", required: true, description: "AC별 검증 채널과 판정" },
        { name: "redReasons", type: "FindingRow[]", required: true, description: "추적 산출물의 RED 사유" },
        { name: "apiSurfaces", type: "RequirementApiSurface[]", required: true, description: "연결 API 작업" },
        { name: "dataShapes", type: "RequirementDataShape[]", required: true, description: "Request/Response/Entity 구성" },
        { name: "uiSurfaces", type: "RequirementUiSurface[]", required: true, description: "화면과 Storybook 검토 링크" },
      ],
    },
    {
      kind: "Entity",
      name: "RequirementRow",
      status: "Skeleton",
      file: "harness/ui/src/lib/harness-data/types.ts",
      line: 16,
      fields: [
        { name: "id", type: "string", required: true, description: "REQ-XXX 요건 ID" },
        { name: "title", type: "string", required: true, description: "요건 제목" },
        { name: "traceState", type: "TraceState", required: true, description: "RED/GREEN/BLUE/INACTIVE 판정" },
        { name: "priority", type: "string", required: true, description: "카드 우선순위" },
      ],
    },
  ],
  uiSurfaces: [
    {
      kind: "Page",
      name: "RequirementBoardPage",
      route: "/requirements",
      status: "Skeleton",
      description: "요건 목록과 상태 요약을 보여주는 하네스 UI 화면 표면이다.",
      file: "harness/ui/src/features/requirements/RequirementBoardPage.tsx",
      line: 1,
    },
    {
      kind: "Story",
      name: "RequirementBoard",
      status: "검토 가능",
      description: "요건 보드 화면 Skeleton을 Storybook에서 검토하는 대표 상태다.",
      file: "harness/ui/src/features/requirements/RequirementBoard.stories.tsx",
      line: 1,
      storybookTitle: "Harness/Requirements/RequirementBoard",
      storybookStory: "AllRequirements",
      storybookUrl: "http://127.0.0.1:6007/?path=/story/harness-requirements-requirementboard--all-requirements",
    },
    {
      kind: "Story",
      name: "RequirementBoard Docs",
      status: "검토 가능",
      description: "요건 보드 Storybook 문서와 검토 설명을 확인하는 Docs 표면이다.",
      file: "harness/ui/src/features/requirements/RequirementBoard.stories.tsx",
      line: 1,
      storybookTitle: "Harness/Requirements/RequirementBoard",
      storybookStory: "Docs",
      storybookUrl: "http://127.0.0.1:6007/?path=/docs/harness-requirements-requirementboard--docs",
    },
  ],
};

export const gateCategories: GateCategory[] = [
  { category: "TRACE", blocked: true, errors: 7, byRuleId: { "TRACE-AC-MISSING": 7 } },
  { category: "CARD", blocked: false, errors: 0, byRuleId: {} },
  { category: "REF", blocked: false, errors: 0, byRuleId: {} },
  { category: "TRC", blocked: false, errors: 0, byRuleId: {} },
  { category: "BE", blocked: false, errors: 0, byRuleId: {} },
  { category: "FE", blocked: false, errors: 0, byRuleId: {} },
  { category: "SCN", blocked: false, errors: 0, byRuleId: {} },
  { category: "TRM", blocked: false, errors: 0, byRuleId: {} },
];

export const findingRows = requirementDetail.redReasons;

export const changeSetRows: ChangeSetRow[] = [
  {
    title: "2026-06-10 하네스 로컬 웹 UI MVP",
    status: "진행중",
    requestedDate: "2026-06-10",
    affectedRequirements: requirementRows.slice(0, 3),
    summary: "하네스 산출물을 로컬 웹 UI에서 조회하고 검증 명령을 실행한다.",
    scopeItems: ["하네스 UI 요건", "Storybook Skeleton", "검증 명령 실행"],
    completionCriteria: ["REQ-029~REQ-035 승인", "npm run harness:validate 통과"],
    verificationCommands: ["npm run harness:trace -- --requirement REQ-031", "npm run harness:validate"],
    openDiscussions: [],
  },
];

export const commands: CommandDefinition[] = [
  { id: "harness:trace", label: "Harness Trace", description: "하네스 scope 추적 산출물을 갱신한다.", supportsRequirement: true },
  { id: "harness:validate", label: "Harness Validate", description: "하네스 게이트를 실행한다.", supportsRequirement: false },
  { id: "harness:self-test", label: "Harness Self Test", description: "하네스 self-test를 실행한다.", supportsRequirement: false },
  { id: "app:trace", label: "App Trace", description: "애플리케이션 scope 추적 산출물을 갱신한다.", supportsRequirement: true },
  { id: "app:validate", label: "App Validate", description: "애플리케이션 게이트를 실행한다.", supportsRequirement: false },
  { id: "repo:validate", label: "Repo Validate", description: "두 scope 게이트를 순차 실행한다.", supportsRequirement: false },
];

export const readyRun: CommandRunState = {
  status: "ready",
  selectedCommand: "harness:trace",
  requirementId: "REQ-031",
  logs: [],
};

export const runningRun: CommandRunState = {
  ...readyRun,
  status: "running",
  startedAt: "2026-06-10T14:30:00.000Z",
  logs: ["[harness:index-requirements] requirements.index.json", "[harness:trace] trace-requirements.mjs --requirement REQ-031"],
};

export const succeededRun: CommandRunState = {
  ...runningRun,
  status: "succeeded",
  exitCode: 0,
  logs: [...runningRun.logs, "gate: pass"],
};

export const failedRun: CommandRunState = {
  ...runningRun,
  status: "failed",
  exitCode: 1,
  logs: [...runningRun.logs, "TRACE failed: REQ-031 RED"],
};

export const rejectedRun: CommandRunState = {
  ...readyRun,
  status: "rejected",
  selectedCommand: "npm:arbitrary",
  rejectionReason: "허용 목록 밖 명령이다.",
};
