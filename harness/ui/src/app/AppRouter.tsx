import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../features/shell/AppShell";
import { RequirementBoardPage } from "../features/requirements/RequirementBoardPage";
import { RequirementDetailPage } from "../features/requirements/RequirementDetailPage";
import { GateViewPage } from "../features/gates/GateViewPage";
import { ChangeSetViewPage } from "../features/change-sets/ChangeSetViewPage";
import { CommandRunnerPage } from "../features/runs/CommandRunnerPage";
import { appShellDefault } from "../lib/harness-data/fixtures";

export function AppRouter() {
  return (
    <AppShell model={appShellDefault}>
      <Routes>
        <Route path="/" element={<Navigate to="/requirements" replace />} />
        <Route path="/requirements" element={<RequirementBoardPage />} />
        <Route path="/requirements/:requirementId" element={<RequirementDetailPage />} />
        <Route path="/gate" element={<GateViewPage />} />
        <Route path="/change-sets" element={<ChangeSetViewPage />} />
        <Route path="/runs" element={<CommandRunnerPage />} />
      </Routes>
    </AppShell>
  );
}
