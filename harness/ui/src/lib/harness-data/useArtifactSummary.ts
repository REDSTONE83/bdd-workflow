import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ArtifactSummary, HarnessScope } from "./types";

async function fetchArtifactSummary(scope: HarnessScope): Promise<ArtifactSummary> {
  const response = await fetch(`/api/artifact-summary?scope=${scope}`);
  if (!response.ok) {
    throw new Error(`산출물 요약을 불러오지 못했다: ${response.status}`);
  }
  return (await response.json()) as ArtifactSummary;
}

/**
 * 선택한 scope의 산출물 요약을 서버에서 받아오고, `/api/events` SSE 채널을 구독해
 * 산출물 파일이 바뀌면 새로 고침 없이 모델을 다시 받아온다.
 */
export function useArtifactSummary(scope: HarnessScope) {
  const queryClient = useQueryClient();
  const [liveUpdated, setLiveUpdated] = useState(false);

  const query = useQuery({
    queryKey: ["artifact-summary", scope],
    queryFn: () => fetchArtifactSummary(scope),
  });

  useEffect(() => {
    setLiveUpdated(false);
    if (typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource(`/api/events?scope=${scope}`);
    let initialReceived = false;
    const handler = () => {
      // 연결 직후 보내는 초기 스냅샷은 useQuery가 이미 갖고 있으므로 무시한다.
      if (!initialReceived) {
        initialReceived = true;
        return;
      }
      setLiveUpdated(true);
      void queryClient.invalidateQueries({ queryKey: ["artifact-summary", scope] });
    };
    source.addEventListener("artifacts-changed", handler);

    return () => {
      source.removeEventListener("artifacts-changed", handler);
      source.close();
    };
  }, [scope, queryClient]);

  const model: ArtifactSummary | null = query.data
    ? { ...query.data, autoRefresh: liveUpdated ? "updated" : query.data.autoRefresh }
    : null;

  return { model, isLoading: query.isLoading, isError: query.isError };
}
