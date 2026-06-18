import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const Dialog = BaseDialog.Root;
const DialogPortal = BaseDialog.Portal;

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Trigger>
>(({ className, ...props }, ref) => (
  <BaseDialog.Trigger
    ref={ref}
    data-slot="dialog-trigger"
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
DialogTrigger.displayName = "DialogTrigger";

const DialogBackdrop = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>
>(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    data-slot="dialog-backdrop"
    className={cn("fixed inset-0 z-50 bg-slate-950/45", className)}
    {...props}
  />
));
DialogBackdrop.displayName = "DialogBackdrop";

const DialogPopup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Popup>
>(({ className, ...props }, ref) => (
  <BaseDialog.Popup
    ref={ref}
    data-slot="dialog-popup"
    className={cn(
      "fixed left-1/2 top-1/2 z-50 grid max-h-[84vh] w-[min(760px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-hidden rounded-lg border border-border bg-card p-5 text-card-foreground shadow-lg outline-none",
      className,
    )}
    {...props}
  />
));
DialogPopup.displayName = "DialogPopup";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    data-slot="dialog-title"
    className={cn("text-lg font-semibold leading-none tracking-normal text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Close> & { tooltip?: React.ReactNode }
>(({ className, children, tooltip, ...props }, ref) => {
  const closeButton = (
    <BaseDialog.Close
      ref={ref}
      data-slot="dialog-close"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {children ?? <X className="size-4" aria-hidden="true" />}
    </BaseDialog.Close>
  );
  const tooltipContent = tooltip ?? (!children && typeof props["aria-label"] === "string" ? props["aria-label"] : undefined);

  if (!tooltipContent) return closeButton;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{closeButton}</TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
});
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
