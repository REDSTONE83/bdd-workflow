import type { LinkedArtifact, RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Card } from "../../../components/ui/card";
import { MetricCard } from "../../../components/ui/metric-card";
import { coverageTone } from "./detail-utils";

export function RequirementOverviewTab({
  detail,
  sourceLinks,
}: {
  detail: RequirementDetail;
  sourceLinks: LinkedArtifact[];
}) {
  const entityShapes = detail.dataShapes.filter((shape) => shape.kind === "Entity");

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {[
          ["AC", `${detail.acceptanceCriteria.length}건`],
          ["Scenario", `${detail.scenarios.length}건`],
          ["UI", `${detail.uiSurfaces.length}건`],
          ["API", `${detail.apiSurfaces.length}건`],
          ["Entity", `${entityShapes.length}건`],
          ["Test", `${detail.coverage.reduce((count, row) => count + row.tests.length, 0)}건`],
          ["Source", `${sourceLinks.length}건`],
          ["Trace", detail.traceState],
        ].map(([label, value]) => (
          <MetricCard key={label} label={label} value={value} />
        ))}
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <Card className="p-4">
          <h2 className="text-base font-semibold text-foreground">대표 AC</h2>
          {detail.acceptanceCriteria[0] ? (
            <div className="mt-3 text-sm">
              <div className="font-mono text-xs text-muted-foreground">{detail.acceptanceCriteria[0].id}</div>
              <div className="mt-2 break-words font-medium text-foreground">{detail.acceptanceCriteria[0].text}</div>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge label={detail.acceptanceCriteria[0].channel} />
                <StatusBadge label={detail.acceptanceCriteria[0].status} tone={coverageTone(detail.acceptanceCriteria[0].status)} />
              </div>
            </div>
          ) : <div className="mt-3 text-sm text-muted-foreground">수용 기준이 없다.</div>}
        </Card>
        <Card className="p-4">
          <h2 className="text-base font-semibold text-foreground">대표 API</h2>
          {detail.apiSurfaces[0] ? (
            <div className="mt-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={detail.apiSurfaces[0].method} />
                <span className="break-all font-mono font-semibold text-foreground">{detail.apiSurfaces[0].path}</span>
              </div>
              <div className="mt-2 break-words text-muted-foreground">operationId: {detail.apiSurfaces[0].operationId}</div>
              <div className="mt-3"><StatusBadge label={detail.apiSurfaces[0].status} tone="warning" /></div>
            </div>
          ) : <div className="mt-3 text-sm text-muted-foreground">연결된 API 작업이 없다.</div>}
        </Card>
      </div>
    </>
  );
}
