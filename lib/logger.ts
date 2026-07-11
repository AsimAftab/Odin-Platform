/**
 * Minimal structured logger for route handlers: one JSON line per event so
 * hosted log drains (Vercel, Docker, CloudWatch, …) can parse level/tag/fields
 * instead of grepping "[tag]" prefixes. Deliberately dependency-free.
 */

type Level = "debug" | "info" | "warn" | "error";

function emit(
  level: Level,
  tag: string,
  message: string,
  fields?: Record<string, unknown>
) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    tag,
    message,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** Flattens an unknown thrown value into loggable fields. */
function errorFields(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { error: err.message, stack: err.stack };
  }
  return { error: String(err) };
}

export const logger = {
  debug: (tag: string, message: string, fields?: Record<string, unknown>) =>
    emit("debug", tag, message, fields),
  info: (tag: string, message: string, fields?: Record<string, unknown>) =>
    emit("info", tag, message, fields),
  warn: (tag: string, message: string, fields?: Record<string, unknown>) =>
    emit("warn", tag, message, fields),
  /** `err` is the caught value; extra fields merge alongside it. */
  error: (tag: string, err: unknown, fields?: Record<string, unknown>) =>
    emit("error", tag, "unhandled error", { ...errorFields(err), ...fields }),
};
