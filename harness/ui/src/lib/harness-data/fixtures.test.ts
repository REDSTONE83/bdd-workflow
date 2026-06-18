import { describe, expect, it } from "vitest";
import {
  appShellDefault,
  appShellMissing,
  appShellStale,
  changeSetRows,
  commands,
  findingRows,
  gateCategories,
  readyRun,
  requirementDetail,
  requirementRows,
  requirementSummary,
  terminologyBrowser,
} from "./fixtures";

describe("harness UI fixtures", () => {
  it("exports representative fixture sets for skeleton views", () => {
    expect([appShellDefault, appShellMissing, appShellStale].every((summary) => summary.scope && typeof summary.missing === "boolean")).toBe(true);
    expect(requirementRows.length).toBeGreaterThan(0);
    expect(requirementSummary.length).toBeGreaterThan(0);
    expect(requirementDetail.id).toMatch(/^REQ-\d{3}$/);
    expect(gateCategories.length).toBeGreaterThan(0);
    expect(findingRows.length).toBeGreaterThan(0);
    expect(changeSetRows.length).toBeGreaterThan(0);
    expect(commands.length).toBeGreaterThan(0);
    expect(readyRun.status).toBe("ready");
    expect(terminologyBrowser.terms.length).toBeGreaterThan(0);
  });
});
