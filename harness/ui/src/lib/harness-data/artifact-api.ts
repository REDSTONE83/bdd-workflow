import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AcceptanceCoverageRow,
  ChangeSetRow,
  CommandDefinition,
  CommandRunState,
  FindingRow,
  GateCategory,
  HarnessScope,
  LinkedArtifact,
  RequirementAcceptanceCriterion,
  RequirementApiSurface,
  RequirementDataField,
  RequirementDataShape,
  RequirementDetail,
  RequirementEntityColumn,
  RequirementEntitySurface,
  RequirementRow,
  RequirementScenario,
  RequirementSummary,
  RequirementUiSurface,
  TraceState,
} from "./types";

export interface RequirementBoardModel {
  generatedAt: string | null;
  rows: RequirementRow[];
  summary: RequirementSummary[];
}

export interface GateViewModel {
  generatedAt: string | null;
  categories: GateCategory[];
  findings: FindingRow[];
}

export interface CommandRunnerModel {
  commands: CommandDefinition[];
  run: CommandRunState;
  requirements: RequirementRow[];
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const defaultWorkspaceRoot = path.resolve(currentDir, "../../../../..");

const scopeOutputDirs = {
  application: "app",
  harness: "harness",
} as const satisfies Record<HarnessScope, string>;

export const commandDefinitions: CommandDefinition[] = [
  { id: "harness:trace", label: "Harness Trace", description: "하네스 범위 추적 산출물을 갱신한다.", supportsRequirement: true },
  { id: "harness:validate", label: "Harness Validate", description: "하네스 게이트를 실행한다.", supportsRequirement: false },
  { id: "harness:self-test", label: "Harness Self Test", description: "하네스 self-test를 실행한다.", supportsRequirement: false },
  { id: "app:trace", label: "App Trace", description: "애플리케이션 범위 추적 산출물을 갱신한다.", supportsRequirement: true },
  { id: "app:validate", label: "App Validate", description: "애플리케이션 게이트를 실행한다.", supportsRequirement: false },
  { id: "repo:validate", label: "Repo Validate", description: "두 범위 게이트를 순차 실행한다.", supportsRequirement: false },
];

const traceStates: TraceState[] = ["RED", "GREEN", "BLUE", "INACTIVE"];

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function maybeReadJson(file: string): unknown | null {
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

function outputPath(workspaceRoot: string, scope: HarnessScope, ...segments: string[]) {
  return path.join(workspaceRoot, "build", scopeOutputDirs[scope], ...segments);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 1): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeLine(value: unknown): number {
  const line = numberValue(value, 1);
  return line > 0 ? line : 1;
}

function traceState(value: unknown): TraceState {
  return traceStates.includes(value as TraceState) ? value as TraceState : "INACTIVE";
}

function traceRequirements(payload: unknown): Record<string, unknown>[] {
  return recordArray(asRecord(payload).requirements);
}

function requirementEntries(payload: unknown): Record<string, unknown>[] {
  return recordArray(asRecord(payload).entries);
}

function readTraceState(scope: HarnessScope, workspaceRoot: string) {
  return readJson(outputPath(workspaceRoot, scope, "state", "trace.state.json"));
}

function readRequirementsIndex(scope: HarnessScope, workspaceRoot: string) {
  return readJson(outputPath(workspaceRoot, scope, "indexes", "requirements.index.json"));
}

function readTerminologyIndex(scope: HarnessScope, workspaceRoot: string) {
  return maybeReadJson(outputPath(workspaceRoot, scope, "indexes", "terminology.index.json"));
}

function rowFromTraceRequirement(requirement: Record<string, unknown>): RequirementRow {
  return {
    id: stringValue(requirement.id),
    title: stringValue(requirement.title, stringValue(requirement.id)),
    traceState: traceState(requirement.state),
    cardStatus: stringValue(requirement.status, "상태 없음"),
    productArea: stringValue(requirement.productArea, "unknown"),
    priority: stringValue(requirement.priority, "미지정"),
    specRole: stringValue(requirement.specRole, "미지정"),
    parentRequirementIds: stringArray(requirement.parentRequirementIds),
    childRequirementIds: stringArray(requirement.childRequirementIds),
    relatedRequirementIds: stringArray(requirement.relatedRequirementIds),
  };
}

function rowsFromTracePayload(tracePayload: unknown): RequirementRow[] {
  return traceRequirements(tracePayload)
    .map(rowFromTraceRequirement)
    .filter((row) => row.id);
}

function summaryFromRows(rows: RequirementRow[]): RequirementSummary[] {
  return traceStates.map((state) => ({
    state,
    count: rows.filter((row) => row.traceState === state).length,
  }));
}

export function buildRequirementBoardModel(
  scope: HarnessScope,
  workspaceRoot = defaultWorkspaceRoot,
): RequirementBoardModel {
  const tracePayload = readTraceState(scope, workspaceRoot);
  const traceRecord = asRecord(tracePayload);
  const rows = rowsFromTracePayload(tracePayload);

  return {
    generatedAt: typeof traceRecord.generatedAt === "string" ? traceRecord.generatedAt : null,
    rows,
    summary: summaryFromRows(rows),
  };
}

function findRequirementRecord(payload: unknown, requirementId: string) {
  return traceRequirements(payload).find((entry) => entry.id === requirementId) ?? null;
}

function findCardRecord(payload: unknown, requirementId: string) {
  return requirementEntries(payload).find((entry) => entry.id === requirementId) ?? null;
}

function cardLocation(card: Record<string, unknown>, traceRequirement: Record<string, unknown>): LinkedArtifact {
  const location = asRecord(card.location);
  return {
    kind: "card",
    file: stringValue(location.file, stringValue(traceRequirement.file)),
    line: normalizeLine(location.line),
  };
}

function terminologyTerms(scope: HarnessScope, workspaceRoot: string, termKeys: string[]) {
  const terminologyPayload = readTerminologyIndex(scope, workspaceRoot);
  const terms = asRecord(asRecord(terminologyPayload).terms);

  return termKeys.map((key) => {
    const term = asRecord(terms[key]);
    return {
      key,
      ko: stringValue(term.ko, key),
      en: stringValue(term.en, key),
    };
  });
}

function coversTextList(value: unknown): string[] {
  return recordArray(value)
    .map((item) => stringValue(item.text))
    .filter(Boolean);
}

function scenarioTitleList(value: unknown): string[] {
  return recordArray(value)
    .map((item) => stringValue(item.title))
    .filter(Boolean);
}

function testLabel(test: Record<string, unknown>): string {
  const file = stringValue(test.file);
  const line = normalizeLine(asRecord(test.location).line ?? test.line);
  const label = stringValue(test.displayName, stringValue(test.identity, file));
  return file ? `${file}:${line} > ${label}` : label;
}

function buildCoverageRows(traceRequirement: Record<string, unknown>): AcceptanceCoverageRow[] {
  return recordArray(traceRequirement.coverage).map((coverage) => ({
    criterion: stringValue(coverage.criterion),
    channel: stringValue(coverage.target, "UNKNOWN"),
    status: stringValue(coverage.status, "MISSING"),
    tests: recordArray(coverage.tests).map(testLabel),
    scenarios: scenarioTitleList(coverage.scenarios),
  }));
}

function buildAcceptanceCriteria(
  card: Record<string, unknown>,
  traceRequirement: Record<string, unknown>,
  coverageRows: AcceptanceCoverageRow[],
): RequirementAcceptanceCriterion[] {
  const cardCriteria = recordArray(card.acceptanceCriteria).length > 0
    ? recordArray(card.acceptanceCriteria)
    : recordArray(traceRequirement.acceptanceCriteria);
  const coverageByCriterion = new Map(coverageRows.map((coverage) => [coverage.criterion, coverage]));
  const sourceFile = cardLocation(card, traceRequirement).file;

  return cardCriteria.map((criterion, index) => {
    const text = stringValue(criterion.text);
    const coverage = coverageByCriterion.get(text);

    return {
      id: `AC-${index + 1}`,
      text,
      channel: stringValue(criterion.target, coverage?.channel ?? "UNKNOWN"),
      status: coverage?.status ?? "MISSING",
      file: sourceFile,
      line: normalizeLine(criterion.line),
      scenarios: coverage?.scenarios ?? [],
    };
  });
}

function buildScenarios(traceRequirement: Record<string, unknown>): RequirementScenario[] {
  return recordArray(traceRequirement.scenarios).map((scenario) => ({
    title: stringValue(scenario.title),
    status: "정의됨",
    file: stringValue(scenario.file),
    line: normalizeLine(scenario.line),
    covers: coversTextList(scenario.covers),
    steps: recordArray(scenario.steps)
      .map((step) => {
        const keyword = stringValue(step.keyword);
        const text = stringValue(step.text);
        return keyword && text ? `${keyword} ${text}` : text;
      })
      .filter(Boolean),
  }));
}

function stringifyEvidence(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function findingRow(value: unknown, fallbackRequirement = ""): FindingRow {
  if (typeof value === "string") {
    return {
      ruleId: "TRACE",
      severity: "error",
      requirement: fallbackRequirement,
      file: "",
      message: value,
      evidence: "",
      recommendation: "",
    };
  }

  const record = asRecord(value);
  const location = asRecord(record.location);
  return {
    ruleId: stringValue(record.ruleId, stringValue(record.kind, "UNKNOWN")),
    severity: stringValue(record.strictSeverity, stringValue(record.severity, "error")),
    requirement: stringArray(record.requirements)[0] ?? stringValue(record.requirement, fallbackRequirement),
    file: stringValue(record.file, stringValue(location.file)),
    message: stringValue(record.message),
    evidence: stringifyEvidence(record.evidence),
    recommendation: stringValue(record.recommendation),
  };
}

function cleanJavaType(value: string): string {
  const responseEntity = value.match(/^ResponseEntity<(.+)>$/);
  if (responseEntity) return cleanJavaType(responseEntity[1]);
  const jsonNullable = value.match(/^JsonNullable<(.+)>$/);
  if (jsonNullable) return cleanJavaType(jsonNullable[1]);
  return value;
}

function methodAndPath(api: Record<string, unknown>) {
  const http = stringValue(api.http);
  const match = http.match(/^([A-Z]+)\s+(.+)$/);
  return {
    method: match?.[1] ?? stringValue(api.method),
    path: match?.[2] ?? stringValue(api.path),
  };
}

function buildApiSurfaces(traceRequirement: Record<string, unknown>): RequirementApiSurface[] {
  const entityNames = recordArray(traceRequirement.entities).map((entity) => stringValue(entity.className)).filter(Boolean);

  return recordArray(traceRequirement.apis).map((api) => {
    const http = methodAndPath(api);
    const requestTypes = recordArray(api.parameters)
      .filter((parameter) => parameter.springRequestBody === true)
      .map((parameter) => stringValue(parameter.javaType))
      .filter(Boolean);
    // 응답 데이터 shape는 반환 DTO만 담는다. 상태 코드(201/400 등)는 DTO shape가 아니므로
    // dataShapes 대상에서 제외한다(data-contracts.md: dataShapes[]는 Request/Response와 참조 객체 DTO shape).
    const responseTypes = [cleanJavaType(stringValue(api.returnType))].filter(Boolean);

    return {
      method: http.method,
      path: http.path,
      operationId: stringValue(api.controller, `${http.method} ${http.path}`),
      status: "연결됨",
      file: stringValue(api.file),
      line: normalizeLine(api.line),
      requests: [...new Set(requestTypes)],
      responses: [...new Set(responseTypes)],
      entities: entityNames,
    };
  });
}

function readBackendDtoMap(scope: HarnessScope, workspaceRoot: string): Map<string, Record<string, unknown>> {
  const payload = maybeReadJson(outputPath(workspaceRoot, scope, "indexes", "backend.source-index.json"));
  const byName = new Map<string, Record<string, unknown>>();
  for (const dto of recordArray(asRecord(payload).dtos)) {
    const name = stringValue(dto.className);
    if (name) byName.set(name, dto);
  }
  return byName;
}

function isRequiredField(field: Record<string, unknown>): boolean {
  const annotations = stringArray(field.annotations);
  return annotations.includes("NotBlank") || annotations.includes("NotNull");
}

function dtoFields(dto: Record<string, unknown>): RequirementDataField[] {
  return recordArray(dto.fields).map((field) => {
    const description = stringValue(field.schemaDescription);
    return {
      name: stringValue(field.name),
      type: cleanJavaType(stringValue(field.javaType)),
      required: isRequiredField(field),
      ...(description ? { description } : {}),
    };
  });
}

function buildDataShapes(
  apiSurfaces: RequirementApiSurface[],
  dtoMap: Map<string, Record<string, unknown>>,
): RequirementDataShape[] {
  const shapes = new Map<string, RequirementDataShape>();
  const hasName = (name: string) => [...shapes.values()].some((shape) => shape.name === name);

  function addShape(kind: RequirementDataShape["kind"], name: string, fallbackFile: string, fallbackLine: number) {
    const key = `${kind}:${name}`;
    if (!name || shapes.has(key)) return;
    const dto = dtoMap.get(name);
    shapes.set(key, {
      kind,
      name,
      status: "연결됨",
      file: dto ? stringValue(dto.file, fallbackFile) : fallbackFile,
      line: dto ? normalizeLine(dto.schemaLine) : fallbackLine,
      fields: dto ? dtoFields(dto) : [],
    });
    if (!dto) return;
    // 필드가 다른 DTO를 참조하면 그 객체도 shape로 펼쳐 중첩 표시를 가능하게 한다.
    for (const field of recordArray(dto.fields)) {
      const referenced = cleanJavaType(stringValue(field.javaType));
      if (dtoMap.has(referenced) && !hasName(referenced)) {
        const refDto = dtoMap.get(referenced);
        if (refDto) addShape("Object", referenced, stringValue(refDto.file), normalizeLine(refDto.schemaLine));
      }
    }
  }

  for (const api of apiSurfaces) {
    for (const request of api.requests) addShape("Request", request, api.file, api.line);
    for (const response of api.responses) addShape("Response", response, api.file, api.line);
  }
  return [...shapes.values()];
}

function buildEntityColumns(value: unknown): RequirementEntityColumn[] {
  return recordArray(value).map((column) => ({
    fieldName: stringValue(column.fieldName),
    columnName: stringValue(column.columnName),
    javaType: stringValue(column.javaType),
    primaryKey: column.primaryKey === true,
    generation: typeof column.generation === "string" ? column.generation : null,
    nullable: nullableBoolean(column.nullable),
    unique: nullableBoolean(column.unique),
    updatable: nullableBoolean(column.updatable),
    length: nullableNumber(column.length),
    annotations: stringArray(column.annotations),
    requirements: stringArray(column.requirements),
  }));
}

function buildEntitySurfaces(traceRequirement: Record<string, unknown>): RequirementEntitySurface[] {
  return recordArray(traceRequirement.entities).map((entity) => ({
    className: stringValue(entity.className),
    table: stringValue(entity.table),
    file: stringValue(entity.file),
    line: normalizeLine(entity.line),
    listeners: stringArray(entity.listeners),
    requirements: stringArray(entity.requirements),
    columns: buildEntityColumns(entity.columns),
  }));
}

function storybookId(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function storybookUrl(scope: HarnessScope, title: string, story: string) {
  const port = scope === "harness" ? 6007 : 6006;
  return `http://127.0.0.1:${port}/?path=/story/${storybookId(title)}--${storybookId(story)}`;
}

function buildUiSurfaces(scope: HarnessScope, traceRequirement: Record<string, unknown>): RequirementUiSurface[] {
  const frontEnd = asRecord(traceRequirement.frontEnd);
  const pages: RequirementUiSurface[] = recordArray(frontEnd.pages).map((page) => ({
    kind: "Page",
    name: stringValue(page.name),
    status: "연결됨",
    description: "요건과 연결된 UI page 표면이다.",
    file: stringValue(page.file),
    line: normalizeLine(page.line),
    route: typeof page.route === "string" ? page.route : undefined,
  }));
  const routes: RequirementUiSurface[] = recordArray(frontEnd.routes).map((route) => ({
    kind: "Route",
    name: stringValue(route.component, stringValue(route.path)),
    status: "연결됨",
    description: "요건과 연결된 route 표면이다.",
    file: stringValue(route.file),
    line: normalizeLine(route.line),
    route: stringValue(route.path),
  }));
  const stories: RequirementUiSurface[] = recordArray(frontEnd.stories).map((story) => {
    const title = stringValue(story.title);
    const storyName = stringValue(story.story);
    return {
      kind: "Story",
      name: stringValue(story.component, storyName),
      status: "검토 가능",
      description: "요건과 연결된 UI 설계 검토 표면이다.",
      file: stringValue(story.file),
      line: normalizeLine(story.line),
      storybookTitle: title,
      storybookStory: storyName,
      storybookUrl: title && storyName ? storybookUrl(scope, title, storyName) : undefined,
    };
  });

  return [...pages, ...routes, ...stories].filter((surface) => surface.file || surface.name);
}

function uniqueArtifacts(artifacts: LinkedArtifact[]) {
  return artifacts.filter(
    (artifact, index, list) =>
      list.findIndex((other) => `${other.kind}:${other.file}:${other.line}` === `${artifact.kind}:${artifact.file}:${artifact.line}`) === index,
  );
}

export function buildRequirementDetailModel(
  scope: HarnessScope,
  requirementId: string,
  workspaceRoot = defaultWorkspaceRoot,
): RequirementDetail | null {
  const tracePayload = readTraceState(scope, workspaceRoot);
  const cardPayload = readRequirementsIndex(scope, workspaceRoot);
  const traceRequirement = findRequirementRecord(tracePayload, requirementId);
  if (!traceRequirement) return null;

  const card = findCardRecord(cardPayload, requirementId) ?? traceRequirement;
  const coverage = buildCoverageRows(traceRequirement);
  const scenarios = buildScenarios(traceRequirement);
  const apiSurfaces = buildApiSurfaces(traceRequirement);
  const dataShapes = buildDataShapes(apiSurfaces, readBackendDtoMap(scope, workspaceRoot));
  const entitySurfaces = buildEntitySurfaces(traceRequirement);
  const uiSurfaces = buildUiSurfaces(scope, traceRequirement);

  return {
    id: requirementId,
    title: stringValue(traceRequirement.title, stringValue(card.title, requirementId)),
    cardStatus: stringValue(traceRequirement.status, stringValue(card.status, "상태 없음")),
    priority: stringValue(traceRequirement.priority, stringValue(card.priority, "미지정")),
    targetSystem: stringValue(traceRequirement.targetSystem, stringValue(card.targetSystem, scope)),
    productArea: stringValue(traceRequirement.productArea, stringValue(card.productArea, "unknown")),
    verificationLevel: stringValue(traceRequirement.verificationLevel, stringValue(card.verificationLevel, "unknown")),
    traceState: traceState(traceRequirement.state),
    sourceFile: cardLocation(card, traceRequirement),
    purpose: stringValue(card.purpose),
    scopeItems: stringArray(card.scopeItems),
    terms: terminologyTerms(scope, workspaceRoot, stringArray(card.terms)),
    outOfScopeItems: stringArray(card.outOfScopeItems),
    decisionLogs: recordArray(card.decisionLogs).map((decision) => ({
      date: stringValue(decision.date),
      decision: stringValue(decision.decision),
      reason: stringValue(decision.reason),
      decisionMaker: stringValue(decision.decisionMaker),
      impact: stringValue(decision.impact),
    })),
    acceptanceCriteria: buildAcceptanceCriteria(card, traceRequirement, coverage),
    scenarios,
    coverage,
    redReasons: recordArray(traceRequirement.redReasons).map((finding) => findingRow(finding, requirementId)),
    blueBlockedBy: stringArray(traceRequirement.blueBlockedBy),
    linkedArtifacts: uniqueArtifacts(scenarios.map((scenario) => ({ kind: "scenario", file: scenario.file, line: scenario.line }))),
    apiSurfaces,
    dataShapes,
    entitySurfaces,
    uiSurfaces,
  };
}

export function buildGateViewModel(scope: HarnessScope, workspaceRoot = defaultWorkspaceRoot): GateViewModel {
  const reportPayload = readJson(outputPath(workspaceRoot, scope, "reports", "gate-report.json"));
  const report = asRecord(reportPayload);
  const categories = recordArray(report.categories).map((category): GateCategory => ({
    category: stringValue(category.category),
    blocked: category.blocked === true,
    errors: numberValue(category.errors, 0),
    byRuleId: Object.fromEntries(
      Object.entries(asRecord(category.byRuleId)).map(([ruleId, count]) => [ruleId, numberValue(count, 0)]),
    ),
  }));

  const findingsDir = outputPath(workspaceRoot, scope, "findings");
  const findings = fs.existsSync(findingsDir)
    ? fs.readdirSync(findingsDir)
      .filter((file) => file.endsWith(".findings.json"))
      .flatMap((file) => recordArray(asRecord(maybeReadJson(path.join(findingsDir, file))).findings).map((finding) => findingRow(finding)))
    : [];

  return {
    generatedAt: typeof report.generatedAt === "string" ? report.generatedAt : null,
    categories,
    findings,
  };
}

function placeholderRequirement(id: string): RequirementRow {
  return {
    id,
    title: id,
    traceState: "INACTIVE",
    cardStatus: "상태 없음",
    productArea: "unknown",
    priority: "미지정",
    specRole: "미지정",
    parentRequirementIds: [],
    childRequirementIds: [],
    relatedRequirementIds: [],
  };
}

export function buildChangeSetRows(scope: HarnessScope, workspaceRoot = defaultWorkspaceRoot): ChangeSetRow[] {
  const changeSetPayload = readJson(outputPath(workspaceRoot, scope, "indexes", "change-sets.index.json"));
  const tracePayload = maybeReadJson(outputPath(workspaceRoot, scope, "state", "trace.state.json"));
  const requirementsById = new Map(rowsFromTracePayload(tracePayload).map((row) => [row.id, row]));

  return requirementEntries(changeSetPayload).map((entry) => {
    const affectedRequirementIds = stringArray(entry.affectedRequirementIds).length > 0
      ? stringArray(entry.affectedRequirementIds)
      : stringArray(entry.requirements);
    return {
      title: stringValue(entry.title),
      status: stringValue(entry.status, "상태 없음"),
      requestedDate: stringValue(entry.requestedDate),
      affectedRequirements: affectedRequirementIds.map((id) => requirementsById.get(id) ?? placeholderRequirement(id)),
      summary: stringArray(entry.requestSummary).join(" "),
      scopeItems: stringArray(entry.scopeItems),
      completionCriteria: stringArray(entry.completionCriteria),
      verificationCommands: stringArray(entry.verificationCommands),
      openDiscussions: stringArray(entry.openDiscussions),
    };
  });
}

export function buildCommandRunnerModel(scope: HarnessScope, workspaceRoot = defaultWorkspaceRoot): CommandRunnerModel {
  return {
    commands: commandDefinitions,
    run: {
      status: "ready",
      selectedCommand: commandDefinitions[0]?.id ?? "",
      logs: [],
    },
    requirements: buildRequirementBoardModel(scope, workspaceRoot).rows,
  };
}
