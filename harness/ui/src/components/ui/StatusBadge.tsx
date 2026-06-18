import { Badge } from "./badge";
import type { BadgeProps } from "./badge";

type Tone = "red" | "green" | "blue" | "inactive" | "warning" | "neutral";

const toneVariant: Record<Tone, "destructive" | "success" | "info" | "inactive" | "warning" | "outline"> = {
  red: "destructive",
  green: "success",
  blue: "info",
  inactive: "inactive",
  warning: "warning",
  neutral: "outline",
};

export function StatusBadge({
  label,
  tone = "neutral",
  size,
  className,
}: {
  label: string;
  tone?: Tone;
  size?: BadgeProps["size"];
  className?: string;
}) {
  return <Badge className={className} size={size} variant={toneVariant[tone]}>{label}</Badge>;
}
