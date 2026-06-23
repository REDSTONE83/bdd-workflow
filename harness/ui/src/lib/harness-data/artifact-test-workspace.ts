import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultWorkspaceRoot } from "./artifact-api";

export type ArtifactScope = "app" | "harness";

const tempRoots: string[] = [];
const linkedRoots = new Map<ArtifactScope, string>();

function envArtifactScope(): ArtifactScope | null {
  if (process.env.HARNESS_SCOPE === "application") return "app";
  if (process.env.HARNESS_SCOPE === "harness") return "harness";
  return null;
}

export function workspaceRootForArtifactScope(scope: ArtifactScope): string {
  const outputRoot = process.env.HARNESS_OUTPUT_ROOT;
  // 게이트 파이프라인은 harness UI 단위 테스트를 trace 평가(=state 생성)보다 먼저 실행하므로, 그 시점의
  // run root에는 아직 state/trace.state.json 이 없다. run root에 state가 실재할 때만 그것을(=가장 신선)
  // 쓰고, 없으면 canonical build로 폴백해 in-gate parity가 조용히 skip되지 않게 한다. 둘 다 없으면
  // (최초 clean 실행) hasArtifactScope가 false를 반환해 caller가 해당 scope를 skip한다.
  if (
    !outputRoot ||
    envArtifactScope() !== scope ||
    !fs.existsSync(path.join(outputRoot, "state", "trace.state.json"))
  ) {
    return defaultWorkspaceRoot;
  }

  const existing = linkedRoots.get(scope);
  if (existing) return existing;

  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-ui-artifacts-"));
  const buildDir = path.join(workspaceRoot, "build");
  fs.mkdirSync(buildDir, { recursive: true });
  fs.symlinkSync(outputRoot, path.join(buildDir, scope), process.platform === "win32" ? "junction" : "dir");
  tempRoots.push(workspaceRoot);
  linkedRoots.set(scope, workspaceRoot);
  return workspaceRoot;
}

export function hasArtifactScope(scope: ArtifactScope): boolean {
  return fs.existsSync(path.join(workspaceRootForArtifactScope(scope), "build", scope, "state", "trace.state.json"));
}

export function cleanupArtifactWorkspaceRoots() {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  linkedRoots.clear();
}

process.once("exit", cleanupArtifactWorkspaceRoots);
