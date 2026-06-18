import { describe, expect, test } from "vitest";
import {
  buildCommandRunnerModel,
  buildGateViewModel,
  buildRequirementBoardModel,
  buildRequirementDetailModel,
  defaultWorkspaceRoot,
} from "./artifact-api";

describe("artifact API DTO builders", () => {
  test("builds requirement board rows from trace.state.json", () => {
    const model = buildRequirementBoardModel("harness", defaultWorkspaceRoot);
    const requirement = model.rows.find((row) => row.id === "REQ-031");

    expect(model.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(model.summary.map((item) => item.state)).toEqual(["RED", "GREEN", "BLUE", "INACTIVE"]);
    expect(requirement?.title).toBe("하네스 UI 요건 추적 보드");
    expect(requirement?.traceState).toBe("BLUE");
  });

  test("combines card metadata and trace links for requirement detail", () => {
    const detail = buildRequirementDetailModel("harness", "REQ-032", defaultWorkspaceRoot);

    expect(detail?.purpose).toContain("수용 기준별 커버리지");
    expect(detail?.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(detail?.coverage.length).toBeGreaterThan(0);
    expect(detail?.uiSurfaces.some((surface) => surface.kind === "Story" && surface.storybookUrl)).toBe(true);
    expect(detail?.linkedArtifacts.some((artifact) => artifact.file.endsWith(".feature"))).toBe(true);
  });

  test("builds gate and command runner models from server artifacts", () => {
    const gate = buildGateViewModel("harness", defaultWorkspaceRoot);
    const runner = buildCommandRunnerModel("harness", defaultWorkspaceRoot);

    expect(gate.categories.map((category) => category.category)).toEqual([
      "TRACE",
      "CARD",
      "REF",
      "TRC",
      "BE",
      "FE",
      "SCN",
      "TRM",
    ]);
    expect(runner.commands.map((command) => command.id)).toEqual([
      "harness:trace",
      "harness:validate",
      "harness:self-test",
      "app:trace",
      "app:validate",
      "repo:validate",
    ]);
    expect(runner.requirements.length).toBeGreaterThan(0);
  });
});
