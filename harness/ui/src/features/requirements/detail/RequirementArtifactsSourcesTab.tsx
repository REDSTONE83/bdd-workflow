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
  );
}
