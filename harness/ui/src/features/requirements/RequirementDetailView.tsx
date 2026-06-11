import type { RequirementDetail } from "../../lib/harness-data/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Card } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { RequirementAcceptanceTab } from "./detail/RequirementAcceptanceTab";
import { RequirementApiContractsTab } from "./detail/RequirementApiContractsTab";
import { RequirementArtifactsSourcesTab } from "./detail/RequirementArtifactsSourcesTab";
import { RequirementEntitiesTab } from "./detail/RequirementEntitiesTab";
import { RequirementOverviewTab } from "./detail/RequirementOverviewTab";
import { RequirementScenariosTab } from "./detail/RequirementScenariosTab";
import { RequirementUiTab } from "./detail/RequirementUiTab";
import { sourceLinksForRequirement } from "./detail/detail-utils";

export function RequirementDetailView({ detail }: { detail: RequirementDetail }) {
  const sourceLinks = sourceLinksForRequirement(detail);

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
          <RequirementOverviewTab detail={detail} sourceLinks={sourceLinks} />
        </TabsContent>

        <TabsContent value="acceptance" className="space-y-4">
          <RequirementAcceptanceTab detail={detail} />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <RequirementScenariosTab detail={detail} />
        </TabsContent>

        <TabsContent value="ui" className="space-y-4">
          <RequirementUiTab detail={detail} />
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <RequirementApiContractsTab detail={detail} />
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <RequirementEntitiesTab detail={detail} />
        </TabsContent>

        <TabsContent value="artifacts" className="space-y-4">
          <RequirementArtifactsSourcesTab detail={detail} sourceLinks={sourceLinks} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
