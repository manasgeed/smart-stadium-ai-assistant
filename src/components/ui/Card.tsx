import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <As
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-black/10 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </As>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
