import type { LinkedArtifact } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Card } from "../../../components/ui/card";
import { LocationLink } from "../../../components/ui/location-link";
import { artifactKindMeta } from "./detail-utils";

export function ArtifactLinkCard({ item }: { item: LinkedArtifact }) {
  const meta = artifactKindMeta(item.kind);
  const title = meta.name || item.kind;
  const locationLabel = `${item.file}:${item.line}`;

  return (
    <Card className="p-4" role="listitem">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={meta.label} tone={meta.tone} />
          {item.status ? <StatusBadge label={item.status} /> : null}
          <div className="break-words text-sm font-semibold text-foreground">{title}</div>
        </div>
        <LocationLink className="mt-2" file={item.file} line={item.line} label={locationLabel} />
      </div>
    </Card>
  );
}
