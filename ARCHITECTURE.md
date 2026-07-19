# ArenaIQ Architecture

## Overview
ArenaIQ is a React/TypeScript application designed as a Smart Stadium Operations Assistant. It features a live telemetry simulation engine, a rule-based decision engine, and an AI Copilot capable of reasoning over real-time data and executing stadium operations.

## Core Components
1. **Simulation Engine (`lib/simulation.ts`)**
   - Drives the core telemetry (tick-based).
   - Simulates realistic crowd flow, weather drift, concession consumption, and random incidents.
   - Houses the domain logic for mutating stadium state (e.g., `toggleGate`, `resolveIncident`).
2. **Decision Engine (`lib/decisionEngine.ts`)**
   - A deterministic, rule-based reasoning engine.
   - Generates ranked, explainable recommendations based on the live `StadiumState`.
   - Structures context for the AI Copilot prompts.
3. **Command Executor (`lib/commandExecutor.ts`)**
   - The unified entry point for all AI-driven and manual commands.
   - Receives command payloads (`CommandPayload`), validates arguments, and defers to `simulation.ts` logic to produce a new immutable state.
4. **AI Copilot (`lib/geminiClient.ts` & `lib/offlineAssistant.ts`)**
   - **Gemini**: Leverages the Gemini 2.0 Flash REST API with strict function calling (JSON Schema tools).
   - **Offline Fallback**: Uses regex-based natural language parsing to ensure core functionality remains available without an API key.

## Data Flow
1. `useStadiumContext` maintains the `StadiumState` and runs the tick interval.
2. `App.tsx` provides the layout and passes state/actions to views.
3. The AI Copilot (`AssistantView`) parses user intent and outputs a `pendingFunction`.
4. The user approves the function, calling `dispatchCommand`.
5. `commandExecutor` mutates the state, updating the UI globally.
