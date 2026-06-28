import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * Lazily-initialized Drizzle client.
 *
 * The connection is deferred until first query so that importing this module
 * (e.g. while Next.js collects page data at build time, when secrets may be
 * absent) never touches the database. When `DATABASE_URL` is unset, `getDb()`
 * returns null and callers fall back to the local `.data/*.json` store.
 */
type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: DB;
};

export function isDbConfigured(): boolean {
  const configured = Boolean(env.DATABASE_URL);

  // In production a missing DATABASE_URL would silently route every read to the
  // empty local-file fallback — which looks exactly like data loss. Fail loudly
  // instead so a misconfigured deploy is obvious and the data is never hidden.
  // (Dev/test keep the convenient local fallback.)
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL must be set in production. Refusing to fall back to the empty local store so live data is never hidden.",
    );
  }

  return configured;
}

function createDb(): DB {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const isProduction = process.env.NODE_ENV === "production";

  // Supabase's transaction pooler (port 6543) requires `prepare: false`.
  //
  // Serverless timeout discipline: the pooler silently drops idle server-side
  // connections, so we must recycle ours proactively or a stale socket will
  // accept a query that never completes and the request hangs until Vercel's
  // 300s wall (504). `idle_timeout`/`max_lifetime` recycle connections,
  // `statement_timeout` bounds any single query server-side, and `max > 1`
  // keeps one stuck connection from stalling every concurrent request.
  const client =
    globalForDb.client ??
    postgres(env.DATABASE_URL, {
      prepare: false,
      max: isProduction ? 3 : 10,
      idle_timeout: 20,
      max_lifetime: 60 * 5,
      connect_timeout: 10,
      connection: { statement_timeout: 8000 },
    });

  if (!isProduction) globalForDb.client = client;
  return drizzle(client, { schema });
}

function getDbInstance(): DB {
  globalForDb.db ??= createDb();
  return globalForDb.db;
}

/** The Drizzle client, or null when `DATABASE_URL` is unset. */
export function getDb(): DB | null {
  return isDbConfigured() ? getDbInstance() : null;
}

/** Proxy that initializes the real client on first property access. */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    return Reflect.get(getDbInstance(), prop, receiver);
  },
});
