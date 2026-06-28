import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const requiredServerEnv = {
  AI_GATEWAY_API_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
};

const requiredClientEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
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
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
});
