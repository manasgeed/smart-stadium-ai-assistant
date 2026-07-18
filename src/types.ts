// Core domain types for the ArenaIQ Smart Stadium Operations Assistant

export type GateStatus = "open" | "congested" | "closed" | "reserve";

export interface Gate {
  id: string;
  name: string;
  zone: string;
  status: GateStatus;
  queueLength: number; // people currently queued
  waitTimeMin: number; // estimated wait time in minutes
  throughputPerMin: number; // scans per minute
  capacityPerMin: number; // max possible scans per minute
}

export interface Zone {
  id: string;
  name: string;
  section: "Lower Bowl" | "Upper Tier" | "Concourse" | "VIP" | "Parking";
  capacity: number;
  occupancy: number; // current headcount
  densityPct: number; // occupancy / capacity * 100
  temperatureC: number;
  noiseLevelDb: number;
}

export type IncidentType =
  | "medical"
  | "security"
  | "crowd-surge"
  | "weather"
  | "technical"
  | "lost-item";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  zone: string;
  description: string;
  timestamp: number;
  resolved: boolean;
}

export interface StaffUnit {
  id: string;
  name: string;
  role: "Security" | "Medical" | "Steward" | "Maintenance" | "Guest Services";
  zone: string;
  status: "available" | "deployed" | "on-break";
}

export interface Concession {
  id: string;
  name: string;
  zone: string;
  stockPct: number;
  demandLevel: "low" | "moderate" | "high" | "surge";
}

export type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "heat-advisory";

export interface WeatherState {
  condition: WeatherCondition;
  temperatureC: number;
  windKph: number;
  updatedAt: number;
}

export type MatchPhase =
  | "pre-match"
  | "first-half"
  | "half-time"
  | "second-half"
  | "post-match";

export interface MatchInfo {
  tournament: string;
  fixture: string;
  venue: string;
  phase: MatchPhase;
  clock: string;
  attendance: number;
  attendanceCapacity: number;
}

export type RecommendationCategory =
  | "crowd-flow"
  | "safety"
  | "weather"
  | "staffing"
  | "concessions"
  | "logistics";

export type RecommendationPriority = "info" | "advisory" | "urgent" | "critical";

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  rationale: string;
  action: string;
  relatedZone?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  source?: "gemini" | "offline";
}

export interface StadiumState {
  match: MatchInfo;
  weather: WeatherState;
  gates: Gate[];
  zones: Zone[];
  incidents: Incident[];
  staff: StaffUnit[];
  concessions: Concession[];
  tick: number;
}
