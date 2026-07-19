import { useEffect, useMemo, useState } from "react";
import type { StadiumState } from "../types";
import {
  advanceSimulation,
  createInitialState,
  injectClearWeather,
  injectCriticalIncident,
  injectGateSurge,
  injectHeatAdvisory,
  injectHeavyRain,
  resolveIncident,
  toggleGate,
} from "../lib/simulation";
import { generateRecommendations } from "../lib/decisionEngine";
import { executeCommand } from "../lib/commandExecutor";

const TICK_MS = 4000;

export function useStadiumContext() {
  const [state, setState] = useState<StadiumState>(() => createInitialState());
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    
    // Pause simulation if tab is not visible to save CPU/battery
    let active = !document.hidden;
    
    const handleVisibility = () => {
      active = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const interval = setInterval(() => {
      if (active) {
        setState((prev) => advanceSimulation(prev));
      }
    }, TICK_MS);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [live]);

  const recommendations = useMemo(() => generateRecommendations(state), [state]);

  const actions = useMemo(
    () => ({
      toggleLive: () => setLive((v) => !v),
      dispatchCommand: (name: string, args: Record<string, any>, currentState: StadiumState) => {
        try {
          const newState = executeCommand(name, args, currentState);
          setState(newState);
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.message || "Unknown error during execution" };
        }
      },
      resolveIncident: (id: string) => setState((prev) => resolveIncident(prev, id)),
      toggleGate: (id: string, targetStatus?: string) => setState((prev) => toggleGate(prev, id, targetStatus)),
      simulateRain: () => setState((prev) => injectHeavyRain(prev)),
      simulateHeat: () => setState((prev) => injectHeatAdvisory(prev)),
      clearWeather: () => setState((prev) => injectClearWeather(prev)),
      simulateGateSurge: () => setState((prev) => injectGateSurge(prev)),
      simulateCriticalIncident: () => setState((prev) => injectCriticalIncident(prev)),
      forceTick: () => setState((prev) => advanceSimulation(prev)),
    }),
    []
  );

  return { state, recommendations, live, actions };
}
