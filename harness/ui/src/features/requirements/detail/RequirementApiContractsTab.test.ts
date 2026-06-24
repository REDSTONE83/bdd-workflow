import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { appRequirementDetail } from "../../../lib/harness-data/fixtures";
import { RequirementApiContractsTab } from "./RequirementApiContractsTab";

describe("RequirementApiContractsTab", () => {
  test("renders expandable contract labels without visible expand wording", () => {
    const html = renderToStaticMarkup(createElement(RequirementApiContractsTab, { detail: appRequirementDetail }));

    expect(html).toContain("Request");
    expect(html).toContain("Response");
    expect(html).toContain("참조 객체");
    expect(html).toContain("CreateTodoRequest");
    expect(html).not.toContain("Request 펼치기");
    expect(html).not.toContain("Response 펼치기");
    expect(html).not.toContain("참조 객체 펼치기");
  });

  test("renders a referenced DTO only once when the same name has multiple shape kinds", () => {
    const duplicateCategoryShape = appRequirementDetail.dataShapes.find((shape) => shape.name === "TodoCategoryInfo");
    const detail = {
      ...appRequirementDetail,
      dataShapes: duplicateCategoryShape
        ? [...appRequirementDetail.dataShapes, { ...duplicateCategoryShape, kind: "Response" as const }]
        : appRequirementDetail.dataShapes,
    };

    const html = renderToStaticMarkup(createElement(RequirementApiContractsTab, { detail }));

    expect(html.match(/참조 객체/g)?.length).toBe(1);
  });
});
