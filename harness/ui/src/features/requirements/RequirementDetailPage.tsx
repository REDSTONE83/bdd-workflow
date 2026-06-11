/**
 * @Requirement REQ-032
 * @Page RequirementDetailPage
 * @Route /requirements/:requirementId
 */
import { requirementDetail } from "../../lib/harness-data/fixtures";
import type {
  AcceptanceCoverageRow,
  LinkedArtifact,
  RequirementDataField,
  RequirementDetail,
  RequirementDataShape,
  RequirementScenario,
  RequirementUiSurface,
} from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { MetricCard } from "../../components/ui/metric-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

function editorHref(file: string, line: number) {
  return `vscode://file/${file}:${line}`;
}

function linkTargetProps(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {};
}

function shapeTone(shape: RequirementDataShape) {
  if (shape.kind === "Request") return "warning" as const;
  if (shape.kind === "Response") return "blue" as const;
  return "green" as const;
}

function uiSurfaceLabel(surface: RequirementUiSurface) {
  if (surface.storybookTitle && surface.storybookStory) {
    return `${surface.storybookTitle} / ${surface.storybookStory}`;
  }
  return surface.route ? `${surface.name} ${surface.route}` : surface.name;
}

function coverageTone(status: string) {
  if (status === "PASS") return "green" as const;
  if (status === "FAIL") return "red" as const;
  if (status === "MISSING") return "warning" as const;
  return "neutral" as const;
}

function uniqueTests(rows: AcceptanceCoverageRow[]) {
  return Array.from(new Set(rows.flatMap((row) => row.tests)));
}

function coverageRowsForScenario(detail: RequirementDetail, scenario: RequirementScenario) {
  return detail.coverage.filter((row) => scenario.covers.includes(row.criterion));
}

function artifactKindMeta(kind: string) {
  const [rawCategory, ...detailParts] = kind.split(":");
  const category = rawCategory.toLowerCase();
  const detail = detailParts.join(":");

  if (category === "card") return { label: "요건 카드", name: detail, tone: "blue" as const };
  if (category === "scenario") return { label: "시나리오", name: detail, tone: "green" as const };
  if (category === "api") return { label: "API", name: detail, tone: "neutral" as const };
  if (rawCategory === "Request") return { label: "Request", name: detail, tone: "warning" as const };
  if (rawCategory === "Response") return { label: "Response", name: detail, tone: "blue" as const };
  if (rawCategory === "Entity") return { label: "Entity", name: detail, tone: "green" as const };
  if (rawCategory === "Page") return { label: "UI Page", name: detail, tone: "blue" as const };
  if (rawCategory === "Route") return { label: "UI Route", name: detail, tone: "neutral" as const };
  if (rawCategory === "Story") return { label: "UI Story", name: detail, tone: "warning" as const };
  if (category === "story") return { label: "Story", name: detail, tone: "warning" as const };

  return { label: rawCategory, name: detail, tone: "neutral" as const };
}

function ArtifactLinkCard({ item, actionLabel }: { item: LinkedArtifact; actionLabel: string }) {
  const meta = artifactKindMeta(item.kind);
  const title = meta.name || item.kind;

  return (
    <Card className="p-4" role="listitem">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={meta.label} tone={meta.tone} />
            {item.status ? <StatusBadge label={item.status} /> : null}
            <div className="break-words text-sm font-semibold text-foreground">{title}</div>
          </div>
          <div className="mt-2 break-all font-mono text-xs text-muted-foreground">{item.file}:{item.line}</div>
        </div>
        <Button asChild className="shrink-0" size="sm" variant="outline">
          <a href={editorHref(item.file, item.line)}>{actionLabel}</a>
        </Button>
      </div>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

const MAX_CONTRACT_SHAPE_DEPTH = 3;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function referencedShapesForField(field: RequirementDataField, shapes: RequirementDataShape[]) {
  return shapes.filter((shape) => {
    const boundary = `(^|[^A-Za-z0-9_$])${escapeRegExp(shape.name)}($|[^A-Za-z0-9_$])`;
    return new RegExp(boundary).test(field.type);
  });
}

function ContractShapeFields({
  fields,
  shapes,
  depth = 0,
  ancestry = [],
}: {
  fields: RequirementDataField[];
  shapes: RequirementDataShape[];
  depth?: number;
  ancestry?: string[];
}) {
  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {fields.map((field) => {
        const references = referencedShapesForField(field, shapes);
        return (
          <div key={`${ancestry.join(".")}-${field.name}`} className="grid grid-cols-[1fr_1fr_4rem] gap-2 p-2">
            <div className="break-words font-medium text-foreground">{field.name}</div>
            <div className="break-words font-mono text-xs text-muted-foreground">{field.type}</div>
            <div className="text-xs text-muted-foreground">{field.required ? "필수" : "선택"}</div>
            {field.description ? <div className="col-span-3 break-words text-xs text-muted-foreground">{field.description}</div> : null}
            {references.length > 0 ? (
              <div className="col-span-3 space-y-2 pt-1">
                {references.map((reference) => {
                  const hasCycle = ancestry.includes(reference.name);
                  const isMaxDepth = depth >= MAX_CONTRACT_SHAPE_DEPTH;
                  return (
                    <Collapsible key={`${field.name}-${reference.name}`} className="bg-muted/20">
                      <CollapsibleTrigger className="text-xs">
                        참조 객체 펼치기
                        <span className="ml-2 font-mono font-normal text-muted-foreground">{reference.name}</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-foreground">{reference.name}</div>
                          <StatusBadge label={reference.status} tone={shapeTone(reference)} />
                        </div>
                        {hasCycle ? (
                          <div className="text-xs text-muted-foreground">순환 참조라 이 단계에서 멈춘다.</div>
                        ) : isMaxDepth ? (
                          <div className="text-xs text-muted-foreground">최대 표시 깊이에 도달해 하위 필드를 접는다.</div>
                        ) : (
                          <ContractShapeFields fields={reference.fields} shapes={shapes} depth={depth + 1} ancestry={[...ancestry, reference.name]} />
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ContractShapeDetails({ label, names, shapes }: { label: string; names: string[]; shapes: RequirementDataShape[] }) {
  const linkedShapes = names.map((name) => ({ name, shape: shapes.find((shape) => shape.name === name) }));

  return (
    <Collapsible className="text-sm">
      <CollapsibleTrigger>
        {label} 펼치기
        <span className="ml-2 font-normal text-muted-foreground">{names.length > 0 ? names.join(", ") : "없음"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {linkedShapes.length > 0 ? (
          <div className="space-y-3">
            {linkedShapes.map(({ name, shape }) => (
              <section key={`${label}-${name}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-foreground">{name}</div>
                  {shape ? <StatusBadge label={shape.status} tone={shapeTone(shape)} /> : <StatusBadge label="정보 없음" />}
                </div>
                {shape ? (
                  <div className="mt-2">
                    <ContractShapeFields fields={shape.fields} shapes={shapes} ancestry={[shape.name]} />
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">연결된 구성 정보가 아직 없다.</div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">연결된 {label}가 없다.</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RequirementDetailView({ detail }: { detail: RequirementDetail }) {
  const entityShapes = detail.dataShapes.filter((shape) => shape.kind === "Entity");
  const coverageByCriterion = new Map(detail.coverage.map((row) => [row.criterion, row]));
  const sourceLinks = [
    ...detail.apiSurfaces.map((api) => ({ kind: `api:${api.operationId}`, file: api.file, line: api.line })),
    ...detail.dataShapes.map((shape) => ({ kind: `${shape.kind}:${shape.name}`, file: shape.file, line: shape.line })),
    ...detail.uiSurfaces.map((surface) => ({ kind: `${surface.kind}:${surface.name}`, file: surface.file, line: surface.line })),
  ].filter(
    (item, index, items) =>
      items.findIndex((other) => `${other.kind}-${other.file}-${other.line}` === `${item.kind}-${item.file}-${item.line}`) === index,
  );

  return (
    <section className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-sm text-muted-foreground">{detail.id}</div>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">{detail.title}</h1>
          </div>
          <StatusBadge label={detail.traceState} tone={detail.traceState === "RED" ? "red" : "blue"} />
        </div>
        <dl className="mt-5 grid grid-cols-6 gap-3 text-sm">
          {[
            ["카드 상태", detail.cardStatus],
            ["우선순위", detail.priority],
            ["대상 시스템", detail.targetSystem],
            ["제품 영역", detail.productArea],
            ["검증 수준", detail.verificationLevel],
            ["추적 상태", detail.traceState],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Tabs defaultValue="overview">
        <TabsList aria-label="요건 상세 탭" className="flex w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="acceptance">AC</TabsTrigger>
          <TabsTrigger value="scenarios">시나리오</TabsTrigger>
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="api">API 계약</TabsTrigger>
          <TabsTrigger value="entities">Entity</TabsTrigger>
          <TabsTrigger value="artifacts">산출물 / 소스</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              ["AC", `${detail.acceptanceCriteria.length}건`],
              ["Scenario", `${detail.scenarios.length}건`],
              ["UI", `${detail.uiSurfaces.length}건`],
              ["API", `${detail.apiSurfaces.length}건`],
              ["Entity", `${entityShapes.length}건`],
              ["Test", `${detail.coverage.reduce((count, row) => count + row.tests.length, 0)}건`],
              ["Source", `${sourceLinks.length}건`],
              ["Trace", detail.traceState],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-4">
            <Card className="p-4">
              <h2 className="text-base font-semibold text-foreground">대표 AC</h2>
              {detail.acceptanceCriteria[0] ? (
                <div className="mt-3 text-sm">
                  <div className="font-mono text-xs text-muted-foreground">{detail.acceptanceCriteria[0].id}</div>
                  <div className="mt-2 break-words font-medium text-foreground">{detail.acceptanceCriteria[0].text}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusBadge label={detail.acceptanceCriteria[0].channel} />
                    <StatusBadge label={detail.acceptanceCriteria[0].status} tone={coverageTone(detail.acceptanceCriteria[0].status)} />
                  </div>
                </div>
              ) : <div className="mt-3 text-sm text-muted-foreground">수용 기준이 없다.</div>}
            </Card>
            <Card className="p-4">
              <h2 className="text-base font-semibold text-foreground">대표 API</h2>
              {detail.apiSurfaces[0] ? (
                <div className="mt-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={detail.apiSurfaces[0].method} />
                    <span className="break-all font-mono font-semibold text-foreground">{detail.apiSurfaces[0].path}</span>
                  </div>
                  <div className="mt-2 break-words text-muted-foreground">operationId: {detail.apiSurfaces[0].operationId}</div>
                  <div className="mt-3"><StatusBadge label={detail.apiSurfaces[0].status} tone="warning" /></div>
                </div>
              ) : <div className="mt-3 text-sm text-muted-foreground">연결된 API 작업이 없다.</div>}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="acceptance" className="space-y-4">
          <div>
            <section>
              <SectionHeader title="AC 목록" description="요건 카드의 수용 기준 원문, 커버리지 판정, 연결 테스트와 시나리오를 항목별 카드로 확인한다." />
              <div className="grid gap-3">
                {detail.acceptanceCriteria.map((criterion) => {
                  const coverage = coverageByCriterion.get(criterion.text);
                  const tests = coverage?.tests ?? [];
                  const scenarios = coverage?.scenarios ?? criterion.scenarios;
                  const status = coverage?.status ?? criterion.status;
                  const channel = coverage?.channel ?? criterion.channel;
                  return (
                    <Card key={criterion.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-muted-foreground">{criterion.id}</div>
                          <div className="mt-2 break-words text-sm font-medium text-foreground">{criterion.text}</div>
                        </div>
                        <StatusBadge label={status} tone={coverageTone(status)} />
                      </div>
                      <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">채널</dt>
                        <dd className="font-medium text-foreground">{channel}</dd>
                        <dt className="text-muted-foreground">연결 테스트</dt>
                        <dd className="break-words text-muted-foreground">
                          {tests.length > 0 ? (
                            <ul className="space-y-1">
                              {tests.map((test) => <li key={test} className="font-mono text-xs">{test}</li>)}
                            </ul>
                          ) : "없음"}
                        </dd>
                        <dt className="text-muted-foreground">시나리오</dt>
                        <dd className="break-words text-muted-foreground">{scenarios.length > 0 ? scenarios.join(", ") : "없음"}</dd>
                        <dt className="text-muted-foreground">위치</dt>
                        <dd className="break-all font-mono text-xs text-muted-foreground">{criterion.file}:{criterion.line}</dd>
                      </dl>
                    </Card>
                  );
                })}
              </div>
              {detail.acceptanceCriteria.length === 0 ? <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">수용 기준이 없다.</div> : null}
            </section>
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-4">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">RED 사유</h2>
                <StatusBadge label={`${detail.redReasons.length}건`} tone={detail.redReasons.length > 0 ? "red" : "neutral"} />
              </div>
              {detail.redReasons.map((finding) => (
                <Alert key={`${finding.ruleId}-${finding.message}`} variant="destructive" className="mt-3">
                  <AlertTitle>{finding.ruleId}</AlertTitle>
                  <AlertDescription className="mt-1 break-words">{finding.message}</AlertDescription>
                </Alert>
              ))}
              {detail.redReasons.length === 0 ? <div className="mt-3 text-sm text-muted-foreground">없음</div> : null}
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">BLUE 차단 사유</h2>
                <StatusBadge label={`${detail.blueBlockedBy.length}건`} tone={detail.blueBlockedBy.length > 0 ? "warning" : "neutral"} />
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {detail.blueBlockedBy.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
              {detail.blueBlockedBy.length === 0 ? <div className="mt-3 text-sm text-muted-foreground">없음</div> : null}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="ui" className="space-y-4">
          <SectionHeader title="UI 검토 링크" description="Storybook 링크와 구현 위치를 UI 표면별 목록형 카드로 확인한다." />
          <div className="grid gap-3" role="list" aria-label="연결된 UI 표면">
            {detail.uiSurfaces.map((surface) => {
              const reviewHref = surface.storybookUrl ?? editorHref(surface.file, surface.line);
              return (
                <Card key={`${surface.kind}-${surface.name}-${surface.storybookStory ?? surface.route ?? ""}`} className="p-4" role="listitem">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={surface.kind} />
                        <div className="break-words text-sm font-semibold text-foreground">{surface.name}</div>
                      </div>
                      <div className="mt-2 break-all text-sm text-muted-foreground">{uiSurfaceLabel(surface)}</div>
                      {surface.description ? <div className="mt-2 break-words text-sm text-foreground">{surface.description}</div> : null}
                      <div className="mt-2 break-words text-xs text-muted-foreground">{surface.file}:{surface.line}</div>
                    </div>
                    <StatusBadge label={surface.status} tone={surface.storybookUrl ? "green" : "neutral"} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant={surface.storybookUrl ? "default" : "outline"}>
                      <a href={reviewHref} {...linkTargetProps(reviewHref)}>
                        {surface.storybookUrl ? "Storybook 열기" : "파일 열기"}
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a href={editorHref(surface.file, surface.line)}>
                        구현 위치
                      </a>
                    </Button>
                  </div>
                </Card>
              );
            })}
            {detail.uiSurfaces.length === 0 ? <div className="text-sm text-muted-foreground">연결된 UI 표면이 없다.</div> : null}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div>
            <section>
              <SectionHeader title="API 계약" description="연결된 API 작업을 카드로 확인하고 Request/Response 구성을 펼쳐 본다." />
              <div className="grid gap-3" role="list" aria-label="연결된 API 계약">
                {detail.apiSurfaces.map((api) => (
                  <Card key={`${api.method}-${api.path}`} className="p-4" role="listitem">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={api.method} />
                          <div className="break-all font-mono text-sm font-semibold text-foreground">{api.path}</div>
                        </div>
                        <div className="mt-2 break-words text-sm text-muted-foreground">operationId: {api.operationId}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge label={api.status} tone="warning" />
                        <Button asChild size="sm" variant="outline">
                          <a href={editorHref(api.file, api.line)}>파일 열기</a>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <ContractShapeDetails label="Request" names={api.requests} shapes={detail.dataShapes} />
                      <ContractShapeDetails label="Response" names={api.responses} shapes={detail.dataShapes} />
                    </div>
                  </Card>
                ))}
              </div>
              {detail.apiSurfaces.length === 0 ? <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">연결된 API 작업이 없다.</div> : null}
            </section>
          </div>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <SectionHeader title="Entity" description="연결된 Entity 구성과 속성 목록을 목록형 카드로 확인한다." />
          <div className="grid gap-3" role="list" aria-label="연결된 Entity">
            {entityShapes.map((shape) => (
              <Card key={`${shape.kind}-${shape.name}`} className="p-4" role="listitem">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="break-words text-sm font-semibold text-foreground">{shape.name}</div>
                      <StatusBadge label={shape.kind} />
                    </div>
                    <div className="mt-2 break-words text-sm text-muted-foreground">{shape.file}:{shape.line}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge label={shape.status} tone={shapeTone(shape)} />
                    <Button asChild size="sm" variant="outline">
                      <a href={editorHref(shape.file, shape.line)}>구현 위치</a>
                    </Button>
                  </div>
                </div>
                <Collapsible className="mt-3 text-sm">
                  <CollapsibleTrigger>
                    속성 목록 펼치기
                    <span className="ml-2 font-normal text-muted-foreground">{shape.fields.length}개</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-0">
                    <ContractShapeFields fields={shape.fields} shapes={detail.dataShapes} ancestry={[shape.name]} />
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
            {entityShapes.length === 0 ? <div className="text-sm text-muted-foreground">연결된 Entity가 없다.</div> : null}
          </div>
        </TabsContent>

        <TabsContent value="artifacts" className="space-y-4">
          <div className="grid gap-6">
            <section>
              <SectionHeader title="연결 산출물" description="요건 카드와 연결된 문서·검토 산출물을 종류 뱃지와 함께 확인한다." />
              <div className="mt-3 grid gap-3" role="list" aria-label="연결 산출물">
                {[detail.sourceFile, ...detail.linkedArtifacts].map((artifact) => (
                  <ArtifactLinkCard key={`${artifact.kind}-${artifact.file}-${artifact.line}`} item={artifact} actionLabel="산출물 열기" />
                ))}
              </div>
            </section>
            <section>
              <SectionHeader title="소스코드 위치" description="API, Request, Response, Entity, UI 표면의 구현 위치를 종류 뱃지로 구분한다." />
              <div className="mt-3 grid gap-3" role="list" aria-label="소스코드 위치">
                {sourceLinks.map((source) => (
                  <ArtifactLinkCard key={`${source.kind}-${source.file}-${source.line}`} item={source} actionLabel="소스 열기" />
                ))}
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export function RequirementDetailPage() {
  return <RequirementDetailView detail={requirementDetail} />;
}
