import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "../../lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  render?: React.ReactElement;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, render, ...props }, ref) => {
  const table = useRender({
    defaultTagName: "table",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "table",
      className: cn("w-full caption-bottom text-sm", className),
    },
  });

  return <div className="relative w-full overflow-auto">{table}</div>;
});
Table.displayName = "Table";

interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  render?: React.ReactElement;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "thead",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
    },
  }),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "tbody",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
    },
  }),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "tfoot",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "table-footer",
      className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
    },
  }),
);
TableFooter.displayName = "TableFooter";

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  render?: React.ReactElement;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "tr",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "table-row",
      className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
    },
  }),
);
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  render?: React.ReactElement;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "th",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "table-head",
      className: cn("h-11 px-4 text-left align-middle font-medium text-muted-foreground", className),
    },
  }),
);
TableHead.displayName = "TableHead";

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  render?: React.ReactElement;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "td",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "table-cell",
      className: cn("p-4 align-middle", className),
    },
  }),
);
TableCell.displayName = "TableCell";

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  render?: React.ReactElement;
}

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(({ className, render, ...props }, ref) =>
  useRender({
    defaultTagName: "caption",
    render,
    ref,
    state: {},
    props: {
      ...props,
      "data-slot": "table-caption",
      className: cn("mt-4 text-sm text-muted-foreground", className),
    },
  }),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
