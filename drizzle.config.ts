import { defineConfig } from "drizzle-kit";

// Neon is the database source of truth. Generate versioned migrations from the
// typed schema and apply them with `drizzle-kit migrate`; never use `push`.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: only read by drizzle-kit CLI
    url: process.env.DATABASE_URL!,
  },
});
