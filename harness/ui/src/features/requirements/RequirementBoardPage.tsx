/**
 * @Requirement REQ-031
 * @Page RequirementBoardPage
 * @Route /requirements
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requirementRows, requirementSummary } from "../../lib/harness-data/fixtures";
import type { RequirementRow, RequirementSummary, TraceState } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { MetricCard } from "../../components/ui/metric-card";
import { Select } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

function toneForState(state: TraceState) {
  if (state === "RED") return "red" as const;
  if (state === "GREEN") return "green" as const;
  if (state === "BLUE") return "blue" as const;
  return "inactive" as const;
}

const traceStateOptions = [
  { value: "ALL", label: "전체" },
  { value: "RED", label: "RED" },
  { value: "GREEN", label: "GREEN" },
  { value: "BLUE", label: "BLUE" },
  { value: "INACTIVE", label: "INACTIVE" },
];

const cardStatusOptions = [
  { value: "ALL", label: "전체" },
  { value: "초안", label: "초안" },
  { value: "승인", label: "승인" },
];

const productAreaOptions = [
  { value: "ALL", label: "전체" },
  { value: "harness", label: "harness" },
];

export function RequirementBoard({ rows, summary }: { rows: RequirementRow[]; summary: RequirementSummary[] }) {
  const [traceState, setTraceState] = useState("ALL");
  const [cardStatus, setCardStatus] = useState("ALL");
  const [productArea, setProductArea] = useState("ALL");
  const navigate = useNavigate();

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        if (traceState !== "ALL" && row.traceState !== traceState) return false;
        if (cardStatus !== "ALL" && row.cardStatus !== cardStatus) return false;
        if (productArea !== "ALL" && row.productArea !== productArea) return false;
        return true;
      }),
    [cardStatus, productArea, rows, traceState],
  );

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {summary.map((item) => (
          <MetricCard key={item.state} label={item.state} value={item.count} />
        ))}
      </div>
      <Card className="flex items-center gap-3 p-4">
        <div className="flex items-center gap-2 text-sm">
          <span>추적 상태</span>
          <Select value={traceState} onValueChange={setTraceState} options={traceStateOptions} aria-label="추적 상태 필터" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>카드 상태</span>
          <Select value={cardStatus} onValueChange={setCardStatus} options={cardStatusOptions} aria-label="카드 상태 필터" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>제품 영역</span>
          <Select value={productArea} onValueChange={setProductArea} options={productAreaOptions} aria-label="제품 영역 필터" />
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table className="table-fixed">
          <TableHeader className="bg-muted/70">
            <TableRow>
              <TableHead className="w-28">요건 ID</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-32">추적 상태</TableHead>
              <TableHead className="w-32">카드 상태</TableHead>
              <TableHead className="w-32">제품 영역</TableHead>
              <TableHead className="w-28">우선순위</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-foreground">
                  <Button className="h-auto p-0 font-mono" variant="link" onClick={() => navigate(`/requirements/${row.id}`)}>
                    {row.id}
                  </Button>
                </TableCell>
                <TableCell className="break-words font-medium text-foreground">{row.title}</TableCell>
                <TableCell><StatusBadge label={row.traceState} tone={toneForState(row.traceState)} /></TableCell>
                <TableCell>{row.cardStatus}</TableCell>
                <TableCell>{row.productArea}</TableCell>
                <TableCell>{row.priority}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {visibleRows.length === 0 ? <div className="p-6 text-sm text-muted-foreground">조건에 맞는 요건이 없다.</div> : null}
      </Card>
    </section>
  );
}

export function RequirementBoardPage() {
  return <RequirementBoard rows={requirementRows} summary={requirementSummary} />;
}
