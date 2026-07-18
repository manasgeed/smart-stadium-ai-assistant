import { cn } from "../../utils/cn";

export function ProgressBar({
  value,
  max = 100,
  className,
  label,
  colorClass,
}: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
  colorClass?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const auto =
    pct >= 90 ? "bg-rose-500" : pct >= 75 ? "bg-amber-500" : pct >= 50 ? "bg-sky-500" : "bg-emerald-500";
  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClass ?? auto)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
