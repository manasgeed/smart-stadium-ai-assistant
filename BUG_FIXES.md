# ArenaIQ Bug Fixes & Refactors

## Architectural Fixes
1. **Command Execution Unification**: Previously, command logic was split between `AssistantView.tsx` (hardcoded switch) and a detached `commandExecutor.ts` which incorrectly overrode state logic. This was centralized by making `commandExecutor.ts` the single source of truth for command routing, while deferring actual domain mutations to `simulation.ts`.
2. **Props Prop-Drilling Issue**: `AssistantView` incorrectly expected a raw `setState` prop that `App.tsx` couldn't provide. Fixed by exposing a strict `dispatchCommand(name, args)` function from `useStadiumContext` and passing it securely to `AssistantView`.

## Typescript Strictness
- Replaced multiple instances of `any` with strict interfaces (e.g., `CommandPayload`).
- Ensured all functions returning/receiving state strongly type their arguments.

## State Simulation Fixes
- **Throughput Corruption**: Fixed a bug where `commandExecutor` changed gate status strings but failed to update `throughputPerMin`, which would have caused infinitely growing queues when gates were reopened.
- **Announcement State**: Added `lastAnnouncement` to `StadiumState` so broadcast commands have a persistent place in the telemetry.

## React Rendering
- **Performance**: Wrapped `DashboardView`, `GatesView`, and `IncidentsView` in `React.memo` to prevent deep DOM diffing during the 4000ms global simulation tick.
