import type { LinkedArtifact, RequirementDetail } from "../../../lib/harness-data/types";
import { ArtifactLinkCard } from "./ArtifactLinkCard";
import { SectionHeader } from "./SectionHeader";

export function RequirementArtifactsSourcesTab({
  detail,
  sourceLinks,
}: {
  detail: RequirementDetail;
  sourceLinks: LinkedArtifact[];
}) {
  return (
    <div className="grid gap-6">
      <section>
        <SectionHeader title="연결 산출물" />
        <div className="mt-3 grid gap-3" role="list" aria-label="연결 산출물">
          {[detail.sourceFile, ...detail.linkedArtifacts].map((artifact) => (
            <ArtifactLinkCard key={`${artifact.kind}-${artifact.file}-${artifact.line}`} item={artifact} />
          ))}
        </div>
      </section>
      <section>
        <SectionHeader title="소스코드 위치" />
        <div className="mt-3 grid gap-3" role="list" aria-label="소스코드 위치">
          {sourceLinks.map((source) => (
            <ArtifactLinkCard key={`${source.kind}-${source.file}-${source.line}`} item={source} />
          ))}
        </div>
      </section>
    </div>
  );
}
