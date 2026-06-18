/**
 * @Requirement REQ-033
 * @Page GateViewPage
 * @Route /gate
 */
import { useState, type FormEvent } from "react";
import { findingRows, gateCategories } from "../../lib/harness-data/fixtures";
import type { FindingRow, GateCategory } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

function findingMatchesQuery(finding: FindingRow, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [finding.ruleId, finding.severity, finding.requirement, finding.file, finding.message].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

export function GateView({ categories, findings }: { categories: GateCategory[]; findings: FindingRow[] }) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(findings[0]?.ruleId ?? null);
  const visibleFindings = findings.filter((finding) => findingMatchesQuery(finding, activeQuery));

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    const nextFindings = findings.filter((finding) => findingMatchesQuery(finding, nextQuery));
    setActiveQuery(nextQuery);
    setExpanded(nextFindings[0]?.ruleId ?? null);
  }

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
      <Card className="p-4 text-sm">
        <form className="flex gap-3" onSubmit={applyFilter}>
          <label className="sr-only" htmlFor="gate-finding-filter">
            검사 결과 필터
          </label>
          <Input
            id="gate-finding-filter"
            className="min-w-72"
            placeholder="규칙, 심각도, 요건, 파일 경로"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="outline">
            필터 적용
          </Button>
          {activeQuery ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setQuery("");
                setActiveQuery("");
                setExpanded(findings[0]?.ruleId ?? null);
              }}
            >
              필터 해제
            </Button>
          ) : null}
        </form>
      </Card>
      <div className="space-y-2">
        {visibleFindings.map((finding) => (
          <Card key={`${finding.ruleId}-${finding.file}`} className="p-4">
            <Button className="h-auto w-full justify-between p-0 text-left hover:bg-transparent" variant="ghost" onClick={() => setExpanded(expanded === finding.ruleId ? null : finding.ruleId)}>
              <span className="font-semibold text-foreground">{finding.ruleId} · {finding.message}</span>
              <StatusBadge label={finding.severity} tone={finding.severity === "error" ? "red" : "warning"} />
            </Button>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{finding.requirement}</span>
              <span className="break-all">{finding.file}</span>
            </div>
            {expanded === finding.ruleId ? (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-border bg-muted p-3">{finding.evidence}</div>
                <div className="rounded-md border border-border bg-muted p-3">{finding.recommendation}</div>
              </div>
            ) : null}
          </Card>
        ))}
        {visibleFindings.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">조건에 맞는 검사 결과가 없습니다.</Card>
        ) : null}
      </div>
    </section>
  );
}

export function GateViewPage() {
  return <GateView categories={gateCategories} findings={findingRows} />;
}
