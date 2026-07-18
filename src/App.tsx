import { useEffect, useState } from "react";
import { Activity, LayoutDashboard, MessageSquareText, Settings2, ShieldAlert, Sparkles } from "lucide-react";
import { Sidebar, type NavItem } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { GatesView } from "./components/GatesView";
import { IncidentsView } from "./components/IncidentsView";
import { AssistantView } from "./components/AssistantView";
import { SettingsView } from "./components/SettingsView";
import { useStadiumContext } from "./hooks/useStadiumContext";
import { getStoredApiKey, storeApiKey } from "./lib/geminiClient";
import type { ChatMessage } from "./types";
import { Badge } from "./components/ui/Badge";

type TabId = "dashboard" | "gates" | "incidents" | "assistant" | "settings";

export default function App() {
  const { state, recommendations, live, actions } = useStadiumContext();
  const [tab, setTab] = useState<TabId>("dashboard");
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setApiKey(getStoredApiKey());
  }, []);

  const handleSaveApiKey = (key: string) => {
    storeApiKey(key);
    setApiKey(key.trim());
  };

  const openIncidentCount = state.incidents.filter((i) => !i.resolved).length;
  const criticalCount = recommendations.filter((r) => r.priority === "critical").length;

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
    { id: "gates", label: "Gates & Staffing", icon: Activity },
    { id: "incidents", label: "Incidents", icon: ShieldAlert, badge: openIncidentCount },
    { id: "assistant", label: "AI Assistant", icon: MessageSquareText },
    { id: "settings", label: "Control Room", icon: Settings2 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-semibold">ArenaIQ</span>
        </div>
        <Badge tone={live ? "success" : "neutral"}>{live ? "LIVE" : "PAUSED"}</Badge>
      </header>

      <Sidebar items={navItems} active={tab} onSelect={(id) => setTab(id as TabId)} />

      <div className="flex flex-1 flex-col">
        <header className="hidden items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-900/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-slate-50">ArenaIQ</h1>
              <p className="text-xs text-slate-500">Smart Stadium & Tournament Operations Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <Badge tone="danger">
                <ShieldAlert size={12} className="mr-1 inline" /> {criticalCount} critical alert
                {criticalCount > 1 ? "s" : ""}
              </Badge>
            )}
            <Badge tone={live ? "success" : "neutral"}>{live ? "● LIVE FEED" : "PAUSED"}</Badge>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">
            {tab === "dashboard" && <DashboardView state={state} recommendations={recommendations} />}
            {tab === "gates" && <GatesView state={state} onToggleGate={actions.toggleGate} />}
            {tab === "incidents" && (
              <IncidentsView state={state} onResolve={actions.resolveIncident} />
            )}
            {tab === "assistant" && (
              <AssistantView
                state={state}
                recommendations={recommendations}
                apiKey={apiKey}
                messages={messages}
                setMessages={setMessages}
              />
            )}
            {tab === "settings" && (
              <SettingsView
                apiKey={apiKey}
                onSaveApiKey={handleSaveApiKey}
                live={live}
                onToggleLive={actions.toggleLive}
                onSimulateRain={actions.simulateRain}
                onSimulateHeat={actions.simulateHeat}
                onClearWeather={actions.clearWeather}
                onSimulateGateSurge={actions.simulateGateSurge}
                onSimulateCriticalIncident={actions.simulateCriticalIncident}
              />
            )}
          </div>
        </main>

        <footer className="border-t border-slate-800 px-6 py-3 text-center text-xs text-slate-600">
          ArenaIQ · Built for the Smart Stadiums &amp; Tournament Operations challenge · Simulated demo data
        </footer>
      </div>
    </div>
  );
}
