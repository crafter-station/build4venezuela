# Build4Latam

Build4Latam is a multilingual platform for emergency-response tools and builder communities across Latin America. It grew from Build4Venezuela and includes country hubs, project submissions, browsing, voting, comments, spam checks, and community redirects.

## Tech Stack

- Next.js 16 App Router
- React 19
- Bun for package management and tests
- Tailwind CSS v4
- next-intl for localization
- Clerk for authentication
- Neon Postgres with Drizzle ORM for durable data
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
DATABASE_URL=
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

- `/` is the Build4Latam country selector.
- `/ve` and `/co` are the Venezuela and Colombia tool hubs.
- `/:locale` serves the localized landing page.
- `/:locale/projects` lists published community projects.
- `/:locale/submit` lets signed-in users submit projects.
- `/:locale/p/:slug` shows a project detail page with voting and comments.
- `/:locale/p/:slug/edit` lets the project owner edit their submission.

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

The typed schema is `src/db/schema.ts`. Versioned Neon migrations live in `drizzle/`:

- `bun run db:generate -- --name=<migration-name>` generates a migration.
- `bun run db:migrate` applies pending migrations to `DATABASE_URL`.

The stores use Drizzle when `DATABASE_URL` is configured and local `.data/*.json` fixtures in development when it is absent. `supabase/` is retained only as historical source material from the pre-Neon deployment.

## Project Features

- Authenticated project submission and editing via Clerk.
- Project validation with Zod.
- Project and comment spam checks through AI Gateway.
- Project voting and comment voting.
- Optimistic mutations and visibility-aware polling with TanStack Query.
- Markdown rendering for project descriptions.
- Hosted video embeds for YouTube, Vimeo, Loom, and Screen Studio links.

## Assets

Brand assets, social images, and custom fonts are stored under `public/BFV/`.
