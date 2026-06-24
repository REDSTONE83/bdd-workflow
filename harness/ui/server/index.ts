import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import express, { type Request, type Response } from "express";
import {
  buildChangeSetRows,
  buildCommandRunnerModel,
  buildGateViewModel,
  buildRequirementBoardModel,
  buildRequirementDetailModel,
  buildSurfaceInventoryModel,
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

interface HarnessUiServerOptions {
  workspaceRoot?: string;
  serveStatic?: boolean;
}

function sendJson(response: Response, status: number, payload: unknown) {
  response.status(status).json(payload);
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

function queryParam(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function scopeFromRequest(request: Request): HarnessUiScope | null {
  return scopeFromParam(queryParam(request.query.scope));
}

function sendUnsupportedScope(response: Response) {
  sendJson(response, 400, { error: "지원하지 않는 범위다." });
}

function sendArtifactEvent(response: Response, scope: HarnessUiScope, workspaceRoot: string) {
  response.write(`event: artifacts-changed\ndata: ${JSON.stringify(buildArtifactSummary(scope, workspaceRoot))}\n\n`);
}

export function createHarnessExpressApp(options: HarnessUiServerOptions = {}) {
  const workspaceRoot = options.workspaceRoot ?? defaultWorkspaceRoot;
  const app = express();
  app.disable("x-powered-by");

  app.get("/api/health", (_request, response) => {
    sendJson(response, 200, { status: "ok", host: harnessUiHost, port: harnessUiPort });
  });

  app.get("/api/commands", (_request, response) => {
    sendJson(response, 200, { commands: commandDefinitions });
  });

  app.get("/api/requirements", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }

    try {
      sendJson(response, 200, buildRequirementBoardModel(scope, workspaceRoot));
    } catch {
      sendJson(response, 404, { error: "요건 추적 산출물을 읽을 수 없다." });
    }
  });

  app.get("/api/requirements/:requirementId", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }

    try {
      const detail = buildRequirementDetailModel(scope, request.params.requirementId, workspaceRoot);
      if (!detail) {
        sendJson(response, 404, { error: "요건 상세를 찾을 수 없다." });
        return;
      }
      sendJson(response, 200, detail);
    } catch {
      sendJson(response, 404, { error: "요건 상세 산출물을 읽을 수 없다." });
    }
  });

  app.get("/api/gate", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }

    try {
      sendJson(response, 200, buildGateViewModel(scope, workspaceRoot));
    } catch {
      sendJson(response, 404, { error: "게이트 산출물을 읽을 수 없다." });
    }
  });

  app.get("/api/change-sets", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }

    try {
      sendJson(response, 200, { rows: buildChangeSetRows(scope, workspaceRoot) });
    } catch {
      sendJson(response, 404, { error: "Change Set 산출물을 읽을 수 없다." });
    }
  });

  app.get("/api/command-runner", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }

    try {
      sendJson(response, 200, buildCommandRunnerModel(scope, workspaceRoot));
    } catch {
      sendJson(response, 404, { error: "명령 실행 화면 데이터를 읽을 수 없다." });
    }
  });

  app.get("/api/terminology", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }

    try {
      sendJson(response, 200, readTerminologyBrowserModel(scope, workspaceRoot));
    } catch {
      sendJson(response, 404, { error: "표준 용어 산출물을 읽을 수 없다." });
    }
  });

  app.get("/api/surfaces", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }

    try {
      sendJson(response, 200, buildSurfaceInventoryModel(scope, workspaceRoot));
    } catch {
      sendJson(response, 404, { error: "표면 조회 산출물을 읽을 수 없다." });
    }
  });

  app.get("/api/artifact-summary", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }
    sendJson(response, 200, buildArtifactSummary(scope, workspaceRoot));
  });

  app.get("/api/events", (request, response) => {
    const scope = scopeFromRequest(request);
    if (!scope) {
      sendUnsupportedScope(response);
      return;
    }

    response.setHeader("content-type", "text/event-stream; charset=utf-8");
    response.setHeader("cache-control", "no-cache");
    response.setHeader("connection", "keep-alive");
    response.status(200);
    sendArtifactEvent(response, scope, workspaceRoot);

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
        sendArtifactEvent(response, scope, workspaceRoot);
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
  });

  app.all("/api/commands/run", async (request, response) => {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "POST만 지원한다." });
      return;
    }

    try {
      const validation = validateCommandRunRequest(await readJsonBody(request));
      if (!validation.ok) {
        sendJson(response, validation.status, { error: validation.error, allowedCommands });
        return;
      }

      sendJson(response, 202, {
        status: "accepted",
        commandId: validation.commandId,
        requirementId: validation.requirementId ?? null,
        execution: "command execution backend is not wired in this skeleton",
      });
    } catch {
      sendJson(response, 400, { error: "명령 실행 요청 JSON을 읽을 수 없다." });
    }
  });

  app.use("/api", (_request, response) => {
    sendJson(response, 404, { error: "not found" });
  });

  if (options.serveStatic !== false) {
    const distRoot = path.join(workspaceRoot, "harness", "ui", "dist");
    app.use(express.static(distRoot));
    app.use((request, response) => {
      if (request.method !== "GET") {
        sendJson(response, 404, { error: "not found" });
        return;
      }
      const indexFile = path.join(distRoot, "index.html");
      if (!fs.existsSync(indexFile)) {
        sendJson(response, 404, { error: "not found" });
        return;
      }
      response.sendFile(indexFile);
    });
  }

  return app;
}

export function handleHarnessApiRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  options: HarnessUiServerOptions = {},
) {
  const app = createHarnessExpressApp({ ...options, serveStatic: false });
  app(request as Request, response as Response);
}

export function createHarnessUiServer(options: HarnessUiServerOptions = {}) {
  return http.createServer(createHarnessExpressApp(options));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createHarnessUiServer().listen(harnessUiPort, harnessUiHost, () => {
    console.log(`harness/ui server listening on http://${harnessUiHost}:${harnessUiPort}`);
  });
}
