import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const requiredServerEnv = {
  AI_GATEWAY_API_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  // Neon Postgres connection string. Optional outside production, where stores
  // can still use local JSON fixtures.
  DATABASE_URL: z.string().url().optional(),
};

const requiredClientEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
};

export const env = createEnv({
  server: {
    ...requiredServerEnv,
  },
  client: requiredClientEnv,
  emptyStringAsUndefined: true,
  skipValidation:
    process.env.NODE_ENV !== "production" || !!process.env.SKIP_ENV_VALIDATION,
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
});
