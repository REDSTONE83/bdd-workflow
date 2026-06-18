import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { requirementRows } from "../../lib/harness-data/fixtures";
import { filterRequirementRows, RequirementBoard } from "./RequirementBoardPage";
import { requirementDetailPath, requirementListPath } from "./requirement-navigation";

describe("filterRequirementRows", () => {
  test("filters requirements by title text", () => {
    const results = filterRequirementRows(requirementRows, {
      titleQuery: "목록조회",
      traceState: "ALL",
      cardStatus: "ALL",
      productArea: "ALL",
    }).map((row) => row.id);

    expect(results).toEqual(["REQ-023"]);
  });

  test("combines title search with select filters", () => {
    const results = filterRequirementRows(requirementRows, {
      titleQuery: "하네스 UI",
      traceState: "RED",
      cardStatus: "초안",
      productArea: "harness",
    }).map((row) => row.id);

    expect(results).toEqual(["REQ-030", "REQ-031"]);
  });

  test("renders metadata badges next to the title without kind prefixes", () => {
    const requirement = requirementRows.find((row) => row.id === "REQ-031");
    if (!requirement) throw new Error("REQ-031 fixture is missing");

    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(RequirementBoard, {
          rows: [requirement],
          summary: [{ state: "RED", count: 1 }],
        }),
      ),
    );

    expect(html).toContain("bg-secondary text-secondary-foreground");
    expect(html).toContain("border-sky-200 bg-sky-50 text-sky-800");
    expect(html).toContain("border-amber-200 bg-amber-50 text-amber-900");
    expect(html).not.toContain("카드 초안");
    expect(html).not.toContain("영역 harness");
    expect(html).not.toContain("우선 높음");
    expect(html).toMatch(/하네스 UI 요건 추적 보드[\s\S]*초안[\s\S]*harness[\s\S]*높음[\s\S]*원자 요건[\s\S]*RED/);
  });

  test("reads board filters from the route query", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ["/requirements?title=하네스UI&traceState=RED&cardStatus=초안&productArea=harness"] },
        createElement(RequirementBoard, {
          rows: requirementRows,
          summary: [{ state: "RED", count: 2 }],
        }),
      ),
    );

    expect(html).toContain("REQ-030");
    expect(html).toContain("REQ-031");
    expect(html).not.toContain("REQ-010");
    expect(html).not.toContain("REQ-021");
  });

  test("preserves the board query when moving between list and detail routes", () => {
    const search = "?title=요건&traceState=RED&cardStatus=초안&productArea=harness";

    expect(requirementDetailPath("REQ-031", search)).toBe(`/requirements/REQ-031${search}`);
    expect(requirementListPath(search)).toBe(`/requirements${search}`);
  });
});
