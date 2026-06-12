import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { LocationLink } from "../../../components/ui/location-link";
import { ContractShapeDetails } from "./ContractShapeFields";
import { SectionHeader } from "./SectionHeader";

export function RequirementApiContractsTab({ detail }: { detail: RequirementDetail }) {
  return (
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
                  <LocationLink className="mt-2" file={api.file} line={api.line} />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge label={api.status} tone="warning" />
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <ContractShapeDetails label="Request" names={api.requests} shapes={detail.dataShapes} />
                <ContractShapeDetails label="Response" names={api.responses} shapes={detail.dataShapes} />
              </div>
            </Card>
          ))}
        </div>
        {detail.apiSurfaces.length === 0 ? <EmptyState>연결된 API 작업이 없다.</EmptyState> : null}
      </section>
    </div>
  );
}
