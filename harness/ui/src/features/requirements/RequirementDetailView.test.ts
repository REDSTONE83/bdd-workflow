import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { requirementDetail } from "../../lib/harness-data/fixtures";
import { RequirementDetailView } from "./RequirementDetailView";

describe("RequirementDetailView", () => {
  test("renders the list return action outside the metadata card as borderless navigation", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ["/requirements/REQ-031?title=요건"] },
        createElement(RequirementDetailView, { detail: requirementDetail }),
      ),
    );

    const buttonLabelIndex = html.indexOf("요건 목록");
    const firstCardIndex = html.indexOf('data-slot="card"');
    const buttonStartIndex = html.lastIndexOf("<button", buttonLabelIndex);
    const buttonEndIndex = html.indexOf("</button>", buttonLabelIndex);
    const buttonMarkup = html.slice(buttonStartIndex, buttonEndIndex);

    expect(buttonLabelIndex).toBeGreaterThanOrEqual(0);
    expect(firstCardIndex).toBeGreaterThan(buttonLabelIndex);
    expect(buttonMarkup).toContain("text-sky-800");
    expect(buttonMarkup).toContain("hover:underline");
    expect(buttonMarkup).not.toContain("border border-input");
  });
});
