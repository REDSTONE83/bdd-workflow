/**
 * @Requirement REQ-038
 * @Page SurfaceInventoryPage
 * @Route /surfaces
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { loadSurfaceInventory } from "../../lib/harness-data/client";
import type {
  HarnessScope,
  SurfaceApiItem,
  SurfaceEntityItem,
  SurfaceInventoryModel,
  SurfaceRequirementRef,
  SurfaceUiItem,
} from "../../lib/harness-data/types";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { EmptyState } from "../../components/ui/empty-state";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/input";
import { LoadingState } from "../../components/ui/LoadingState";
import { LocationLink } from "../../components/ui/location-link";
import { MetricCard } from "../../components/ui/metric-card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ContractShapeDetails } from "../requirements/detail/ContractShapeFields";

type SurfaceTab = "api" | "entity" | "ui";

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}

function requirementSearchText(requirements: SurfaceRequirementRef[]) {
  return requirements.map((requirement) => `${requirement.id} ${requirement.title} ${requirement.traceState}`).join(" ");
}

function matchesQuery(values: string[], query: string) {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return true;
  return values.some((value) => normalize(value).includes(normalizedQuery));
}

export function filterApiSurfaces(items: SurfaceApiItem[], query: string) {
  return items.filter((item) =>
    matchesQuery([
      item.method,
      item.path,
      item.operationId,
      item.summary,
      item.file,
      requirementSearchText(item.requirements),
      ...item.requests,
      ...item.responseBodies,
      ...item.responses.flatMap((response) => [response.code, response.description]),
    ], query)
  );
}

export function filterEntitySurfaces(items: SurfaceEntityItem[], query: string) {
  return items.filter((item) =>
    matchesQuery([
      item.className,
      item.table,
      item.file,
      requirementSearchText(item.requirements),
      ...item.listeners,
      ...item.columns.flatMap((column) => [column.columnName, column.fieldName, column.javaType, ...column.requirements]),
    ], query)
  );
}

export function filterUiSurfaces(items: SurfaceUiItem[], query: string) {
  return items.filter((item) =>
    matchesQuery([
      item.kind,
      item.name,
      item.route ?? "",
      item.storybookTitle ?? "",
      item.storybookStory ?? "",
      item.file,
      requirementSearchText(item.requirements),
    ], query)
  );
}

function RequirementsBadges({ requirements }: { requirements: SurfaceRequirementRef[] }) {
  if (requirements.length === 0) {
    return <span className="text-sm text-muted-foreground">연결 요건 없음</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {requirements.map((requirement) => (
        <Badge key={requirement.id} variant="outline" size="sm" className="max-w-full justify-start gap-1">
          <span className="font-mono">{requirement.id}</span>
          <span className="max-w-48 truncate">{requirement.title}</span>
        </Badge>
      ))}
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

function ApiCard({ item, shapes }: { item: SurfaceApiItem; shapes: SurfaceInventoryModel["dataShapes"] }) {
  return (
    <Card className="p-4" role="listitem">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={item.method} tone="blue" />
          <div className="break-all font-mono text-sm font-semibold text-foreground">{item.path}</div>
        </div>
        <div className="mt-2 break-words text-sm text-muted-foreground">operationId: {item.operationId}</div>
        {item.summary ? <div className="mt-2 break-words text-sm text-foreground">{item.summary}</div> : null}
        <LocationLink className="mt-2" file={item.file} line={item.line} />
      </div>
      <div className="mt-4 grid gap-2">
        <ContractShapeDetails label="Request" names={item.requests} shapes={shapes} />
        <ContractShapeDetails label="Response" names={item.responseBodies} shapes={shapes} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <DetailField label="연결 요건"><RequirementsBadges requirements={item.requirements} /></DetailField>
        <DetailField label="응답 코드">
          <div className="grid gap-2">
            {item.responses.length > 0 ? item.responses.map((response) => (
              <div key={`${response.code}-${response.line}`} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2 rounded-md border border-border px-3 py-2">
                <span className="font-mono font-semibold text-foreground">{response.code}</span>
                <span className="break-words text-muted-foreground">{response.description}</span>
              </div>
            )) : <span className="text-sm text-muted-foreground">없음</span>}
          </div>
        </DetailField>
      </dl>
    </Card>
  );
}

function booleanLabel(value: boolean | null) {
  if (value === true) return "예";
  if (value === false) return "아니오";
  return "-";
}

function EntityCard({ item }: { item: SurfaceEntityItem }) {
  return (
    <Card className="p-4" role="listitem">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="break-all font-mono text-sm font-semibold text-foreground">{item.table}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>JPA Entity</span>
            <span className="break-words font-medium text-foreground">{item.className}</span>
            {item.listeners.length > 0 ? (
              <>
                <span aria-hidden="true">/</span>
                <span className="break-words">listener {item.listeners.join(", ")}</span>
              </>
            ) : null}
          </div>
          <LocationLink className="mt-2" file={item.file} line={item.line} />
        </div>
        <StatusBadge label={`${item.requirements.length} REQ`} tone={item.requirements.length > 0 ? "blue" : "neutral"} />
      </div>
      <div className="mt-3">
        <DetailField label="연결 요건"><RequirementsBadges requirements={item.requirements} /></DetailField>
      </div>
      <Collapsible className="mt-3 text-sm">
        <CollapsibleTrigger>
          컬럼 목록
          <span className="ml-2 font-normal text-muted-foreground">{item.columns.length}개</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-0">
          <div className="divide-y divide-border">
            {item.columns.map((column) => (
              <div key={`${item.id}-${column.fieldName}`} className="grid gap-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="break-all font-mono font-medium text-foreground">{column.columnName}</div>
                  <span className="break-words font-mono text-xs text-muted-foreground">{column.fieldName}</span>
                  {column.primaryKey ? <StatusBadge label="PK" tone="warning" size="sm" /> : null}
                </div>
                <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">Java 타입</dt>
                  <dd className="break-all font-mono text-foreground">{column.javaType}</dd>
                  <dt className="text-muted-foreground">nullable</dt>
                  <dd className="text-foreground">{booleanLabel(column.nullable)}</dd>
                  <dt className="text-muted-foreground">unique</dt>
                  <dd className="text-foreground">{booleanLabel(column.unique)}</dd>
                  <dt className="text-muted-foreground">updatable</dt>
                  <dd className="text-foreground">{booleanLabel(column.updatable)}</dd>
                  <dt className="text-muted-foreground">length</dt>
                  <dd className="text-foreground">{column.length ?? "-"}</dd>
                  <dt className="text-muted-foreground">연결 요건</dt>
                  <dd className="break-words font-mono text-foreground">{column.requirements.join(", ") || "-"}</dd>
                </dl>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function uiSubLabel(item: SurfaceUiItem) {
  if (item.storybookTitle && item.storybookStory) return `${item.storybookTitle} / ${item.storybookStory}`;
  return item.route ?? item.name;
}

function UiCard({ item }: { item: SurfaceUiItem }) {
  return (
    <Card className="p-4" role="listitem">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={item.kind} tone={item.kind === "Story" ? "warning" : "blue"} />
            <div className="break-words text-sm font-semibold text-foreground">{item.name}</div>
          </div>
          <div className="mt-2 break-all text-sm text-muted-foreground">{uiSubLabel(item)}</div>
          <LocationLink className="mt-2" file={item.file} line={item.line} />
        </div>
        {item.storybookUrl ? (
          <Button asChild size="sm" className="shrink-0">
            <a href={item.storybookUrl} target="_blank" rel="noreferrer">Storybook 검토</a>
          </Button>
        ) : null}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <DetailField label="연결 요건"><RequirementsBadges requirements={item.requirements} /></DetailField>
        <DetailField label="play">{item.hasPlay === undefined ? "해당 없음" : item.hasPlay ? "있음" : "없음"}</DetailField>
        <DetailField label="assertion">{item.hasAssertion === undefined ? "해당 없음" : item.hasAssertion ? "있음" : "없음"}</DetailField>
        {item.route ? <DetailField label="route">{item.route}</DetailField> : null}
        {item.storybookTitle ? <DetailField label="Storybook title">{item.storybookTitle}</DetailField> : null}
        {item.storybookStory ? <DetailField label="Storybook story">{item.storybookStory}</DetailField> : null}
      </dl>
    </Card>
  );
}

function SurfaceCardList({ label, empty, children }: { label: string; empty: string; children: ReactNode[] }) {
  return (
    <div className="grid gap-3" role="list" aria-label={label}>
      {children}
      {children.length === 0 ? <EmptyState className="p-6">{empty}</EmptyState> : null}
    </div>
  );
}

export function SurfaceInventory({
  model,
  initialTab = "api",
  initialQuery = "",
}: {
  model: SurfaceInventoryModel;
  initialTab?: SurfaceTab;
  initialQuery?: string;
}) {
  const [activeTab, setActiveTab] = useState<SurfaceTab>(initialTab);
  const [query, setQuery] = useState(initialQuery);

  const filteredApis = useMemo(() => filterApiSurfaces(model.apis, query), [model.apis, query]);
  const filteredEntities = useMemo(() => filterEntitySurfaces(model.entities, query), [model.entities, query]);
  const filteredUiSurfaces = useMemo(() => filterUiSurfaces(model.uiSurfaces, query), [model.uiSurfaces, query]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="API" value={model.apis.length} />
        <MetricCard label="Entity" value={model.entities.length} />
        <MetricCard label="UI 표면" value={model.uiSurfaces.length} />
        <MetricCard label="범위" value={model.scope} />
      </div>

      <Card className="p-4">
        <label className="grid gap-2 text-sm text-foreground">
          <span>검색</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="이름, 경로, 파일, 연결 요건"
              aria-label="표면 검색"
            />
          </span>
        </label>
        <div className="mt-3 text-sm text-muted-foreground">
          generatedAt: {model.generatedAt ?? "산출물 없음"} · 현재 탭 {activeTab === "api" ? filteredApis.length : activeTab === "entity" ? filteredEntities.length : filteredUiSurfaces.length}개
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SurfaceTab)}>
        <TabsList aria-label="표면 조회 탭" className="flex w-full justify-start overflow-x-auto">
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="entity">Entity</TabsTrigger>
          <TabsTrigger value="ui">UI</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <SurfaceCardList label="API 목록" empty="조건에 맞는 API가 없다.">
            {filteredApis.map((item) => <ApiCard key={item.id} item={item} shapes={model.dataShapes} />)}
          </SurfaceCardList>
        </TabsContent>

        <TabsContent value="entity">
          <SurfaceCardList label="Entity 목록" empty="조건에 맞는 Entity가 없다.">
            {filteredEntities.map((item) => <EntityCard key={item.id} item={item} />)}
          </SurfaceCardList>
        </TabsContent>

        <TabsContent value="ui">
          <SurfaceCardList label="UI 표면 목록" empty="조건에 맞는 UI 표면이 없다.">
            {filteredUiSurfaces.map((item) => <UiCard key={item.id} item={item} />)}
          </SurfaceCardList>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export function SurfaceInventoryPage({ scope }: { scope: HarnessScope }) {
  const query = useQuery({
    queryKey: ["harness-data", scope, "surfaces"],
    queryFn: () => loadSurfaceInventory(scope),
  });

  if (query.isLoading) return <LoadingState label="표면 목록을 불러오는 중" />;
  if (query.isError || !query.data) return <ErrorState message={query.error instanceof Error ? query.error.message : "표면 조회 산출물을 읽지 못했다."} />;

  return <SurfaceInventory model={query.data} />;
}
