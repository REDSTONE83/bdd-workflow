import type { LinkedArtifact, RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Card } from "../../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible";
import { MetricCard } from "../../../components/ui/metric-card";

function BulletList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) return <div className="mt-3 text-sm text-muted-foreground">{emptyLabel}</div>;

  return (
    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
      {items.map((item) => <li key={item} className="break-words">{item}</li>)}
    </ul>
  );
}

export function RequirementOverviewTab({
  detail,
  sourceLinks,
}: {
  detail: RequirementDetail;
  sourceLinks: LinkedArtifact[];
}) {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {[
          ["AC", `${detail.acceptanceCriteria.length}건`],
          ["Scenario", `${detail.scenarios.length}건`],
          ["UI", `${detail.uiSurfaces.length}건`],
          ["API", `${detail.apiSurfaces.length}건`],
          ["DB 설계", `${detail.entitySurfaces.length}건`],
          ["Test", `${detail.coverage.reduce((count, row) => count + row.tests.length, 0)}건`],
          ["Source", `${sourceLinks.length}건`],
          ["Trace", detail.traceState],
        ].map(([label, value]) => (
          <MetricCard key={label} label={label} value={value} />
        ))}
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <Card className="col-span-2 p-4">
          <h2 className="text-base font-semibold text-foreground">사용자 / 목적</h2>
          <p className="mt-3 break-words text-sm text-muted-foreground">{detail.purpose || "사용자/목적 본문이 없다."}</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-base font-semibold text-foreground">범위</h2>
          <BulletList items={detail.scopeItems} emptyLabel="범위 항목이 없다." />
        </Card>
        <Card className="p-4">
          <h2 className="text-base font-semibold text-foreground">제외 범위</h2>
          <BulletList items={detail.outOfScopeItems} emptyLabel="제외 범위 항목이 없다." />
        </Card>
        <Card className="col-span-2 p-4">
          <h2 className="text-base font-semibold text-foreground">표준 용어</h2>
          {detail.terms.length > 0 ? (
            <div className="mt-3 divide-y divide-border rounded-md border border-border">
              {detail.terms.map((term) => (
                <div key={term.key} className="grid grid-cols-[minmax(15rem,0.8fr)_1fr] gap-3 px-3 py-2 text-sm">
                  <div className="break-all font-mono text-foreground">{term.key}</div>
                  <div className="min-w-0">
                    <span className="break-words font-medium text-foreground">{term.ko}</span>
                    <span className="text-muted-foreground"> / {term.en}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="mt-3 text-sm text-muted-foreground">표준 용어가 없다.</div>}
        </Card>
        <Card className="col-span-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">의사결정 로그</h2>
            <StatusBadge label={`${detail.decisionLogs.length}건`} tone={detail.decisionLogs.length > 0 ? "blue" : "neutral"} />
          </div>
          {detail.decisionLogs.length > 0 ? (
            <div className="mt-3 divide-y divide-border rounded-md border border-border">
              {detail.decisionLogs.map((log) => (
                <Collapsible key={`${log.date}-${log.decision}`} className="rounded-none border-0 bg-transparent">
                  <CollapsibleTrigger className="w-full justify-between">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{log.date}</span>
                      <span className="truncate text-sm font-semibold text-foreground">{log.decision}</span>
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">이유</dt>
                      <dd className="break-words text-foreground">{log.reason || "없음"}</dd>
                      <dt className="text-muted-foreground">결정자</dt>
                      <dd className="break-words text-foreground">{log.decisionMaker || "없음"}</dd>
                      <dt className="text-muted-foreground">영향</dt>
                      <dd className="break-words text-foreground">{log.impact || "없음"}</dd>
                    </dl>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : <div className="mt-3 text-sm text-muted-foreground">의사결정 로그가 없다.</div>}
        </Card>
      </div>
    </>
  );
}
