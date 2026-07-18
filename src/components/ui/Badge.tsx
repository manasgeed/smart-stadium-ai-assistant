import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger" | "violet";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-700/60 text-slate-200 ring-slate-500/30",
  success: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  info: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  warning: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function priorityTone(priority: string): BadgeTone {
  switch (priority) {
    case "critical":
      return "danger";
    case "urgent":
      return "warning";
    case "advisory":
      return "info";
    default:
      return "neutral";
  }
}

export function severityTone(severity: string): BadgeTone {
  switch (severity) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "neutral";
  }
}
