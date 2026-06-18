/**
 * @Requirement REQ-031
 * @Page RequirementBoardPage
 * @Route /requirements
 */
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { loadRequirementBoard } from "../../lib/harness-data/client";
import type { HarnessScope, RequirementRow, RequirementSummary, TraceState } from "../../lib/harness-data/types";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/input";
import { LoadingState } from "../../components/ui/LoadingState";
import { MetricCard } from "../../components/ui/metric-card";
import { Select } from "../../components/ui/select";
import { cn } from "../../lib/utils";
import { RequirementHierarchySummary } from "./RequirementHierarchySummary";
import { requirementDetailPath } from "./requirement-navigation";

function traceStateVariant(state: TraceState) {
  if (state === "RED") return "destructive" as const;
  if (state === "GREEN") return "success" as const;
  if (state === "BLUE") return "info" as const;
  return "inactive" as const;
}

const traceStateOptions = [
  { value: "ALL", label: "전체" },
  { value: "RED", label: "RED" },
  { value: "GREEN", label: "GREEN" },
  { value: "BLUE", label: "BLUE" },
  { value: "INACTIVE", label: "INACTIVE" },
];

const filterQueryKeys = {
  title: "title",
  traceState: "traceState",
  cardStatus: "cardStatus",
  productArea: "productArea",
} as const;

function uniqueValues(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}

function RequirementMetaBadge({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "secondary" | "info" | "warning";
}) {
  return (
    <Badge className="shrink-0" size="sm" variant={variant}>
      {children}
    </Badge>
  );
}

export function filterRequirementRows(
  rows: RequirementRow[],
  filters: { titleQuery: string; traceState: string; cardStatus: string; productArea: string },
) {
  const normalizedTitleQuery = normalize(filters.titleQuery.trim());

  return rows.filter((row) => {
    if (normalizedTitleQuery && !normalize(row.title).includes(normalizedTitleQuery)) return false;
    if (filters.traceState !== "ALL" && row.traceState !== filters.traceState) return false;
    if (filters.cardStatus !== "ALL" && row.cardStatus !== filters.cardStatus) return false;
    if (filters.productArea !== "ALL" && row.productArea !== filters.productArea) return false;
    return true;
  });
}

export function RequirementBoard({
  rows,
  summary,
  initialTitleQuery = "",
}: {
  rows: RequirementRow[];
  summary: RequirementSummary[];
  initialTitleQuery?: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cardStatusOptions = useMemo(
    () => [{ value: "ALL", label: "전체" }, ...uniqueValues(rows.map((row) => row.cardStatus)).map((value) => ({ value, label: value }))],
    [rows],
  );
  const productAreaOptions = useMemo(
    () => [{ value: "ALL", label: "전체" }, ...uniqueValues(rows.map((row) => row.productArea)).map((value) => ({ value, label: value }))],
    [rows],
  );
  const titleQuery = searchParams.has(filterQueryKeys.title) ? (searchParams.get(filterQueryKeys.title) ?? "") : initialTitleQuery;
  const traceStateParam = searchParams.get(filterQueryKeys.traceState);
  const cardStatusParam = searchParams.get(filterQueryKeys.cardStatus);
  const productAreaParam = searchParams.get(filterQueryKeys.productArea);
  const traceState = traceStateOptions.some((option) => option.value === traceStateParam) ? traceStateParam ?? "ALL" : "ALL";
  const cardStatus = cardStatusOptions.some((option) => option.value === cardStatusParam) ? cardStatusParam ?? "ALL" : "ALL";
  const productArea = productAreaOptions.some((option) => option.value === productAreaParam) ? productAreaParam ?? "ALL" : "ALL";

  const visibleRows = useMemo(
    () => filterRequirementRows(rows, { titleQuery, traceState, cardStatus, productArea }),
    [cardStatus, productArea, rows, titleQuery, traceState],
  );
  const updateFilterQuery = (key: keyof typeof filterQueryKeys, value: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        const queryKey = filterQueryKeys[key];

        if (key === "title") {
          next.set(queryKey, value);
          return next;
        }

        if (value === "ALL") {
          next.delete(queryKey);
        } else {
          next.set(queryKey, value);
        }

        return next;
      },
      { replace: true },
    );
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {summary.map((item) => (
          <MetricCard key={item.state} label={item.state} value={item.count} />
        ))}
      </div>
      <Card className="grid gap-3 p-4 lg:grid-cols-[minmax(220px,1fr)_12rem_12rem_12rem]">
        <label className="grid gap-1 text-sm text-foreground">
          <span>제목</span>
          <Input
            value={titleQuery}
            onChange={(event) => updateFilterQuery("title", event.currentTarget.value)}
            placeholder="요건 제목"
            aria-label="요건 제목 검색"
          />
        </label>
        <label className="grid gap-1 text-sm text-foreground">
          <span>추적 상태</span>
          <Select value={traceState} onValueChange={(value) => updateFilterQuery("traceState", value)} options={traceStateOptions} aria-label="추적 상태 필터" />
        </label>
        <label className="grid gap-1 text-sm text-foreground">
          <span>카드 상태</span>
          <Select value={cardStatus} onValueChange={(value) => updateFilterQuery("cardStatus", value)} options={cardStatusOptions} aria-label="카드 상태 필터" />
        </label>
        <label className="grid gap-1 text-sm text-foreground">
          <span>제품 영역</span>
          <Select value={productArea} onValueChange={(value) => updateFilterQuery("productArea", value)} options={productAreaOptions} aria-label="제품 영역 필터" />
        </label>
      </Card>
      <div className="grid gap-1.5">
        {visibleRows.map((row) => {
          const childRequirement = row.parentRequirementIds.length > 0;

          return (
            <div
              key={row.id}
              aria-label={childRequirement ? "하위 요건 행" : undefined}
              className={cn(childRequirement && "ml-8 border-l-2 border-sky-200 pl-4")}
            >
              <Card className={cn("px-3 py-1.5", childRequirement && "bg-sky-50/20")}>
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    className="h-auto shrink-0 p-0 font-mono font-semibold"
                    variant="link"
                    onClick={() => navigate(requirementDetailPath(row.id, location.search))}
                  >
                    {row.id}
                  </Button>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="min-w-0 truncate text-sm font-medium text-foreground" title={row.title}>
                      {row.title}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <RequirementMetaBadge variant="secondary">{row.cardStatus}</RequirementMetaBadge>
                      <RequirementMetaBadge variant="info">{row.productArea}</RequirementMetaBadge>
                      <RequirementMetaBadge variant="warning">{row.priority}</RequirementMetaBadge>
                    </div>
                  </div>
                  <RequirementHierarchySummary
                    className="shrink-0 flex-nowrap"
                    requirement={row}
                  />
                  <div className="ml-auto shrink-0">
                    <Badge className="shrink-0" size="sm" variant={traceStateVariant(row.traceState)}>
                      {row.traceState}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
        {visibleRows.length === 0 ? <EmptyState className="p-6">조건에 맞는 요건이 없다.</EmptyState> : null}
      </div>
    </section>
  );
}

export function RequirementBoardPage({ scope }: { scope: HarnessScope }) {
  const query = useQuery({
    queryKey: ["harness-data", scope, "requirements"],
    queryFn: () => loadRequirementBoard(scope),
  });

  if (query.isLoading) return <LoadingState label="요건 목록을 불러오는 중" />;
  if (query.isError || !query.data) return <ErrorState message={query.error instanceof Error ? query.error.message : "요건 추적 산출물을 읽지 못했다."} />;

  return <RequirementBoard rows={query.data.rows} summary={query.data.summary} />;
}
