import { createElement } from "react";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { requirementDetail } from "../../../lib/harness-data/fixtures";
import { RequirementScenariosTab } from "./RequirementScenariosTab";

const workspaceRoot = path.resolve(process.cwd(), "../..").replace(/\\/g, "/");

describe("RequirementScenariosTab", () => {
  test("renders scenario test locations without coverage sections or list markup", () => {
    const detail = {
      ...requirementDetail,
      coverage: requirementDetail.coverage.map((row) => ({
        ...row,
        tests: ["harness/ui/src/features/requirements/RequirementDetail.stories.tsx > Harness/Requirements/RequirementDetail / AcceptanceAndScenarios"],
      })),
    };

    const html = renderToStaticMarkup(createElement(RequirementScenariosTab, { detail }));

    expect(html).toContain("연결 테스트");
    expect(html).not.toContain("수용 시나리오의 문서 위치, 연결 테스트, 주요 Given/When/Then을 확인한다.");
    expect(html).toContain("harness/ui/src/features/requirements/RequirementDetail.stories.tsx:1");
    expect(html).toContain(`href="vscode://file/${workspaceRoot}/harness/ui/src/features/requirements/RequirementDetail.stories.tsx:1"`);
    expect(html).toContain("Given/When/Then");
    expect(html).toContain("border-emerald-200 bg-emerald-50 text-emerald-800");
    expect(html).toContain("border-amber-200 bg-amber-50 text-amber-800");
    expect(html).toContain("border-sky-200 bg-sky-50 text-sky-800");
    expect(html).not.toContain(">GWT<");
    expect(html).not.toContain("Covers");
    expect(html).not.toContain("커버리지 판정");
    expect(html).not.toContain("<ul");
    expect(html).not.toContain("<li");
  });
});
