import { describe, expect, it } from "vitest";
import { commands, gateCategories, requirementDetail, requirementRows, requirementSummary } from "./fixtures";

describe("harness UI fixture model", () => {
  it("keeps requirement summary aligned with requirement rows", () => {
    const redRows = requirementRows.filter((row) => row.traceState === "RED").length;
    expect(requirementSummary.find((item) => item.state === "RED")?.count).toBeGreaterThanOrEqual(redRows);
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

  it("allows UI surface cards to carry descriptions", () => {
    expect(requirementDetail.uiSurfaces.every((surface) => typeof surface.description === "string" && surface.description.length > 0)).toBe(true);
  });

  it("can project test information onto AC and scenario items", () => {
    const coverageByCriterion = new Map(requirementDetail.coverage.map((row) => [row.criterion, row]));

    expect(requirementDetail.acceptanceCriteria.every((criterion) => coverageByCriterion.has(criterion.text))).toBe(true);
    expect(requirementDetail.scenarios.every((scenario) => scenario.covers.every((cover) => coverageByCriterion.has(cover)))).toBe(true);
    expect(requirementDetail.coverage.every((row) => Array.isArray(row.tests))).toBe(true);
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
