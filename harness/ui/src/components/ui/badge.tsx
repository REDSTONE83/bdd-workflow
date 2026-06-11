import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex min-w-16 items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border bg-background text-foreground",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        info: "border-sky-200 bg-sky-50 text-sky-800",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
        inactive: "border-slate-200 bg-slate-100 text-slate-700",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  render?: React.ReactElement;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, render, ...props }, ref) => {
  return useRender({
    defaultTagName: "span",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "badge",
      className: cn(badgeVariants({ variant }), className),
    },
  });
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
