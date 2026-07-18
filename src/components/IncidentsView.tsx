import { CheckCircle2, Coffee, ShieldAlert } from "lucide-react";
import type { StadiumState } from "../types";
import { Card, CardHeader } from "./ui/Card";
import { Badge, severityTone } from "./ui/Badge";
import { ProgressBar } from "./ui/ProgressBar";

export function IncidentsView({
  state,
  onResolve,
}: {
  state: StadiumState;
  onResolve: (id: string) => void;
}) {
  const open = state.incidents.filter((i) => !i.resolved);
  const resolved = state.incidents.filter((i) => i.resolved);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Incident Log"
          subtitle={`${open.length} open, ${resolved.length} resolved`}
          icon={<ShieldAlert size={16} />}
        />
        <div className="divide-y divide-slate-800">
          {open.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No open incidents. All clear.</p>
          )}
          {open.map((incident) => (
            <div key={incident.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge tone={severityTone(incident.severity)}>{incident.severity.toUpperCase()}</Badge>
                  <Badge tone="neutral">{incident.type}</Badge>
                  <span className="text-xs text-slate-500">{incident.zone}</span>
                </div>
                <p className="text-sm text-slate-200">{incident.description}</p>
                <p className="text-xs text-slate-500">
                  Reported {new Date(incident.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => onResolve(incident.id)}
                className="flex items-center justify-center gap-2 self-start rounded-lg border border-emerald-700/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <CheckCircle2 size={14} /> Mark resolved
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Concession Stock Levels" subtitle="Warehouse & vendor stand inventory" icon={<Coffee size={16} />} />
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          {state.concessions.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-200">{c.name}</h3>
                <Badge tone={c.demandLevel === "surge" || c.demandLevel === "high" ? "warning" : "neutral"}>
                  {c.demandLevel} demand
                </Badge>
              </div>
              <p className="mb-2 text-xs text-slate-500">{c.zone}</p>
              <ProgressBar value={c.stockPct} label={`${c.name} stock level`} />
              <p className="mt-1 text-right text-xs text-slate-400">{c.stockPct}% remaining</p>
            </div>
          ))}
        </div>
      </Card>

      {resolved.length > 0 && (
        <Card>
          <CardHeader title="Resolved Incidents" subtitle="Audit trail" icon={<CheckCircle2 size={16} />} />
          <div className="divide-y divide-slate-800">
            {resolved.slice(0, 10).map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 text-sm text-slate-500">
                <span>
                  {incident.type} in {incident.zone}
                </span>
                <span className="text-xs">{new Date(incident.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
