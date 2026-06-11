/**
 * @Requirement REQ-034
 * @Page ChangeSetViewPage
 * @Route /change-sets
 */
import { Link } from "react-router-dom";
import { changeSetRows } from "../../lib/harness-data/fixtures";
import type { ChangeSetRow } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

export function ChangeSetView({ rows }: { rows: ChangeSetRow[] }) {
  const selected = rows[0];
  return (
    <section className="grid grid-cols-[420px_1fr] gap-4">
      <Card className="overflow-hidden">
        {rows.map((row) => (
          <Button key={row.title} className="h-auto w-full justify-start rounded-none border-b border-border px-4 py-4 text-left" variant="ghost">
            <div>
              <div className="font-semibold text-foreground">{row.title}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge label={row.status} tone="warning" />
              <span>{row.requestedDate}</span>
              <span>영향 요건 {row.affectedRequirements.length}</span>
              </div>
            </div>
          </Button>
        ))}
      </Card>
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{selected.requestedDate}</div>
            <h1 className="mt-1 text-xl font-semibold text-foreground">{selected.title}</h1>
          </div>
          <StatusBadge label={selected.status} tone="warning" />
        </div>
        <p className="mt-4 text-sm text-foreground">{selected.summary}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <section>
            <h2 className="font-semibold text-foreground">작업 범위</h2>
            <ul className="mt-2 space-y-1 text-muted-foreground">{selected.scopeItems.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">완료 조건</h2>
            <ul className="mt-2 space-y-1 text-muted-foreground">{selected.completionCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">검증 명령</h2>
            <ul className="mt-2 space-y-1 font-mono text-muted-foreground">{selected.verificationCommands.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">열린 논의</h2>
            <div className="mt-2 text-muted-foreground">{selected.openDiscussions.length > 0 ? selected.openDiscussions.join(", ") : "없음"}</div>
          </section>
        </div>
        <section className="mt-5">
          <h2 className="font-semibold text-foreground">영향 요건</h2>
          <div className="mt-2 grid gap-2">
            {selected.affectedRequirements.map((req) => (
              <Button key={req.id} asChild className="justify-between" variant="outline">
                <Link to={`/requirements/${req.id}`}>
                  <span>{req.id} · {req.title}</span>
                  <StatusBadge label={req.traceState} tone={req.traceState === "RED" ? "red" : "blue"} />
                </Link>
              </Button>
            ))}
          </div>
        </section>
      </Card>
    </section>
  );
}

export function ChangeSetViewPage() {
  return <ChangeSetView rows={changeSetRows} />;
}
