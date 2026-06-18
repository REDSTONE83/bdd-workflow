import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildChangeSetRows,
  buildCommandRunnerModel,
  buildGateViewModel,
  buildRequirementBoardModel,
  buildRequirementDetailModel,
  commandDefinitions,
  defaultWorkspaceRoot,
} from "../src/lib/harness-data/artifact-api.ts";

export const harnessUiPort = Number(process.env.HARNESS_UI_PORT ?? 5180);
export const harnessUiHost = "127.0.0.1";
const scopeOutputDirs = {
  application: "app",
  harness: "harness",
} as const;

const scopeDocDirs = {
  application: "app/docs",
  harness: "harness/docs",
} as const;

export const commandRegistry = commandDefinitions;

export const allowedCommands = commandDefinitions.map((command) => command.id);

type CommandRunValidation =
  | { ok: true; commandId: string; requirementId?: string }
  | { ok: false; status: number; error: string };

type HarnessUiScope = keyof typeof scopeOutputDirs;

function json(response: http.ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request: http.IncomingMessage) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) {
      throw new Error("request body too large");
    }
  }
  return body.trim() ? JSON.parse(body) : {};
}

export function validateCommandRunRequest(payload: unknown): CommandRunValidation {
  if (!payload || typeof payload !== "object") {
    return { ok: false, status: 400, error: "명령 실행 요청 본문이 올바르지 않다." };
  }

  const record = payload as Record<string, unknown>;
  const commandId = typeof record.commandId === "string"
    ? record.commandId
    : typeof record.command === "string"
      ? record.command
      : undefined;

  if (!commandId) {
    return { ok: false, status: 400, error: "명령 ID가 필요하다." };
  }

  const command = commandRegistry.find((entry) => entry.id === commandId);
  if (!command) {
    return { ok: false, status: 403, error: "허용 목록 밖 명령이다." };
  }

  const rawRequirementId = record.requirementId;
  const requirementId = typeof rawRequirementId === "string" && rawRequirementId.trim() ? rawRequirementId.trim() : undefined;
  if (requirementId && !command.supportsRequirement) {
    return { ok: false, status: 400, error: "이 명령은 요건 인자를 지원하지 않는다." };
  }
  if (requirementId && !/^REQ-\d{3,}$/.test(requirementId)) {
    return { ok: false, status: 400, error: "요건 인자는 REQ-XXX 형식이어야 한다." };
  }

  return { ok: true, commandId, requirementId };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function namesRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, values]) => [key, stringArray(values)]),
  );
}

function termStatus(value: unknown) {
  return value === "draft" ? "draft" : "approved";
}

function scopeFromParam(value: string | null): HarnessUiScope | null {
  if (value === null || value === "harness") return "harness";
  if (value === "application") return "application";
  return null;
}

export function buildTerminologyBrowserModel(indexPayload: unknown, scope: HarnessUiScope = "harness") {
  const record = indexPayload && typeof indexPayload === "object" ? indexPayload as Record<string, unknown> : {};
  const termsRecord = record.terms && typeof record.terms === "object" && !Array.isArray(record.terms)
    ? record.terms as Record<string, unknown>
    : {};

  return {
    scope,
    generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : null,
    terms: Object.entries(termsRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => {
        const term = value && typeof value === "object" ? value as Record<string, unknown> : {};
        return {
          key,
          domain: key.includes(".") ? key.split(".")[0] : "default",
          status: termStatus(term.status),
          sourceFile: typeof term.sourceFile === "string" ? term.sourceFile : "",
          ko: typeof term.ko === "string" ? term.ko : "",
          en: typeof term.en === "string" ? term.en : "",
          meaning: typeof term.meaning === "string" ? term.meaning : "",
          allow: stringArray(term.allow),
          ban: stringArray(term.ban),
          names: namesRecord(term.names),
          note: typeof term.note === "string" ? term.note : undefined,
          reason: typeof term.reason === "string" ? term.reason : undefined,
        };
      }),
  };
}

export function readTerminologyBrowserModel(scope: HarnessUiScope = "harness", workspaceRoot = defaultWorkspaceRoot) {
  const indexPath = path.join(workspaceRoot, "build", scopeOutputDirs[scope], "indexes", "terminology.index.json");
  return buildTerminologyBrowserModel(JSON.parse(fs.readFileSync(indexPath, "utf8")), scope);
}

export interface ArtifactSummaryDto {
  scope: HarnessUiScope;
  generatedAt: string | null;
  missing: boolean;
  stale: boolean;
  staleSources: string[];
  autoRefresh: "idle" | "updated";
}

function collectSourceDocs(dir: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const docs: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      docs.push(...collectSourceDocs(full));
    } else if (/\.(md|feature)$/.test(entry.name)) {
      docs.push(full);
    }
  }
  return docs;
}

export function buildArtifactSummary(scope: HarnessUiScope, workspaceRoot = defaultWorkspaceRoot): ArtifactSummaryDto {
  const traceFile = path.join(workspaceRoot, "build", scopeOutputDirs[scope], "state", "trace.state.json");
  let traceStat: fs.Stats | null = null;
  try {
    traceStat = fs.statSync(traceFile);
  } catch {
    traceStat = null;
  }

  if (!traceStat) {
    return { scope, generatedAt: null, missing: true, stale: false, staleSources: [], autoRefresh: "idle" };
  }

  let generatedAt: string | null = null;
  try {
    const trace = JSON.parse(fs.readFileSync(traceFile, "utf8"));
    generatedAt = typeof trace.generatedAt === "string" ? trace.generatedAt : null;
  } catch {
    generatedAt = null;
  }

  const staleSources = collectSourceDocs(path.join(workspaceRoot, scopeDocDirs[scope]))
    .filter((file) => {
      try {
        return fs.statSync(file).mtimeMs > traceStat.mtimeMs;
      } catch {
        return false;
      }
    })
    .map((file) => path.relative(workspaceRoot, file).replace(/\\/g, "/"))
    .sort();

  return { scope, generatedAt, missing: false, stale: staleSources.length > 0, staleSources, autoRefresh: "idle" };
}

export async function handleHarnessApiRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  options: { workspaceRoot?: string } = {},
) {
    const workspaceRoot = options.workspaceRoot ?? defaultWorkspaceRoot;
    const url = new URL(request.url ?? "/", `http://${harnessUiHost}:${harnessUiPort}`);
    response.setHeader("content-type", "application/json; charset=utf-8");

    if (url.pathname === "/api/health") {
      json(response, 200, { status: "ok", host: harnessUiHost, port: harnessUiPort });
      return;
    }

    if (url.pathname === "/api/commands") {
      json(response, 200, { commands: commandDefinitions });
      return;
    }

    if (url.pathname === "/api/requirements") {
      const scope = scopeFromParam(url.searchParams.get("scope"));
      if (!scope) {
        json(response, 400, { error: "지원하지 않는 범위다." });
        return;
      }

      try {
        json(response, 200, buildRequirementBoardModel(scope, workspaceRoot));
      } catch {
        json(response, 404, { error: "요건 추적 산출물을 읽을 수 없다." });
      }
      return;
    }

    const requirementMatch = url.pathname.match(/^\/api\/requirements\/([^/]+)$/);
    if (requirementMatch) {
      const scope = scopeFromParam(url.searchParams.get("scope"));
      if (!scope) {
        json(response, 400, { error: "지원하지 않는 범위다." });
        return;
      }

      try {
        const detail = buildRequirementDetailModel(scope, decodeURIComponent(requirementMatch[1]), workspaceRoot);
        if (!detail) {
          json(response, 404, { error: "요건 상세를 찾을 수 없다." });
          return;
        }
        json(response, 200, detail);
      } catch {
        json(response, 404, { error: "요건 상세 산출물을 읽을 수 없다." });
      }
      return;
    }

    if (url.pathname === "/api/gate") {
      const scope = scopeFromParam(url.searchParams.get("scope"));
      if (!scope) {
        json(response, 400, { error: "지원하지 않는 범위다." });
        return;
      }

      try {
        json(response, 200, buildGateViewModel(scope, workspaceRoot));
      } catch {
        json(response, 404, { error: "게이트 산출물을 읽을 수 없다." });
      }
      return;
    }

    if (url.pathname === "/api/change-sets") {
      const scope = scopeFromParam(url.searchParams.get("scope"));
      if (!scope) {
        json(response, 400, { error: "지원하지 않는 범위다." });
        return;
      }

      try {
        json(response, 200, { rows: buildChangeSetRows(scope, workspaceRoot) });
      } catch {
        json(response, 404, { error: "Change Set 산출물을 읽을 수 없다." });
      }
      return;
    }

    if (url.pathname === "/api/command-runner") {
      const scope = scopeFromParam(url.searchParams.get("scope"));
      if (!scope) {
        json(response, 400, { error: "지원하지 않는 범위다." });
        return;
      }

      try {
        json(response, 200, buildCommandRunnerModel(scope, workspaceRoot));
      } catch {
        json(response, 404, { error: "명령 실행 화면 데이터를 읽을 수 없다." });
      }
      return;
    }

    if (url.pathname === "/api/terminology") {
      const scope = scopeFromParam(url.searchParams.get("scope"));
      if (!scope) {
        json(response, 400, { error: "지원하지 않는 범위다." });
        return;
      }

      try {
        json(response, 200, readTerminologyBrowserModel(scope, workspaceRoot));
      } catch {
        json(response, 404, { error: "표준 용어 산출물을 읽을 수 없다." });
      }
      return;
    }

    if (url.pathname === "/api/artifact-summary") {
      const scope = scopeFromParam(url.searchParams.get("scope"));
      if (!scope) {
        json(response, 400, { error: "지원하지 않는 범위다." });
        return;
      }
      json(response, 200, buildArtifactSummary(scope, workspaceRoot));
      return;
    }

    if (url.pathname === "/api/events") {
      const scope = scopeFromParam(url.searchParams.get("scope"));
      if (!scope) {
        json(response, 400, { error: "지원하지 않는 범위다." });
        return;
      }

      response.setHeader("content-type", "text/event-stream; charset=utf-8");
      response.setHeader("cache-control", "no-cache");
      response.setHeader("connection", "keep-alive");
      response.statusCode = 200;

      const send = () => {
        response.write(`event: artifacts-changed\ndata: ${JSON.stringify(buildArtifactSummary(scope, workspaceRoot))}\n\n`);
      };
      send();

      const watchTargets = [
        path.join(workspaceRoot, "build", scopeOutputDirs[scope], "state"),
        path.join(workspaceRoot, scopeDocDirs[scope]),
      ];
      const watchers: fs.FSWatcher[] = [];
      let timer: ReturnType<typeof setTimeout> | null = null;
      const onChange = () => {
        if (timer) return;
        timer = setTimeout(() => {
          timer = null;
          send();
        }, 50);
      };
      for (const target of watchTargets) {
        try {
          watchers.push(fs.watch(target, { recursive: true }, onChange));
        } catch {
          // 감시 대상 디렉터리가 아직 없으면 건너뛴다.
        }
      }

      request.on("close", () => {
        for (const watcher of watchers) {
          try {
            watcher.close();
          } catch {
            // 이미 닫힌 watcher는 무시한다.
          }
        }
        if (timer) clearTimeout(timer);
        response.end();
      });
      return;
    }

    if (url.pathname === "/api/commands/run") {
      if (request.method !== "POST") {
        json(response, 405, { error: "POST만 지원한다." });
        return;
      }

      try {
        const validation = validateCommandRunRequest(await readJsonBody(request));
        if (!validation.ok) {
          json(response, validation.status, { error: validation.error, allowedCommands });
          return;
        }

        json(response, 202, {
          status: "accepted",
          commandId: validation.commandId,
          requirementId: validation.requirementId ?? null,
          execution: "command execution backend is not wired in this skeleton",
        });
      } catch {
        json(response, 400, { error: "명령 실행 요청 JSON을 읽을 수 없다." });
      }
      return;
    }

    json(response, 404, { error: "not found" });
}

export function createHarnessUiServer(options: { workspaceRoot?: string } = {}) {
  return http.createServer((request, response) => {
    void handleHarnessApiRequest(request, response, options);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createHarnessUiServer().listen(harnessUiPort, harnessUiHost, () => {
    console.log(`harness/ui server listening on http://${harnessUiHost}:${harnessUiPort}`);
  });
}
