import { describe, expect, it } from "vitest";
import { commands, gateCategories, readyRun, requirementDetail, requirementRows, requirementSummary, runningRun, terminologyBrowser } from "./fixtures";
import { filterTerminologyTerms, terminologyDomains } from "./terminology";

describe("harness UI fixture model", () => {
  it("keeps requirement summary aligned with requirement rows", () => {
    const redRows = requirementRows.filter((row) => row.traceState === "RED").length;
    expect(requirementSummary.find((item) => item.state === "RED")?.count).toBeGreaterThanOrEqual(redRows);
  });

  it("exposes requirement hierarchy metadata for board and picker views", () => {
    const parent = requirementRows.find((row) => row.id === "REQ-021");
    const child = requirementRows.find((row) => row.id === "REQ-023");

    expect(parent?.specRole).toBe("상위 요건");
    expect(parent?.childRequirementIds).toContain("REQ-023");
    expect(child?.parentRequirementIds).toEqual(["REQ-021"]);
    expect(requirementRows.every((row) => Array.isArray(row.relatedRequirementIds))).toBe(true);
  });

  it("keeps gate categories in the unified gate order", () => {
    expect(gateCategories.map((category) => category.category)).toEqual([
      "TRACE",
      "CARD",
      "REF",
      "TRC",
      "BE",
      "FE",
      "SCN",
      "TRM",
    ]);
  });

  it("exposes only the MVP command allow list", () => {
    expect(commands.map((command) => command.id)).toEqual([
      "harness:trace",
      "harness:validate",
      "harness:self-test",
      "app:trace",
      "app:validate",
      "repo:validate",
    ]);
  });

  it("starts the command runner without an implicit requirement selection", () => {
    expect(readyRun.requirementId).toBeUndefined();
    expect(runningRun.requirementId).toBe("REQ-031");
  });

  it("allows UI surface cards to carry descriptions", () => {
    expect(requirementDetail.uiSurfaces.every((surface) => typeof surface.description === "string" && surface.description.length > 0)).toBe(true);
  });

  it("can project test information onto AC and scenario items", () => {
    const coverageByCriterion = new Map(requirementDetail.coverage.map((row) => [row.criterion, row]));

    expect(requirementDetail.acceptanceCriteria.every((criterion) => coverageByCriterion.has(criterion.text))).toBe(true);
    expect(requirementDetail.scenarios.every((scenario) => scenario.covers.every((cover) => coverageByCriterion.has(cover)))).toBe(true);
    expect(requirementDetail.coverage.every((row) => Array.isArray(row.tests))).toBe(true);
  });

  it("exposes requirement card overview sections", () => {
    expect(requirementDetail.purpose.length).toBeGreaterThan(0);
    expect(requirementDetail.scopeItems.length).toBeGreaterThan(0);
    expect(requirementDetail.terms.length).toBeGreaterThan(0);
    expect(requirementDetail.terms.every((term) => term.key && term.ko && term.en)).toBe(true);
    expect(requirementDetail.outOfScopeItems.length).toBeGreaterThan(0);
    expect(requirementDetail.decisionLogs.length).toBeGreaterThan(0);
    expect(requirementDetail.decisionLogs.every((log) => log.date && log.decision)).toBe(true);
  });

  it("exposes terminology browser fields from the terminology index contract", () => {
    expect(terminologyBrowser.terms.length).toBeGreaterThan(0);
    expect(terminologyBrowser.terms.every((term) => term.key && term.status && term.sourceFile && term.ko && term.en && term.meaning)).toBe(true);
    expect(terminologyBrowser.terms.some((term) => term.allow.length > 0)).toBe(true);
    expect(terminologyBrowser.terms.some((term) => term.ban.length > 0)).toBe(true);
    expect(terminologyBrowser.terms.some((term) => Object.values(term.names).flat().length > 0)).toBe(true);
  });

  it("filters terminology terms by domain, status, and searchable fields", () => {
    expect(terminologyDomains(terminologyBrowser.terms)).toEqual(["harness", "todo", "ui"]);
    expect(filterTerminologyTerms(terminologyBrowser.terms, { query: "traceState", domain: "ALL", status: "ALL" }).map((term) => term.key)).toEqual(["harness.traceState"]);
    expect(filterTerminologyTerms(terminologyBrowser.terms, { query: "모달", domain: "ALL", status: "ALL" }).map((term) => term.key)).toEqual(["ui.dialog"]);
    expect(filterTerminologyTerms(terminologyBrowser.terms, { query: "", domain: "ui", status: "approved" }).map((term) => term.domain)).toEqual(["ui", "ui"]);
    expect(filterTerminologyTerms(terminologyBrowser.terms, { query: "", domain: "ALL", status: "draft" }).map((term) => term.key)).toEqual(["todo.dueDate"]);
  });

  it("keeps artifact and source kinds distinguishable for badges", () => {
    const artifactItems = [requirementDetail.sourceFile, ...requirementDetail.linkedArtifacts];
    const artifactKinds = artifactItems.map((item) => item.kind);
    const artifactFiles = artifactItems.map((item) => item.file);
    const sourceItems = [
      ...requirementDetail.apiSurfaces.map((api) => ({ kind: `api:${api.operationId}`, file: api.file })),
      ...requirementDetail.dataShapes.map((shape) => ({ kind: `${shape.kind}:${shape.name}`, file: shape.file })),
      ...requirementDetail.uiSurfaces.map((surface) => ({ kind: `${surface.kind}:${surface.name}`, file: surface.file })),
    ];
    const sourceKinds = sourceItems.map((item) => item.kind);

    expect(new Set(artifactKinds)).toEqual(new Set(["card", "scenario"]));
    expect(sourceItems.every((item) => !artifactFiles.includes(item.file))).toBe(true);
    expect(sourceKinds.some((kind) => artifactKinds.includes(kind))).toBe(false);
    expect(sourceKinds.some((kind) => kind.startsWith("api:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Request:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Response:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Entity:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Page:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Story:"))).toBe(true);
  });
});
