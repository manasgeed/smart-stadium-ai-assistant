import type { Recommendation, StadiumState } from "../types";

/**
 * Local, deterministic reasoning fallback used when no Gemini API key is configured
 * (or a live call fails). It performs lightweight intent detection against the same
 * live context object used by the decision engine, so the assistant is always
 * genuinely context-aware even fully offline - never a static canned reply.
 */
export function generateOfflineReply(
  state: StadiumState,
  recs: Recommendation[],
  question: string
): string {
  const q = question.toLowerCase();

  const criticalRecs = recs.filter((r) => r.priority === "critical");
  const urgentRecs = recs.filter((r) => r.priority === "urgent");

  const respondWithTop = (pool: Recommendation[], introEmpty: string) => {
    if (pool.length === 0) return introEmpty;
    return pool
      .slice(0, 3)
      .map((r) => `• ${r.title} — ${r.action} (Why: ${r.rationale})`)
      .join("\n");
  };

  if (/gate|entry|queue|turnstile/.test(q)) {
    const worst = [...state.gates].sort((a, b) => b.waitTimeMin - a.waitTimeMin)[0];
    const reserve = state.gates.find((g) => g.status === "reserve");
    return `Gate status check: ${worst.name} has the longest wait at ${worst.waitTimeMin} min with ${worst.queueLength} people queued (status: ${worst.status}).${
      reserve
        ? ` ${reserve.name} is currently in reserve and can be activated to absorb overflow.`
        : " All gates are already active; consider reallocating stewards instead."
    }`;
  }

  if (/crowd|density|zone|capacity|overcrowd/.test(q)) {
    const worst = [...state.zones].sort((a, b) => b.densityPct - a.densityPct)[0];
    return `Highest density right now is ${worst.name} at ${worst.densityPct}% (${worst.occupancy}/${worst.capacity}). ${
      worst.densityPct >= 85
        ? "This is above the advisory threshold — recommend slowing inflow and prepping overflow signage."
        : "This is within safe operating range for now, but keep monitoring."
    }`;
  }

  if (/weather|rain|storm|heat|temperature/.test(q)) {
    return `Current conditions: ${state.weather.condition}, ${state.weather.temperatureC}°C, wind ${state.weather.windKph} km/h. ${
      state.weather.condition === "storm"
        ? "Storm protocol should be active: move queues under cover and pause outdoor concessions."
        : state.weather.condition === "heat-advisory"
        ? "Heat advisory in effect — increase hydration stations and medical visibility."
        : "No weather-driven action needed at this time."
    }`;
  }

  if (/incident|medical|security|emergency|safety/.test(q)) {
    const open = state.incidents.filter((i) => !i.resolved);
    if (open.length === 0) return "No open incidents at this time. All clear across monitored zones.";
    return `${open.length} open incident(s):\n${open
      .map((i) => `• [${i.severity.toUpperCase()}] ${i.type} in ${i.zone} — ${i.description}`)
      .join("\n")}`;
  }

  if (/staff|steward|deploy|reallocat|security guard/.test(q)) {
    const available = state.staff.filter((s) => s.status === "available");
    return `${available.length} staff currently available: ${available
      .map((s) => `${s.name} (${s.role} @ ${s.zone})`)
      .join(", ") || "none — all units deployed."}`;
  }

  if (/concession|food|stock|drink|snack/.test(q)) {
    const low = state.concessions.filter((c) => c.stockPct <= 30);
    if (low.length === 0) return "All concession stands are adequately stocked.";
    return `Low stock alert: ${low.map((c) => `${c.name} at ${c.stockPct}%`).join(", ")}. Recommend restocking before the next intermission surge.`;
  }

  if (/critical|urgent|priorit|top|what should i (do|focus)/.test(q)) {
    if (criticalRecs.length > 0) {
      return `⚠️ Top priority — ${criticalRecs.length} critical item(s):\n${respondWithTop(criticalRecs, "")}`;
    }
    if (urgentRecs.length > 0) {
      return `No critical issues right now. ${urgentRecs.length} urgent item(s) need attention:\n${respondWithTop(urgentRecs, "")}`;
    }
    return "Operations are stable — no critical or urgent items right now. Continue routine monitoring.";
  }

  if (/summary|status|overview|brief/.test(q)) {
    return `Match: ${state.match.fixture} (${state.match.phase}, ${state.match.clock}). Attendance ${state.match.attendance}/${state.match.attendanceCapacity}. Weather: ${state.weather.condition}, ${state.weather.temperatureC}°C. Open incidents: ${
      state.incidents.filter((i) => !i.resolved).length
    }. Active recommendations: ${recs.length} (${criticalRecs.length} critical, ${urgentRecs.length} urgent).`;
  }

  // Generic fallback: surface the most important active recommendation.
  if (recs.length > 0) {
    return `Based on current live data, here's what stands out:\n${respondWithTop(recs, "Nothing urgent right now.")}\n\nTip: connect a Gemini API key in Settings for richer, free-form conversational answers.`;
  }

  return "All monitored systems look nominal right now. Ask me about gates, crowd density, weather, incidents, staffing, or concessions for a live operational read-out.";
}

export function detectOfflineCommand(question: string) {
  const q = question.toLowerCase();

  // 1. Toggle Gate
  if (q.includes("close gate") || q.includes("open gate") || q.includes("toggle gate") || q.includes("shut gate")) {
    const match = q.match(/gate\s+(\d+|[a-z]+)/);
    const targetStatus = (q.includes("close") || q.includes("shut")) ? "closed" : q.includes("open") ? "open" : undefined;
    const gateId = match ? `gate-${match[1]}` : null;
    return {
      name: "toggleGate",
      args: {
        gate: gateId,
        ...(targetStatus && { status: targetStatus }),
      },
      rationale: `Understood. Modifying status for ${gateId || "the specified gate"} to manage crowd flow. I have prepared the command for your approval.`,
    };
  }

  // 2. Dispatch Medical
  if (q.includes("dispatch medical") || q.includes("send medical") || q.includes("medic") || q.includes("emergency")) {
    const match = q.match(/(?:to|in|at)\s+([a-z0-9\s]+)/);
    const loc = match ? match[1].trim() : "the specified zone";
    return {
      name: "dispatchMedical",
      args: {
        location: loc,
      },
      rationale: `Medical emergency acknowledged at ${loc}. Immediate dispatch of medical personnel is required. I have staged the dispatch command for your approval.`,
    };
  }

  // 3. Resolve Incident
  if (q.includes("resolve incident") || q.includes("close incident") || q.includes("mark incident")) {
    const match = q.match(/incident\s+([a-z0-9-]+)/);
    const id = match ? match[1] : null;
    return {
      name: "resolveIncident",
      args: {
        incidentId: id,
      },
      rationale: `Logging incident ${id || ""} as resolved to clear it from the active operations board. Please confirm this action.`,
    };
  }

  // 4. Broadcast Announcement
  if (q.includes("broadcast") || q.includes("announce") || q.includes("make an announcement")) {
    const match = q.match(/(?:broadcast|announce)(?: that|:)?\s+(.+)/);
    const msg = match ? match[1].trim() : "Attention all fans, please remain calm.";
    return {
      name: "broadcastAnnouncement",
      args: {
        message: msg,
      },
      rationale: `Preparing to route the following public address announcement to the stadium: "${msg}". Awaiting your final approval to broadcast.`,
    };
  }

  return null;
}
