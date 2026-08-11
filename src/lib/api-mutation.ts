import { NextResponse } from "next/server";
import { logError, logEvent } from "@/lib/log";
import { withTimeout } from "@/lib/timeout";

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
