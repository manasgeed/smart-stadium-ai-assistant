# Changelog

## [1.6.0] - Reliability & Robustness Hardening

### Added
- **Automatic Offline Failover**: The AI Copilot now gracefully handles Gemini API errors (e.g., 401 Invalid Key, 429 Rate Limits, Network Timeouts). Instead of throwing fatal errors, it intercepts the failure, alerts the operator, and instantly routes the prompt to the local offline reasoning engine to guarantee 100% uptime.
- **Centralized Structured Logging**: Replaced scattered raw `console.*` outputs with a centralized `logger.ts` utility. The client now emits time-stamped, structured logs for easier debugging and potential remote shipping.

### Security & Hardening
- **Strict Input Sanitization**: Upgraded Zod schemas in `commandExecutor.ts`. All command arguments are now strictly trimmed of whitespace, and bounded by maximum string lengths to prevent malformed or hallucinated AI inputs from corrupting application state.
- **Defensive State Bounds**: Verified the simulation engine uses mathematical clamping (`Math.max(0)`) to strictly prevent any negative telemetry values (queue lengths, wait times, occupancy) regardless of anomaly logic.

## [1.5.1] - Performance & State Optimization

### Optimized
- **React Rendering Bottleneck Resolved**: Fixed a critical performance issue where the AI Copilot text streaming (SSE) triggered full application re-renders (forcing the Dashboard, Sidebar, and layout to diff 10+ times per second). 
  - `messages` state was moved locally to `AssistantView.tsx`.
  - The Copilot sidebar now hides via CSS `translate-x-full` rather than unmounting, preserving localized state without cascading re-renders up to `App.tsx`.
- **Memoization**: Confirmed `<DashboardView>`, `<GatesView>`, and `<IncidentsView>` effectively utilize `React.memo`, safely protecting them from unrelated component updates.
- **Bundle Efficiency**: Verified Vite tree-shaking is fully active on `lucide-react` and `zod`. Final minified/gzipped payload remains incredibly lean at ~112KB.

## [1.5.0] - Enterprise UX Polish

### Added
- **Persistent Command History**: AI Approval Cards are now embedded inline directly within the Copilot chat stream. Once an action is executed (or fails), the card locks its visual state and remains in the chat history to provide a permanent audit log.
- **Premium Animations**: Added smooth slide-in and fade-in entrances to AI chat bubbles and loading indicators (using a pulsing loader) to make interactions feel fluid.
- **Tactile Hover States**: Dashboard components (Cards, StatCards) now feature subtle lift (`-translate-y-1`) and shadow expansion on hover, elevating the premium "control room" aesthetic.

## [1.4.0] - Execution Rollback & Predictive Analysis

### Added
- **Predictive Crowd Analysis**: The decision engine now projects the future impact of each recommendation (e.g., "Reduces wait time at Gate B by ~40% within 10 mins").
- **AI Decision Transparency**: Each AI recommendation is now scored with a quantitative Confidence metric (0-100%). The dashboard renders this using a stylized progress bar, improving explainability for stadium operators.
- **Strict Execution Rollback**: Overhauled `commandExecutor.ts` to strictly validate commands against the live stadium layout (e.g., rejecting an AI hallucination trying to close a non-existent gate). 
- **Execution UI Feedback**: The Copilot chat now renders explicit `❌ Execution Failed` system alerts with exact rollback reasons if an AI command fails validation.

## [1.3.0] - AI Reasoning & React Performance

### Added
- **AI Chain-of-Thought**: Enforced a strict operational reasoning phase in the Gemini prompt. The assistant must explain the *why* based on live telemetry before staging a command card.
- **Offline Reasoning**: The offline engine now mimics this behavior, returning contextual explanations for commands (e.g., "Medical emergency acknowledged...") before prompting the user for approval.
- **Performance Optimization**: Hooked the `useStadiumContext` simulation loop into the Page Visibility API, halting background processing when the tab is inactive to save battery and CPU.
- **TypeScript Architecture**: Extracted a unified `AppActions` interface to remove prop-drilling duplication across major views.

## [1.2.0] - AI Streaming & Validation Architecture

### Added
- **AI Streaming**: Upgraded the Gemini API integration in `geminiClient.ts` to use `streamGenerateContent` via Server-Sent Events (SSE). The Copilot chat UI now updates progressively as chunks arrive, dramatically reducing perceived latency.
- **Runtime Validation**: Integrated `zod` into `commandExecutor.ts` to strictly validate all incoming AI command arguments against schemas (e.g. `toggleGateSchema`), preventing state corruption from AI hallucinations.
- **Context Filtering**: Optimized `summarizeContextForPrompt` in `decisionEngine.ts` to filter out nominal telemetry data (e.g., empty gates, fully stocked concessions). This massively reduces token bloat and improves AI focus on actual stadium anomalies.

## [1.1.0] - Production Hardening & Code Review

### Added
- **Command Architecture**: Unified `commandExecutor.ts` routing, properly deferring to `simulation.ts`.
- **AI Tools**: Added `dispatchMedical` and `broadcastAnnouncement` to Gemini's JSON schema definitions in `geminiClient.ts`.
- **Offline Parsing**: Expanded offline natural language detection to support all 4 core actions (Gates, Medical, Incident, Broadcast).
- **Keyboard Shortcut**: Added `Cmd/Ctrl + /` to quickly toggle the AI Copilot panel.
- **State Logging**: Added `lastAnnouncement` to track broadcast history and feed it back to the AI prompt.

### Fixed
- Fixed bug where `AssistantView` expected `setState` instead of `actions` from `App.tsx`.
- Fixed simulation bug where toggling a gate didn't accurately update queue throughputs.
- Removed `any` typings across core components.
- Reduced unnecessary React re-renders by wrapping large data views in `React.memo`.
