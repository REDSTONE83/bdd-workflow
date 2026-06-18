import * as React from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
}

function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "선택",
  className,
  disabled,
  name,
  id,
  "aria-label": ariaLabel,
}: SelectProps) {
  const labels = React.useMemo(() => new Map(options.map((option) => [option.value, option.label])), [options]);

  return (
    <BaseSelect.Root
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string") {
          onValueChange?.(nextValue);
        }
      }}
    >
      <BaseSelect.Trigger
        data-slot="select-trigger"
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-9 min-w-32 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm outline-none transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <BaseSelect.Value data-slot="select-value" placeholder={placeholder}>
          {(selectedValue) => labels.get(String(selectedValue)) ?? selectedValue ?? placeholder}
        </BaseSelect.Value>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false}>
          <BaseSelect.Popup
            data-slot="select-popup"
            className="z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none"
          >
            <BaseSelect.List data-slot="select-list" className="grid gap-1">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  data-slot="select-item"
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex min-h-8 cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute left-2 flex size-4 items-center justify-center">
                    <BaseSelect.ItemIndicator>
                      <Check className="size-4" aria-hidden="true" />
                    </BaseSelect.ItemIndicator>
                  </span>
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

export { Select };
