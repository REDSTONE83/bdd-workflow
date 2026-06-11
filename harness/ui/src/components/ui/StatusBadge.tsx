import { Badge } from "./badge";

type Tone = "red" | "green" | "blue" | "inactive" | "warning" | "neutral";

const toneVariant: Record<Tone, "destructive" | "success" | "info" | "inactive" | "warning" | "outline"> = {
  red: "destructive",
  green: "success",
  blue: "info",
  inactive: "inactive",
  warning: "warning",
  neutral: "outline",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <Badge variant={toneVariant[tone]}>{label}</Badge>;
}
