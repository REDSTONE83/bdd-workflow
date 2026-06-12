/**
 * @Requirement REQ-037
 */
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { RequirementRow, TraceState } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Dialog, DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogPortal, DialogTitle } from "../../components/ui/dialog";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { cn } from "../../lib/utils";
import { RequirementHierarchySummary } from "./RequirementHierarchySummary";

function toneForState(state: TraceState) {
  if (state === "RED") return "red" as const;
  if (state === "GREEN") return "green" as const;
  if (state === "BLUE") return "blue" as const;
  return "inactive" as const;
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

export type RequirementPickerSearchResult = {
  requirement: RequirementRow;
  inclusion: "direct" | "parent";
};

export const REQUIREMENT_PICKER_DIALOG_VIEWPORT_HEIGHT_CLASS = "h-[min(760px,calc(100vh-32px))] max-h-none sm:h-[min(760px,calc(100vh-64px))]";

function matchesSearch(value: string, normalizedQuery: string) {
  return normalize(value).includes(normalizedQuery);
}

function directlyMatchesRequirement(row: RequirementRow, normalizedQuery: string) {
  return [
    row.id,
    row.title,
    row.traceState,
    row.cardStatus,
    row.productArea,
    row.priority,
    row.specRole,
  ].some((value) => matchesSearch(value, normalizedQuery));
}

export function filterRequirementPickerResults(rows: RequirementRow[], query: string): RequirementPickerSearchResult[] {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return rows.map((requirement) => ({ requirement, inclusion: "direct" }));

  const directlyMatchedParentChildIds = new Set(
    rows
      .filter((row) => directlyMatchesRequirement(row, normalizedQuery))
      .flatMap((row) => row.childRequirementIds),
  );

  return rows.flatMap<RequirementPickerSearchResult>((row) => {
    if (directlyMatchesRequirement(row, normalizedQuery)) {
      return [{ requirement: row, inclusion: "direct" as const }];
    }

    const includedByParentSearch = directlyMatchedParentChildIds.has(row.id)
      || row.parentRequirementIds.some((parentRequirementId) => matchesSearch(parentRequirementId, normalizedQuery));

    if (includedByParentSearch) {
      return [{ requirement: row, inclusion: "parent" as const }];
    }

    return [];
  });
}

export function RequirementPickerDialog({
  open,
  onOpenChange,
  requirements,
  selectedRequirement,
  onSelect,
  onClear,
  title = "요건 검색/선택",
  description = "단일 요건 추적 명령에 전달할 요건을 ID, 제목, 상태, 제품 영역, 상위/하위 관계로 검색해 선택한다.",
  searchLabel = "검색",
  searchAriaLabel = "실행 대상 요건 검색",
  searchPlaceholder = "REQ-031, 요건 제목, RED, harness, 상위 요건",
  clearLabel = "선택 해제",
  emptyMessage = "조건에 맞는 요건이 없다.",
  closeLabel = "요건 선택 대화상자 닫기",
  initialQuery = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirements: RequirementRow[];
  selectedRequirement: RequirementRow | undefined;
  onSelect: (requirement: RequirementRow) => void;
  onClear: () => void;
  title?: string;
  description?: string;
  searchLabel?: string;
  searchAriaLabel?: string;
  searchPlaceholder?: string;
  currentSelectionLabel?: string;
  clearLabel?: string;
  emptyMessage?: string;
  closeLabel?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const searchResults = useMemo(() => filterRequirementPickerResults(requirements, query), [query, requirements]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={cn("flex flex-col", REQUIREMENT_PICKER_DIALOG_VIEWPORT_HEIGHT_CLASS)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">{description}</DialogDescription>
            </div>
            <DialogClose aria-label={closeLabel} />
          </div>

          <div className="grid gap-2 text-sm text-foreground">
            <span>{searchLabel}</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                className={cn("pl-9", selectedRequirement && "pr-10")}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder={searchPlaceholder}
                aria-label={searchAriaLabel}
              />
              {selectedRequirement ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                      variant="ghost"
                      size="icon"
                      aria-label={clearLabel}
                      onClick={() => {
                        onClear();
                        onOpenChange(false);
                      }}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{clearLabel}</TooltipContent>
                </Tooltip>
              ) : null}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1" aria-label="요건 후보 목록">
            <div className="grid gap-1.5">
              {searchResults.map(({ requirement, inclusion }) => {
                const selected = selectedRequirement?.id === requirement.id;
                const childRequirement = requirement.parentRequirementIds.length > 0;
                return (
                  <div key={requirement.id} className={cn(childRequirement && "ml-6 border-l-2 border-sky-200 pl-3")}>
                    <Button
                      className={cn(
                        "h-auto w-full justify-start rounded-md border border-border bg-background px-3 py-2 text-left shadow-sm",
                        selected && "border-sky-300 bg-sky-50/70",
                        childRequirement && "bg-sky-50/20",
                      )}
                      variant="ghost"
                      onClick={() => {
                        onSelect(requirement);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="shrink-0 font-mono font-semibold text-foreground">{requirement.id}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={requirement.title}>
                          {requirement.title}
                        </span>
                        <RequirementHierarchySummary className="shrink-0 flex-nowrap" requirement={requirement} />
                        {inclusion === "parent" ? <Badge className="shrink-0" size="sm" variant="warning">상위 검색 포함</Badge> : null}
                      </div>
                      <div className="ml-auto shrink-0">
                        <StatusBadge label={requirement.traceState} size="sm" tone={toneForState(requirement.traceState)} />
                      </div>
                    </Button>
                  </div>
                );
              })}
            </div>
            {searchResults.length === 0 ? (
              <EmptyState className="p-6">{emptyMessage}</EmptyState>
            ) : null}
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
