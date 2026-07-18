import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const toneRing =
    tone === "danger"
      ? "ring-rose-500/30"
      : tone === "warning"
      ? "ring-amber-500/30"
      : tone === "success"
      ? "ring-emerald-500/30"
      : "ring-slate-800";
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 ring-1",
        toneRing
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <span className="text-2xl font-semibold text-slate-50">{value}</span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}
