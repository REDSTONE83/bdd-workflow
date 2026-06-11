import type { CommandDefinition } from "../../lib/harness-data/types";
import { Card } from "../../components/ui/card";

const commandByStatus: Record<string, string> = {
  "초안": "harness:trace -- --requirement REQ-XXX",
  "Skeleton 검토중": "harness:front-end-source-index",
  "검증중": "harness:validate",
};

export function RecommendedCommand({ cardStatus, commands }: { cardStatus: string; commands: CommandDefinition[] }) {
  const command = commandByStatus[cardStatus] ?? "harness:trace -- --requirement REQ-XXX";
  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">권장 검증 명령</div>
      <div className="mt-2 font-mono text-sm font-semibold text-foreground">{command}</div>
      <div className="mt-3 text-sm text-muted-foreground">
        허용 명령: {commands.map((item) => item.id).join(", ")}
      </div>
    </Card>
  );
}
