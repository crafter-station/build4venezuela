# Insights Methodology

How every project on the `/insights` dashboard is scored. The goal: from a pile
of hackathon submissions, surface which projects are **real, ready, and safe** to
deploy for earthquake victims in Venezuela — and which need work first.

Everything is reproducible: see [`UPDATE.md`](./UPDATE.md) for the exact commands.
Scores are AI-generated from a shallow clone + the live demo — a strong, evidence-
based first pass, **not** ground truth. Re-running is cheap; we do it whenever
repos change.

---

## The pipeline (6 stages)

```
1. Collect   → find every project's repo, clone it, scrape git/GitHub signals
2. Analyze   → read the CODE; score architecture & production-readiness
3. Evaluate  → check the LIVE demo; score real-problem fit & product quality
4. Security  → audit for leaked data/secrets; re-check if past issues were fixed
5. Merge     → join all of the above per project
6. Publish   → bake the dashboard dataset + report
```

Each project gets its **own AI agent** at stages 2, 3, and 4 (one agent, one repo)
so judgments are independent and parallel. Agents are told to be skeptical and
**evidence-based** — score what the code/demo actually contains, not what the
README claims. Boilerplate and empty scaffolding score low on purpose.

---

## Stage 1 — Collect (deterministic, no AI)

- **Find the repo.** For each project we take the first GitHub URL in
  `contribute_in_url` → `project_url` → the description text, de-duplicated.
- **Clone + measure.** Shallow-clone (`--depth 50`) and scrape objective signals:
  stars, commit count, contributors, lines of real code, languages, license.
- **Reachability.** Private / 404 / profile-only links are flagged and skipped —
  no code, no score.

_This session: 88 projects → 46 had a repo link → **43 reachable & analyzed** →
3 repos returned 404._

## Stage 2 — Analyze the code (one AI agent per repo)

The agent inspects the actual source — `package.json`/lockfiles, Dockerfile/CI,
the DB layer (ORM vs raw SQL vs BaaS), auth, error handling, secret management,
tests — and returns:

| Dimension | Scale | What it measures |
|---|---|---|
| **Maturity** | 1–5 | Real product vs. boilerplate (readme/tests/CI, iterated commits) |
| **Production-readiness** | 1–5 | Auth, error handling, logging, env/secrets, deploy config |
| **Code organization** | 1–5 | Structure, naming, documentation quality |
| **Viability** | 1–5 | Could this realistically be deployed to help victims |

**Rubric:** `1` = empty skeleton · `2` = early prototype · `3` = working MVP ·
`4` = polished/usable · `5` = production-grade.

Plus: stack detection, architecture pattern, **domain tags** (from a controlled
vocabulary — people-finder, shelter-mapping, seismic-data, etc.), merge potential,
and explicit **red flags**.

## Stage 3 — Evaluate the product (one AI agent per project)

The agent reads the Stage-2 analysis **and fetches the live demo** to judge
real-world value, not just code:

| Dimension | Scale / values | What it measures |
|---|---|---|
| **Solves a real problem** | yes / partial / no / unclear | Genuine victim need vs. novelty |
| **Problem severity** | critical / high / medium / low | How urgent the need is |
| **Impact potential** | 1–5 | How many victims it could realistically help |
| **Product quality** | 1–5 | How complete/usable the actual product is |
| **Live demo status** | working / partial / broken / no-public-demo / unknown | Does it actually run |
| **Diffusion readiness** | 1–5 + `ready_to_promote` | Is there something real to promote *today* |

Hard rule enforced in the prompt: **a polished landing page with no working
product is not high quality.** "Ready to promote" requires something a victim or
donor could use right now. Each project also gets available promo assets, a
recommended angle, gaps, and a marketing-ready one-line pitch.

### The final tier

`overall_recommendation` rolls the above into one label used to rank the board:

- **spotlight** — best; promote heavily
- **promote** — solid; ready to share
- **merge-candidate** — overlaps strongly with another project; combine
- **improve-first** — real but not presentable yet
- **deprioritize** — boilerplate / broken / out of scope

## Stage 4 — Security audit + re-audit (one AI agent per repo)

A separate axis from product quality. An auditor agent hunts for the failure
modes that matter for a disaster-relief app handling victim data:

- Committed secrets (service-role keys, API keys, DB URLs, signing secrets)
- Missing auth on state-changing endpoints; **mass-assignment**
- **PII exposure** (names, phones, national IDs, locations of missing people)
  via public/anon access or leaky API responses
- Supabase RLS disabled / anon write access; open CORS
- Injection, SSRF, open proxies, unrestricted upload

Each repo gets an overall **risk** (critical / high / medium / low / none) = the
severity of its worst still-open finding.

**Re-audit (what makes this a living check).** On a repeat run, the agent doesn't
just re-scan — for every *previous* finding it opens the current code and marks it:

- **resolved** — properly fixed
- **partial** — mitigated but still exploitable
- **open** — unchanged

…scans for **new** issues, and checks the state of the disclosure GitHub issue.
The dashboard then shows each finding's status, the risk delta vs. last audit
(e.g. "was high"), and a short note on what changed. This is how we tell teams
that *actually fixed* their issues apart from teams that didn't.

## Stages 5–6 — Merge & publish

Analysis + evaluation + signals + security are joined per project into
`insights.json`, rendered to `INSIGHTS-REPORT.md`, and trimmed into the dashboard
dataset. The overlap-network graph connects projects sharing **≥3 domain tags**,
laid out with a deterministic force-directed algorithm (fixed coordinates — no
runtime randomness).

---

## What the scores are — and aren't

- **A strong first pass, not a verdict.** Every score is AI-generated from one
  shallow clone and one demo fetch. Treat it as triage, not a final grade.
- **Independent per project.** No agent sees another's scores, so there's no
  ranking contamination — but also no cross-project calibration beyond the shared
  rubric.
- **Point-in-time.** Repos and demos change. A score reflects the code at clone
  time; the security section additionally records when it was (re-)audited.
- **Two separate axes.** A project can be an excellent product (spotlight) *and*
  carry a critical security risk — those are reported independently, on purpose.
