import { expect, mock, test } from "bun:test";

process.env.AI_GATEWAY_API_KEY = "test-ai-gateway-key";
process.env.CLERK_SECRET_KEY = "test-clerk-secret-key";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-clerk-publishable-key";
process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";

const rateLimitCounts = new Map<string, number>();

mock.module("@upstash/redis", () => ({
  Redis: class Redis {},
}));

mock.module("@upstash/ratelimit", () => ({
  Ratelimit: class Ratelimit {
    private readonly limitValue: number;

    constructor({ limiter }: { limiter: { limit: number } }) {
      this.limitValue = limiter.limit;
    }

    static slidingWindow(limit: number, _window: string) {
      return { limit };
    }

    async limit(key: string) {
      const count = (rateLimitCounts.get(key) ?? 0) + 1;
      rateLimitCounts.set(key, count);

      return {
        success: count <= this.limitValue,
        reset: Date.now() + 60_000,
        pending: Promise.resolve(),
      };
    }
  },
}));

async function apiSecurity() {
  return await import("./api-security");
}

test("readJsonObject returns a clean 400 response for malformed JSON", async () => {
  const { readJsonObject } = await apiSecurity();
  const result = await readJsonObject(
    new Request("https://example.test/api/projects", {
      body: "{",
      method: "POST",
    }),
  );

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      errors: { form: "Invalid JSON body." },
    });
  }
});

test("readJsonObject rejects non-object JSON bodies", async () => {
  const { readJsonObject } = await apiSecurity();
  const result = await readJsonObject(
    new Request("https://example.test/api/projects", {
      body: JSON.stringify(["not", "an", "object"]),
      method: "POST",
    }),
  );

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      errors: { form: "Expected a JSON object." },
    });
  }
});

test("rateLimitKey prefers Clerk user IDs over client IP headers", async () => {
  const { rateLimitKey } = await apiSecurity();
  const request = new Request("https://example.test/api/projects", {
    headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.2" },
  });

  expect(rateLimitKey(request, "project:create", "user_123")).toBe(
    "project:create:user:user_123",
  );
});

test("checkRateLimit blocks requests over the configured limit", async () => {
  const { checkRateLimit } = await apiSecurity();
  const key = `test:${crypto.randomUUID()}`;

  await expect(
    checkRateLimit({ key, limit: 2, windowMs: 60_000 }),
  ).resolves.toEqual({
    ok: true,
  });
  await expect(
    checkRateLimit({ key, limit: 2, windowMs: 60_000 }),
  ).resolves.toEqual({
    ok: true,
  });

  const result = await checkRateLimit({ key, limit: 2, windowMs: 60_000 });

  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.retryAfter).toBeGreaterThan(0);
  }
});
