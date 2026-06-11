/**
 * @Requirement REQ-033
 * @Page GateViewPage
 * @Route /gate
 */
import { useState } from "react";
import { findingRows, gateCategories } from "../../lib/harness-data/fixtures";
import type { FindingRow, GateCategory } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

export function GateView({ categories, findings }: { categories: GateCategory[]; findings: FindingRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(findings[0]?.ruleId ?? null);
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-8 gap-2">
        {categories.map((category) => (
          <Card key={category.category} className="p-3">
            <div className="text-sm font-semibold text-foreground">{category.category}</div>
            <div className="mt-2">
              <StatusBadge label={category.blocked ? "차단" : "통과"} tone={category.blocked ? "red" : "green"} />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">검사 결과 {category.errors}</div>
          </Card>
        ))}
      </div>
      <Card className="flex gap-3 p-4 text-sm">
        <Input className="min-w-72" placeholder="규칙, 심각도, 요건, 파일 경로" />
        <Button variant="outline">필터 적용</Button>
      </Card>
      <div className="space-y-2">
        {findings.map((finding) => (
          <Card key={finding.ruleId} className="p-4">
            <Button className="h-auto w-full justify-between p-0 text-left hover:bg-transparent" variant="ghost" onClick={() => setExpanded(expanded === finding.ruleId ? null : finding.ruleId)}>
              <span className="font-semibold text-foreground">{finding.ruleId} · {finding.message}</span>
              <StatusBadge label={finding.severity} tone={finding.severity === "error" ? "red" : "warning"} />
            </Button>
            <div className="mt-2 break-all text-sm text-muted-foreground">{finding.file}</div>
            {expanded === finding.ruleId ? (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-border bg-muted p-3">{finding.evidence}</div>
                <div className="rounded-md border border-border bg-muted p-3">{finding.recommendation}</div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}

export function GateViewPage() {
  return <GateView categories={gateCategories} findings={findingRows} />;
}
