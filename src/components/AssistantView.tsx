import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, Cpu, Loader2, Send, Sparkles, User } from "lucide-react";
import type { ChatMessage, Recommendation, StadiumState } from "../types";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { callGemini } from "../lib/geminiClient";
import { generateOfflineReply } from "../lib/offlineAssistant";
import { summarizeContextForPrompt } from "../lib/decisionEngine";
import { nextId } from "../lib/simulation";

const SUGGESTIONS = [
  "What should I prioritize right now?",
  "Which gate needs attention?",
  "Any weather-related risk?",
  "Give me a full status briefing.",
];

export function AssistantView({
  state,
  recommendations,
  apiKey,
  messages,
  setMessages,
}: {
  state: StadiumState;
  recommendations: Recommendation[];
  apiKey: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setError(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: nextId("msg"),
      role: "user",
      content: question,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const contextSummary = summarizeContextForPrompt(state, recommendations);

    try {
      if (apiKey) {
        const result = await callGemini(apiKey, contextSummary, messages, question);
        setMessages((prev) => [
          ...prev,
          { id: nextId("msg"), role: "assistant", content: result.text, timestamp: Date.now(), source: result.source },
        ]);
      } else {
        const reply = generateOfflineReply(state, recommendations, question);
        await new Promise((r) => setTimeout(r, 350));
        setMessages((prev) => [
          ...prev,
          { id: nextId("msg"), role: "assistant", content: reply, timestamp: Date.now(), source: "offline" },
        ]);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error contacting Gemini API.";
      setError(`Live AI request failed (${message}). Showing local reasoning instead.`);
      const reply = generateOfflineReply(state, recommendations, question);
      setMessages((prev) => [
        ...prev,
        { id: nextId("msg"), role: "assistant", content: reply, timestamp: Date.now(), source: "offline" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">ArenaIQ Assistant</h2>
              <p className="text-xs text-slate-400">Context-aware stadium operations copilot</p>
            </div>
          </div>
          <Badge tone={apiKey ? "violet" : "neutral"}>
            {apiKey ? (
              <>
                <Sparkles size={12} className="mr-1 inline" /> Gemini Live
              </>
            ) : (
              <>
                <Cpu size={12} className="mr-1 inline" /> Offline Reasoning
              </>
            )}
          </Badge>
        </div>

        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          className="flex-1 space-y-4 overflow-y-auto p-4"
          style={{ minHeight: 320, maxHeight: "52vh" }}
        >
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
              Ask about gates, crowd density, weather, incidents, staffing, or concessions.
              The assistant grounds every answer in the live telemetry shown on the Dashboard.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  m.role === "user" ? "bg-slate-700 text-slate-200" : "bg-gradient-to-br from-cyan-500 to-violet-600 text-white"
                }`}
              >
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-cyan-600/20 text-cyan-50 ring-1 ring-cyan-600/30"
                    : "bg-slate-800/80 text-slate-100 ring-1 ring-slate-700/60"
                }`}
              >
                {m.content}
                {m.source && (
                  <div className="mt-1.5 text-[10px] uppercase tracking-wide text-slate-500">
                    {m.source === "gemini" ? "Gemini generated" : "Local reasoning engine"} ·{" "}
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" /> ArenaIQ is analyzing live telemetry...
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300 ring-1 ring-amber-500/30">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                disabled={loading}
                className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Ask ArenaIQ a question
            </label>
            <input
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about gates, crowd, weather, incidents..."
              maxLength={500}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
