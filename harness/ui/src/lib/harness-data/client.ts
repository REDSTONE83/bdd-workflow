import type { CommandRunState, HarnessScope, TerminologyBrowserModel } from "./types";
import type { CommandRunnerModel, GateViewModel, RequirementBoardModel } from "./artifact-api";
import type { ChangeSetRow, RequirementDetail } from "./types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let message = `API 요청 실패: ${response.status}`;
    try {
      const payload = await response.json() as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // JSON 오류 본문이 아니면 HTTP 상태만 사용한다.
    }
    throw new Error(message);
  }
  return await response.json() as T;
}

export async function loadShellSummary(scope: HarnessScope) {
  return fetchJson(`/api/artifact-summary?scope=${scope}`);
}

export async function loadRequirementBoard(scope: HarnessScope): Promise<RequirementBoardModel> {
  return fetchJson(`/api/requirements?scope=${scope}`);
}

export async function loadRequirementDetail(scope: HarnessScope, requirementId: string): Promise<RequirementDetail> {
  return fetchJson(`/api/requirements/${encodeURIComponent(requirementId)}?scope=${scope}`);
}

export async function loadTerminology(scope: HarnessScope): Promise<TerminologyBrowserModel> {
  return fetchJson(`/api/terminology?scope=${scope}`);
}

export async function loadGateView(scope: HarnessScope): Promise<GateViewModel> {
  return fetchJson(`/api/gate?scope=${scope}`);
}

export async function loadChangeSets(scope: HarnessScope): Promise<ChangeSetRow[]> {
  const payload = await fetchJson<{ rows: ChangeSetRow[] }>(`/api/change-sets?scope=${scope}`);
  return payload.rows;
}

export async function loadCommandRunner(scope: HarnessScope): Promise<CommandRunnerModel> {
  return fetchJson(`/api/command-runner?scope=${scope}`);
}

export async function runCommand(commandId: string, requirementId?: string): Promise<CommandRunState> {
  const payload = await fetchJson<{
    commandId: string;
    requirementId: string | null;
    execution: string;
  }>("/api/commands/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ commandId, requirementId }),
  });

  return {
    status: "ready",
    selectedCommand: payload.commandId,
    requirementId: payload.requirementId ?? undefined,
    startedAt: new Date().toISOString(),
    logs: [payload.execution],
  };
}
