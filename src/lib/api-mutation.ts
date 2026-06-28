import { NextResponse } from "next/server";
import { logError, logEvent } from "@/lib/log";

class TimeoutError extends Error {
  constructor(label: string) {
    super(`${label} timed out`);
    this.name = "TimeoutError";
  }
}

/**
 * Reject after `ms` if `promise` hasn't settled. The underlying work isn't
 * cancelled (its own DB/HTTP timeouts handle that) — this just guarantees the
 * caller stops waiting, so a route can't hang to Vercel's 300s wall.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

type MutationResult<T> = { value: T } | { response: NextResponse };

/**
 * Run a store mutation with a hard server-side timeout and structured logging.
 *
 * Returns `{ value }` on success or `{ response }` (a clean JSON 503) on
 * timeout/error — so the client always gets a parseable body instead of an
 * empty 504, and the handler is bounded regardless of how the store stalls.
 * Mirrors the `{ ok, value | response }` shape used by `readJsonObject`.
 */
export async function runMutation<T>(
  event: string,
  fields: Record<string, unknown>,
  op: () => Promise<T>,
  ms = 15_000,
): Promise<MutationResult<T>> {
  const start = Date.now();
  try {
    const value = await withTimeout(op(), ms, event);
    logEvent(event, { ...fields, ms: Date.now() - start, ok: true });
    return { value };
  } catch (error) {
    logError(event, error, { ...fields, ms: Date.now() - start });
    return {
      response: NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 503 },
      ),
    };
  }
}
