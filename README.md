# Build4Venezuela

Build4Venezuela is a multilingual Next.js app for the Build4Venezuela community. It includes the public landing page, project submissions, project browsing, voting, comments, spam checks, and community redirects.

## Tech Stack

- Next.js 16 App Router
- React 19
- Bun for package management and tests
- Tailwind CSS v4
- next-intl for localization
- Clerk for authentication
- Supabase for projects, votes, and comments
- AI SDK Gateway for submission/comment spam checks
- Biome for linting and formatting

## Getting Started

Install dependencies:

```bash
bun install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the required variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_GATEWAY_API_KEY=
```

Run the development server:

```bash
bun run dev
```

Open `http://localhost:3000`.

## Scripts

- `bun run dev` starts the Next.js development server.
- `bun run build` builds the app for production.
- `bun run start` starts the production server.
- `bun run lint` runs Biome checks.
- `bun run format` formats files with Biome.
- `bun test` runs the test suite.

## Main Routes

- `/` redirects through locale routing to the localized landing page.
- `/:locale` serves the localized landing page.
- `/projects` lists published community projects.
- `/submit` lets signed-in users submit projects.
- `/p/:slug` shows a project detail page with voting and comments.
- `/p/:slug/edit` lets the project owner edit their submission.

Community redirects are configured in `next.config.ts`:

- `/whatsapp` and `/wpp`
- `/discord`
- `/luma` and `/event`

## Localization

Translations live in `messages/`:

- `en.json`
- `es.json`
- `fr.json`
- `ja.json`
- `pt.json`
- `zh.json`

Locale routing is configured in `src/i18n/`.

## Data

Supabase schema files live in `supabase/`:

- `supabase/projects.sql`
- `supabase/migrations/20260626000000_create_projects.sql`
- `supabase/migrations/20260626010000_create_project_comments.sql`

The project store uses Supabase when configured (`DATABASE_URL`/Supabase env vars set) and only falls back to `.data/projects.json` locally when no database is configured at all — e.g. local development without those env vars. Once a database is configured, a runtime error is logged and propagated as a 500/503 response instead of silently falling back to the local file.

## Project Features

- Authenticated project submission and editing via Clerk.
- Project validation with Zod.
- Project and comment spam checks through AI Gateway.
- Project voting and comment voting.
- Realtime-friendly project/comment query helpers with TanStack Query.
- Markdown rendering for project descriptions.
- Hosted video embeds for YouTube, Vimeo, Loom, and Screen Studio links.

## Assets

Brand assets, social images, and custom fonts are stored under `public/BFV/`.
