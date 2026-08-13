/**
 * Post the drafted improvement comments to project_comments, authored by the
 * reporte-ve owner. Dry-run by default; pass --apply to write.
 *   bun run analysis/tools/post-comments.ts            # dry run
 *   bun run analysis/tools/post-comments.ts --apply    # write to DB
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectComments, projects } from "@/db/schema";

const AUTHOR_ID = "user_3FjyVUUBHqBXwEVYE8Nui56zfnV"; // reporte-ve owner = Cris's account
const AUTHOR_NAME = "Cris";
const AUTHOR_IMAGE = "";

const apply = process.argv.includes("--apply");
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : null;
const work = resolve(import.meta.dirname, "../.work");
const comments = JSON.parse(
  readFileSync(`${work}/comments.json`, "utf8"),
) as Array<{ slug: string; comment: string | null }>;

const norm = (s: string) => s.toLowerCase().replace(/-/g, "");
const all = await db
  .select({ id: projects.id, slug: projects.slug })
  .from(projects);
const bySlug = new Map(all.map((p) => [p.slug, p.id]));
const byNorm = new Map(all.map((p) => [norm(p.slug), p.id]));

let posted = 0;
let skipped = 0;
const unmatched: string[] = [];

for (const c of comments) {
  if (only && c.slug !== only) continue;
  if (!c.comment) {
    skipped++;
    continue;
  }
  const projectId = bySlug.get(c.slug) ?? byNorm.get(norm(c.slug));
  if (!projectId) {
    unmatched.push(c.slug);
    continue;
  }

  // idempotency: skip if this author already commented on this project
  const existing = await db
    .select({ id: projectComments.id })
    .from(projectComments)
    .where(
      and(
        eq(projectComments.projectId, projectId),
        eq(projectComments.authorUserId, AUTHOR_ID),
      ),
    );
  if (existing.length > 0) {
    console.log(`skip ${c.slug} — author already commented`);
    skipped++;
    continue;
  }

  if (apply) {
    await db.insert(projectComments).values({
      projectId,
      authorUserId: AUTHOR_ID,
      authorName: AUTHOR_NAME,
      authorImageUrl: AUTHOR_IMAGE,
      body: c.comment,
    });
    console.log(`posted ${c.slug}`);
  } else {
    console.log(`[dry] would post ${c.slug} (${c.comment.length} chars)`);
  }
  posted++;
}

console.log(
  `\n${apply ? "APPLIED" : "DRY RUN"}: ${posted} to post, ${skipped} skipped` +
    (unmatched.length ? `, unmatched: ${unmatched.join(", ")}` : ""),
);
process.exit(0);
