import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { appShellDefault } from "../../lib/harness-data/fixtures";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  test("renders the main navigation as a left LNB before route content", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ["/requirements"] },
        createElement(AppShell, { model: appShellDefault, children: createElement("div", null, "route content") }),
      ),
    );

    const asideIndex = html.indexOf("<aside");
    const mainIndex = html.indexOf("<main");
    const headerCloseIndex = html.indexOf("</header>");

    expect(html).toContain('aria-label="좌측 주요 작업 영역"');
    expect(html).toContain('aria-label="주요 작업 영역"');
    expect(html).toContain('href="/requirements"');
    expect(html).toContain('href="/terminology"');
    expect(html).toContain('href="/surfaces"');
    expect(html).toContain('href="/gate"');
    expect(html).toContain('href="/change-sets"');
    expect(html).toContain('href="/runs"');
    expect(asideIndex).toBeGreaterThan(headerCloseIndex);
    expect(asideIndex).toBeLessThan(mainIndex);
  });
});
