import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { appRequirementDetail } from "../../../lib/harness-data/fixtures";
import { RequirementEntitiesTab } from "./RequirementEntitiesTab";

describe("RequirementEntitiesTab", () => {
  test("renders collected entity table and column metadata without visible expand wording", () => {
    const html = renderToStaticMarkup(createElement(RequirementEntitiesTab, { detail: appRequirementDetail }));

    expect(html).toContain("Todo");
    expect(html).toContain("todo");
    expect(html.indexOf("todo")).toBeLessThan(html.indexOf("Todo"));
    expect(html).toContain("AuditingEntityListener");
    expect(html).toContain("컬럼 목록");
    expect(html).toContain("due_date");
    expect(html.indexOf("due_date")).toBeLessThan(html.indexOf("dueDate"));
    expect(html).toContain("JPA Entity");
    expect(html).toContain("JPA Field");
    expect(html).toContain("LocalDate");
    expect(html).toContain("NOT NULL");
    expect(html).toContain("PK");
    expect(html).toContain("REQ-022, REQ-023, REQ-024");
    expect(html).not.toContain("field dueDate");
    expect(html).not.toContain("Annotation");
    expect(html).not.toContain("CreatedDate");
    expect(html).not.toContain("미지정");
    expect(html).not.toContain("속성 목록 펼치기");
    expect(html).not.toContain("컬럼 목록 펼치기");
  });
});
