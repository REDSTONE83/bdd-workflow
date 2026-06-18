import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { LocationLink } from "../../../components/ui/location-link";
import { SectionHeader } from "./SectionHeader";
import { linkTargetProps, uiSurfaceLabel } from "./detail-utils";

export function RequirementUiTab({ detail }: { detail: RequirementDetail }) {
  return (
    <>
      <SectionHeader title="UI 검토 링크" />
      <div className="grid gap-3" role="list" aria-label="연결된 UI 표면">
        {detail.uiSurfaces.map((surface) => {
          return (
            <Card key={`${surface.kind}-${surface.name}-${surface.storybookStory ?? surface.route ?? ""}`} className="p-4" role="listitem">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={surface.kind} />
                    <div className="break-words text-sm font-semibold text-foreground">{surface.name}</div>
                  </div>
                  <div className="mt-2 break-all text-sm text-muted-foreground">{uiSurfaceLabel(surface)}</div>
                  {surface.description ? <div className="mt-2 break-words text-sm text-foreground">{surface.description}</div> : null}
                  <LocationLink className="mt-2" file={surface.file} line={surface.line} />
                </div>
                {surface.storybookUrl ? (
                  <Button asChild size="sm" className="shrink-0">
                    <a href={surface.storybookUrl} {...linkTargetProps(surface.storybookUrl)}>
                      Storybook 검토
                    </a>
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
        {detail.uiSurfaces.length === 0 ? <EmptyState>연결된 UI 표면이 없다.</EmptyState> : null}
      </div>
    </>
  );
}
