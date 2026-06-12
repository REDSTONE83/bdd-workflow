import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { requirementDetail } from "../../../lib/harness-data/fixtures";
import { RequirementEntitiesTab } from "./RequirementEntitiesTab";

describe("RequirementEntitiesTab", () => {
  test("renders collected entity table and column metadata without visible expand wording", () => {
    const html = renderToStaticMarkup(createElement(RequirementEntitiesTab, { detail: requirementDetail }));

    expect(html).toContain("Category");
    expect(html).toContain("category");
    expect(html.indexOf("category")).toBeLessThan(html.indexOf("Category"));
    expect(html).toContain("AuditingEntityListener");
    expect(html).toContain("컬럼 목록");
    expect(html).toContain("display_order");
    expect(html.indexOf("display_order")).toBeLessThan(html.indexOf("displayOrder"));
    expect(html).toContain("JPA Entity");
    expect(html).toContain("JPA Field");
    expect(html).toContain("Integer");
    expect(html).toContain("NOT NULL");
    expect(html).toContain("PK");
    expect(html).toContain("REQ-016, REQ-017, REQ-018, REQ-020");
    expect(html).not.toContain("field displayOrder");
    expect(html).not.toContain("Annotation");
    expect(html).not.toContain("CreatedDate");
    expect(html).not.toContain("미지정");
    expect(html).not.toContain("속성 목록 펼치기");
    expect(html).not.toContain("컬럼 목록 펼치기");
  });
});
