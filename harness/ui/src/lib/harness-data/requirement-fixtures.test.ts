import { describe, expect, it } from "vitest";
import { requirementDetail, requirementRows, requirementSummary } from "./fixtures";

describe("requirement fixtures", () => {
  it("keeps requirement summary aligned with requirement rows", () => {
    const redRows = requirementRows.filter((row) => row.traceState === "RED").length;

    expect(requirementSummary.find((item) => item.state === "RED")?.count).toBeGreaterThanOrEqual(redRows);
  });

  it("exposes hierarchy metadata for board and picker views", () => {
    const parent = requirementRows.find((row) => row.id === "REQ-021");
    const child = requirementRows.find((row) => row.id === "REQ-023");

    expect(parent?.specRole).toBe("상위 요건");
    expect(parent?.childRequirementIds).toContain("REQ-023");
    expect(child?.parentRequirementIds).toEqual(["REQ-021"]);
    expect(requirementRows.every((row) => Array.isArray(row.relatedRequirementIds))).toBe(true);
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

  it("allows UI surface cards to carry descriptions", () => {
    expect(requirementDetail.uiSurfaces.every((surface) => typeof surface.description === "string" && surface.description.length > 0)).toBe(true);
  });

  it("exposes entity surfaces with source-index column metadata", () => {
    expect(requirementDetail.entitySurfaces.length).toBeGreaterThan(0);
    expect(requirementDetail.entitySurfaces.every((entity) => entity.className && entity.table && entity.file && Array.isArray(entity.columns))).toBe(true);
    expect(
      requirementDetail.entitySurfaces.every((entity) =>
        entity.columns.every(
          (column) =>
            column.fieldName &&
            column.columnName &&
            column.javaType &&
            typeof column.primaryKey === "boolean" &&
            Array.isArray(column.annotations) &&
            Array.isArray(column.requirements),
        ),
      ),
    ).toBe(true);
  });
});
