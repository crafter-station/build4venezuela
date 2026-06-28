import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { categoryProposals, projectCategories } from "@/db/schema";
import { cachedAggregate, invalidateCache } from "@/lib/cache";
import { logError } from "@/lib/log";
import type { CategoryProposal, ClassificationDecision } from "./categories";

export type ProjectCategoryAssignment = {
  categoryId: string;
  status: string;
};

type CategoryContext = {
  proposals: CategoryProposal[];
  /** category_id -> number of projects assigned to it. */
  counts: Map<string, number>;
};

type CachedCategoryContext = {
  proposals: CategoryProposal[];
  counts: Record<string, number>;
};

type CachedCategoryMap = Record<string, ProjectCategoryAssignment>;

type LocalCategoryData = {
  proposals: { id: string; label: string; description: string }[];
  assignments: Record<
    string,
    { category_id: string; status: string; confidence: number | null }
  >;
};

const localStorePath = path.join(process.cwd(), ".data", "categories.json");

// Same discipline as project list caching: keep category reads off the pool on
// the `/projects` hot path. Writes invalidate explicitly below.
const CACHE_VERSION = "v1";
const CACHE_TTL_SECONDS = 60;
const categoryCacheKeys = {
  context: `build4venezuela:categories:context:${CACHE_VERSION}`,
  map: `build4venezuela:categories:map:${CACHE_VERSION}`,
};

async function readLocalData(): Promise<LocalCategoryData> {
  try {
    const data = JSON.parse(
      await readFile(localStorePath, "utf8"),
    ) as LocalCategoryData;
    return {
      proposals: data.proposals ?? [],
      assignments: data.assignments ?? {},
    };
  } catch {
    return { proposals: [], assignments: {} };
  }
}

async function writeLocalData(data: LocalCategoryData) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, `${JSON.stringify(data, null, 2)}\n`);
}

function countAssignments(rows: { categoryId: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + 1);
  }
  return counts;
}

function serializeContext(context: CategoryContext): CachedCategoryContext {
  return {
    proposals: context.proposals,
    counts: Object.fromEntries(context.counts),
  };
}

function deserializeContext(cached: CachedCategoryContext): CategoryContext {
  return {
    proposals: cached.proposals,
    counts: new Map(Object.entries(cached.counts)),
  };
}

function serializeMap(
  map: Map<string, ProjectCategoryAssignment>,
): CachedCategoryMap {
  return Object.fromEntries(map);
}

function deserializeMap(cached: CachedCategoryMap) {
  return new Map(Object.entries(cached));
}

function invalidateCategoryCaches() {
  return invalidateCache(categoryCacheKeys.context, categoryCacheKeys.map);
}

async function loadCategoryContext(): Promise<CategoryContext> {
  if (isDbConfigured()) {
    try {
      // Serial reads: the pool caps at 3 connections in production and the
      // projects page already loads projects + the category map in parallel.
      const proposals = await db
        .select({
          id: categoryProposals.id,
          label: categoryProposals.label,
          description: categoryProposals.description,
        })
        .from(categoryProposals);
      const assignments = await db
        .select({ categoryId: projectCategories.categoryId })
        .from(projectCategories);

      return {
        proposals: proposals.map((row) => ({
          id: row.id,
          label: row.label,
          description: row.description,
        })),
        counts: countAssignments(assignments),
      };
    } catch (error) {
      logError("category.context.fallback", error);
    }
  }

  const local = await readLocalData();
  return {
    proposals: local.proposals.map((proposal) => ({
      id: proposal.id,
      label: proposal.label,
      description: proposal.description ?? "",
    })),
    counts: countAssignments(
      Object.values(local.assignments).map((value) => ({
        categoryId: value.category_id,
      })),
    ),
  };
}

async function loadProjectCategoryMap(): Promise<
  Map<string, ProjectCategoryAssignment>
> {
  if (isDbConfigured()) {
    try {
      const rows = await db
        .select({
          projectId: projectCategories.projectId,
          categoryId: projectCategories.categoryId,
          status: projectCategories.status,
        })
        .from(projectCategories);

      return new Map(
        rows.map((row) => [
          row.projectId,
          { categoryId: row.categoryId, status: row.status },
        ]),
      );
    } catch (error) {
      logError("category.map.fallback", error);
    }
  }

  const local = await readLocalData();
  return new Map(
    Object.entries(local.assignments).map(([projectId, value]) => [
      projectId,
      { categoryId: value.category_id, status: value.status },
    ]),
  );
}

/** Proposals + per-cluster assignment counts. Drives both the classifier
 * (so it can reuse pending proposals) and the UI (so proposals can graduate). */
export async function getCategoryContext(): Promise<CategoryContext> {
  const cached = await cachedAggregate(
    { key: categoryCacheKeys.context, ttlSeconds: CACHE_TTL_SECONDS },
    async () => serializeContext(await loadCategoryContext()),
  );
  return deserializeContext(cached);
}

/** project_id -> assignment, for resolving display clusters on the list page. */
export async function getProjectCategoryMap(): Promise<
  Map<string, ProjectCategoryAssignment>
> {
  const cached = await cachedAggregate(
    { key: categoryCacheKeys.map, ttlSeconds: CACHE_TTL_SECONDS },
    async () => serializeMap(await loadProjectCategoryMap()),
  );
  return deserializeMap(cached);
}

/** Persist one classification decision (idempotent upserts). */
export async function assignProjectCategory(
  projectId: string,
  decision: ClassificationDecision,
): Promise<void> {
  if (isDbConfigured()) {
    try {
      if (decision.proposal) {
        await db
          .insert(categoryProposals)
          .values({
            id: decision.proposal.id,
            label: decision.proposal.label,
            description: decision.proposal.description,
          })
          .onConflictDoNothing({ target: categoryProposals.id });
      }

      await db
        .insert(projectCategories)
        .values({
          projectId,
          categoryId: decision.categoryId,
          status: decision.status,
          confidence: decision.confidence,
        })
        .onConflictDoUpdate({
          target: projectCategories.projectId,
          set: {
            categoryId: decision.categoryId,
            status: decision.status,
            confidence: decision.confidence,
            updatedAt: sql`now()`,
          },
        });
      await invalidateCategoryCaches();
      return;
    } catch (error) {
      logError("category.assign.fallback", error);
    }
  }

  const local = await readLocalData();
  if (
    decision.proposal &&
    !local.proposals.some((p) => p.id === decision.proposal?.id)
  ) {
    local.proposals.push({
      id: decision.proposal.id,
      label: decision.proposal.label,
      description: decision.proposal.description,
    });
  }
  local.assignments[projectId] = {
    category_id: decision.categoryId,
    status: decision.status,
    confidence: decision.confidence,
  };
  await writeLocalData(local);
  await invalidateCategoryCaches();
}
