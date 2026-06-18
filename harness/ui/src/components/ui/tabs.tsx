import * as React from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "../../lib/utils";

interface TabsProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseTabs.Root>, "className"> {
  className?: string;
}

function Tabs({ className, ...props }: TabsProps) {
  return <BaseTabs.Root data-slot="tabs" className={cn("space-y-4", className)} {...props} />;
}

interface TabsListProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseTabs.List>, "className"> {
  className?: string;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ className, ...props }, ref) => (
  <BaseTabs.List
    ref={ref}
    data-slot="tabs-list"
    className={cn("inline-flex min-h-10 items-center rounded-md bg-muted p-1 text-muted-foreground", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseTabs.Tab>, "className"> {
  className?: string;
}

const TabsTrigger = React.forwardRef<HTMLElement, TabsTriggerProps>(({ className, ...props }, ref) => (
  <BaseTabs.Tab
    ref={ref}
    data-slot="tabs-trigger"
    className={({ active }) =>
      cn(
        "inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        active ? "bg-background text-foreground shadow-sm" : "hover:bg-background/60 hover:text-foreground",
        className,
      )
    }
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseTabs.Panel>, "className"> {
  className?: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(({ className, keepMounted = true, ...props }, ref) => (
  <BaseTabs.Panel
    ref={ref}
    data-slot="tabs-content"
    keepMounted={keepMounted}
    className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
