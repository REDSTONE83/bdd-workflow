import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { requirementDetail } from "../../../lib/harness-data/fixtures";
import { RequirementOverviewTab } from "./RequirementOverviewTab";

describe("RequirementOverviewTab", () => {
  test("shows standard term key and Korean/English names without representative AC/API cards", () => {
    const html = renderToStaticMarkup(
      createElement(RequirementOverviewTab, {
        detail: requirementDetail,
        sourceLinks: [requirementDetail.sourceFile, ...requirementDetail.linkedArtifacts],
      }),
    );

    expect(html).toContain("harness.requirementCard");
    expect(html).toContain("요건 카드");
    expect(html).toContain("requirement card");
    expect(html).not.toContain("대표 AC");
    expect(html).not.toContain("대표 API");
  });
});
