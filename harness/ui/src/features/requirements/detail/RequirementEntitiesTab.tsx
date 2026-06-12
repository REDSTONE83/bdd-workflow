import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Card } from "../../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible";
import { EmptyState } from "../../../components/ui/empty-state";
import { LocationLink } from "../../../components/ui/location-link";
import { ContractShapeFields } from "./ContractShapeFields";
import { SectionHeader } from "./SectionHeader";
import { shapeTone } from "./detail-utils";

export function RequirementEntitiesTab({ detail }: { detail: RequirementDetail }) {
  const entityShapes = detail.dataShapes.filter((shape) => shape.kind === "Entity");

  return (
    <>
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
                  <LocationLink className="mt-2" file={shape.file} line={shape.line} />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge label={shape.status} tone={shapeTone(shape)} />
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
        {entityShapes.length === 0 ? <EmptyState>연결된 Entity가 없다.</EmptyState> : null}
      </div>
    </>
  );
}
