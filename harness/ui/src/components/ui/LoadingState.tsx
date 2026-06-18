import { Card } from "./card";

export function LoadingState({ label = "불러오는 중" }: { label?: string }) {
  return (
    <Card className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      {label}
    </Card>
  );
}
