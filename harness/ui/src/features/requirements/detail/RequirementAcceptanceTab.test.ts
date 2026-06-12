import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { requirementDetail } from "../../../lib/harness-data/fixtures";
import { RequirementAcceptanceTab } from "./RequirementAcceptanceTab";

describe("RequirementAcceptanceTab", () => {
  test("renders AC id, channel badge, and linked tests/scenarios in aligned rows", () => {
    const detail = {
      ...requirementDetail,
      coverage: requirementDetail.coverage.map((row) => ({
        ...row,
        tests: ["harness/ui/tests/e2e/requirements.spec.ts"],
      })),
    };

    const html = renderToStaticMarkup(createElement(RequirementAcceptanceTab, { detail }));

    expect(html).toContain("font-mono text-sm font-semibold text-foreground");
    expect(html).toContain("border-sky-200 bg-sky-50 text-sky-800");
    expect(html).toContain("grid-cols-[6rem_minmax(0,1fr)] items-start");
    expect(html).toContain('text-xs font-semibold leading-5 text-muted-foreground">연결 테스트');
    expect(html).toContain("block break-all rounded-sm font-mono text-xs font-medium leading-5 text-sky-800");
    expect(html).not.toContain("pt-0.5 text-muted-foreground");
    expect(html).toContain("href=\"vscode://file/harness/ui/tests/e2e/requirements.spec.ts:1\"");
    expect(html).toContain("href=\"vscode://file/harness/docs/scenarios/REQ-031-harness-ui-requirement-board.feature:4\"");
  });
});
