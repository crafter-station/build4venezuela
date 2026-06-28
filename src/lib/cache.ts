import { Redis } from "@upstash/redis";
import { env } from "@/env";
import { logError } from "@/lib/log";
import { withTimeout } from "@/lib/timeout";

// Redis REST calls should be fast; bound them so a stalled Upstash hop can't
// hold the render to the same 8s wall as a DB pool stall.
const REDIS_READ_TIMEOUT_MS = 2_000;

/**
 * Upstash-backed cache for hot server-side reads.
 *
 * The point is to keep the Postgres pool off the request hot path: `/projects`
 * and `/p/[slug]` render on every visit (`force-dynamic`), and the Supabase
 * transaction pooler caps concurrent connections — so reading from Redis instead
 * of the DB is what stops a few overlapping renders from starving the pool.
 *
 * Reads degrade gracefully to a direct DB call when Redis errors; writes are
 * best-effort (a failed `set`/`del` never blocks or throws into the request).
 */
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

type CacheOptions = {
  key: string;
  ttlSeconds: number;
};

export async function cachedAggregate<T>(
  { key, ttlSeconds }: CacheOptions,
  compute: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await withTimeout(
      redis.get<T>(key),
      REDIS_READ_TIMEOUT_MS,
      "cache.get",
    );
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (error) {
    logError("cache.get", error, { key });
  }

  const fresh = await compute();

  // Don't cache null/undefined (e.g. a missing slug) so a just-created record
  // isn't masked by a cached "not found".
  if (fresh !== null && fresh !== undefined) {
    redis.set(key, fresh, { ex: ttlSeconds }).catch((error) => {
      logError("cache.set", error, { key });
    });
  }

  return fresh;
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  const clean = keys.filter(Boolean);
  if (clean.length === 0) {
    return;
  }

  try {
    await redis.del(...clean);
  } catch (error) {
    logError("cache.invalidate", error, { keys: clean });
  }
}
