import { z } from "zod";
import { StadiumState, Incident } from "../types";
import { toggleGate, resolveIncident } from "./simulation";

/**
 * Local stadium command execution engine.
 * Takes a command name, arguments, and the current state, and returns a new updated state.
 * Never mutates the original state.
 */
const toggleGateSchema = z.object({
  gate: z.string().trim().min(1).max(50),
  status: z.enum(["open", "closed", "reserve"]).optional(),
});

const dispatchMedicalSchema = z.object({
  location: z.string().trim().min(1).max(100),
});

const broadcastAnnouncementSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

const resolveIncidentSchema = z.object({
  incidentId: z.string().trim().min(1).max(100),
});

export function executeCommand(commandName: string, args: Record<string, any>, state: StadiumState): StadiumState {
  let newState = { ...state };

  switch (commandName) {
    case "toggleGate": {
      const parsed = toggleGateSchema.parse(args);
      const gateExists = state.gates.some((g) => g.id === parsed.gate);
      if (!gateExists) throw new Error(`Gate ID '${parsed.gate}' does not exist in the stadium layout.`);
      newState = toggleGate(newState, parsed.gate, parsed.status);
      break;
    }

    case "dispatchMedical": {
      const parsed = dispatchMedicalSchema.parse(args);
      const zoneExists = state.zones.some((z) => z.name.toLowerCase() === parsed.location.toLowerCase());
      if (!zoneExists) throw new Error(`Zone '${parsed.location}' does not exist in the stadium layout.`);
      
      const newIncident: Incident = {
        id: `med-${Date.now()}`,
        type: "medical",
        severity: "high",
        zone: parsed.location,
        description: "Medical response dispatched via command.",
        timestamp: Date.now(),
        resolved: false,
      };
      newState.incidents = [...state.incidents, newIncident];
      break;
    }

    case "broadcastAnnouncement": {
      const parsed = broadcastAnnouncementSchema.parse(args);
      newState.lastAnnouncement = parsed.message;
      break;
    }

    case "resolveIncident": {
      const parsed = resolveIncidentSchema.parse(args);
      const incidentExists = state.incidents.some((i) => i.id === parsed.incidentId);
      if (!incidentExists) throw new Error(`Incident ID '${parsed.incidentId}' does not exist.`);
      newState = resolveIncident(newState, parsed.incidentId);
      break;
    }

    default:
      throw new Error(`Unknown command requested: ${commandName}`);
  }

  return newState;
}
