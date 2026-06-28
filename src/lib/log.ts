/**
 * Tiny structured logger for server-side observability.
 *
 * Every event is emitted as a single-line JSON object prefixed with `b4v` so it
 * can be filtered in Vercel's log drain (search `b4v` or a specific `evt`).
 * Keep payloads free of PII / large bodies — log lengths and ids, not content.
 */
type Fields = Record<string, unknown>;

function emit(level: "info" | "error", event: string, fields: Fields) {
  const line = {
    tag: "b4v",
    evt: event,
    at: new Date().toISOString(),
    ...fields,
  };

  try {
    const serialized = JSON.stringify(line);
    if (level === "error") {
      console.error(serialized);
    } else {
      console.log(serialized);
    }
  } catch {
    // Never let logging throw into the request path.
    console.log(`b4v ${event}`);
  }
}

export function logEvent(event: string, fields: Fields = {}) {
  emit("info", event, fields);
}

export function logError(event: string, error: unknown, fields: Fields = {}) {
  emit("error", event, {
    ...fields,
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    errorName: error instanceof Error ? error.name : undefined,
  });
}

/**
 * Run `fn`, logging how long it took and whether it succeeded. On failure it
 * logs the error (including `TimeoutError`/`AbortError` names so a stalled
 * upstream is obvious) and re-throws so callers keep their existing control flow.
 */
export async function timed<T>(
  event: string,
  fields: Fields,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logEvent(event, { ...fields, ms: Date.now() - start, ok: true });
    return result;
  } catch (error) {
    logError(event, error, { ...fields, ms: Date.now() - start });
    throw error;
  }
}
