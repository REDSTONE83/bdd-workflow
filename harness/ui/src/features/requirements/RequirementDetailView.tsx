import type { RequirementDetail } from "../../lib/harness-data/types";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/button";
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
import { requirementListPath } from "./requirement-navigation";

export function RequirementDetailView({ detail }: { detail: RequirementDetail }) {
  const sourceLinks = sourceLinksForRequirement(detail);
  const location = useLocation();
  const navigate = useNavigate();
  const requirementListHref = requirementListPath(location.search);

  return (
    <section className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit px-1 text-sky-800 hover:bg-transparent hover:text-sky-900 hover:underline"
        onClick={() => navigate(requirementListHref)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        요건 목록
      </Button>
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
          <TabsTrigger value="scenarios">수용 시나리오</TabsTrigger>
          <TabsTrigger value="ui">UI 설계</TabsTrigger>
          <TabsTrigger value="api">API 설계</TabsTrigger>
          <TabsTrigger value="entities">DB 설계</TabsTrigger>
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
