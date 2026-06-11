import * as React from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<typeof BaseInput>>(
  ({ className, type, ...props }, ref) => (
    <BaseInput
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
