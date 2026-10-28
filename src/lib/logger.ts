/**
 * Structured JSON logger — one line per event, no sensitive data.
 * Sensitive keys (password, token, cookie, authorization) are redacted defensively.
 */
type Level = "debug" | "info" | "warn" | "error";

const REDACT_KEYS = /^(password|token|tokenHash|cookie|authorization|secret|sessionToken)$/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.test(k) ? "[REDACTED]" : redact(v);
    }
    return out;
  }
  return value;
}

function log(level: Level, msg: string, fields?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...(fields ? (redact(fields) as Record<string, unknown>) : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => log("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => log("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => log("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => log("error", msg, fields),
};
