import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { SectionHeader } from "./SectionHeader";
import { editorHref, linkTargetProps, uiSurfaceLabel } from "./detail-utils";

export function RequirementUiTab({ detail }: { detail: RequirementDetail }) {
  return (
    <>
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
    </>
  );
}
