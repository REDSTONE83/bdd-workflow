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
  SurfaceApiItem,
  SurfaceEntityItem,
  SurfaceInventoryModel,
  SurfaceRequirementRef,
  SurfaceUiItem,
  TestResultIssue,
  TestResultRow,
  TestResultSummary,
  TestType,
  TestTypeSummary,
  TestResultsModel,
  TestRunStatus,
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

function readBackendSourceIndex(scope: HarnessScope, workspaceRoot: string) {
  return maybeReadJson(outputPath(workspaceRoot, scope, "indexes", "backend.source-index.json"));
}

function readFrontEndSourceIndex(scope: HarnessScope, workspaceRoot: string) {
  return maybeReadJson(outputPath(workspaceRoot, scope, "indexes", "front-end.source-index.json"));
}

function readHarnessSelfTestIndex(scope: HarnessScope, workspaceRoot: string) {
  if (scope !== "harness") return null;
  return maybeReadJson(outputPath(workspaceRoot, scope, "indexes", "harness.self-test.index.json"));
}

function readTestResultsIndex(scope: HarnessScope, workspaceRoot: string) {
  return readJson(outputPath(workspaceRoot, scope, "indexes", "test-results.index.json"));
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

function splitGenericArguments(value: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "<") depth += 1;
    if (char === ">") depth -= 1;
    if (char === "," && depth === 0) {
      args.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  const last = value.slice(start).trim();
  return last ? [...args, last] : args;
}

function simpleJavaName(value: string): string {
  const trimmed = value.trim();
  return trimmed.split(".").pop() ?? trimmed;
}

function parseJavaType(value: string): { name: string; args: string[] } {
  const trimmed = value.trim();
  const genericStart = trimmed.indexOf("<");
  if (genericStart < 0 || !trimmed.endsWith(">")) return { name: simpleJavaName(trimmed), args: [] };
  return {
    name: simpleJavaName(trimmed.slice(0, genericStart)),
    args: splitGenericArguments(trimmed.slice(genericStart + 1, -1)),
  };
}

function cleanJavaType(value: string, bindings = new Map<string, string>()): string {
  const parsed = parseJavaType(value);
  if (!parsed.name) return "";
  if ((parsed.name === "ResponseEntity" || parsed.name === "JsonNullable") && parsed.args[0]) {
    return cleanJavaType(parsed.args[0], bindings);
  }
  if (parsed.args.length > 0) {
    return `${parsed.name}<${parsed.args.map((arg) => cleanJavaType(arg, bindings)).join(", ")}>`;
  }
  const bound = bindings.get(parsed.name);
  return bound && bound !== parsed.name ? cleanJavaType(bound, bindings) : parsed.name;
}

function isVoidJavaType(value: string): boolean {
  const cleaned = cleanJavaType(value);
  return cleaned === "Void" || cleaned === "void";
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
      .map((parameter) => cleanJavaType(stringValue(parameter.javaType)))
      .filter(Boolean);
    // 응답 데이터 shape는 반환 DTO만 담는다. 상태 코드(201/400 등)는 DTO shape가 아니므로
    // dataShapes 대상에서 제외한다(data-contracts.md: dataShapes[]는 Request/Response와 참조 객체 DTO shape).
    const responseType = cleanJavaType(stringValue(api.returnType));
    const responseTypes = responseType && !isVoidJavaType(responseType) ? [responseType] : [];

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

function typeVariablesForDto(dto: Record<string, unknown>): string[] {
  const variables = new Set<string>();
  for (const field of recordArray(dto.fields)) {
    const type = cleanJavaType(stringValue(field.javaType));
    for (const match of type.matchAll(/\b[A-Z]\b/g)) variables.add(match[0]);
  }
  return [...variables];
}

function typeBindingsForDto(dto: Record<string, unknown>, name: string): Map<string, string> {
  const args = parseJavaType(name).args;
  if (args.length === 0) return new Map();
  const variables = typeVariablesForDto(dto);
  return new Map(variables.slice(0, args.length).map((variable, index) => [variable, cleanJavaType(args[index])]));
}

function dtoNamesInType(type: string, dtoMap: Map<string, Record<string, unknown>>): string[] {
  const names = new Set<string>();
  for (const match of cleanJavaType(type).matchAll(/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/g)) {
    const name = simpleJavaName(match[0]);
    if (dtoMap.has(name)) names.add(name);
  }
  return [...names];
}

function dtoFields(dto: Record<string, unknown>, bindings = new Map<string, string>()): RequirementDataField[] {
  return recordArray(dto.fields).map((field) => {
    const description = stringValue(field.schemaDescription);
    return {
      name: stringValue(field.name),
      type: cleanJavaType(stringValue(field.javaType), bindings),
      required: isRequiredField(field),
      ...(description ? { description } : {}),
    };
  });
}

function buildDataShapes(
  apiSurfaces: Array<Pick<RequirementApiSurface, "requests" | "responses" | "file" | "line">>,
  dtoMap: Map<string, Record<string, unknown>>,
): RequirementDataShape[] {
  const shapes = new Map<string, RequirementDataShape>();
  const hasName = (name: string) => [...shapes.values()].some((shape) => shape.name === name);

  function addShape(kind: RequirementDataShape["kind"], name: string, fallbackFile: string, fallbackLine: number) {
    const key = `${kind}:${name}`;
    if (!name || shapes.has(key)) return;
    const parsed = parseJavaType(name);
    const dto = dtoMap.get(parsed.name);
    const bindings = dto ? typeBindingsForDto(dto, name) : new Map<string, string>();
    shapes.set(key, {
      kind,
      name,
      status: "연결됨",
      file: dto ? stringValue(dto.file, fallbackFile) : fallbackFile,
      line: dto ? normalizeLine(dto.schemaLine) : fallbackLine,
      fields: dto ? dtoFields(dto, bindings) : [],
    });
    if (!dto) return;
    // 필드가 다른 DTO를 참조하면 그 객체도 shape로 펼쳐 중첩 표시를 가능하게 한다.
    for (const field of recordArray(dto.fields)) {
      const fieldType = cleanJavaType(stringValue(field.javaType), bindings);
      for (const referenced of dtoNamesInType(fieldType, dtoMap)) {
        if (referenced === parsed.name || hasName(referenced)) continue;
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

function generatedAtFrom(...payloads: unknown[]): string | null {
  for (const payload of payloads) {
    const generatedAt = asRecord(payload).generatedAt;
    if (typeof generatedAt === "string") return generatedAt;
  }
  return null;
}

const testStatuses: TestRunStatus[] = ["PASS", "FAIL", "SKIP", "NOT_RUN"];
const testTypes: TestType[] = ["API", "UI", "UNIT", "E2E", "STATIC", "OTHER"];

function testRunStatus(value: unknown): TestRunStatus {
  return testStatuses.includes(value as TestRunStatus) ? value as TestRunStatus : "NOT_RUN";
}

function testTypeFor(value: Record<string, unknown>): TestType {
  const runtime = stringValue(value.runtime).toLowerCase();
  const source = stringValue(value.source).toLowerCase();
  const identity = stringValue(value.identity, stringValue(value.displayName)).toLowerCase();
  const file = stringValue(value.file, stringValue(asRecord(value.location).file)).toLowerCase();

  if (runtime.includes("playwright") || file.includes("/e2e/") || identity.includes("e2e")) return "E2E";
  if (runtime.includes("storybook")) return "UI";
  if (runtime.includes("junit")) return "API";
  if (runtime.includes("vitest") || runtime.includes("node")) return "UNIT";
  if (source === "harness") return "STATIC";
  return "OTHER";
}

function backendDisplayIdentity(value: Record<string, unknown>): string {
  const className = stringValue(value.className);
  const displayName = stringValue(value.displayName);
  return className && displayName ? `${className}.${displayName}` : "";
}

function testKeys(value: Record<string, unknown>): string[] {
  return [
    stringValue(value.identity),
    stringValue(value.displayName),
    backendDisplayIdentity(value),
    stringValue(asRecord(value.location).identity),
    ...stringArray(value.resultKeys),
    ...stringArray(value.alternateIdentities),
  ].filter((key, index, list) => key && list.indexOf(key) === index);
}

function inferredJavaMethodLine(workspaceRoot: string, test: Record<string, unknown>): number {
  const file = stringValue(test.file, stringValue(asRecord(test.location).file));
  const method = stringValue(test.method);
  if (!file || !method) return 1;

  try {
    const content = fs.readFileSync(path.join(workspaceRoot, file), "utf8");
    const lines = content.split(/\r?\n/);
    const methodPattern = new RegExp(`\\b${method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(`);
    const index = lines.findIndex((line) => methodPattern.test(line));
    return index >= 0 ? index + 1 : 1;
  } catch {
    return 1;
  }
}

function withTestSourceDefaults(
  test: Record<string, unknown>,
  defaults: { scope: HarnessScope; source: string; runtime: string },
  workspaceRoot: string,
): Record<string, unknown> {
  const line = normalizeLine(test.line ?? asRecord(test.location).line ?? inferredJavaMethodLine(workspaceRoot, test));
  return {
    ...test,
    scope: stringValue(test.scope, defaults.scope),
    source: stringValue(test.source, defaults.source),
    runtime: stringValue(test.runtime, defaults.runtime),
    line,
  };
}

function testSourceRows(
  scope: HarnessScope,
  backendPayload: unknown,
  frontEndPayload: unknown,
  selfTestPayload: unknown,
  workspaceRoot: string,
): Record<string, unknown>[] {
  return [
    ...recordArray(asRecord(backendPayload).tests).map((test) => withTestSourceDefaults(test, { scope, source: "back-end", runtime: "junit" }, workspaceRoot)),
    ...recordArray(asRecord(frontEndPayload).tests).map((test) => withTestSourceDefaults(test, { scope, source: "front-end", runtime: stringValue(test.runtime, "front-end") }, workspaceRoot)),
    ...recordArray(asRecord(selfTestPayload).tests).map((test) => withTestSourceDefaults(test, { scope, source: "harness", runtime: stringValue(test.runtime, "node") }, workspaceRoot)),
  ];
}

function testResultRows(payload: unknown): Record<string, unknown>[] {
  return recordArray(asRecord(payload).entries);
}

function sourceTestRow(
  scope: HarnessScope,
  sourceTest: Record<string, unknown>,
  result: Record<string, unknown> | null,
  requirementsById: Map<string, SurfaceRequirementRef>,
): TestResultRow {
  const sourceLocation = asRecord(sourceTest.location);
  const resultLocation = asRecord(result?.location);
  const identity = stringValue(sourceTest.identity, stringValue(sourceLocation.identity, stringValue(sourceTest.displayName)));
  const runtime = stringValue(sourceTest.runtime, stringValue(result?.runtime, "unknown"));
  const file = stringValue(sourceTest.file, stringValue(sourceLocation.file));
  const line = normalizeLine(sourceTest.line ?? sourceLocation.line);
  const resultFile = stringValue(resultLocation.file);
  const resultLine = normalizeLine(resultLocation.line);
  const requirements = requirementRefs(stringArray(sourceTest.requirements), requirementsById);

  return {
    id: `source:${runtime}:${identity}`,
    scope,
    source: stringValue(sourceTest.source, "front-end"),
    runtime,
    testType: testTypeFor({ ...sourceTest, runtime }),
    status: result ? testRunStatus(result.status) : "NOT_RUN",
    displayName: stringValue(sourceTest.displayName, identity),
    identity,
    requirements,
    covers: stringArray(sourceTest.covers).map((text) => ({ text, requirements })),
    file,
    line,
    ...(result ? { resultIdentity: stringValue(result.identity, stringValue(resultLocation.identity)) } : {}),
    ...(result && resultFile ? { resultFile } : {}),
    ...(result && resultFile ? { resultLine } : {}),
  };
}

function resultOnlyTestRow(
  scope: HarnessScope,
  result: Record<string, unknown>,
  requirementsById: Map<string, SurfaceRequirementRef>,
): TestResultRow {
  const location = asRecord(result.location);
  const identity = stringValue(result.identity, stringValue(location.identity));
  const runtime = stringValue(result.runtime, "unknown");
  const file = stringValue(location.file);
  const line = normalizeLine(location.line);

  return {
    id: `result:${runtime}:${identity}`,
    scope,
    source: "test-results",
    runtime,
    testType: testTypeFor(result),
    status: testRunStatus(result.status),
    displayName: identity,
    identity,
    requirements: requirementRefs(stringArray(result.requirements), requirementsById),
    covers: [],
    file,
    line,
    resultIdentity: identity,
    resultFile: file,
    resultLine: line,
  };
}

function buildTestRows(
  scope: HarnessScope,
  sourceTests: Record<string, unknown>[],
  results: Record<string, unknown>[],
  requirementsById: Map<string, SurfaceRequirementRef>,
): TestResultRow[] {
  const resultsByKey = new Map<string, { result: Record<string, unknown>; index: number }>();
  results.forEach((result, index) => {
    for (const key of testKeys(result)) {
      if (!resultsByKey.has(key)) {
        resultsByKey.set(key, { result, index });
      }
    }
  });

  const usedResultIndexes = new Set<number>();
  const sourceRows = sourceTests.map((sourceTest) => {
    let matched: { result: Record<string, unknown>; index: number } | null = null;
    for (const key of testKeys(sourceTest)) {
      const candidate = resultsByKey.get(key);
      if (candidate && !usedResultIndexes.has(candidate.index)) {
        matched = candidate;
        usedResultIndexes.add(candidate.index);
        break;
      }
    }
    return sourceTestRow(scope, sourceTest, matched?.result ?? null, requirementsById);
  });

  const resultRows = results
    .filter((_result, index) => !usedResultIndexes.has(index))
    .map((result) => resultOnlyTestRow(scope, result, requirementsById));

  return [...sourceRows, ...resultRows].sort((left, right) =>
    compareByLabel(`${left.runtime} ${left.displayName}`, `${right.runtime} ${right.displayName}`),
  );
}

function testSummary(rows: TestResultRow[]): TestResultSummary[] {
  return testStatuses.map((status) => ({
    status,
    count: rows.filter((row) => row.status === status).length,
  }));
}

function testTypeSummary(rows: TestResultRow[]): TestTypeSummary[] {
  return testTypes.map((type) => ({
    type,
    count: rows.filter((row) => row.testType === type).length,
  }));
}

function buildTestIssues(payload: unknown): TestResultIssue[] {
  return recordArray(asRecord(payload).issues).map((issue) => {
    const location = asRecord(issue.location);
    return {
      kind: stringValue(issue.kind, "TEST_RESULT_ISSUE"),
      runtime: stringValue(issue.runtime, "unknown"),
      reason: stringValue(issue.reason),
      resultFile: stringValue(issue.resultFile),
      identity: stringValue(issue.identity) || undefined,
      file: stringValue(location.file),
      line: normalizeLine(location.line),
    };
  });
}

export function buildTestResultsModel(scope: HarnessScope, workspaceRoot = defaultWorkspaceRoot): TestResultsModel {
  const frontEndPayload = readFrontEndSourceIndex(scope, workspaceRoot);
  const selfTestPayload = readHarnessSelfTestIndex(scope, workspaceRoot);
  const backendPayload = readBackendSourceIndex(scope, workspaceRoot);
  const resultPayload = readTestResultsIndex(scope, workspaceRoot);
  const tracePayload = maybeReadJson(outputPath(workspaceRoot, scope, "state", "trace.state.json"));
  const tests = buildTestRows(
    scope,
    testSourceRows(scope, backendPayload, frontEndPayload, selfTestPayload, workspaceRoot),
    testResultRows(resultPayload),
    requirementRefMap(tracePayload),
  );

  return {
    scope,
    generatedAt: generatedAtFrom(resultPayload, frontEndPayload, selfTestPayload),
    sourceGeneratedAt: generatedAtFrom(frontEndPayload, selfTestPayload),
    resultGeneratedAt: generatedAtFrom(resultPayload),
    summary: testSummary(tests),
    typeSummary: testTypeSummary(tests),
    tests,
    issues: buildTestIssues(resultPayload),
  };
}

function requirementRefMap(tracePayload: unknown): Map<string, SurfaceRequirementRef> {
  return new Map(rowsFromTracePayload(tracePayload).map((row) => [
    row.id,
    { id: row.id, title: row.title, traceState: row.traceState },
  ]));
}

function requirementRefs(ids: string[], byId: Map<string, SurfaceRequirementRef>): SurfaceRequirementRef[] {
  return [...new Set(ids)]
    .filter(Boolean)
    .map((id) => byId.get(id) ?? { id, title: id, traceState: "INACTIVE" });
}

function compareByLabel(left: string, right: string): number {
  return left.localeCompare(right, "ko");
}

function buildSurfaceApiItems(backendPayload: unknown, requirementsById: Map<string, SurfaceRequirementRef>): SurfaceApiItem[] {
  return recordArray(asRecord(backendPayload).apis)
    .map((api) => {
      const http = methodAndPath(api);
      const requestTypes = recordArray(api.parameters)
        .filter((parameter) => parameter.springRequestBody === true)
        .map((parameter) => cleanJavaType(stringValue(parameter.javaType)))
        .filter(Boolean);
      const responseType = cleanJavaType(stringValue(api.returnType));
      const responseBodies = responseType && !isVoidJavaType(responseType) ? [responseType] : [];
      const operationId = stringValue(api.controller, `${http.method} ${http.path}`);

      return {
        id: `API:${http.method}:${http.path}:${operationId}`,
        method: http.method,
        path: http.path,
        operationId,
        summary: stringValue(api.operationSummary),
        description: stringValue(api.operationDescription),
        file: stringValue(api.file),
        line: normalizeLine(api.line),
        requirements: requirementRefs(stringArray(api.requirements), requirementsById),
        requests: [...new Set(requestTypes)],
        responseBodies: [...new Set(responseBodies)],
        responses: recordArray(api.responses).map((response) => ({
          code: stringValue(response.responseCode),
          description: stringValue(response.description),
          line: normalizeLine(response.line),
        })),
      };
    })
    .sort((left, right) => compareByLabel(`${left.path} ${left.method}`, `${right.path} ${right.method}`));
}

function buildSurfaceEntityItems(backendPayload: unknown, requirementsById: Map<string, SurfaceRequirementRef>): SurfaceEntityItem[] {
  return recordArray(asRecord(backendPayload).entities)
    .map((entity) => {
      const className = stringValue(entity.className);
      const table = stringValue(entity.table);
      return {
        id: `Entity:${className}:${table}`,
        className,
        table,
        file: stringValue(entity.file),
        line: normalizeLine(entity.line),
        listeners: stringArray(entity.listeners),
        requirements: requirementRefs(stringArray(entity.requirements), requirementsById),
        columns: buildEntityColumns(entity.columns),
      };
    })
    .sort((left, right) => compareByLabel(`${left.table} ${left.className}`, `${right.table} ${right.className}`));
}

function sourceLine(record: Record<string, unknown>): number {
  return normalizeLine(asRecord(record.location).line ?? record.line);
}

function buildSurfaceUiItems(
  scope: HarnessScope,
  frontEndPayload: unknown,
  requirementsById: Map<string, SurfaceRequirementRef>,
): SurfaceUiItem[] {
  const frontEnd = asRecord(frontEndPayload);
  const pages: SurfaceUiItem[] = recordArray(frontEnd.pages).map((page) => {
    const name = stringValue(page.name);
    const route = typeof page.route === "string" ? page.route : undefined;
    return {
      id: `UI:Page:${name}:${route ?? ""}:${stringValue(page.file)}`,
      kind: "Page",
      name,
      file: stringValue(page.file),
      line: sourceLine(page),
      requirements: requirementRefs(stringArray(page.requirements), requirementsById),
      ...(route ? { route } : {}),
    };
  });
  const routes: SurfaceUiItem[] = recordArray(frontEnd.routes).map((route) => {
    const pathValue = stringValue(route.path);
    const name = stringValue(route.component, pathValue);
    return {
      id: `UI:Route:${name}:${pathValue}:${stringValue(route.file)}`,
      kind: "Route",
      name,
      file: stringValue(route.file),
      line: sourceLine(route),
      requirements: requirementRefs(stringArray(route.requirements), requirementsById),
      route: pathValue,
    };
  });
  const stories: SurfaceUiItem[] = recordArray(frontEnd.stories).map((story) => {
    const title = stringValue(story.title);
    const storyName = stringValue(story.story);
    const name = stringValue(story.component, storyName);
    return {
      id: `UI:Story:${title}:${storyName}:${stringValue(story.file)}`,
      kind: "Story",
      name,
      file: stringValue(story.file),
      line: sourceLine(story),
      requirements: requirementRefs(stringArray(story.requirements), requirementsById),
      storybookTitle: title,
      storybookStory: storyName,
      ...(title && storyName ? { storybookUrl: storybookUrl(scope, title, storyName) } : {}),
      hasPlay: story.hasPlay === true,
      hasAssertion: story.hasAssertion === true,
    };
  });

  const kindOrder = { Page: 0, Route: 1, Story: 2 } satisfies Record<SurfaceUiItem["kind"], number>;
  return [...pages, ...routes, ...stories]
    .filter((surface) => surface.file || surface.name)
    .sort((left, right) => kindOrder[left.kind] - kindOrder[right.kind] || compareByLabel(left.name, right.name));
}

export function buildSurfaceInventoryModel(
  scope: HarnessScope,
  workspaceRoot = defaultWorkspaceRoot,
): SurfaceInventoryModel {
  const tracePayload = readTraceState(scope, workspaceRoot);
  const backendPayload = readBackendSourceIndex(scope, workspaceRoot);
  const frontEndPayload = readFrontEndSourceIndex(scope, workspaceRoot);
  const requirementsById = requirementRefMap(tracePayload);
  const apis = buildSurfaceApiItems(backendPayload, requirementsById);
  const dataShapes = buildDataShapes(
    apis.map((api) => ({
      requests: api.requests,
      responses: api.responseBodies,
      file: api.file,
      line: api.line,
    })),
    readBackendDtoMap(scope, workspaceRoot),
  );

  return {
    scope,
    generatedAt: generatedAtFrom(tracePayload, backendPayload, frontEndPayload),
    apis,
    dataShapes,
    entities: buildSurfaceEntityItems(backendPayload, requirementsById),
    uiSurfaces: buildSurfaceUiItems(scope, frontEndPayload, requirementsById),
  };
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
