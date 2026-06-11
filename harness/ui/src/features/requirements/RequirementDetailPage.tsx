/**
 * @Requirement REQ-032
 * @Page RequirementDetailPage
 * @Route /requirements/:requirementId
 */
import { requirementDetail } from "../../lib/harness-data/fixtures";
import { RequirementDetailView } from "./RequirementDetailView";

export { RequirementDetailView } from "./RequirementDetailView";

export function RequirementDetailPage() {
  return <RequirementDetailView detail={requirementDetail} />;
}
