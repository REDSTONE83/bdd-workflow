import { createElement } from "react";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ArtifactLinkCard } from "./ArtifactLinkCard";

const workspaceRoot = path.resolve(process.cwd(), "../..").replace(/\\/g, "/");

describe("ArtifactLinkCard", () => {
  test("uses the file location itself as the editor shortcut without a separate open button", () => {
    const html = renderToStaticMarkup(
      createElement(ArtifactLinkCard, {
        item: {
          kind: "scenario",
          file: "harness/docs/scenarios/REQ-032-harness-ui-requirement-detail.feature",
          line: 72,
        },
      }),
    );

    expect(html).toContain("harness/docs/scenarios/REQ-032-harness-ui-requirement-detail.feature:72");
    expect(html).toContain(`href="vscode://file/${workspaceRoot}/harness/docs/scenarios/REQ-032-harness-ui-requirement-detail.feature:72"`);
    expect(html).toContain("text-sky-800");
    expect(html).toContain("hover:underline");
    expect(html).not.toContain("열기");
    expect(html).not.toContain("data-slot=\"button\"");
  });
});
