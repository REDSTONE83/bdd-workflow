import { describe, expect, it } from "vitest";
import { appRequirementDetail, requirementDetail, requirementRows, requirementSummary } from "./fixtures";

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
    expect(appRequirementDetail.entitySurfaces.length).toBeGreaterThan(0);
    expect(appRequirementDetail.entitySurfaces.every((entity) => entity.className && entity.table && entity.file && Array.isArray(entity.columns))).toBe(true);
    expect(
      appRequirementDetail.entitySurfaces.every((entity) =>
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

  it("keeps harness requirement detail free of backend surfaces", () => {
    // 하네스 요건은 JPA 엔티티·Spring API가 없으므로 라이브 출력과 같이 백엔드 표면이 비어야 한다.
    expect(requirementDetail.apiSurfaces).toEqual([]);
    expect(requirementDetail.dataShapes).toEqual([]);
    expect(requirementDetail.entitySurfaces).toEqual([]);
  });

  it("populates app requirement Request/Response data shape fields", () => {
    // Request/Response DTO shape는 라이브 buildDataShapes와 같은 규칙으로 필드 구성을 채운다.
    const request = appRequirementDetail.dataShapes.find((shape) => shape.kind === "Request");
    const response = appRequirementDetail.dataShapes.find((shape) => shape.kind === "Response");
    expect(request?.fields.length).toBeGreaterThan(0);
    expect(response?.fields.length).toBeGreaterThan(0);
    expect(appRequirementDetail.dataShapes.every((shape) => shape.fields.every((field) => field.name && field.type))).toBe(true);
    // 응답 DTO가 다른 객체를 참조하면 그 객체도 dataShapes에 중첩 shape로 들어 있다.
    const referenced = response?.fields.find((field) => field.type === "TodoCategoryInfo");
    expect(referenced).toBeTruthy();
    expect(appRequirementDetail.dataShapes.some((shape) => shape.name === "TodoCategoryInfo")).toBe(true);
  });
});
