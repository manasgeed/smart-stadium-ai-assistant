import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, Cpu, Loader2, Send, Sparkles, User } from "lucide-react";
import type { ChatMessage, Recommendation, StadiumState, AppActions, CommandPayload } from "../types";
import { Badge } from "./ui/Badge";
import { callGemini } from "../lib/geminiClient";
import { logger } from "../lib/logger";
import {
  generateOfflineReply,
  detectOfflineCommand,
} from "../lib/offlineAssistant";
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
  actions,
  apiKey,
}: {
  state: StadiumState;
  recommendations: Recommendation[];
  actions: AppActions;
  apiKey: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function handleApprove(msgId: string, command: CommandPayload) {
    const result = actions.dispatchCommand(command.name, command.args, state);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            commandStatus: result.success ? "success" : "error",
            commandError: result.success ? undefined : result.error,
          };
        }
        return m;
      })
    );
  }

  const handleSend = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    setInput("");
    setError(null);
    setLoading(true);

    const contextSummary = summarizeContextForPrompt(state, recommendations);
    
    // Create placeholder message for the stream
    const tempMsgId = nextId("msg");
    setMessages((prev) => [
      ...prev,
      { id: nextId("msg"), role: "user", content: question, timestamp: Date.now() },
      { id: tempMsgId, role: "assistant", content: "", timestamp: Date.now(), source: apiKey ? "gemini" : "offline" },
    ]);

    try {
      if (apiKey) {
        try {
          // Stream Gemini response
          let currentText = "";
          const result = await callGemini(apiKey, contextSummary, messages, question, (chunkText) => {
            currentText = chunkText;
            setMessages((prev) =>
              prev.map((m) => (m.id === tempMsgId ? { ...m, content: currentText } : m))
            );
          });

          if (result.functionCall) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempMsgId
                  ? {
                      ...m,
                      content: result.text || currentText,
                      command: { name: result.functionCall!.name, args: result.functionCall!.args },
                      commandStatus: "pending",
                    }
                  : m
              )
            );
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === tempMsgId ? { ...m, content: result.text } : m))
            );
          }
          return; // Exit if Gemini succeeds
        } catch (geminiError: any) {
          logger.warn("Copilot", "Gemini API failed, triggering automatic offline failover.", { error: geminiError });
          setMessages((prev) =>
            prev.map((m) => (m.id === tempMsgId ? { ...m, content: "⚠️ Cloud AI unreachable. Routing to local reasoning engine...", source: "offline" } : m))
          );
          // Wait briefly to show the failover message
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      // Offline parsing (runs if apiKey is missing OR if Gemini throws an error)
      const fn = detectOfflineCommand(question) as { name: string, args: Record<string, any>, rationale?: string } | null;
      if (fn) {
        if (fn.rationale) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempMsgId
                ? {
                    ...m,
                    content: fn.rationale!,
                    command: { name: fn.name, args: fn.args },
                    commandStatus: "pending",
                  }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempMsgId
                ? {
                    ...m,
                    content: "Executing command...",
                    command: { name: fn.name, args: fn.args },
                    commandStatus: "pending",
                  }
                : m
            )
          );
        }
      } else {
        const offlineRes = generateOfflineReply(state, recommendations, question);
        await new Promise((r) => setTimeout(r, 450));
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsgId ? { ...m, content: offlineRes } : m))
        );
      }
      
    } catch (err: any) {
      logger.error("Copilot", "Complete failure in Assistant processing", err);
      setError("Critical system failure during processing.");
      setMessages((prev) => prev.filter((m) => m.id !== tempMsgId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">ArenaIQ Copilot</h2>
            <p className="text-[11px] text-slate-400">Context-aware operations assistant</p>
          </div>
        </div>
        <Badge tone={apiKey ? "violet" : "neutral"}>
          {apiKey ? (
            <>
              <Sparkles size={12} className="mr-1 inline" /> Live
            </>
          ) : (
            <>
              <Cpu size={12} className="mr-1 inline" /> Offline
            </>
          )}
        </Badge>
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
            Ask about gates, crowd density, weather, incidents, staffing, or concessions.
            The assistant grounds every answer in the live telemetry shown on the Dashboard.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                m.role === "user" ? "bg-slate-700 text-slate-200" : "bg-gradient-to-br from-cyan-500 to-violet-600 text-white"
              }`}
            >
              {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="flex max-w-[85%] flex-col gap-2">
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
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
              
              {m.command && (
                <div className={`rounded-xl p-3 ring-1 ${m.commandStatus === 'success' ? 'bg-emerald-500/10 ring-emerald-500/30' : m.commandStatus === 'error' ? 'bg-rose-500/10 ring-rose-500/30' : 'bg-slate-800/80 ring-cyan-500/50'}`}>
                  <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
                    {m.commandStatus === 'success' ? <Sparkles size={14} className="text-emerald-400" /> : m.commandStatus === 'error' ? <AlertCircle size={14} className="text-rose-400" /> : <Sparkles size={14} className="text-cyan-400" />}
                    {m.commandStatus === 'success' ? 'Executed Action' : m.commandStatus === 'error' ? 'Execution Failed' : 'Proposed Action'}
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    <span className="font-medium text-slate-400">Command:</span> {m.command.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    <span className="font-medium text-slate-400">Arguments:</span>
                    <pre className="mt-1 overflow-x-auto rounded bg-slate-900 p-2 text-[10px] text-slate-300">
                      {JSON.stringify(m.command.args, null, 2)}
                    </pre>
                  </div>
                  
                  {m.commandStatus === 'error' && (
                    <div className="mt-2 text-xs text-rose-300">
                      <span className="font-medium text-rose-400">Reason:</span> {m.commandError}
                    </div>
                  )}

                  {m.commandStatus === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleApprove(m.id, m.command!)}
                        className="flex-1 rounded-lg bg-cyan-600 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, commandStatus: 'error', commandError: 'Cancelled by user.' } : msg))}
                        className="flex-1 rounded-lg bg-slate-700 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
            <Loader2 size={14} className="animate-spin text-cyan-500" /> ArenaIQ is analyzing live telemetry...
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300 ring-1 ring-amber-500/30">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="border-t border-slate-800 p-3 bg-slate-950">
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
            placeholder="Ask about gates, incidents..."
            maxLength={500}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
