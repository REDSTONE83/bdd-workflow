/**
 * @Requirement REQ-035
 * @Page CommandRunnerPage
 * @Route /runs
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { loadCommandRunner, runCommand } from "../../lib/harness-data/client";
import type { CommandDefinition, CommandRunState, HarnessScope, RequirementRow, TraceState } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { RequirementPickerDialog } from "../requirements/RequirementPickerDialog";

function toneForState(state: TraceState) {
  if (state === "RED") return "red" as const;
  if (state === "GREEN") return "green" as const;
  if (state === "BLUE") return "blue" as const;
  return "inactive" as const;
}

function labelForRunStatus(status: CommandRunState["status"]) {
  if (status === "ready") return "준비";
  if (status === "running") return "실행 중";
  if (status === "succeeded") return "성공";
  if (status === "failed") return "실패";
  return "거절";
}

export function CommandRunner({
  commands,
  run,
  requirements,
  onRun,
  initialRequirementDialogOpen = false,
}: {
  commands: CommandDefinition[];
  run: CommandRunState;
  requirements: RequirementRow[];
  onRun?: (request: { commandId: string; requirementId?: string }) => Promise<CommandRunState>;
  initialRequirementDialogOpen?: boolean;
}) {
  const [selectedCommand, setSelectedCommand] = useState(run.selectedCommand);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | undefined>(run.requirementId);
  const [currentRun, setCurrentRun] = useState(run);
  const [requirementDialogOpen, setRequirementDialogOpen] = useState(initialRequirementDialogOpen);
  const [runRequest, setRunRequest] = useState<{ commandId: string; requirementId?: string } | null>(null);
  const selectedCommandDefinition = commands.find((command) => command.id === selectedCommand) ?? commands[0];
  const selectedRequirement = requirements.find((requirement) => requirement.id === selectedRequirementId);
  const requiresRequirement = selectedCommandDefinition?.supportsRequirement ?? false;
  async function requestRun() {
    const request = { commandId: selectedCommand, requirementId: requiresRequirement ? selectedRequirement?.id : undefined };
    setRunRequest(request);
    if (!onRun) return;

    setCurrentRun({
      status: "running",
      selectedCommand: request.commandId,
      requirementId: request.requirementId,
      startedAt: new Date().toISOString(),
      logs: ["실행 요청 전송 중"],
    });
    try {
      setCurrentRun(await onRun(request));
    } catch (error) {
      setCurrentRun({
        status: "rejected",
        selectedCommand: request.commandId,
        requirementId: request.requirementId,
        rejectionReason: error instanceof Error ? error.message : "명령 실행 요청이 거절됐다.",
        logs: [],
      });
    }
  }
  const executeButton = (
    <div className="border-t border-border bg-background/70 p-3">
      <Button
        className="w-full"
        disabled={currentRun.status === "running"}
        onClick={() => void requestRun()}
      >
        {currentRun.status === "running" ? "실행 중" : "실행"}
      </Button>
    </div>
  );
  const requirementSelectionPanel = requiresRequirement ? (
    <div className="border-t border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        실행 대상 요건
        <StatusBadge label="선택 항목" tone="neutral" />
      </div>
      <div className="mt-3 space-y-3">
        {selectedRequirement ? (
          <div className="rounded-md border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">{selectedRequirement.id}</span>
                  <StatusBadge label={selectedRequirement.traceState} tone={toneForState(selectedRequirement.traceState)} />
                </div>
                <div className="mt-2 break-words text-sm text-foreground">{selectedRequirement.title}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentRun.status === "running"}
                onClick={() => setSelectedRequirementId(undefined)}
              >
                <X className="size-4" aria-hidden="true" />
                선택 해제
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <StatusBadge label="미선택" tone="neutral" />
              <span className="text-sm font-medium text-foreground">선택한 요건이 없다.</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">요건을 선택하지 않으면 요건 인자 없이 명령을 실행한다.</div>
          </div>
        )}
        <Button className="w-full" variant="outline" disabled={currentRun.status === "running"} onClick={() => setRequirementDialogOpen(true)}>
          요건 검색/선택
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <section className="grid grid-cols-[420px_1fr] gap-4">
      <Card className="p-4">
        <h1 className="text-lg font-semibold text-foreground">검증 명령</h1>
        <div className="mt-4 space-y-2">
          {commands.map((command) => {
            const selected = selectedCommand === command.id;
            return (
              <div
                key={command.id}
                className={selected ? "overflow-hidden rounded-md border border-sky-200 bg-sky-50/40" : "overflow-hidden rounded-md border border-border bg-background"}
              >
                <Button
                  className="h-auto w-full justify-start rounded-none border-0 px-3 py-3 text-left shadow-none"
                  variant={selected ? "secondary" : "ghost"}
                  disabled={currentRun.status === "running" && !selected}
                  onClick={() => setSelectedCommand(command.id)}
                >
                  <div className="w-full min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 break-words font-semibold text-foreground">{command.label}</div>
                      {command.supportsRequirement ? <StatusBadge label="요건 선택" tone="blue" /> : null}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{command.description}</div>
                    <div className="mt-2 font-mono text-xs text-muted-foreground">{command.id}</div>
                  </div>
                </Button>
                {selected && command.supportsRequirement ? requirementSelectionPanel : null}
                {selected && !command.supportsRequirement ? (
                  <div className="border-t border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    이 명령은 요건 인자를 사용하지 않는다.
                  </div>
                ) : null}
                {selected ? executeButton : null}
              </div>
            );
          })}
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">실행 상태</h2>
          <StatusBadge label={labelForRunStatus(currentRun.status)} tone={currentRun.status === "failed" || currentRun.status === "rejected" ? "red" : currentRun.status === "succeeded" ? "green" : "neutral"} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-muted-foreground">명령</dt><dd className="mt-1 font-mono">{selectedCommand}</dd></div>
          <div><dt className="text-muted-foreground">시작</dt><dd className="mt-1">{currentRun.startedAt ?? "-"}</dd></div>
          <div><dt className="text-muted-foreground">종료 코드</dt><dd className="mt-1">{currentRun.exitCode ?? "-"}</dd></div>
        </dl>
        {requiresRequirement ? (
          <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">실행 대상 요건</span>
            <span className="ml-2 font-mono text-foreground">{selectedRequirement?.id ?? "-"}</span>
          </div>
        ) : null}
        {runRequest ? (
          <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950" role="status">
            실행 요청: <span className="font-mono">{runRequest.commandId}</span>
            {" "}
            <span className="ml-2">요건 인자 {runRequest.requirementId ?? "없음"}</span>
          </div>
        ) : null}
        {currentRun.rejectionReason ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{currentRun.rejectionReason}</div> : null}
        <pre className="mt-4 h-80 overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs text-slate-50">
          {currentRun.logs.length > 0 ? currentRun.logs.join("\n") : "실행 로그가 여기에 표시된다."}
        </pre>
      </Card>
      <RequirementPickerDialog
        open={requirementDialogOpen}
        onOpenChange={setRequirementDialogOpen}
        requirements={requirements}
        selectedRequirement={selectedRequirement}
        onSelect={(requirement) => setSelectedRequirementId(requirement.id)}
        onClear={() => setSelectedRequirementId(undefined)}
      />
    </section>
  );
}

export function CommandRunnerPage({ scope }: { scope: HarnessScope }) {
  const query = useQuery({
    queryKey: ["harness-data", scope, "command-runner"],
    queryFn: () => loadCommandRunner(scope),
  });

  if (query.isLoading) return <LoadingState label="검증 명령 데이터를 불러오는 중" />;
  if (query.isError || !query.data) return <ErrorState message={query.error instanceof Error ? query.error.message : "검증 명령 데이터를 읽지 못했다."} />;

  return (
    <CommandRunner
      commands={query.data.commands}
      run={query.data.run}
      requirements={query.data.requirements}
      onRun={(request) => runCommand(request.commandId, request.requirementId)}
    />
  );
}
