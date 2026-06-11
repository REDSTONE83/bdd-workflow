import * as React from "react";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface CollapsibleProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseCollapsible.Root>, "className"> {
  className?: string;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(({ className, ...props }, ref) => (
  <BaseCollapsible.Root ref={ref} data-slot="collapsible" className={cn("rounded-md border border-border", className)} {...props} />
));
Collapsible.displayName = "Collapsible";

interface CollapsibleTriggerProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseCollapsible.Trigger>, "className"> {
  className?: string;
  hideIcon?: boolean;
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, children, hideIcon = false, ...props }, ref) => (
    <BaseCollapsible.Trigger
      ref={ref}
      data-slot="collapsible-trigger"
      className={cn(
        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring [&[data-panel-open]_.collapsible-icon]:rotate-180",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 break-words">{children}</span>
      {hideIcon ? null : (
        <ChevronDown className="collapsible-icon size-4 shrink-0 text-muted-foreground transition-transform" aria-hidden="true" />
      )}
    </BaseCollapsible.Trigger>
  ),
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

interface CollapsibleContentProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseCollapsible.Panel>, "className"> {
  className?: string;
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, keepMounted = true, ...props }, ref) => (
    <BaseCollapsible.Panel
      ref={ref}
      data-slot="collapsible-content"
      keepMounted={keepMounted}
      className={cn("border-t border-border p-3 text-sm", className)}
      {...props}
    />
  ),
);
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
