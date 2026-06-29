# Updating the insights (refresh when there are more repos)

This is the step-by-step runbook to regenerate everything — the report, the
`insights.json` data, and the `/insights` dashboard — after new projects are
submitted or existing repos change.

> **Fastest path:** open Claude Code in this repo and say
> _"update the project insights"_. It will run the steps below (steps 3 and 5
> are AI workflows it drives for you). The manual commands are here so the
> process is transparent and reproducible.

## Prerequisites (once)

- `bun install` done, and a working **`DATABASE_URL`** in `.env` (reads the
  projects table).
- **`gh`** authenticated (`gh auth status`) — used to fetch repo metadata.
- `jq` installed.

All intermediate files land in `analysis/.work/` (gitignored). The committed
outputs are `analysis/insights.json`, `analysis/insights/*.json`,
`analysis/INSIGHTS-REPORT.md`, and `src/lib/insights/dataset.json`.

---

## Steps

Run everything from the repo root.

### 1. Pull repos + metadata from the DB

```bash
bun run analysis/tools/extract-repos.ts   # → analysis/.work/repo-list.json
bun run analysis/tools/export-meta.ts     # → analysis/.work/project-meta.json
```

`extract-repos.ts` finds each project's GitHub URL (first match in
`contribute_in_url` → `project_url` → `description_markdown`, deduped).

### 2. Clone repos + scrape signals

```bash
bash analysis/tools/batch-collect.sh
```

Shallow-clones each repo into `analysis/.work/repos/` and writes
`analysis/.work/signals/<slug>.json` (stars, commits, contributors, LOC,
languages). Prints an accessibility summary; unreachable repos (private/404/
profile links) are marked and skipped downstream.

### 3. Analyze the code (AI workflow)

```bash
bash analysis/tools/build-analyze-args.sh   # → analysis/.work/analyze-args.json
```

Then run the analyze workflow, passing that array as `args`:

- Script: `analysis/tools/workflows/analyze.workflow.js`
- In Claude Code: invoke the **Workflow** tool with
  `scriptPath: "analysis/tools/workflows/analyze.workflow.js"` and
  `args` = the contents of `analysis/.work/analyze-args.json`.
- Save the workflow's result array (the `.result` field of the task output) to
  **`analysis/.work/analysis-raw.json`**.

One agent per repo emits the technical schema (stack, architecture + ORM
detection, code organization, production-readiness, maturity, viability, domain
tags, red flags).

### 4. Merge (first pass — produces per-project files for step 5)

```bash
bash analysis/tools/merge-insights.sh
```

Joins analysis + signals + metadata into `analysis/insights.json` and
`analysis/insights/<slug>.json`. (Evaluation is left null until step 5.)

### 5. Evaluate the products (AI workflow)

```bash
bash analysis/tools/build-eval-args.sh      # → analysis/.work/eval-args.json
```

Then run the evaluate workflow:

- Script: `analysis/tools/workflows/evaluate.workflow.js`
- Invoke **Workflow** with that `scriptPath` and `args` = contents of
  `analysis/.work/eval-args.json`.
- Save its result array to **`analysis/.work/eval-raw.json`**.

One agent per project reads the analysis + public metadata and **fetches the
live demo** to score real-problem fit, product quality, and diffusion readiness.

### 6. Merge again (now with evaluation) + report

```bash
bash analysis/tools/merge-insights.sh       # picks up eval-raw.json this time
bash analysis/tools/gen-report.sh           # → analysis/INSIGHTS-REPORT.md
```

### 7. Rebuild the dashboard dataset

```bash
bun scripts/gen-insights-dataset.mjs        # → src/lib/insights/dataset.json
```

This trims `insights.json` and re-bakes the overlap-network layout.

### 8. Verify + commit

```bash
bunx tsc --noEmit && bun run lint && bun run build
git add -A && git commit -m "Refresh project insights (N repos)"
```

---

## TL;DR

```
extract-repos.ts + export-meta.ts   →  repo list + metadata
batch-collect.sh                    →  clones + signals
build-analyze-args.sh → [Workflow analyze.workflow.js] → analysis-raw.json
merge-insights.sh                   →  insights.json (analysis only)
build-eval-args.sh    → [Workflow evaluate.workflow.js] → eval-raw.json
merge-insights.sh + gen-report.sh   →  insights.json (+eval) + report
gen-insights-dataset.mjs            →  dashboard dataset
```

## Notes / knobs

- **Network density:** the overlap-network connects projects sharing **≥3**
  domain tags. Change the threshold in `scripts/gen-insights-dataset.mjs`
  (`shared.length >= 3`) if the graph gets too dense/sparse, then re-run step 7.
- **Cost:** steps 3 and 5 spawn one agent per repo (~28 today). Sonnet is used
  by default — see the `model:` option in the workflow scripts.
- **Scores are AI-generated** from a shallow clone — a strong first pass, not
  ground truth. Re-running is cheap; do it whenever repos change.
- **Optional DB load:** to push results into the `project_insights` table
  instead of (or in addition to) static JSON, apply the migration and run
  `bun run analysis/tools/backfill-insights.ts analysis/insights.json --apply`
  (see `analysis/README.md`).
