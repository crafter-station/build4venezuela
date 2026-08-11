import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { env } from "@/env";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type JsonObjectResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; response: NextResponse };

const unknownClient = "unknown";
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
const rateLimiters = new Map<string, Ratelimit>();

function rateLimitWindow(windowMs: number): Duration {
  return `${windowMs} ms`;
}

function getRateLimiter(limit: number, windowMs: number) {
  const key = `${limit}:${windowMs}`;
  const existing = rateLimiters.get(key);

  if (existing) {
    return existing;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, rateLimitWindow(windowMs)),
    prefix: `build4latam:ratelimit:${key}`,
  });

  rateLimiters.set(key, limiter);
  return limiter;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];

  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    forwardedFor?.trim() ??
    unknownClient
  );
}

export function rateLimitKey(
  request: Request,
  scope: string,
  userId?: string | null,
) {
  return `${scope}:${userId ? `user:${userId}` : `ip:${getClientIp(request)}`}`;
}

export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions) {
  try {
    const result = await getRateLimiter(limit, windowMs).limit(key);
    void result.pending.catch((error) => {
      console.error("Failed to persist rate-limit analytics", error);
    });

    if (result.success) {
      return { ok: true as const };
    }

    return {
      ok: false as const,
      retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error("Failed to check rate limit", error);
    return { ok: false as const, retryAfter: 60 };
  }
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function readJsonObject(
  request: Request,
): Promise<JsonObjectResult> {
  let value: unknown;

  try {
    value = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { errors: { form: "Invalid JSON body." } },
        { status: 400 },
      ),
    };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      ok: false,
      response: NextResponse.json(
        { errors: { form: "Expected a JSON object." } },
        { status: 400 },
      ),
    };
  }

  return { ok: true, value: value as Record<string, unknown> };
}
