import type { LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function Sidebar({
  items,
  active,
  onSelect,
  className,
}: {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/80 px-2 py-2 lg:w-60 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:px-3 lg:py-6",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
              isActive
                ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            )}
          >
            <Icon size={18} />
            <span className="whitespace-nowrap">{item.label}</span>
            {!!item.badge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
