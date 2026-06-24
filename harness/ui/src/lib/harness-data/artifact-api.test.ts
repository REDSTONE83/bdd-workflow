import { describe, expect, test } from "vitest";
import {
  buildCommandRunnerModel,
  buildGateViewModel,
  buildRequirementBoardModel,
  buildRequirementDetailModel,
  buildSurfaceInventoryModel,
} from "./artifact-api";
import { hasArtifactScope, workspaceRootForArtifactScope } from "./artifact-test-workspace";

const harnessWorkspaceRoot = workspaceRootForArtifactScope("harness");
const appWorkspaceRoot = workspaceRootForArtifactScope("app");
const testHarnessArtifacts = hasArtifactScope("harness") ? test : test.skip;
const testAppArtifacts = hasArtifactScope("app") ? test : test.skip;

describe("artifact API DTO builders", () => {
  testHarnessArtifacts("builds requirement board rows from trace.state.json", () => {
    const model = buildRequirementBoardModel("harness", harnessWorkspaceRoot);
    const requirement = model.rows.find((row) => row.id === "REQ-031");

    expect(model.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(model.summary.map((item) => item.state)).toEqual(["RED", "GREEN", "BLUE", "INACTIVE"]);
    expect(requirement?.title).toBe("하네스 UI 요건 추적 보드");
    expect(requirement?.traceState).toBe("BLUE");
  });

  testHarnessArtifacts("combines card metadata and trace links for requirement detail", () => {
    const detail = buildRequirementDetailModel("harness", "REQ-032", harnessWorkspaceRoot);

    expect(detail?.purpose).toContain("수용 기준별 커버리지");
    expect(detail?.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(detail?.coverage.length).toBeGreaterThan(0);
    expect(detail?.uiSurfaces.some((surface) => surface.kind === "Story" && surface.storybookUrl)).toBe(true);
    expect(detail?.linkedArtifacts.some((artifact) => artifact.file.endsWith(".feature"))).toBe(true);
  });

  testHarnessArtifacts("builds gate and command runner models from server artifacts", () => {
    const gate = buildGateViewModel("harness", harnessWorkspaceRoot);
    const runner = buildCommandRunnerModel("harness", harnessWorkspaceRoot);

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

  testAppArtifacts("builds surface inventory from app source indexes", () => {
    const model = buildSurfaceInventoryModel("application", appWorkspaceRoot);

    expect(model.apis.some((api) => api.method === "POST" && api.path === "/todos")).toBe(true);
    expect(model.apis.find((api) => api.operationId === "TodoController.createTodo")?.requests).toContain("CreateTodoRequest");
    expect(model.dataShapes.find((shape) => shape.name === "CreateTodoRequest")?.fields.map((field) => field.name)).toContain("title");
    expect(model.dataShapes.find((shape) => shape.name === "TodoResponse")?.fields.map((field) => field.name)).toContain("todoId");
    expect(model.entities.some((entity) => entity.className === "Todo" && entity.table === "todo")).toBe(true);
    expect(model.uiSurfaces.some((surface) => surface.kind === "Route" && surface.route === "/todos")).toBe(true);
  });

  testHarnessArtifacts("builds harness UI surface inventory without backend-only surfaces", () => {
    const model = buildSurfaceInventoryModel("harness", harnessWorkspaceRoot);

    expect(model.apis).toEqual([]);
    expect(model.dataShapes).toEqual([]);
    expect(model.entities).toEqual([]);
    expect(model.uiSurfaces.some((surface) => surface.kind === "Route" && surface.route === "/requirements")).toBe(true);
  });
});
