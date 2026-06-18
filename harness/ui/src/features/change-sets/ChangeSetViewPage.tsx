/**
 * @Requirement REQ-034
 * @Page ChangeSetViewPage
 * @Route /change-sets
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { loadChangeSets } from "../../lib/harness-data/client";
import type { ChangeSetRow, HarnessScope, RequirementRow, TraceState } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button, buttonVariants } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { RequirementPickerDialog } from "../requirements/RequirementPickerDialog";
import { cn } from "../../lib/utils";

const ALL_STATUSES = "ALL_STATUSES";
const ALL_REQUIREMENTS = "ALL_REQUIREMENTS";

function toneForTraceState(state: TraceState) {
  if (state === "RED") return "red" as const;
  if (state === "GREEN") return "green" as const;
  if (state === "BLUE") return "blue" as const;
  return "inactive" as const;
}

function DetailList({ title, items, mono = false }: { title: string; items: string[]; mono?: boolean }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {items.length > 0 ? (
        <ul className={mono ? "mt-2 space-y-1 font-mono text-xs text-muted-foreground" : "mt-2 space-y-1 text-sm text-muted-foreground"}>
          {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      ) : (
        <div className="mt-2 text-sm text-muted-foreground">없음</div>
      )}
    </section>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}

function uniqueValues(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function uniqueRequirements(rows: ChangeSetRow[]) {
  const requirements = new Map<string, RequirementRow>();
  rows.forEach((row) => {
    row.affectedRequirements.forEach((requirement) => requirements.set(requirement.id, requirement));
  });
  return [...requirements.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function ChangeSetView({
  rows,
  initialTitleQuery = "",
  initialStatus = ALL_STATUSES,
  initialAffectedRequirement = ALL_REQUIREMENTS,
  initialAffectedRequirementDialogOpen = false,
}: {
  rows: ChangeSetRow[];
  initialTitleQuery?: string;
  initialStatus?: string;
  initialAffectedRequirement?: string;
  initialAffectedRequirementDialogOpen?: boolean;
}) {
  const [titleQuery, setTitleQuery] = useState(initialTitleQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [affectedRequirementFilter, setAffectedRequirementFilter] = useState(initialAffectedRequirement);
  const [affectedRequirementDialogOpen, setAffectedRequirementDialogOpen] = useState(initialAffectedRequirementDialogOpen);
  const statusOptions = useMemo(
    () => [
      { value: ALL_STATUSES, label: "전체 상태" },
      ...uniqueValues(rows.map((row) => row.status)).map((status) => ({ value: status, label: status })),
    ],
    [rows],
  );
  const affectedRequirements = useMemo(() => uniqueRequirements(rows), [rows]);
  const selectedAffectedRequirement = affectedRequirements.find((requirement) => requirement.id === affectedRequirementFilter);
  const initiallyExpandedTitle = rows[0]?.title;
  const filteredRows = useMemo(() => {
    const normalizedTitleQuery = normalize(titleQuery.trim());
    return rows.filter((row) => {
      const matchesTitle = normalizedTitleQuery ? normalize(row.title).includes(normalizedTitleQuery) : true;
      const matchesStatus = statusFilter === ALL_STATUSES ? true : row.status === statusFilter;
      const matchesAffectedRequirement = affectedRequirementFilter === ALL_REQUIREMENTS
        ? true
        : row.affectedRequirements.some((requirement) => requirement.id === affectedRequirementFilter);

      return matchesTitle && matchesStatus && matchesAffectedRequirement;
    });
  }, [affectedRequirementFilter, rows, statusFilter, titleQuery]);
  const hasActiveFilter = titleQuery.trim() !== "" || statusFilter !== ALL_STATUSES || affectedRequirementFilter !== ALL_REQUIREMENTS;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-foreground">Change Set</h1>
        <StatusBadge label={`${filteredRows.length}/${rows.length}`} tone={filteredRows.length === rows.length ? "neutral" : "blue"} />
      </div>
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_12rem_minmax(220px,18rem)_auto]">
          <label className="grid gap-1 text-sm text-foreground">
            <span>제목</span>
            <Input
              value={titleQuery}
              onChange={(event) => setTitleQuery(event.currentTarget.value)}
              placeholder="Change Set 제목"
              aria-label="Change Set 제목 검색"
            />
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            <span>상태</span>
            <Select
              value={statusFilter}
              options={statusOptions}
              onValueChange={setStatusFilter}
              aria-label="Change Set 상태 필터"
              className="w-full"
            />
          </label>
          <label className="grid gap-1 text-sm text-foreground">
            <span>영향 요건</span>
            <div className="flex h-9 min-w-0 items-center rounded-md border border-input bg-background pl-3 shadow-sm">
              <span
                aria-label="선택된 영향 요건 필터"
                className={
                  selectedAffectedRequirement
                    ? "min-w-0 flex-1 truncate font-mono text-sm font-semibold text-foreground"
                    : "min-w-0 flex-1 truncate text-sm text-muted-foreground"
                }
              >
                {selectedAffectedRequirement ? selectedAffectedRequirement.id : "전체 영향 요건"}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="영향 요건 검색/선택" onClick={() => setAffectedRequirementDialogOpen(true)}>
                    <Search className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>영향 요건 검색/선택</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={affectedRequirementFilter === ALL_REQUIREMENTS}
                    aria-label="영향 요건 필터 해제"
                    onClick={() => setAffectedRequirementFilter(ALL_REQUIREMENTS)}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>영향 요건 필터 해제</TooltipContent>
              </Tooltip>
            </div>
          </label>
          <div className="flex items-end">
            <Button
              className="w-full"
              variant="outline"
              disabled={!hasActiveFilter}
              onClick={() => {
                setTitleQuery("");
                setStatusFilter(ALL_STATUSES);
                setAffectedRequirementFilter(ALL_REQUIREMENTS);
              }}
            >
              초기화
            </Button>
          </div>
        </div>
      </Card>
      {filteredRows.length === 0 ? (
        <EmptyState className="p-6">조건에 맞는 Change Set이 없다.</EmptyState>
      ) : null}
      <div className="grid gap-3">
        {filteredRows.map((row) => (
          <Card key={row.title} className="overflow-hidden">
            <Collapsible defaultOpen={row.title === initiallyExpandedTitle} className="rounded-none border-0">
              <CollapsibleTrigger className="px-5 py-4 hover:bg-muted/40 [&[data-panel-open]_.collapsible-icon]:rotate-180" hideIcon>
                <div className="w-full min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <ChevronDown className="collapsible-icon mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="break-words text-base font-semibold text-foreground">{row.title}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{row.requestedDate}</span>
                          <span>영향 요건 {row.affectedRequirements.length}</span>
                          <span>열린 논의 {row.openDiscussions.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge label={row.status} tone="warning" />
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-normal text-muted-foreground">{row.summary}</p>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-5 py-4">
                <section className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">요청 요약</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{row.summary}</p>
                </section>
                <div className="grid gap-4 lg:grid-cols-2">
                  <DetailList title="작업 범위" items={row.scopeItems} />
                  <DetailList title="완료 조건" items={row.completionCriteria} />
                  <DetailList title="검증 명령" items={row.verificationCommands} mono />
                  <DetailList title="열린 논의" items={row.openDiscussions} />
                </div>
                <section className="mt-5">
                  <h2 className="text-sm font-semibold text-foreground">영향 요건</h2>
                  {row.affectedRequirements.length > 0 ? (
                    <div className="mt-2 grid gap-2">
                      {row.affectedRequirements.map((req) => (
                        <Link
                          key={req.id}
                          className={cn(buttonVariants({ variant: "outline" }), "h-auto justify-between px-3 py-2")}
                          to={`/requirements/${req.id}`}
                        >
                          <span className="min-w-0 break-words text-left">
                            <span className="font-mono">{req.id}</span>
                            <span className="mx-1 text-muted-foreground">·</span>
                            {req.title}
                          </span>
                          <StatusBadge label={req.traceState} tone={toneForTraceState(req.traceState)} />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState className="mt-2 p-3">영향 요건이 없다.</EmptyState>
                  )}
                </section>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
      <RequirementPickerDialog
        open={affectedRequirementDialogOpen}
        onOpenChange={setAffectedRequirementDialogOpen}
        requirements={affectedRequirements}
        selectedRequirement={selectedAffectedRequirement}
        onSelect={(requirement) => setAffectedRequirementFilter(requirement.id)}
        onClear={() => setAffectedRequirementFilter(ALL_REQUIREMENTS)}
        title="영향 요건 검색/선택"
        description="Change Set 목록을 필터링할 영향 요건을 ID, 제목, 상태, 제품 영역으로 검색해 선택한다."
        searchAriaLabel="Change Set 영향 요건 검색"
        currentSelectionLabel="현재 필터"
        clearLabel="필터 해제"
        emptyMessage="조건에 맞는 영향 요건이 없다."
        closeLabel="영향 요건 선택 대화상자 닫기"
      />
    </section>
  );
}

export function ChangeSetViewPage({ scope }: { scope: HarnessScope }) {
  const query = useQuery({
    queryKey: ["harness-data", scope, "change-sets"],
    queryFn: () => loadChangeSets(scope),
  });

  if (query.isLoading) return <LoadingState label="Change Set을 불러오는 중" />;
  if (query.isError || !query.data) return <ErrorState message={query.error instanceof Error ? query.error.message : "Change Set 산출물을 읽지 못했다."} />;

  return <ChangeSetView rows={query.data} />;
}
