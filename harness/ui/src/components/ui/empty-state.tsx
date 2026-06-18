import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function EmptyState({
  children,
  className,
  ...props
}: {
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  );
}
