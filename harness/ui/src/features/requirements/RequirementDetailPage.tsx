/**
 * @Requirement REQ-032
 * @Page RequirementDetailPage
 * @Route /requirements/:requirementId
 */
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { loadRequirementDetail } from "../../lib/harness-data/client";
import type { HarnessScope } from "../../lib/harness-data/types";
import { RequirementDetailView } from "./RequirementDetailView";

export { RequirementDetailView } from "./RequirementDetailView";

export function RequirementDetailPage({ scope = "harness" }: { scope?: HarnessScope }) {
  const { requirementId } = useParams();
  const query = useQuery({
    queryKey: ["harness-data", scope, "requirement", requirementId],
    queryFn: () => loadRequirementDetail(scope, requirementId ?? ""),
    enabled: Boolean(requirementId),
  });

  if (!requirementId) return <ErrorState message="요건 ID가 필요하다." />;
  if (query.isLoading) return <LoadingState label="요건 상세를 불러오는 중" />;
  if (query.isError || !query.data) return <ErrorState message={query.error instanceof Error ? query.error.message : "요건 상세 산출물을 읽지 못했다."} />;

  return <RequirementDetailView detail={query.data} />;
}
