import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva("relative w-full rounded-lg border p-4 text-sm", {
  variants: {
    variant: {
      default: "bg-background text-foreground",
      destructive: "border-red-200 bg-red-50 text-red-950",
      warning: "border-amber-200 bg-amber-50 text-amber-950",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  render?: React.ReactElement;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant, render, role = "alert", ...props }, ref) =>
  useRender({
    defaultTagName: "div",
    render,
    ref,
    state: {},
    props: {
      ...props,
      role,
      "data-slot": "alert",
      className: cn(alertVariants({ variant }), className),
    },
  }),
);
Alert.displayName = "Alert";

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  render?: React.ReactElement;
}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "h5",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "alert-title",
      className: cn("mb-1 font-semibold leading-none tracking-normal", className),
    },
  }),
);
AlertTitle.displayName = "AlertTitle";

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  render?: React.ReactElement;
}

const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "div",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "alert-description",
      className: cn("text-sm", className),
    },
  }),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
