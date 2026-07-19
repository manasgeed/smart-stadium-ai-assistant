import type { ChatMessage } from "../types";
import { logger } from "./logger";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;
export const API_KEY_STORAGE_KEY = "arenaiq_gemini_api_key";

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (e.g. private browsing) - key simply won't persist.
  }
}

export interface FunctionCallInfo {
  name: string;
  args: Record<string, any>;
}

export interface GeminiCallResult {
  text: string;
  source: "gemini" | "offline";
  functionCall?: FunctionCallInfo;
}

const SYSTEM_PROMPT = `You are ArenaIQ, an elite AI Operations Assistant embedded in a Smart Stadium Command Center.
You help control-room staff, stewards, security leads and event managers make fast, safe, and practical decisions during a live tournament fixture.
You have access to a live operational context snapshot (gates, crowd density, weather, incidents, staff, concessions) and AI rule-based recommendations.

CORE BEHAVIORS:
1. Ground every answer in the provided context data. Reference concrete numbers (queue lengths, density %, wait times) to build trust.
2. Be concise, operational, and action-oriented. Provide professional briefings, not generic chatter.
3. Assess risk dynamically. If there is a critical/urgent safety issue, lead with it.
4. Never invent incidents, staff names, or numbers that are not present in the context.

TOOL USAGE & REASONING (CRITICAL):
You have access to operational tools (toggleGate, resolveIncident, dispatchMedical, broadcastAnnouncement).
When the user asks you to take an action, OR when you determine an action is urgently necessary:
1. You MUST first output a short 1-3 sentence explanation of WHY you are taking the action and WHAT the expected outcome is, based on the telemetry.
2. After your text explanation, you MUST trigger the appropriate tool call.
DO NOT just return the tool call silently. Always provide your operational reasoning first.`;

/**
 * Calls Google's Gemini generateContent REST API directly from the browser using a
 * user-supplied API key (stored only in localStorage, never hardcoded or transmitted
 * anywhere besides Google's endpoint). Falls back gracefully if no key is configured
 * or the request fails, so the assistant remains fully usable offline.
 */
export async function callGemini(
  apiKey: string,
  contextSummary: string,
  history: ChatMessage[],
  userMessage: string,
  onChunk?: (text: string) => void
): Promise<GeminiCallResult> {
  const recentHistory = history
    .slice(-6)
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body = {
    contents: [
      ...recentHistory,
      {
        role: "user",
        parts: [
          {
            text: `LIVE OPERATIONAL CONTEXT:\n${contextSummary}\n\nSTAFF QUESTION: ${userMessage}`,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    tools: [
      {
        functionDeclarations: [
          {
            name: "toggleGate",
            description: "Use this tool to manage crowd flow by toggling a gate's status between open, closed, or reserve. It should be used when queue lengths are too long, wait times exceed acceptable thresholds, or when explicitly requested by the user.",
            parameters: {
              type: "object",
              properties: {
                id: { type: "string", description: "The ID of the gate to toggle (e.g., 'gate-a', 'gate-vip')" },
              },
              required: ["id"],
            },
          },
          {
            name: "resolveIncident",
            description: "Use this tool to mark a stadium incident as resolved. It should only be used when the situation has actually been handled (e.g., medical team arrived, security handled the altercation) or when the user explicitly requests resolving it.",
            parameters: {
              type: "object",
              properties: {
                id: { type: "string", description: "The ID of the incident to resolve" },
              },
              required: ["id"],
            },
          },
          {
            name: "dispatchMedical",
            description: "Use this tool to dispatch medical staff to a specific location when a medical incident or emergency is reported.",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string", description: "The stadium zone or specific location where medical assistance is needed." },
              },
              required: ["location"],
            },
          },
          {
            name: "broadcastAnnouncement",
            description: "Use this tool to broadcast a public address announcement to the entire stadium. Use for critical safety warnings, weather alerts, or crowd management instructions.",
            parameters: {
              type: "object",
              properties: {
                message: { type: "string", description: "The precise message to be broadcasted over the PA system." },
              },
              required: ["message"],
            },
          },
        ],
      },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: "AUTO",
      },
    },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 400,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}&key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    if (!res.body) throw new Error("No response body from Gemini API");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let functionCall: FunctionCallInfo | undefined = undefined;

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();
          if (!dataStr) continue;
          
          try {
            const data = JSON.parse(dataStr);
            const parts = data?.candidates?.[0]?.content?.parts || [];
            
            for (const part of parts) {
              if (part.text) {
                text += part.text;
                if (onChunk) onChunk(text);
              }
              if (part.functionCall) {
                functionCall = {
                  name: part.functionCall.name,
                  args: part.functionCall.args,
                };
              }
            }
          } catch (e) {
            logger.warn("geminiClient", "Failed to parse SSE chunk", { dataStr, error: e });
          }
        }
      }
    }

    text = text.trim();

    if (!text && !functionCall) {
      throw new Error("Gemini returned an empty response.");
    }

    return { text, source: "gemini", functionCall };
  } finally {
    clearTimeout(timeout);
  }
}
