import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Card } from "../../../components/ui/card";
import { coverageRowsForScenario, coverageTone, uniqueTests } from "./detail-utils";
import { SectionHeader } from "./SectionHeader";

export function RequirementScenariosTab({ detail }: { detail: RequirementDetail }) {
  return (
    <>
      <SectionHeader title="시나리오" description="BDD Scenario의 Covers 관계와 주요 Given/When/Then을 확인한다." />
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {detail.scenarios.map((scenario) => {
            const coverageRows = coverageRowsForScenario(detail, scenario);
            const tests = uniqueTests(coverageRows);
            return (
              <section key={`${scenario.file}-${scenario.line}`} className="p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{scenario.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{scenario.file}:{scenario.line}</div>
                  </div>
                  <StatusBadge label={scenario.status} tone="blue" />
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-muted-foreground">Covers</div>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {scenario.covers.map((cover) => <li key={cover} className="break-words">{cover}</li>)}
                  </ul>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-muted-foreground">커버리지 판정</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {coverageRows.length > 0 ? coverageRows.map((row) => (
                      <StatusBadge key={row.criterion} label={`${row.channel} ${row.status}`} tone={coverageTone(row.status)} />
                    )) : <StatusBadge label="연결 없음" />}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-muted-foreground">연결 테스트</div>
                  {tests.length > 0 ? (
                    <ul className="mt-2 grid gap-2 text-muted-foreground">
                      {tests.map((test) => <li key={test} className="break-words font-mono text-xs">{test}</li>)}
                    </ul>
                  ) : (
                    <div className="mt-2 text-muted-foreground">없음</div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-muted-foreground">GWT</div>
                  <div className="mt-1 space-y-1 text-muted-foreground">
                    {scenario.steps.map((step) => <div key={step} className="break-words">{step}</div>)}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        {detail.scenarios.length === 0 ? <div className="p-4 text-sm text-muted-foreground">연결된 시나리오가 없다.</div> : null}
      </Card>
    </>
  );
}
