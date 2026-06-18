import { describe, expect, it } from "vitest";
import { commands, gateCategories, readyRun, runningRun } from "./fixtures";

describe("run and gate fixtures", () => {
  it("keeps gate categories in the unified gate order", () => {
    expect(gateCategories.map((category) => category.category)).toEqual([
      "TRACE",
      "CARD",
      "REF",
      "TRC",
      "BE",
      "FE",
      "SCN",
      "TRM",
    ]);
  });

  it("exposes only the MVP command allow list", () => {
    expect(commands.map((command) => command.id)).toEqual([
      "harness:trace",
      "harness:validate",
      "harness:self-test",
      "app:trace",
      "app:validate",
      "repo:validate",
    ]);
  });

  it("starts the command runner without an implicit requirement selection", () => {
    expect(readyRun.requirementId).toBeUndefined();
    expect(runningRun.requirementId).toBe("REQ-031");
  });
});
