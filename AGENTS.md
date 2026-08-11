<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This repo uses Next `16.2.9` and React `19.2.4`; APIs and file conventions may differ from model defaults. Before changing Next code, read the relevant docs in `node_modules/next/dist/docs/` if dependencies are installed, and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

- Use Bun (`bun.lock`): `bun install`, `bun run dev`, `bun run build`.
- Checks: `bun run lint` (`biome check`), `bun run format`, `bun test`. Run one test file with `bun test path/to/file.test.ts`.
- There is no typecheck script; use `bunx tsc --noEmit`.
- Production builds validate every key in `src/env.ts`; use real env values or `SKIP_ENV_VALIDATION=1 bun run build` for a configuration-free build check.
- `db:studio` and `db:pull` load `.env.local`; `db:migrate` does not, so export `DATABASE_URL` before applying migrations. `db:generate` only compares the local schema and migration snapshots.
- Regenerate OG images and favicons with `bun run gen:assets`; the script writes both `public/favicon.ico` and Next's `src/app/favicon.ico`.

## App Structure

- The root country selector is `src/app/page.tsx`; other user-facing pages, including project/community and builder pages, live below `src/app/[locale]`. Locales are in `src/i18n/routing.ts` and copy is in `messages/*.json`.
- `src/proxy.ts` composes Clerk and `next-intl`. Unprefixed community URLs such as `/projects`, `/p/[slug]`, `/builders`, and `/insights` are legacy 308 redirects to `/en/...`; APIs and static/redirect routes skip intl.
- Protected page routing in `src/proxy.ts` is not the only authorization layer: API mutations authenticate again, and project edits/deletes enforce owner identity server-side.
- Root layout wires Clerk and TanStack Query globally in `src/app/layout.tsx`; client data helpers live in `src/lib/projects/queries.ts`.

## Data And Env

- Env shape is in `src/env.ts`/`.env.example`; validation is skipped outside production. Tests importing env-backed modules must set fake env vars before a dynamic import, as in `src/lib/projects/spam.test.ts`.
- All app stores use Drizzle through `src/db/` when `DATABASE_URL` exists and local `.data/*.json` fallbacks when it does not. Production deliberately throws if `DATABASE_URL` is missing instead of serving empty local data.
- Neon schema source of truth is `src/db/schema.ts` plus versioned migrations in `drizzle/`. For schema changes, generate and review a migration with `bun run db:generate -- --name=<name>`, then apply it with `bun run db:migrate`; never use `drizzle-kit push`.
- `supabase/` is historical pre-Neon material, not the active schema. `scripts/migrate-supabase-to-neon.ts` is the one-time data migration utility.

## UI Conventions

- Styling is Tailwind CSS v4 through `src/app/globals.css`, with shadcn config in `components.json` (`style: base-lyra`, Phosphor icons, aliases under `@/`).
- The visual language is a black-background, mono-font Build4Venezuela poster style using assets/fonts in `public/BFV`; preserve that before introducing generic shadcn-looking layouts.
