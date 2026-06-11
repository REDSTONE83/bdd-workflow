/**
 * @Requirement REQ-035
 * @Page CommandRunnerPage
 * @Route /runs
 */
import { commands, readyRun } from "../../lib/harness-data/fixtures";
import type { CommandDefinition, CommandRunState } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

export function CommandRunner({ commands, run }: { commands: CommandDefinition[]; run: CommandRunState }) {
  return (
    <section className="grid grid-cols-[420px_1fr] gap-4">
      <Card className="p-4">
        <h1 className="text-lg font-semibold text-foreground">검증 명령</h1>
        <div className="mt-4 space-y-2">
          {commands.map((command) => (
            <Button key={command.id} className="h-auto w-full justify-start px-3 py-3 text-left" variant="outline">
              <div>
                <div className="font-semibold text-foreground">{command.label}</div>
                <div className="mt-1 text-sm text-muted-foreground">{command.description}</div>
                <div className="mt-2 font-mono text-xs text-muted-foreground">{command.id}</div>
              </div>
            </Button>
          ))}
        </div>
        <label className="mt-4 block text-sm text-foreground">
          단일 요건
          <Input className="mt-1 font-mono" defaultValue={run.requirementId} />
        </label>
        <Button className="mt-4 w-full" disabled={run.status === "running"}>
          {run.status === "running" ? "실행 중" : "실행"}
        </Button>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">실행 상태</h2>
          <StatusBadge label={run.status} tone={run.status === "failed" || run.status === "rejected" ? "red" : run.status === "succeeded" ? "green" : "neutral"} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-muted-foreground">명령</dt><dd className="mt-1 font-mono">{run.selectedCommand}</dd></div>
          <div><dt className="text-muted-foreground">시작</dt><dd className="mt-1">{run.startedAt ?? "-"}</dd></div>
          <div><dt className="text-muted-foreground">종료 코드</dt><dd className="mt-1">{run.exitCode ?? "-"}</dd></div>
        </dl>
        {run.rejectionReason ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{run.rejectionReason}</div> : null}
        <pre className="mt-4 h-80 overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs text-slate-50">
          {run.logs.length > 0 ? run.logs.join("\n") : "실행 로그가 여기에 표시된다."}
        </pre>
      </Card>
    </section>
  );
}

export function CommandRunnerPage() {
  return <CommandRunner commands={commands} run={readyRun} />;
}
