import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "./DashboardView";
import type { StadiumState, Recommendation } from "../types";

const state: StadiumState = {
  match: {
    tournament: "Premier League",
    fixture: "Team A vs Team B",
    venue: "Arena",
    phase: "first-half",
    clock: "25:00",
    attendance: 50000,
    attendanceCapacity: 60000,
  },
  weather: {
    condition: "clear",
    temperatureC: 28,
    windKph: 10,
    updatedAt: Date.now(),
  },
  gates: [
    {
      id: "g1",
      name: "Gate 1",
      zone: "North",
      status: "open",
      queueLength: 20,
      waitTimeMin: 5,
      throughputPerMin: 40,
      capacityPerMin: 50,
    },
  ],
  zones: [
    {
      id: "z1",
      name: "North Stand",
      section: "Lower Bowl",
      capacity: 1000,
      occupancy: 800,
      densityPct: 80,
      temperatureC: 28,
      noiseLevelDb: 75,
    },
  ],
  incidents: [],
  staff: [],
  concessions: [],
  tick: 1,
};

const recommendations: Recommendation[] = [
  {
    id: "1",
    category: "crowd-flow",
    priority: "urgent",
    title: "High queue wait time",
    rationale: "Queue at Gate A is too long.",
    action: "Open reserve gate",
    createdAt: Date.now(),
    confidenceScore: 0.95,
    predictedImpact: "Reduces queue time by 30%",
  },
];

describe("DashboardView", () => {
  it("renders dashboard information", () => {
    render(
      <DashboardView
        state={state}
        recommendations={recommendations}
      />
    );

    expect(screen.getByText("Attendance")).toBeInTheDocument();
    expect(screen.getByText("50,000")).toBeInTheDocument();
    expect(screen.getByText("High queue wait time")).toBeInTheDocument();
  });
});