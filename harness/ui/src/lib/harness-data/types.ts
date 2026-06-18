export type HarnessScope = "application" | "harness";
export type TraceState = "RED" | "GREEN" | "BLUE" | "INACTIVE";

export interface ArtifactSummary {
  scope: HarnessScope;
  generatedAt: string | null;
  missing: boolean;
  stale: boolean;
  staleSources: string[];
  autoRefresh: "idle" | "updated";
}

export interface RequirementRow {
  id: string;
  title: string;
  traceState: TraceState;
  cardStatus: string;
  productArea: string;
  priority: string;
  specRole: string;
  parentRequirementIds: string[];
  childRequirementIds: string[];
  relatedRequirementIds: string[];
}

export interface RequirementSummary {
  state: TraceState;
  count: number;
}

export type TermStatus = "approved" | "draft";

export interface TerminologyTerm {
  key: string;
  domain: string;
  status: TermStatus;
  sourceFile: string;
  ko: string;
  en: string;
  meaning: string;
  allow: string[];
  ban: string[];
  names: Record<string, string[]>;
  note?: string;
  reason?: string;
}

export interface TerminologyBrowserModel {
  scope: HarnessScope;
  generatedAt: string | null;
  terms: TerminologyTerm[];
}

export interface AcceptanceCoverageRow {
  criterion: string;
  channel: string;
  status: string;
  tests: string[];
  scenarios: string[];
}

export interface RequirementAcceptanceCriterion {
  id: string;
  text: string;
  channel: string;
  status: string;
  file: string;
  line: number;
  scenarios: string[];
}

export interface RequirementScenario {
  title: string;
  status: string;
  file: string;
  line: number;
  covers: string[];
  steps: string[];
}

export interface FindingRow {
  ruleId: string;
  severity: string;
  requirement: string;
  file: string;
  message: string;
  evidence: string;
  recommendation: string;
}

export interface LinkedArtifact {
  kind: string;
  file: string;
  line: number;
  status?: string;
}

export interface RequirementApiSurface {
  method: string;
  path: string;
  operationId: string;
  status: string;
  file: string;
  line: number;
  requests: string[];
  responses: string[];
  entities: string[];
}

export interface RequirementDataField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface RequirementDataShape {
  kind: "Request" | "Response" | "Object";
  name: string;
  status: string;
  file: string;
  line: number;
  fields: RequirementDataField[];
}

export interface RequirementEntityColumn {
  fieldName: string;
  columnName: string;
  javaType: string;
  primaryKey: boolean;
  generation: string | null;
  nullable: boolean | null;
  unique: boolean | null;
  updatable: boolean | null;
  length: number | null;
  annotations: string[];
  requirements: string[];
}

export interface RequirementEntitySurface {
  className: string;
  table: string;
  file: string;
  line?: number;
  listeners: string[];
  requirements: string[];
  columns: RequirementEntityColumn[];
}

export interface RequirementUiSurface {
  kind: "Page" | "Route" | "Story";
  name: string;
  status: string;
  description?: string;
  file: string;
  line: number;
  route?: string;
  storybookTitle?: string;
  storybookStory?: string;
  storybookUrl?: string;
}

export interface RequirementDecisionLog {
  date: string;
  decision: string;
  reason: string;
  decisionMaker: string;
  impact: string;
}

export interface RequirementStandardTerm {
  key: string;
  ko: string;
  en: string;
}

export interface RequirementDetail {
  id: string;
  title: string;
  cardStatus: string;
  priority: string;
  targetSystem: string;
  productArea: string;
  verificationLevel: string;
  traceState: TraceState;
  sourceFile: LinkedArtifact;
  purpose: string;
  scopeItems: string[];
  terms: RequirementStandardTerm[];
  outOfScopeItems: string[];
  decisionLogs: RequirementDecisionLog[];
  acceptanceCriteria: RequirementAcceptanceCriterion[];
  scenarios: RequirementScenario[];
  coverage: AcceptanceCoverageRow[];
  redReasons: FindingRow[];
  blueBlockedBy: string[];
  linkedArtifacts: LinkedArtifact[];
  apiSurfaces: RequirementApiSurface[];
  dataShapes: RequirementDataShape[];
  entitySurfaces: RequirementEntitySurface[];
  uiSurfaces: RequirementUiSurface[];
}

export interface GateCategory {
  category: string;
  blocked: boolean;
  errors: number;
  byRuleId: Record<string, number>;
}

export interface ChangeSetRow {
  title: string;
  status: string;
  requestedDate: string;
  affectedRequirements: RequirementRow[];
  summary: string;
  scopeItems: string[];
  completionCriteria: string[];
  verificationCommands: string[];
  openDiscussions: string[];
}

export interface CommandDefinition {
  id: string;
  label: string;
  description: string;
  supportsRequirement: boolean;
}

export interface CommandRunState {
  status: "ready" | "running" | "succeeded" | "failed" | "rejected";
  selectedCommand: string;
  requirementId?: string;
  startedAt?: string;
  exitCode?: number;
  rejectionReason?: string;
  logs: string[];
}
