# ArenaIQ — Smart Stadium & Tournament Operations AI Assistant

> Built for **PromptWars Virtual — Challenge 4: Smart Stadiums & Tournament Operations**

ArenaIQ is a context-aware Generative AI copilot for stadium control rooms. It fuses a
live (simulated) operations telemetry feed — gates, crowd density, weather, incidents,
staffing and concessions — with a deterministic rule-based decision engine and a
Generative AI (Google Gemini) conversational layer, so control-room staff can ask
natural-language questions and get grounded, actionable, real-time answers.

## 1. Chosen Vertical

**Smart Stadiums & Tournament Operations.** The persona is a stadium **Control Room
Operator / Event Manager** running a live tournament fixture who needs fast, correct,
prioritized decisions during a fast-moving event (entry congestion, crowd density
spikes, weather changes, medical/security incidents, staffing gaps, concession
stockouts).

## 2. Approach & Logic

ArenaIQ is deliberately built in two cooperating layers so it is both **trustworthy**
and **genuinely generative**:

1. **Deterministic Decision Engine** (`src/lib/decisionEngine.ts`)
   A rule-based reasoning core continuously inspects the live stadium state and derives
   explainable, prioritized recommendations (critical → urgent → advisory → info),
   each with a `rationale` (why) and an `action` (what to do). This guarantees the
   assistant never "hallucinates" facts about the venue — numbers always trace back to
   the live telemetry.

2. **Generative AI Conversational Layer** (`src/lib/geminiClient.ts`)
   The same live context snapshot + the decision engine's output are compiled into a
   structured prompt and sent to **Google's Gemini API** (`gemini-2.0-flash`,
   `generateContent` REST endpoint) with a system instruction that constrains the
   model to ground its answers in the supplied data, prioritize safety-critical issues,
   and respond like a professional operations briefing.
   - The user supplies their **own** Gemini API key (Settings → Control Room), stored
     only in `localStorage` on their machine. No key is hardcoded or bundled in the
     repository.
   - If no key is configured, or the live call fails/times out, ArenaIQ **automatically
     falls back** to a local, still fully context-aware reasoning engine
     (`src/lib/offlineAssistant.ts`) that performs lightweight intent detection and
     answers from the exact same live data — so the app is 100% functional and
     demoable without any external dependency or API cost, while remaining upgradeable
     to true generative reasoning in one step.

This two-layer design directly demonstrates **"logical decision-making based on user
context"**: every recommendation and every chat answer is derived live from the current
simulated sensor state (queue lengths, density %, weather, open incidents, staff
availability, concession stock) rather than static, scripted content.

### Why simulate telemetry?
Real stadium IoT/turnstile/CCTV feeds are not publicly available for a demo build. A
realistic simulation engine (`src/lib/simulation.ts`) drives believable, continuously
changing operational data (updated every 4 seconds) so the decision engine and AI
assistant have genuine live context to reason over — exactly like they would with real
sensor integrations in production. A **Control Room Scenario Test Bench** lets judges
trigger specific conditions (storm, heat advisory, gate surge, critical medical
incident) on demand to instantly see the assistant adapt its reasoning.

## 3. How the Solution Works

| Screen | Purpose |
|---|---|
| **Command Center** | KPIs (attendance, avg. gate wait, avg. zone density, open incidents), live zone density bars, weather widget, and the top AI-ranked recommendation feed. |
| **Gates & Staffing** | Per-gate live queue/wait/throughput telemetry with a one-click "activate reserve gate" control, plus the live staff roster by zone and status. |
| **Incidents** | Full incident log (open/resolved) with severity badges and one-click resolve, plus concession stock levels. |
| **AI Assistant** | Chat interface grounded in live context. Works with or without a Gemini API key (clearly labeled "Gemini Live" vs "Offline Reasoning"). Includes quick-suggestion prompts. |
| **Control Room** | Configure your Gemini API key, pause/resume the live simulation, and trigger test scenarios for demonstration/QA. |

### Example interactions
- *"What should I prioritize right now?"* → Assistant surfaces the highest-severity
  open recommendation with its rationale and concrete action.
- *"Which gate needs attention?"* → Identifies the gate with the longest queue/wait and
  suggests activating a reserve gate or redeploying stewards.
- *"Any weather-related risk?"* → Reads live weather state and gives protocol-specific
  guidance (e.g., storm → move queues under cover; heat advisory → open hydration
  stations).

## 4. Tech Stack

- **React 19 + TypeScript + Vite** — component architecture, strict typing throughout.
- **Tailwind CSS 4** — dark, high-contrast "control room" UI.
- **lucide-react** — accessible icon set.
- **Google Gemini API** (`generateContent`, model `gemini-2.0-flash`) via a direct,
  key-authenticated `fetch` call — no server component required, but the key never
  leaves the browser except to Google's endpoint.

## 5. Key Design Decisions & Assumptions

- **No hardcoded secrets.** Per security best practice, no API key is committed to the
  repository. Users paste their own key locally; it is stored in `localStorage` only.
- **Graceful degradation.** Every Gemini call has a robust local fallback so the app
  never breaks, times out silently, or shows an empty state to the operator.
- **Explainability over black-box answers.** Both the rule engine and the AI layer are
  instructed to always state *why* (rationale) before *what to do* (action) — critical
  for high-stakes operational tooling.
- **Simulated but realistic data.** All venue, gate, crowd, weather and incident data
  is synthetically generated to model a real top-tier stadium during a live final,
  since no public real-time stadium API was available for this build.
- **Accessibility-first.** Semantic landmarks (`header`, `nav`, `main`, `footer`), a
  skip-to-content link, `aria-live` chat region, `role="progressbar"` density meters,
  labeled form controls, visible focus rings, and sufficient color contrast throughout
  the dark theme.
- **Performance & efficiency.** Simulation ticks are capped/cleaned up via `useEffect`,
  recommendation generation is memoized (`useMemo`), incident/message history is capped
  to prevent unbounded memory growth, and the production build is a single inlined
  bundle (~90 KB gzipped) for fast cold loads.

## 6. Running Locally

```bash
npm install
npm run dev      # start dev server
npm run build    # production build (outputs to dist/)
npm run preview  # preview the production build
```

To enable live Gemini responses, open the app → **Control Room** tab → paste a Gemini
API key (get one free at https://aistudio.google.com/app/apikey) → **Save key**. Without
a key, the assistant automatically uses its built-in offline reasoning engine.

## 7. Project Structure

```
src/
  types.ts                 Domain types (gates, zones, incidents, staff, recommendations...)
  lib/
    simulation.ts           Live telemetry generator + scenario injectors
    decisionEngine.ts        Rule-based recommendation engine (the "brain")
    geminiClient.ts          Gemini REST API integration
    offlineAssistant.ts      Context-aware offline fallback reasoning
  hooks/
    useStadiumContext.ts     Live state + interval ticking + actions
  components/
    DashboardView.tsx, GatesView.tsx, IncidentsView.tsx,
    AssistantView.tsx, SettingsView.tsx, Sidebar.tsx, ui/*
  App.tsx                    Shell, navigation, wiring
```

## 8. Submission Notes

This repository is intentionally self-contained (no server, no database) so it can be
deployed instantly to any static host (Vercel, Netlify, GitHub Pages) and stays well
under the 10 MB repository size limit.
