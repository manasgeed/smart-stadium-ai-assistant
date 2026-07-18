import type { Recommendation, StadiumState } from "../types";
import { nextId } from "./simulation";

/**
 * Rule-based reasoning engine that inspects the live stadium context and derives
 * prioritized, explainable recommendations. This is the deterministic "logic core"
 * that grounds the Generative AI assistant so its answers stay factual and consistent
 * with real-time operational data instead of hallucinating.
 */
export function generateRecommendations(state: StadiumState): Recommendation[] {
  const recs: Recommendation[] = [];
  const now = Date.now();
  const push = (r: Omit<Recommendation, "id" | "createdAt">) =>
    recs.push({ ...r, id: nextId("rec"), createdAt: now });

  // --- Gate & entry flow reasoning ---
  const reserveGates = state.gates.filter((g) => g.status === "reserve");
  const congested = state.gates.filter((g) => g.status === "congested" || g.waitTimeMin >= 10);
  for (const gate of congested) {
    const alt = reserveGates[0];
    push({
      category: "crowd-flow",
      priority: gate.waitTimeMin >= 15 ? "critical" : "urgent",
      title: `Queue building at ${gate.name}`,
      rationale: `${gate.queueLength} people queued with an estimated wait of ${gate.waitTimeMin} min, exceeding the 10-minute comfort threshold for entry gates.`,
      action: alt
        ? `Open ${alt.name} immediately and redirect arriving fans via signage/staff to balance load.`
        : `Add 2 extra stewards to ${gate.name} and open a fast-lane for digital ticket holders.`,
      relatedZone: gate.zone,
    });
  }

  // --- Crowd density / safety reasoning ---
  for (const zone of state.zones) {
    if (zone.densityPct >= 95) {
      push({
        category: "safety",
        priority: "critical",
        title: `${zone.name} at critical capacity (${zone.densityPct}%)`,
        rationale: `Occupancy of ${zone.occupancy}/${zone.capacity} exceeds the 95% critical safety threshold, raising crowd-crush risk.`,
        action: `Pause further entry to ${zone.name}, open overflow area, and dispatch stewards to manage egress flow.`,
        relatedZone: zone.name,
      });
    } else if (zone.densityPct >= 85) {
      push({
        category: "crowd-flow",
        priority: "urgent",
        title: `${zone.name} approaching capacity (${zone.densityPct}%)`,
        rationale: `Density has crossed the 85% advisory threshold. Historical patterns show bottlenecks form within 10-15 minutes past this point.`,
        action: `Slow inflow to ${zone.name} and monitor concourse cameras; prep overflow signage.`,
        relatedZone: zone.name,
      });
    }
    if (zone.noiseLevelDb >= 100) {
      push({
        category: "safety",
        priority: "advisory",
        title: `Elevated noise levels in ${zone.name}`,
        rationale: `Noise measured at ${zone.noiseLevelDb} dB, above the 100 dB sustained-exposure guideline.`,
        action: `Remind stewards stationed in ${zone.name} to use hearing protection and monitor for crowd agitation.`,
        relatedZone: zone.name,
      });
    }
  }

  // --- Weather reasoning ---
  const { weather } = state;
  if (weather.condition === "storm") {
    push({
      category: "weather",
      priority: "critical",
      title: "Severe weather - storm conditions detected",
      rationale: `Wind speed at ${weather.windKph} km/h with storm activity. Open-air concourses and queues are at risk.`,
      action: "Activate weather protocol: move queues under cover, pause outdoor concessions, brief PA announcement on shelter points.",
    });
  } else if (weather.condition === "rain") {
    push({
      category: "weather",
      priority: "advisory",
      title: "Rain detected around the venue",
      rationale: "Wet walkways increase slip risk near uncovered concourses and stairwells.",
      action: "Deploy non-slip mats near entrances and alert cleaning crews to monitor water pooling.",
    });
  } else if (weather.condition === "heat-advisory") {
    push({
      category: "weather",
      priority: "urgent",
      title: `Heat advisory - ${weather.temperatureC}°C ambient`,
      rationale: "Sustained high temperature raises dehydration and heat-exhaustion risk, especially in Upper Tier sun-exposed sections.",
      action: "Open additional hydration stations, increase medical staff visibility, and push a hydration reminder over the PA system.",
    });
  }

  // --- Incident reasoning ---
  const openIncidents = state.incidents.filter((i) => !i.resolved);
  for (const incident of openIncidents) {
    if (incident.severity === "critical" || incident.severity === "high") {
      const medicalNearby = state.staff.find(
        (s) => s.role === "Medical" && s.status === "available"
      );
      push({
        category: "safety",
        priority: incident.severity === "critical" ? "critical" : "urgent",
        title: `${incident.severity === "critical" ? "Critical" : "High-severity"} incident: ${incident.type} in ${incident.zone}`,
        rationale: incident.description,
        action: medicalNearby
          ? `Dispatch ${medicalNearby.name} (${medicalNearby.role}, currently available) to ${incident.zone} immediately.`
          : `All medical units are deployed - request nearest available first-responder to ${incident.zone} and alert control room.`,
        relatedZone: incident.zone,
      });
    }
  }

  // --- Staffing reasoning: idle staff vs overloaded zones ---
  const overloadedZoneNames = new Set(
    state.zones.filter((z) => z.densityPct >= 85).map((z) => z.name)
  );
  const idleStaff = state.staff.filter(
    (s) => s.status === "available" && !overloadedZoneNames.has(s.zone)
  );
  if (overloadedZoneNames.size > 0 && idleStaff.length > 0) {
    const target = Array.from(overloadedZoneNames)[0];
    const candidate = idleStaff[0];
    push({
      category: "staffing",
      priority: "advisory",
      title: "Reallocation opportunity detected",
      rationale: `${candidate.name} (${candidate.role}) is available in a lower-density area while ${target} is under pressure.`,
      action: `Reassign ${candidate.name} to ${target} to reinforce crowd management.`,
      relatedZone: target,
    });
  }

  // --- Concessions reasoning ---
  for (const c of state.concessions) {
    if (c.stockPct <= 25) {
      push({
        category: "concessions",
        priority: c.stockPct <= 10 ? "urgent" : "advisory",
        title: `${c.name} running low on stock (${c.stockPct}%)`,
        rationale: `Demand level "${c.demandLevel}" combined with low remaining stock risks a stockout during peak match moments.`,
        action: `Trigger restock run to ${c.name} from central warehouse before next intermission.`,
        relatedZone: c.zone,
      });
    }
  }

  // --- Match-phase aware logistics reasoning ---
  if (state.match.phase === "half-time") {
    push({
      category: "logistics",
      priority: "info",
      title: "Half-time surge expected",
      rationale: "Historical concourse data shows a 3-4x spike in concession and restroom traffic within the first 5 minutes of half-time.",
      action: "Pre-position extra stewards at concourse chokepoints and open all concession registers.",
    });
  }

  const attendancePct = Math.round(
    (state.match.attendance / state.match.attendanceCapacity) * 100
  );
  if (attendancePct >= 98) {
    push({
      category: "logistics",
      priority: "advisory",
      title: "Venue near sell-out capacity",
      rationale: `Attendance at ${attendancePct}% of capacity. Egress planning should begin ahead of full-time to avoid exit bottlenecks.`,
      action: "Stagger exit gate openings post-match and coordinate with transit/parking teams in advance.",
    });
  }

  // Sort: critical > urgent > advisory > info
  const order: Record<Recommendation["priority"], number> = {
    critical: 0,
    urgent: 1,
    advisory: 2,
    info: 3,
  };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 12);
}

export function summarizeContextForPrompt(state: StadiumState, recs: Recommendation[]): string {
  const gatesSummary = state.gates
    .map((g) => `${g.name}: ${g.status}, queue ${g.queueLength}, wait ${g.waitTimeMin}min`)
    .join("; ");
  const zonesSummary = state.zones
    .map((z) => `${z.name}: ${z.densityPct}% density`)
    .join("; ");
  const incidentsSummary = state.incidents
    .filter((i) => !i.resolved)
    .map((i) => `[${i.severity}] ${i.type} in ${i.zone}: ${i.description}`)
    .join(" | ") || "None open";
  const staffSummary = state.staff
    .map((s) => `${s.name} (${s.role}) - ${s.status} @ ${s.zone}`)
    .join("; ");
  const concessionsSummary = state.concessions
    .map((c) => `${c.name}: ${c.stockPct}% stock, demand ${c.demandLevel}`)
    .join("; ");
  const recsSummary = recs
    .map((r) => `- [${r.priority.toUpperCase()}] ${r.title} -> ${r.action}`)
    .join("\n") || "No active recommendations.";

  return `MATCH: ${state.match.fixture} (${state.match.tournament}) at ${state.match.venue}. Phase: ${state.match.phase}, Clock: ${state.match.clock}. Attendance: ${state.match.attendance}/${state.match.attendanceCapacity}.
WEATHER: ${state.weather.condition}, ${state.weather.temperatureC}°C, wind ${state.weather.windKph} km/h.
GATES: ${gatesSummary}
ZONES: ${zonesSummary}
OPEN INCIDENTS: ${incidentsSummary}
STAFF: ${staffSummary}
CONCESSIONS: ${concessionsSummary}
CURRENT AI-GENERATED RECOMMENDATIONS (rule engine):
${recsSummary}`;
}
