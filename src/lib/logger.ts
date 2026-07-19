/**
 * Centralized structured logger for ArenaIQ.
 * Ensures consistent log formatting and provides a single point of control
 * for verbosity and remote log shipping if implemented later.
 */

type LogLevel = "info" | "warn" | "error";

function formatMessage(level: LogLevel, context: string, message: string) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

export const logger = {
  info: (context: string, message: string, ...data: any[]) => {
    console.info(formatMessage("info", context, message), ...data);
  },
  warn: (context: string, message: string, ...data: any[]) => {
    console.warn(formatMessage("warn", context, message), ...data);
  },
  error: (context: string, message: string, err?: any) => {
    console.error(formatMessage("error", context, message), err || "");
  },
};
