/**
 * @Requirement REQ-036
 * @Page TerminologyBrowserPage
 * @Route /terminology
 */
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { terminologyBrowser } from "../../lib/harness-data/fixtures";
import { filterTerminologyTerms, terminologyDomains } from "../../lib/harness-data/terminology";
import type { TermStatus, TerminologyBrowserModel, TerminologyTerm } from "../../lib/harness-data/types";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { MetricCard } from "../../components/ui/metric-card";
import { Select } from "../../components/ui/select";

const statusOptions = [
  { value: "ALL", label: "전체" },
  { value: "approved", label: "approved" },
  { value: "draft", label: "draft" },
];

function statusVariant(status: TermStatus) {
  return status === "approved" ? "success" as const : "warning" as const;
}

function TermTokenList({ label, values, empty = "없음" }: { label: string; values: string[]; empty?: string }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <Badge key={value} variant="outline" className="max-w-full justify-start break-all text-left font-mono">
              {value}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">{empty}</span>
        )}
      </div>
    </section>
  );
}

function CodeNameList({ names }: { names: TerminologyTerm["names"] }) {
  const entries = Object.entries(names).filter(([, values]) => values.length > 0);

  if (entries.length === 0) {
    return <div className="text-sm text-muted-foreground">없음</div>;
  }

  return (
    <div className="grid gap-2">
      {entries.map(([category, values]) => (
        <div key={category} className="grid grid-cols-[92px_1fr] gap-3 text-sm">
          <div className="font-mono text-muted-foreground">{category}</div>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <Badge key={`${category}:${value}`} variant="outline" className="font-mono">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TermDetail({ term }: { term: TerminologyTerm | undefined }) {
  if (!term) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">선택한 표준 용어가 없다.</div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-xl font-semibold text-foreground">{term.ko}</h2>
            <span className="text-lg text-muted-foreground">/ {term.en}</span>
            <Badge variant={statusVariant(term.status)}>{term.status}</Badge>
          </div>
          <div className="mt-2 break-all font-mono text-sm text-muted-foreground">{term.key}</div>
        </div>
      </div>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">의미</h3>
        <p className="mt-2 text-sm leading-6 text-foreground">{term.meaning}</p>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-5">
        <TermTokenList label="허용 표현" values={term.allow} />
        <TermTokenList label="금지 표현" values={term.ban} />
      </div>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">코드 이름</h3>
        <div className="mt-2">
          <CodeNameList names={term.names} />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-5 text-sm">
        <section>
          <h3 className="font-semibold text-foreground">note</h3>
          <p className="mt-2 leading-6 text-muted-foreground">{term.note ?? "없음"}</p>
        </section>
        <section>
          <h3 className="font-semibold text-foreground">reason</h3>
          <p className="mt-2 leading-6 text-muted-foreground">{term.reason ?? "없음"}</p>
        </section>
      </div>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">source file</h3>
        <div className="mt-2 break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground">
          {term.sourceFile}
        </div>
      </section>
    </Card>
  );
}

export function TerminologyBrowser({
  model,
  initialQuery = "",
  initialDomain = "ALL",
  initialStatus = "ALL",
  initialSelectedKey,
}: {
  model: TerminologyBrowserModel;
  initialQuery?: string;
  initialDomain?: string;
  initialStatus?: "ALL" | TermStatus;
  initialSelectedKey?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [domain, setDomain] = useState(initialDomain);
  const [status, setStatus] = useState<"ALL" | TermStatus>(initialStatus);
  const [selectedKey, setSelectedKey] = useState(initialSelectedKey ?? model.terms[0]?.key);

  const domains = useMemo(() => terminologyDomains(model.terms), [model.terms]);
  const filteredTerms = useMemo(
    () => filterTerminologyTerms(model.terms, { query, domain, status }),
    [domain, model.terms, query, status],
  );
  const selectedTerm = filteredTerms.find((term) => term.key === selectedKey) ?? filteredTerms[0];
  const approvedCount = model.terms.filter((term) => term.status === "approved").length;
  const draftCount = model.terms.filter((term) => term.status === "draft").length;

  const domainOptions = [
    { value: "ALL", label: "전체" },
    ...domains.map((value) => ({ value, label: value })),
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="전체" value={model.terms.length} />
        <MetricCard label="approved" value={approvedCount} />
        <MetricCard label="draft" value={draftCount} />
        <MetricCard label="범위" value={model.scope} />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-[minmax(320px,1fr)_auto_auto] items-end gap-3">
          <label className="grid gap-2 text-sm text-foreground">
            <span>검색</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="term key, 이름, 의미, 표현, 코드 이름"
                aria-label="표준 용어 검색"
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm text-foreground">
            <span>도메인</span>
            <Select value={domain} onValueChange={setDomain} options={domainOptions} aria-label="도메인 필터" />
          </label>
          <label className="grid gap-2 text-sm text-foreground">
            <span>승인 상태</span>
            <Select value={status} onValueChange={(value) => setStatus(value as "ALL" | TermStatus)} options={statusOptions} aria-label="승인 상태 필터" />
          </label>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          generatedAt: {model.generatedAt ?? "산출물 없음"} · 결과 {filteredTerms.length}개
        </div>
      </Card>

      <div className="grid grid-cols-[480px_1fr] gap-4">
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-muted/70 px-4 py-3 text-sm font-semibold text-foreground">
            표준 용어 목록
          </div>
          <div className="max-h-[620px] overflow-auto">
            {filteredTerms.map((term) => {
              const selected = selectedTerm?.key === term.key;
              return (
                <Button
                  key={term.key}
                  className="h-auto w-full justify-start rounded-none border-b border-border px-4 py-4 text-left"
                  variant={selected ? "secondary" : "ghost"}
                  onClick={() => setSelectedKey(term.key)}
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-words font-semibold text-foreground">{term.ko}</span>
                      <span className="text-muted-foreground">/ {term.en}</span>
                      <Badge variant={statusVariant(term.status)}>{term.status}</Badge>
                    </div>
                    <div className="break-all font-mono text-sm text-foreground">{term.key}</div>
                    <p className="line-clamp-2 whitespace-normal text-sm leading-5 text-muted-foreground">{term.meaning}</p>
                    <div className="break-all font-mono text-xs text-muted-foreground">{term.sourceFile}</div>
                  </div>
                </Button>
              );
            })}
            {filteredTerms.length === 0 ? (
              <EmptyState className="m-4 p-6">조건에 맞는 표준 용어가 없다.</EmptyState>
            ) : null}
          </div>
        </Card>
        <TermDetail term={selectedTerm} />
      </div>
    </section>
  );
}

export function TerminologyBrowserPage() {
  return <TerminologyBrowser model={terminologyBrowser} />;
}
