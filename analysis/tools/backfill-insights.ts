/**
 * Backfill project_insights from the offline analysis pipeline output.
 * Usage: bun run backfill-insights.ts <path-to-insights.json> [--apply]
 * Without --apply it does a dry run (prints what it would upsert).
 */
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projectInsights, projects } from "@/db/schema";

const file = process.argv[2];
const apply = process.argv.includes("--apply");
if (!file) {
  console.error("provide path to insights.json");
  process.exit(1);
}

const norm = (s: string) => s.toLowerCase().replace(/-/g, "");
const insights = JSON.parse(readFileSync(file, "utf8")) as Array<any>;

const allProjects = await db
  .select({ id: projects.id, slug: projects.slug })
  .from(projects);
const bySlug = new Map(allProjects.map((p) => [p.slug, p.id]));
const byNorm = new Map(allProjects.map((p) => [norm(p.slug), p.id]));

let matched = 0;
let unmatched: string[] = [];

for (const ins of insights) {
  const slug: string = ins.project_slug;
  const projectId = bySlug.get(slug) ?? byNorm.get(norm(slug));
  if (!projectId) {
    unmatched.push(slug);
    continue;
  }
  matched++;

  const a = ins.analysis ?? {};
  const e = ins.evaluation ?? {};
  const s = ins.signals ?? {};

  const row = {
    projectId,
    repoUrl: ins.repo_url ?? "",
    repoSourceField: null as string | null,
    repoAccessible: s.accessible ?? true,
    stars: s.stars ?? null,
    forks: s.forks ?? null,
    contributors: s.contributors ?? null,
    commitCount: s.commit_count ?? null,
    codeLoc: s.code_loc ?? null,
    license: s.license ?? null,
    repoCreatedAt: s.created_at ? new Date(s.created_at) : null,
    repoPushedAt: s.pushed_at ? new Date(s.pushed_at) : null,
    languages: s.languages_bytes ?? null,
    summary: a.summary ?? null,
    projectType: a.project_type ?? null,
    domainTags: a.domain_tags ?? [],
    usesOrm: a.architecture?.uses_orm ?? null,
    ormOrDbLayer: a.architecture?.orm_or_db_layer ?? null,
    maturityScore: a.maturity?.score ?? null,
    productionReadinessScore: a.production_readiness?.score ?? null,
    codeOrganizationScore: a.code_organization?.score ?? null,
    viabilityScore: a.viability?.score ?? null,
    stack: a.stack ?? null,
    architecture: a.architecture ?? null,
    redFlags: a.red_flags ?? [],
    analysis: a,
    solvesRealProblem: e.solves_real_problem ?? null,
    problemSeverity: e.problem_severity ?? null,
    impactPotential: e.impact_potential ?? null,
    productQuality: e.product_quality ?? null,
    diffusionScore: e.diffusion?.score ?? null,
    diffusionReady: e.diffusion?.ready_to_promote ?? null,
    liveDemoStatus: e.live_demo_status ?? null,
    overallRecommendation: e.overall_recommendation ?? null,
    oneLinePitch: e.one_line_pitch ?? null,
    evaluation: e,
  };

  if (apply) {
    await db
      .insert(projectInsights)
      .values(row)
      .onConflictDoUpdate({
        target: projectInsights.projectId,
        set: { ...row, updatedAt: new Date() },
      });
    console.log(`upserted ${slug}`);
  } else {
    console.log(
      `[dry] ${slug} -> ${projectId} | ${row.overallRecommendation} | viab ${row.viabilityScore} | tags ${row.domainTags.join(",")}`,
    );
  }
}

console.log(
  `\n${apply ? "APPLIED" : "DRY RUN"}: matched ${matched}/${insights.length}` +
    (unmatched.length ? `, unmatched: ${unmatched.join(", ")}` : ""),
);
process.exit(0);
