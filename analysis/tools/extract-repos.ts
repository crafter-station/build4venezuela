/**
 * Step 1a — extract GitHub repos from the projects DB.
 * Heuristic: first github.com URL in contribute_in_url → project_url →
 * description_markdown, deduped by repo. Writes analysis/.work/repo-list.json.
 *
 * Run from repo root: bun run analysis/tools/extract-repos.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "@/db";
import { projects } from "@/db/schema";

const GH = /https?:\/\/(www\.)?github\.com\/[^\s)"'<>]+/i;
const firstGh = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const m = s.match(GH);
  return m ? m[0].replace(/[.,);]+$/, "") : null;
};

const rows = await db
  .select({
    slug: projects.slug,
    name: projects.name,
    projectUrl: projects.projectUrl,
    contributeInUrl: projects.contributeInUrl,
    descriptionMarkdown: projects.descriptionMarkdown,
  })
  .from(projects);

const out: {
  slug: string;
  name: string;
  repo_url: string;
  source_field: string;
}[] = [];
const seen = new Set<string>();

for (const r of rows) {
  const candidates: [string | null, string][] = [
    [firstGh(r.contributeInUrl), "contribute_in_url"],
    [firstGh(r.projectUrl), "project_url"],
    [firstGh(r.descriptionMarkdown), "description_markdown"],
  ];
  const hit = candidates.find(([u]) => u);
  if (!hit?.[0]) continue;
  const repo = hit[0];
  const norm = repo.toLowerCase().replace(/\.git$/, "").replace(/\/$/, "");
  if (seen.has(norm)) continue;
  seen.add(norm);
  out.push({ slug: r.slug, name: r.name, repo_url: repo, source_field: hit[1] });
}

const work = resolve(import.meta.dirname, "../.work");
mkdirSync(work, { recursive: true });
writeFileSync(`${work}/repo-list.json`, JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} repos to analysis/.work/repo-list.json`);
process.exit(0);
