import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { requirementDetail } from "../../../lib/harness-data/fixtures";
import { RequirementUiTab } from "./RequirementUiTab";

describe("RequirementUiTab", () => {
  test("renders Storybook review action at the top right of each reviewable card", () => {
    const html = renderToStaticMarkup(createElement(RequirementUiTab, { detail: requirementDetail }));

    expect(html).toContain("flex items-start justify-between gap-3");
    expect(html).toContain("Storybook 검토");
    expect(html).toContain("http://127.0.0.1:6007/?path=/story/harness-requirements-requirementboard--all-requirements");
    expect(html).toContain("harness/ui/src/features/requirements/RequirementBoard.stories.tsx:1");
    expect(html).not.toContain("mt-3 flex flex-wrap gap-2");
  });
});
