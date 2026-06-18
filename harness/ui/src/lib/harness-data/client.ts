import {
  appShellDefault,
  changeSetRows,
  commands,
  findingRows,
  gateCategories,
  readyRun,
  requirementDetail,
  requirementRows,
  requirementSummary,
} from "./fixtures";

export async function loadShellSummary() {
  return appShellDefault;
}

export async function loadRequirementBoard() {
  return { rows: requirementRows, summary: requirementSummary };
}

export async function loadRequirementDetail() {
  return requirementDetail;
}

export async function loadGateView() {
  return { categories: gateCategories, findings: findingRows };
}

export async function loadChangeSets() {
  return changeSetRows;
}

export async function loadCommandRunner() {
  return { commands, run: readyRun };
}
