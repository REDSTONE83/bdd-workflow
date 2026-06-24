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
});
