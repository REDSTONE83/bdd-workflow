/**
 * @Requirement REQ-039
 * @Page TestResultsPage
 * @Route /tests
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { EmptyState } from "../../components/ui/empty-state";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/input";
import { LoadingState } from "../../components/ui/LoadingState";
import { LocationLink } from "../../components/ui/location-link";
import { MetricCard } from "../../components/ui/metric-card";
import { Select } from "../../components/ui/select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { loadTestResults } from "../../lib/harness-data/client";
import type { HarnessScope, SurfaceRequirementRef, TestResultIssue, TestResultRow, TestResultsModel, TestRunStatus, TestType } from "../../lib/harness-data/types";

type TestStatusFilter = "all" | TestRunStatus;
type TestTypeFilter = "all" | TestType;

const testTypeOrder: TestType[] = ["API", "UI", "UNIT", "E2E", "STATIC", "OTHER"];

const statusLabels: Record<TestRunStatus, string> = {
  PASS: "PASS",
  FAIL: "FAIL",
  SKIP: "SKIP",
  NOT_RUN: "NOT_RUN",
};

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}

function requirementLabel(requirement: SurfaceRequirementRef) {
  return `${requirement.id} - ${requirement.title}`;
}

function matchesQuery(row: TestResultRow, query: string) {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return true;

  return [
    row.displayName,
    row.runtime,
    row.source,
    row.testType,
    row.status,
    row.source === "test-results" ? "" : row.file,
    ...row.requirements.flatMap((requirement) => [requirement.id, requirement.title, requirement.traceState, requirementLabel(requirement)]),
    ...row.covers.flatMap((cover) => [
      cover.text,
      ...cover.requirements.flatMap((requirement) => [requirement.id, requirement.title, requirement.traceState, requirementLabel(requirement)]),
    ]),
  ].some((value) => normalize(value).includes(normalizedQuery));
}

export function filterTestRows(
  rows: TestResultRow[],
  {
    query,
    status,
    testType,
    runtime,
  }: {
    query: string;
    status: TestStatusFilter;
    testType: TestTypeFilter;
    runtime: string;
  },
) {
  return rows.filter((row) =>
    matchesQuery(row, query)
    && (status === "all" || row.status === status)
    && (testType === "all" || row.testType === testType)
    && (runtime === "all" || row.runtime === runtime)
  );
}

function statusTone(status: TestRunStatus) {
  if (status === "PASS") return "green";
  if (status === "FAIL") return "red";
  if (status === "SKIP") return "warning";
  return "inactive";
}

function testTypeTone(testType: TestType) {
  if (testType === "API") return "blue";
  if (testType === "UI") return "green";
  if (testType === "E2E") return "warning";
  if (testType === "UNIT") return "neutral";
  if (testType === "STATIC") return "inactive";
  return "neutral";
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

function RequirementBadges({ requirements }: { requirements: SurfaceRequirementRef[] }) {
  if (requirements.length === 0) {
    return <span className="text-sm text-muted-foreground">연결 요건 없음</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {requirements.map((requirement) => {
        const label = requirementLabel(requirement);
        return (
          <Badge key={requirement.id} variant="outline" size="sm" className="max-w-full justify-start" title={label}>
            <span className="max-w-64 truncate">{label}</span>
          </Badge>
        );
      })}
    </div>
  );
}

function ImplementationLocation({ row }: { row: TestResultRow }) {
  if (row.source === "test-results" || !row.file) {
    return <span className="text-sm text-muted-foreground">구현 위치 없음</span>;
  }

  return <LocationLink file={row.file} line={row.line} />;
}

function TestResultCard({ row }: { row: TestResultRow }) {
  return (
    <Card className="p-4" role="listitem">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={statusLabels[row.status]} tone={statusTone(row.status)} />
            <StatusBadge label={row.testType} tone={testTypeTone(row.testType)} />
            <Badge variant="outline" size="sm" className="font-mono">{row.runtime}</Badge>
            <Badge variant="secondary" size="sm">{row.source}</Badge>
          </div>
          <div className="mt-2 break-words text-sm font-semibold text-foreground">{row.displayName}</div>
        </div>
      </div>

      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <DetailField label="연결 요건"><RequirementBadges requirements={row.requirements} /></DetailField>
        <DetailField label="구현 위치"><ImplementationLocation row={row} /></DetailField>
      </dl>

      {row.covers.length > 0 ? (
        <Collapsible className="mt-4 text-sm">
          <CollapsibleTrigger>
            Cover
            {" "}
            <span className="ml-1 font-normal text-muted-foreground">{row.covers.length}개</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-0">
            <ul className="grid gap-2 p-3">
              {row.covers.map((cover) => (
                <li key={cover.text} className="grid gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                  <RequirementBadges requirements={cover.requirements} />
                  <div className="break-words">{cover.text}</div>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </Card>
  );
}

function IssueList({ issues }: { issues: TestResultIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <StatusBadge label="freshness issue" tone="warning" />
        <div className="text-sm font-semibold text-foreground">테스트 결과 이슈</div>
      </div>
      <div className="mt-3 grid gap-2">
        {issues.map((issue) => (
          <div key={`${issue.kind}-${issue.runtime}-${issue.identity ?? issue.resultFile}`} className="grid gap-1 rounded-md border border-border bg-muted p-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="font-mono font-semibold text-foreground">{issue.kind}</span>
              <span className="font-mono text-muted-foreground">{issue.runtime}</span>
              <span className="text-muted-foreground">{issue.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function summaryValue(model: TestResultsModel, status: TestRunStatus) {
  return model.summary.find((entry) => entry.status === status)?.count ?? 0;
}

export function TestResults({
  model,
  initialQuery = "",
  initialStatus = "all",
  initialTestType = "all",
  initialRuntime = "all",
}: {
  model: TestResultsModel;
  initialQuery?: string;
  initialStatus?: TestStatusFilter;
  initialTestType?: TestTypeFilter;
  initialRuntime?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<TestStatusFilter>(initialStatus);
  const [testType, setTestType] = useState<TestTypeFilter>(initialTestType);
  const [runtime, setRuntime] = useState(initialRuntime);
  const typeOptions = useMemo(() => [
    { value: "all", label: "전체 구분" },
    ...testTypeOrder.map((value) => ({ value, label: value })),
  ], []);
  const runtimeOptions = useMemo(() => [
    { value: "all", label: "전체 런타임" },
    ...[...new Set(model.tests.map((row) => row.runtime))].sort().map((value) => ({ value, label: value })),
  ], [model.tests]);
  const visibleRows = useMemo(() => filterTestRows(model.tests, { query, status, testType, runtime }), [model.tests, query, status, testType, runtime]);
  const visibleGroups = testTypeOrder
    .map((type) => ({ type, rows: visibleRows.filter((row) => row.testType === type) }))
    .filter((group) => group.rows.length > 0);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="전체 테스트" value={model.tests.length} />
        <MetricCard label="PASS" value={summaryValue(model, "PASS")} />
        <MetricCard label="FAIL" value={summaryValue(model, "FAIL")} />
        <MetricCard label="SKIP" value={summaryValue(model, "SKIP")} />
        <MetricCard label="NOT_RUN" value={summaryValue(model, "NOT_RUN")} />
      </div>

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_12rem]">
          <label className="grid gap-2 text-sm text-foreground">
            <span>검색</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="테스트명, 요건, 파일"
                aria-label="테스트 검색"
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm text-foreground">
            <span>상태</span>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as TestStatusFilter)}
              options={[
                { value: "all", label: "전체 상태" },
                { value: "PASS", label: "PASS" },
                { value: "FAIL", label: "FAIL" },
                { value: "SKIP", label: "SKIP" },
                { value: "NOT_RUN", label: "NOT_RUN" },
              ]}
              aria-label="수행 상태 필터"
              className="w-full"
            />
          </label>
          <label className="grid gap-2 text-sm text-foreground">
            <span>구분</span>
            <Select
              value={testType}
              onValueChange={(value) => setTestType(value as TestTypeFilter)}
              options={typeOptions}
              aria-label="테스트 구분 필터"
              className="w-full"
            />
          </label>
          <label className="grid gap-2 text-sm text-foreground">
            <span>런타임</span>
            <Select
              value={runtime}
              onValueChange={setRuntime}
              options={runtimeOptions}
              aria-label="런타임 필터"
              className="w-full"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {model.typeSummary.map((entry) => (
            <Badge key={entry.type} variant="outline" size="sm" className="gap-1">
              <span className="font-mono">{entry.type}</span>
              <span>{entry.count}</span>
            </Badge>
          ))}
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          generatedAt: {model.generatedAt ?? "산출물 없음"} · source: {model.sourceGeneratedAt ?? "없음"} · result: {model.resultGeneratedAt ?? "없음"} · 표시 {visibleRows.length}개
        </div>
      </Card>

      <IssueList issues={model.issues} />

      <div className="grid gap-5" role="list" aria-label="테스트 결과 목록">
        {visibleGroups.map((group) => (
          <section key={group.type} className="grid gap-3" aria-label={`${group.type} 테스트 결과`}>
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <StatusBadge label={group.type} tone={testTypeTone(group.type)} />
              <span className="text-sm text-muted-foreground">{group.rows.length}개</span>
            </div>
            {group.rows.map((row) => <TestResultCard key={row.id} row={row} />)}
          </section>
        ))}
        {visibleRows.length === 0 ? <EmptyState className="p-6">조건에 맞는 테스트 결과가 없다.</EmptyState> : null}
      </div>
    </section>
  );
}

export function TestResultsPage({ scope }: { scope: HarnessScope }) {
  const query = useQuery({
    queryKey: ["harness-data", scope, "tests"],
    queryFn: () => loadTestResults(scope),
  });

  if (query.isLoading) return <LoadingState label="테스트 결과를 불러오는 중" />;
  if (query.isError || !query.data) return <ErrorState message={query.error instanceof Error ? query.error.message : "테스트 결과 산출물을 읽지 못했다."} />;

  return <TestResults model={query.data} />;
}
