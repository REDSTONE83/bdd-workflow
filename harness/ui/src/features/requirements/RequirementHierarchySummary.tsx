import type { RequirementRow } from "../../lib/harness-data/types";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

function roleVariant(role: string) {
  if (role === "상위 요건") return "info" as const;
  if (role === "구현 슬라이스") return "warning" as const;
  return "outline" as const;
}

function idsLabel(ids: string[]) {
  if (ids.length <= 3) return ids.join(", ");
  return `${ids.slice(0, 3).join(", ")} 외 ${ids.length - 3}`;
}

export function RequirementHierarchySummary({
  requirement,
  className,
}: {
  requirement: RequirementRow;
  className?: string;
}) {
  const parentRequirementIds = requirement.parentRequirementIds;
  const childRequirementIds = requirement.childRequirementIds;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label={`${requirement.id} 요건 구조`}>
      <Badge className="shrink-0" size="sm" variant={roleVariant(requirement.specRole)}>{requirement.specRole}</Badge>
      {parentRequirementIds.length > 0 ? (
        <Badge className="shrink-0" size="sm" variant="secondary">상위 {idsLabel(parentRequirementIds)}</Badge>
      ) : null}
      {childRequirementIds.length > 0 ? (
        <Badge className="shrink-0" size="sm" variant="info">하위 {childRequirementIds.length}</Badge>
      ) : null}
    </div>
  );
}
