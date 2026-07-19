import { memo } from "react";
import { AlertTriangle, CloudRain, DoorOpen, ShieldAlert, Thermometer, Users } from "lucide-react";
import type { Recommendation, StadiumState } from "../types";
import { StatCard } from "./ui/StatCard";
import { Card, CardHeader } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { Badge, priorityTone } from "./ui/Badge";

const WEATHER_LABEL: Record<StadiumState["weather"]["condition"], string> = {
  clear: "Clear skies",
  cloudy: "Cloudy",
  rain: "Rain",
  storm: "Storm warning",
  "heat-advisory": "Heat advisory",
};

export const DashboardView = memo(function DashboardView({
  state,
  recommendations,
}: {
  state: StadiumState;
  recommendations: Recommendation[];
}) {
  const openIncidents = state.incidents.filter((i) => !i.resolved);
  const avgWait = Math.round(
    state.gates.reduce((sum, g) => sum + g.waitTimeMin, 0) / state.gates.length
  );
  const avgDensity = Math.round(
    state.zones.reduce((sum, z) => sum + z.densityPct, 0) / state.zones.length
  );
  const criticalCount = recommendations.filter((r) => r.priority === "critical").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance"
          value={`${state.match.attendance.toLocaleString()}`}
          hint={`${Math.round((state.match.attendance / state.match.attendanceCapacity) * 100)}% of ${state.match.attendanceCapacity.toLocaleString()} capacity`}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Avg. Gate Wait"
          value={`${avgWait} min`}
          hint={`${state.gates.filter((g) => g.status === "congested").length} gate(s) congested`}
          icon={<DoorOpen size={18} />}
          tone={avgWait >= 10 ? "warning" : "default"}
        />
        <StatCard
          label="Avg. Zone Density"
          value={`${avgDensity}%`}
          hint="Across all monitored zones"
          icon={<Thermometer size={18} />}
          tone={avgDensity >= 85 ? "danger" : avgDensity >= 70 ? "warning" : "success"}
        />
        <StatCard
          label="Open Incidents"
          value={`${openIncidents.length}`}
          hint={criticalCount > 0 ? `${criticalCount} critical AI alert(s)` : "No critical alerts"}
          icon={<ShieldAlert size={18} />}
          tone={openIncidents.length > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
          <Card>
            <CardHeader
              title="Zone Density Monitor"
              subtitle="Live occupancy across stadium sections"
              icon={<Users size={16} />}
            />
            <div className="space-y-4 p-4">
              {state.zones.map((zone) => (
                <div key={zone.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{zone.name}</span>
                    <span className="text-slate-400">
                      {zone.occupancy.toLocaleString()} / {zone.capacity.toLocaleString()} ({zone.densityPct}%)
                    </span>
                  </div>
                  <ProgressBar value={zone.densityPct} label={`${zone.name} density`} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
          <Card>
          <CardHeader
            title="Weather Conditions"
            subtitle={`Updated ${new Date(state.weather.updatedAt).toLocaleTimeString()}`}
            icon={<CloudRain size={16} />}
          />
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Condition</span>
              <Badge tone={state.weather.condition === "clear" ? "success" : state.weather.condition === "storm" ? "danger" : "warning"}>
                {WEATHER_LABEL[state.weather.condition]}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Temperature</span>
              <span className="font-medium text-slate-200">{state.weather.temperatureC}°C</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Wind</span>
              <span className="font-medium text-slate-200">{state.weather.windKph} km/h</span>
            </div>
            <hr className="border-slate-800" />
            <div className="text-sm">
              <p className="text-slate-400">Fixture</p>
              <p className="font-medium text-slate-200">{state.match.fixture}</p>
              <p className="text-xs text-slate-500">{state.match.tournament}</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Phase</span>
              <span className="font-medium capitalize text-slate-200">{state.match.phase.replace("-", " ")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Clock</span>
              <span className="font-mono font-medium text-slate-200">{state.match.clock}</span>
            </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
        <Card>
        <CardHeader
          title="AI Recommendation Feed"
          subtitle="Ranked by urgency - generated by the live decision engine"
          icon={<AlertTriangle size={16} />}
        />
        <div className="divide-y divide-slate-800">
          {recommendations.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No active recommendations. Operations nominal.</p>
          )}
          {recommendations.slice(0, 6).map((rec) => (
            <div key={rec.id} className="flex flex-col gap-1 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={priorityTone(rec.priority)}>{rec.priority.toUpperCase()}</Badge>
                <Badge tone="neutral">{rec.category}</Badge>
                <h3 className="text-sm font-semibold text-slate-100">{rec.title}</h3>
              </div>
              <p className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">Why: </span>
                {rec.rationale}
              </p>
              <div className="flex items-center gap-4 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                    <div 
                      className={`h-full ${rec.confidenceScore >= 95 ? 'bg-cyan-400' : 'bg-cyan-600'}`} 
                      style={{ width: `${rec.confidenceScore}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-400/80">
                    {rec.confidenceScore}% Confidence
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  <span className="font-medium text-slate-400">Impact: </span>
                  {rec.predictedImpact}
                </div>
              </div>
              <p className="mt-1 text-xs text-cyan-300">
                <span className="font-medium">Recommended action: </span>
                {rec.action}
              </p>
            </div>
          ))}
          </div>
        </Card>
      </div>
    </div>
  );
});
