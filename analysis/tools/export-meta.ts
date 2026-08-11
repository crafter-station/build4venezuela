/**
 * Step 1b — export project metadata (used by the evaluation pass for live_url,
 * video_url, descriptions). Writes analysis/.work/project-meta.json.
 *
 * Run from repo root: bun run analysis/tools/export-meta.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "@/db";
import { projects } from "@/db/schema";

const rows = await db
  .select({
    slug: projects.slug,
    name: projects.name,
    status: projects.status,
    lifecycleStatus: projects.lifecycleStatus,
    projectUrl: projects.projectUrl,
    videoUrl: projects.videoUrl,
    contributeInUrl: projects.contributeInUrl,
    countries: projects.countries,
    participantName: projects.participantName,
    descriptionMarkdown: projects.descriptionMarkdown,
  })
  .from(projects);

const work = resolve(import.meta.dirname, "../.work");
mkdirSync(work, { recursive: true });
writeFileSync(`${work}/project-meta.json`, JSON.stringify(rows, null, 2));
console.log(`wrote ${rows.length} projects to analysis/.work/project-meta.json`);
process.exit(0);
