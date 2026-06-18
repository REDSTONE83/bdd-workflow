import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../features/shell/AppShell";
import { RequirementBoardPage } from "../features/requirements/RequirementBoardPage";
import { RequirementDetailPage } from "../features/requirements/RequirementDetailPage";
import { TerminologyBrowserPage } from "../features/terminology/TerminologyBrowserPage";
import { GateViewPage } from "../features/gates/GateViewPage";
import { ChangeSetViewPage } from "../features/change-sets/ChangeSetViewPage";
import { CommandRunnerPage } from "../features/runs/CommandRunnerPage";
import { useArtifactSummary } from "../lib/harness-data/useArtifactSummary";
import type { ArtifactSummary, HarnessScope } from "../lib/harness-data/types";

function loadingSummary(scope: HarnessScope): ArtifactSummary {
  return { scope, generatedAt: null, missing: false, stale: false, staleSources: [], autoRefresh: "idle" };
}

export function AppRouter() {
  const [scope, setScope] = useState<HarnessScope>("harness");
  const { model } = useArtifactSummary(scope);

  return (
    <AppShell model={model ?? loadingSummary(scope)} onScopeChange={setScope}>
      <Routes>
        <Route path="/" element={<Navigate to="/requirements" replace />} />
        <Route path="/requirements" element={<RequirementBoardPage />} />
        <Route path="/requirements/:requirementId" element={<RequirementDetailPage />} />
        <Route path="/terminology" element={<TerminologyBrowserPage />} />
        <Route path="/gate" element={<GateViewPage />} />
        <Route path="/change-sets" element={<ChangeSetViewPage />} />
        <Route path="/runs" element={<CommandRunnerPage />} />
      </Routes>
    </AppShell>
  );
}
