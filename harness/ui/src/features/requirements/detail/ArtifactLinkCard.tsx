import type { LinkedArtifact } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { artifactKindMeta, editorHref } from "./detail-utils";

export function ArtifactLinkCard({ item, actionLabel }: { item: LinkedArtifact; actionLabel: string }) {
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
