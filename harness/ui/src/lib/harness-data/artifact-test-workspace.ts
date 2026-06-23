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
  if (!outputRoot || envArtifactScope() !== scope || !fs.existsSync(outputRoot)) return defaultWorkspaceRoot;

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
