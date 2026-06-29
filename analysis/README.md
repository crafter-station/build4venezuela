# Project Repository Insights

Offline analysis of every Build4Venezuela project that links a GitHub repo:
tech stack, architecture, production-readiness, real-problem fit, and diffusion
(promo) readiness. Built to find merge/overlap candidates, judge maturity, and
decide which projects are ready to spotlight.

## Contents

- `INSIGHTS-REPORT.md` — human-readable report: recommendation tiers, diffusion
  shortlist, domain overlap map, and per-project detail.
- `insights.json` — machine-readable master record (28 projects): raw git/GitHub
  signals + technical analysis + product evaluation, merged per project.
- `insights/<slug>.json` — one record per project.
- `tools/` — the reusable pipeline (see below).

## Coverage

72 projects total → 35 had a GitHub repo (extracted via `contribute_in_url` →
`project_url` → description scan) → 28 were reachable and analyzed → 7 were
private / 404 / a user-profile link.

## Pipeline (how to re-run)

1. **Extract repos** from the DB (heuristic: first `github.com` URL found in
   `contribute_in_url`, then `project_url`, then `description_markdown`;
   deduped by repo). Output: `tools/repo-list.json`.
2. **Collect signals** — `tools/batch-collect.sh` shallow-clones each repo and
   scrapes stars/commits/contributors/LOC/languages via `gh` + `git`
   (`tools/collect-signals.sh` does one repo). Requires an authenticated `gh`.
3. **Analyze** — one agent per repo reads the cloned code and emits the
   technical schema (stack, architecture incl. ORM detection, code organization,
   production-readiness, maturity, viability, domain tags, red flags).
4. **Evaluate** — one agent per project reads the analysis + public metadata and
   fetches the live demo to score real-problem fit, product quality, and
   diffusion readiness.
5. **Merge + report** — join analysis + signals + DB metadata → `insights.json`
   → `INSIGHTS-REPORT.md`.

## Loading into the database (not yet applied)

A `project_insights` table is defined but **has not been applied to production**.

- Migration: `supabase/migrations/20260629020000_create_project_insights.sql`
- Drizzle surface: `projectInsights` in `src/db/schema.ts`
- Backfill: `tools/backfill-insights.ts`

To apply:

```bash
# 1. apply the migration (via your normal supabase migration flow) — do NOT drizzle-kit push
# 2. dry-run the backfill (read-only):
bun run analysis/tools/backfill-insights.ts analysis/insights.json
# 3. apply it:
bun run analysis/tools/backfill-insights.ts analysis/insights.json --apply
```

The backfill maps each `project_slug` to a real `project_id` (hyphen-insensitive,
so `aid-trace` ↔ `aidtrace`) and upserts on `project_id`.

## Caveats

- Scores are AI-generated from a single shallow clone; treat as a strong first
  pass, not ground truth. Re-run after repos change.
- `guacamalla` scored high technically but its live demo was unreachable at
  analysis time — verify before spotlighting.
- Slug duplicates exist in the project data (e.g. `aid-trace`/`aidtrace`,
  `apoyo-venezuela`/`apoyo-venezuela-org` are distinct projects with similar names).
