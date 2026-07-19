import { useState } from "react";
import { CloudLightning, KeyRound, PlayCircle, PauseCircle, Siren, Sun, Users2 } from "lucide-react";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { AppActions } from "../types";

export function SettingsView({
  apiKey,
  onSaveApiKey,
  live,
  actions,
}: {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  live: boolean;
  actions: AppActions;
}) {
  const [draft, setDraft] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Generative AI Configuration"
          subtitle="Connect a Google Gemini API key for live conversational reasoning"
          icon={<KeyRound size={16} />}
        />
        <div className="space-y-3 p-4">
          <p className="text-sm text-slate-400">
            ArenaIQ works fully offline using its built-in decision engine and local reasoning fallback.
            Optionally add a{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline underline-offset-2"
            >
              Gemini API key
            </a>{" "}
            to unlock free-form, natural-language conversation grounded in the same live context.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveApiKey(draft);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="api-key" className="sr-only">
              Gemini API key
            </label>
            <input
              id="api-key"
              type="password"
              autoComplete="off"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste your Gemini API key (kept only in this browser)"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {saved ? "Saved!" : "Save key"}
            </button>
          </form>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Badge tone={apiKey ? "violet" : "neutral"}>{apiKey ? "Gemini key configured" : "No key configured"}</Badge>
            <span>Stored only in this browser's local storage - never sent anywhere except Google's API.</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Live Simulation Control"
          subtitle="Pause/resume the telemetry feed"
          icon={live ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
          action={
            <button
              onClick={actions.toggleLive}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              {live ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
              {live ? "Pause feed" : "Resume feed"}
            </button>
          }
        />
        <div className="p-4 text-sm text-slate-400">
          The stadium telemetry (gates, crowd density, concessions) updates automatically every few seconds
          to emulate live IoT sensor feeds and turnstile scanners.
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Control Room Scenario Test Bench"
          subtitle="Inject test conditions to validate the decision engine and assistant responses"
          icon={<Siren size={16} />}
        />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <ScenarioButton icon={<CloudLightning size={16} />} label="Trigger storm" onClick={actions.simulateRain} />
          <ScenarioButton icon={<Sun size={16} />} label="Trigger heat advisory" onClick={actions.simulateHeat} />
          <ScenarioButton icon={<Sun size={16} />} label="Clear weather" onClick={actions.clearWeather} />
          <ScenarioButton icon={<Users2 size={16} />} label="Simulate gate surge" onClick={actions.simulateGateSurge} />
          <ScenarioButton icon={<Siren size={16} />} label="Simulate critical incident" onClick={actions.simulateCriticalIncident} />
        </div>
      </Card>
    </div>
  );
}

function ScenarioButton({
  icon,
  label,
  onClick,
  hidden,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      <span className="text-cyan-400">{icon}</span>
      {label}
    </button>
  );
}
