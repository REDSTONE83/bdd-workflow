import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "../../lib/utils";

const Tooltip = BaseTooltip.Root;
const TooltipProvider = BaseTooltip.Provider;
const TooltipPortal = BaseTooltip.Portal;

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseTooltip.Trigger> & { asChild?: boolean }
>(({ asChild = false, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return <BaseTooltip.Trigger ref={ref} data-slot="tooltip-trigger" render={children} {...props} />;
  }

  return (
    <BaseTooltip.Trigger
      ref={ref}
      data-slot="tooltip-trigger"
      className="outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      {...props}
    >
      {children}
    </BaseTooltip.Trigger>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipPositioner = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseTooltip.Positioner>
>(({ side = "top", sideOffset = 6, className, ...props }, ref) => (
  <BaseTooltip.Positioner
    ref={ref}
    data-slot="tooltip-positioner"
    side={side}
    sideOffset={sideOffset}
    className={cn("z-50", className)}
    {...props}
  />
));
TooltipPositioner.displayName = "TooltipPositioner";

const TooltipPopup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseTooltip.Popup>
>(({ className, ...props }, ref) => (
  <BaseTooltip.Popup
    ref={ref}
    data-slot="tooltip-popup"
    className={cn(
      "max-w-72 rounded-md border border-border bg-popover px-2 py-1.5 text-xs font-medium text-popover-foreground shadow-md outline-none",
      className,
    )}
    {...props}
  />
));
TooltipPopup.displayName = "TooltipPopup";

function TooltipContent({
  children,
  side,
  sideOffset,
  className,
}: {
  children: React.ReactNode;
  side?: React.ComponentPropsWithoutRef<typeof TooltipPositioner>["side"];
  sideOffset?: React.ComponentPropsWithoutRef<typeof TooltipPositioner>["sideOffset"];
  className?: string;
}) {
  return (
    <TooltipPortal>
      <TooltipPositioner side={side} sideOffset={sideOffset}>
        <TooltipPopup className={className}>{children}</TooltipPopup>
      </TooltipPositioner>
    </TooltipPortal>
  );
}

export {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipPopup,
  TooltipPositioner,
  TooltipProvider,
  TooltipTrigger,
};
