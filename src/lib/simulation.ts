import type {
  Concession,
  Gate,
  Incident,
  IncidentSeverity,
  IncidentType,
  StadiumState,
  StaffUnit,
  Zone,
} from "../types";

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function createInitialState(): StadiumState {
  const gates: Gate[] = [
    { id: "gate-a", name: "Gate A - North", zone: "North Concourse", status: "open", queueLength: 40, waitTimeMin: 4, throughputPerMin: 55, capacityPerMin: 70 },
    { id: "gate-b", name: "Gate B - East", zone: "East Concourse", status: "open", queueLength: 120, waitTimeMin: 9, throughputPerMin: 60, capacityPerMin: 65 },
    { id: "gate-c", name: "Gate C - South", zone: "South Concourse", status: "open", queueLength: 25, waitTimeMin: 2, throughputPerMin: 48, capacityPerMin: 70 },
    { id: "gate-d", name: "Gate D - West", zone: "West Concourse", status: "reserve", queueLength: 0, waitTimeMin: 0, throughputPerMin: 0, capacityPerMin: 60 },
    { id: "gate-vip", name: "Gate VIP - Premium", zone: "VIP Plaza", status: "open", queueLength: 8, waitTimeMin: 1, throughputPerMin: 20, capacityPerMin: 30 },
  ];

  const zoneSeeds: Zone[] = [
    { id: "z-lower-n", name: "Lower Bowl North", section: "Lower Bowl", capacity: 8000, occupancy: 6200, densityPct: 0, temperatureC: 29, noiseLevelDb: 78 },
    { id: "z-lower-s", name: "Lower Bowl South", section: "Lower Bowl", capacity: 8000, occupancy: 7100, densityPct: 0, temperatureC: 29, noiseLevelDb: 82 },
    { id: "z-upper-e", name: "Upper Tier East", section: "Upper Tier", capacity: 6000, occupancy: 3200, densityPct: 0, temperatureC: 31, noiseLevelDb: 70 },
    { id: "z-upper-w", name: "Upper Tier West", section: "Upper Tier", capacity: 6000, occupancy: 5700, densityPct: 0, temperatureC: 31, noiseLevelDb: 75 },
    { id: "z-concourse", name: "Main Concourse", section: "Concourse", capacity: 5000, occupancy: 2400, densityPct: 0, temperatureC: 28, noiseLevelDb: 65 },
    { id: "z-vip", name: "VIP Plaza", section: "VIP", capacity: 800, occupancy: 410, densityPct: 0, temperatureC: 26, noiseLevelDb: 55 },
    { id: "z-parking", name: "Parking Deck A", section: "Parking", capacity: 4000, occupancy: 3100, densityPct: 0, temperatureC: 30, noiseLevelDb: 60 },
  ];
  const zones: Zone[] = zoneSeeds.map((z) => ({ ...z, densityPct: Math.round((z.occupancy / z.capacity) * 100) }));

  const staff: StaffUnit[] = [
    { id: "s1", name: "R. Sharma", role: "Security", zone: "North Concourse", status: "available" },
    { id: "s2", name: "A. Verma", role: "Security", zone: "East Concourse", status: "deployed" },
    { id: "s3", name: "K. Iyer", role: "Medical", zone: "Main Concourse", status: "available" },
    { id: "s4", name: "M. Khan", role: "Steward", zone: "Lower Bowl South", status: "deployed" },
    { id: "s5", name: "P. Das", role: "Guest Services", zone: "VIP Plaza", status: "available" },
    { id: "s6", name: "T. Nair", role: "Maintenance", zone: "Parking Deck A", status: "on-break" },
    { id: "s7", name: "S. Reddy", role: "Medical", zone: "Upper Tier West", status: "available" },
    { id: "s8", name: "V. Singh", role: "Security", zone: "West Concourse", status: "available" },
  ];

  const concessions: Concession[] = [
    { id: "c1", name: "North Snack Bar", zone: "North Concourse", stockPct: 82, demandLevel: "moderate" },
    { id: "c2", name: "East Beverage Hub", zone: "East Concourse", stockPct: 46, demandLevel: "high" },
    { id: "c3", name: "South Grill", zone: "South Concourse", stockPct: 70, demandLevel: "low" },
    { id: "c4", name: "VIP Lounge Bar", zone: "VIP Plaza", stockPct: 91, demandLevel: "low" },
  ];

  const incidents: Incident[] = [
    {
      id: nextId("inc"),
      type: "lost-item",
      severity: "low",
      zone: "Main Concourse",
      description: "Guest reported a lost wallet near Section C entrance.",
      timestamp: Date.now() - 1000 * 60 * 12,
      resolved: false,
    },
  ];

  return {
    match: {
      tournament: "Continental Champions Cup - Final",
      fixture: "Titans FC vs Falcons United",
      venue: "Unity National Stadium",
      phase: "first-half",
      clock: "27:14",
      attendance: 28320,
      attendanceCapacity: 32000,
    },
    weather: {
      condition: "clear",
      temperatureC: 30,
      windKph: 12,
      updatedAt: Date.now(),
    },
    gates,
    zones,
    incidents,
    staff,
    concessions,
    tick: 0,
  };
}

const INCIDENT_LIBRARY: Array<{ type: IncidentType; severity: IncidentSeverity; description: string }> = [
  { type: "medical", severity: "high", description: "Fan reported dizziness and dehydration symptoms." },
  { type: "security", severity: "medium", description: "Altercation reported between two spectators." },
  { type: "crowd-surge", severity: "high", description: "Rapid inflow causing bottleneck at turnstiles." },
  { type: "technical", severity: "low", description: "Scoreboard display flickering intermittently." },
  { type: "lost-item", severity: "low", description: "Child reported separated from guardian." },
  { type: "weather", severity: "medium", description: "Gust of wind loosened banner near upper tier." },
];

/** Advances the simulated stadium telemetry by one tick, mimicking live sensor + IoT feeds. */
export function advanceSimulation(state: StadiumState): StadiumState {
  const tick = state.tick + 1;

  const gates: Gate[] = state.gates.map((gate) => {
    if (gate.status === "reserve" || gate.status === "closed") return gate;
    const drift = Math.round((Math.random() - 0.45) * 30);
    const queueLength = clamp(gate.queueLength + drift, 0, 400);
    const throughputPerMin = clamp(
      Math.round(gate.capacityPerMin * (0.7 + Math.random() * 0.3)),
      10,
      gate.capacityPerMin
    );
    const waitTimeMin = Math.round(queueLength / Math.max(throughputPerMin, 1));
    const status: Gate["status"] = queueLength > 150 ? "congested" : "open";
    return { ...gate, queueLength, throughputPerMin, waitTimeMin, status };
  });

  const zones: Zone[] = state.zones.map((zone) => {
    const drift = Math.round((Math.random() - 0.4) * zone.capacity * 0.03);
    const occupancy = clamp(zone.occupancy + drift, 0, zone.capacity);
    const densityPct = Math.round((occupancy / zone.capacity) * 100);
    const temperatureC = clamp(zone.temperatureC + (Math.random() - 0.5), 18, 42);
    const noiseLevelDb = clamp(zone.noiseLevelDb + (Math.random() - 0.5) * 4, 40, 110);
    return { ...zone, occupancy, densityPct, temperatureC: Math.round(temperatureC * 10) / 10, noiseLevelDb: Math.round(noiseLevelDb) };
  });

  const concessions: Concession[] = state.concessions.map((c) => {
    const consumption = Math.round(Math.random() * (c.demandLevel === "surge" ? 8 : c.demandLevel === "high" ? 5 : 2));
    const stockPct = clamp(c.stockPct - consumption, 0, 100);
    return { ...c, stockPct };
  });

  let incidents = state.incidents;
  if (Math.random() < 0.12) {
    const template = INCIDENT_LIBRARY[Math.floor(Math.random() * INCIDENT_LIBRARY.length)];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const incident: Incident = {
      id: nextId("inc"),
      type: template.type,
      severity: template.severity,
      zone: zone.name,
      description: template.description,
      timestamp: Date.now(),
      resolved: false,
    };
    incidents = [incident, ...state.incidents].slice(0, 25);
  }

  return { ...state, tick, gates, zones, concessions, incidents };
}

export function resolveIncident(state: StadiumState, id: string): StadiumState {
  return {
    ...state,
    incidents: state.incidents.map((i) => (i.id === id ? { ...i, resolved: true } : i)),
  };
}

export function toggleGate(state: StadiumState, id: string): StadiumState {
  return {
    ...state,
    gates: state.gates.map((g) => {
      if (g.id !== id) return g;
      if (g.status === "reserve") {
        return { ...g, status: "open", throughputPerMin: Math.round(g.capacityPerMin * 0.6) };
      }
      if (g.status === "closed") return { ...g, status: "open" };
      return { ...g, status: "reserve", queueLength: 0, waitTimeMin: 0, throughputPerMin: 0 };
    }),
  };
}

// --- Demo scenario injectors, used by the Control Room panel for scripted testing ---

export function injectHeavyRain(state: StadiumState): StadiumState {
  return {
    ...state,
    weather: { condition: "storm", temperatureC: 24, windKph: 46, updatedAt: Date.now() },
  };
}

export function injectHeatAdvisory(state: StadiumState): StadiumState {
  return {
    ...state,
    weather: { condition: "heat-advisory", temperatureC: 39, windKph: 6, updatedAt: Date.now() },
  };
}

export function injectClearWeather(state: StadiumState): StadiumState {
  return {
    ...state,
    weather: { condition: "clear", temperatureC: 29, windKph: 10, updatedAt: Date.now() },
  };
}

export function injectGateSurge(state: StadiumState): StadiumState {
  const target = state.gates[1];
  return {
    ...state,
    gates: state.gates.map((g) =>
      g.id === target.id ? { ...g, queueLength: 260, waitTimeMin: 18, status: "congested" } : g
    ),
  };
}

export function injectCriticalIncident(state: StadiumState): StadiumState {
  const incident: Incident = {
    id: nextId("inc"),
    type: "medical",
    severity: "critical",
    zone: "Lower Bowl South",
    description: "Multiple fans reported fainting due to overcrowding and heat.",
    timestamp: Date.now(),
    resolved: false,
  };
  return { ...state, incidents: [incident, ...state.incidents] };
}
