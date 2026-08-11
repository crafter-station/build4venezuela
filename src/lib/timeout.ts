/**
 * Reject after `ms` if `promise` hasn't settled.
 *
 * The underlying work isn't cancelled (the DB driver's own timeouts handle
 * that) — this just guarantees the *caller* stops waiting, so a server render or
 * route can't hang to Vercel's 300s wall (504) when a query stalls. Frees the
 * serverless invocation to return fast instead of pinning it for five minutes.
 */
export class TimeoutError extends Error {
  constructor(label: string) {
    super(`${label} timed out`);
    this.name = "TimeoutError";
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
