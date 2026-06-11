import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  render?: React.ReactElement;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "div",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "card",
      className: cn("rounded-lg border bg-card text-card-foreground shadow-sm", className),
    },
  }),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "div",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "card-header",
      className: cn("flex flex-col space-y-1.5 p-5", className),
    },
  }),
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  render?: React.ReactElement;
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "h3",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "card-title",
      className: cn("text-lg font-semibold leading-none tracking-normal", className),
    },
  }),
);
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  render?: React.ReactElement;
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "p",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "card-description",
      className: cn("text-sm text-muted-foreground", className),
    },
  }),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "div",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "card-content",
      className: cn("p-5 pt-0", className),
    },
  }),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "div",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "card-footer",
      className: cn("flex items-center p-5 pt-0", className),
    },
  }),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
