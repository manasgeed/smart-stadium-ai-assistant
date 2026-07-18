import { DoorClosed, DoorOpen, Users } from "lucide-react";
import type { Gate, StadiumState, StaffUnit } from "../types";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { ProgressBar } from "./ui/ProgressBar";

function gateBadgeTone(status: Gate["status"]) {
  switch (status) {
    case "congested":
      return "danger" as const;
    case "open":
      return "success" as const;
    case "reserve":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export function GatesView({
  state,
  onToggleGate,
}: {
  state: StadiumState;
  onToggleGate: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Entry Gate Control"
          subtitle="Live queue telemetry from turnstile scanners"
          icon={<DoorOpen size={16} />}
        />
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.gates.map((gate) => (
            <div key={gate.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">{gate.name}</h3>
                <Badge tone={gateBadgeTone(gate.status)}>{gate.status}</Badge>
              </div>
              <p className="mb-3 text-xs text-slate-500">{gate.zone}</p>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Queue</dt>
                  <dd className="font-medium text-slate-200">{gate.queueLength} people</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Wait time</dt>
                  <dd className="font-medium text-slate-200">{gate.waitTimeMin} min</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Throughput</dt>
                  <dd className="font-medium text-slate-200">{gate.throughputPerMin}/min</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Capacity</dt>
                  <dd className="font-medium text-slate-200">{gate.capacityPerMin}/min</dd>
                </div>
              </dl>
              <div className="mt-3">
                <ProgressBar value={gate.queueLength} max={200} label={`${gate.name} queue level`} />
              </div>
              <button
                onClick={() => onToggleGate(gate.id)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {gate.status === "reserve" ? (
                  <>
                    <DoorOpen size={14} /> Activate gate
                  </>
                ) : (
                  <>
                    <DoorClosed size={14} /> Set to reserve
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Staff Deployment" subtitle="Real-time roster by zone" icon={<Users size={16} />} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Zone</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.staff.map((s: StaffUnit) => (
                <tr key={s.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-2 font-medium text-slate-200">{s.name}</td>
                  <td className="px-4 py-2 text-slate-400">{s.role}</td>
                  <td className="px-4 py-2 text-slate-400">{s.zone}</td>
                  <td className="px-4 py-2">
                    <Badge
                      tone={s.status === "available" ? "success" : s.status === "deployed" ? "warning" : "neutral"}
                    >
                      {s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
