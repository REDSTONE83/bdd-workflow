import type { AnchorHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const workspaceRoot = import.meta.env.VITE_WORKSPACE_ROOT?.replace(/\/+$/, "") ?? "";

function isAbsolutePath(file: string) {
  return file.startsWith("/") || /^[A-Za-z]:[\\/]/.test(file) || file.startsWith("\\\\");
}

export function absoluteEditorFile(file: string) {
  const normalized = file.replace(/\\/g, "/");
  if (isAbsolutePath(normalized)) return normalized;
  return workspaceRoot ? `${workspaceRoot}/${normalized.replace(/^\/+/, "")}` : normalized;
}

export function editorHref(file: string, line: number) {
  return `vscode://file/${encodeURI(absoluteEditorFile(file))}:${line}`;
}

export function LocationLink({
  file,
  line,
  label,
  className,
  ...props
}: {
  file: string;
  line: number;
  label?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const locationLabel = label ?? `${file}:${line}`;

  return (
    <a
      href={editorHref(file, line)}
      aria-label={props["aria-label"] ?? `${locationLabel} 위치 바로가기`}
      className={cn(
        "block break-all rounded-sm font-mono text-xs font-medium text-sky-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {locationLabel}
    </a>
  );
}
