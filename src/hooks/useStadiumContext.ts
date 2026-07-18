import { useEffect, useMemo, useRef, useState } from "react";
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

const TICK_MS = 4000;

export function useStadiumContext() {
  const [state, setState] = useState<StadiumState>(() => createInitialState());
  const [live, setLive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!live) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setState((prev) => advanceSimulation(prev));
    }, TICK_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [live]);

  const recommendations = useMemo(() => generateRecommendations(state), [state]);

  const actions = useMemo(
    () => ({
      toggleLive: () => setLive((v) => !v),
      resolveIncident: (id: string) => setState((prev) => resolveIncident(prev, id)),
      toggleGate: (id: string) => setState((prev) => toggleGate(prev, id)),
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
