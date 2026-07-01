import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import {
  projectComments,
  projectCommentVotes,
  projects,
  projectVotes,
} from "@/db/schema";
import { cachedAggregate, invalidateCache } from "@/lib/cache";
import { logError } from "@/lib/log";
import type {
  Project,
  ProjectComment,
  ProjectCommentInput,
  ProjectFormInput,
  ProjectLifecycleStatus,
  ProjectStatus,
} from "./schema";
import {
  normalizeCountries,
  sortCommentsByVotes,
  sortProjectsByVotes,
} from "./schema";

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  status?: ProjectStatus | null;
  lifecycle_status?: ProjectLifecycleStatus | null;
  project_url: string;
  countries: string[];
  participant_name: string;
  video_url: string;
  contribute_in_url?: string | null;
  description_markdown: string;
  owner_user_id: string;
  owner_name?: string | null;
  owner_image_url?: string | null;
  spam_score: number | null;
  spam_reason: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  votes_count?: number | null;
};

type ProjectWrite = ProjectFormInput & {
  ownerUserId: string;
  ownerName: string;
  ownerImageUrl: string;
  spamScore: number;
  spamReason: string;
};

type ProjectCommentRow = {
  id: string;
  project_id: string;
  author_user_id: string;
  author_name: string;
  author_image_url?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  votes_count?: number | null;
};

type ProjectCommentVoteRow = {
  comment_id: string;
  voter_id: string;
  created_at: string;
};

type LocalData = {
  projects: ProjectRow[];
  votes: { project_id: string; voter_id: string; created_at: string }[];
  comments?: ProjectCommentRow[];
  commentVotes?: ProjectCommentVoteRow[];
};

const localStorePath = path.join(process.cwd(), ".data", "projects.json");

// Hot-read cache (Upstash). Short TTL because vote counts/ordering change
// often — but the realtime channel patches votes on the client, so a slightly
// stale SSR payload is fine, and writes invalidate explicitly below.
const CACHE_VERSION = "v1";
const CACHE_TTL_SECONDS = 60;
const projectCacheKeys = {
  list: `build4venezuela:projects:list:${CACHE_VERSION}`,
  detail: (slug: string) => `build4venezuela:project:${slug}:${CACHE_VERSION}`,
};

const voteCount = sql<number>`count(${projectVotes.voterId})`.mapWith(Number);
const commentVoteCount =
  sql<number>`count(${projectCommentVotes.voterId})`.mapWith(Number);

// --- Drizzle row -> domain mappers ------------------------------------------

function rowToProject(
  row: typeof projects.$inferSelect,
  votesCount: number,
): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: (row.status ?? "published") as ProjectStatus,
    lifecycleStatus: (row.lifecycleStatus ??
      "ready_to_use") as ProjectLifecycleStatus,
    projectUrl: row.projectUrl,
    countries: row.countries,
    participantName: row.participantName,
    videoUrl: row.videoUrl,
    contributeInUrl: row.contributeInUrl ?? "",
    descriptionMarkdown: row.descriptionMarkdown,
    ownerName: row.ownerName || row.participantName,
    ownerImageUrl: row.ownerImageUrl ?? "",
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    votesCount,
  };
}

function rowToComment(
  row: typeof projectComments.$inferSelect,
  votesCount: number,
  voted: boolean,
): ProjectComment {
  return {
    id: row.id,
    projectId: row.projectId,
    authorName: row.authorName,
    authorImageUrl: row.authorImageUrl ?? "",
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    votesCount,
    voted,
  };
}

// --- Local JSON fallback (used when DATABASE_URL is unset) -------------------

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status ?? "published",
    lifecycleStatus: row.lifecycle_status ?? "ready_to_use",
    projectUrl: row.project_url,
    countries: row.countries,
    participantName: row.participant_name,
    videoUrl: row.video_url,
    contributeInUrl: row.contribute_in_url ?? "",
    descriptionMarkdown: row.description_markdown,
    ownerName: row.owner_name || row.participant_name,
    ownerImageUrl: row.owner_image_url ?? "",
    publishedAt: row.published_at ?? row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    votesCount: row.votes_count ?? 0,
  };
}

function toComment(row: ProjectCommentRow, voted = false): ProjectComment {
  return {
    id: row.id,
    projectId: row.project_id,
    authorName: row.author_name,
    authorImageUrl: row.author_image_url ?? "",
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    votesCount: row.votes_count ?? 0,
    voted,
  };
}

function toLocalRow(
  input: ProjectWrite,
): Omit<ProjectRow, "id" | "created_at" | "updated_at"> {
  return {
    slug: input.slug,
    name: input.name,
    status: "published",
    lifecycle_status: input.lifecycleStatus,
    project_url: input.projectUrl,
    countries: normalizeCountries(input.countries),
    participant_name: input.participantName,
    video_url: input.videoUrl,
    contribute_in_url: input.contributeInUrl,
    description_markdown: input.descriptionMarkdown,
    owner_user_id: input.ownerUserId,
    owner_name: input.ownerName,
    owner_image_url: input.ownerImageUrl,
    spam_score: input.spamScore,
    spam_reason: input.spamReason,
  };
}

async function readLocalData(): Promise<LocalData> {
  try {
    const data = JSON.parse(
      await readFile(localStorePath, "utf8"),
    ) as LocalData;
    return {
      ...data,
      comments: data.comments ?? [],
      commentVotes: data.commentVotes ?? [],
    };
  } catch {
    return { projects: [], votes: [], comments: [], commentVotes: [] };
  }
}

async function writeLocalData(data: LocalData) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, `${JSON.stringify(data, null, 2)}\n`);
}

function normalizeStoreError(error: unknown) {
  if (!(error instanceof Error) && typeof error !== "object") {
    return { message: String(error) };
  }

  const details = error as Record<string, unknown>;
  return {
    code: details.code,
    message: details.message,
    name: details.name,
  };
}

// Build the project domain shape from an insert/update Drizzle row, where the
// vote count is fetched separately (insert returns no aggregate).
function toProjectInput(
  input: Omit<ProjectWrite, "ownerUserId" | "ownerName" | "ownerImageUrl">,
) {
  return {
    slug: input.slug,
    name: input.name,
    lifecycleStatus: input.lifecycleStatus,
    projectUrl: input.projectUrl,
    countries: normalizeCountries(input.countries),
    participantName: input.participantName,
    videoUrl: input.videoUrl,
    contributeInUrl: input.contributeInUrl,
    descriptionMarkdown: input.descriptionMarkdown,
    spamScore: input.spamScore,
    spamReason: input.spamReason,
  };
}

// The local JSON fallback only ever applies when there is no database
// configured at all (local dev without DATABASE_URL — see isDbConfigured()).
// Once the database is configured, any runtime error from `operation` is
// logged and re-thrown rather than silently masked by a fallback write/read,
// so callers (API routes) can turn it into an explicit 500 instead of data
// quietly diverging from the real database.
async function withDbOperation<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
) {
  if (!isDbConfigured()) {
    return fallback();
  }

  try {
    return await operation();
  } catch (error) {
    logError("project.store.error", error, {
      detail: normalizeStoreError(error),
    });
    throw error;
  }
}

export async function listProjects() {
  return withDbOperation(
    async () => {
      const rows = await db
        .select({ project: projects, votesCount: voteCount })
        .from(projects)
        .leftJoin(projectVotes, eq(projectVotes.projectId, projects.id))
        .where(eq(projects.status, "published"))
        .groupBy(projects.id)
        .orderBy(desc(projects.publishedAt), desc(projects.createdAt));

      return sortProjectsByVotes(
        rows.map((row) => rowToProject(row.project, row.votesCount)),
      );
    },
    async () => {
      const data = await readLocalData();
      const list = data.projects
        .filter((project) => (project.status ?? "published") === "published")
        .map((project) => ({
          ...project,
          votes_count: data.votes.filter(
            (vote) => vote.project_id === project.id,
          ).length,
        }))
        .map(toProject);

      return sortProjectsByVotes(list);
    },
  );
}

export async function listProjectsByOwner(userId: string) {
  return withLocalFallback(
    async () => {
      const rows = await db
        .select({ project: projects, votesCount: voteCount })
        .from(projects)
        .leftJoin(projectVotes, eq(projectVotes.projectId, projects.id))
        .where(eq(projects.ownerUserId, userId))
        .groupBy(projects.id)
        .orderBy(desc(projects.createdAt));

      return rows.map((row) => rowToProject(row.project, row.votesCount));
    },
    async () => {
      const data = await readLocalData();
      return data.projects
        .filter((project) => project.owner_user_id === userId)
        .map((project) => toProject({ ...project, votes_count: 0 }));
    },
  );
}

export async function getProjectBySlug(slug: string) {
  return withDbOperation(
    async () => {
      const rows = await db
        .select({ project: projects, votesCount: voteCount })
        .from(projects)
        .leftJoin(projectVotes, eq(projectVotes.projectId, projects.id))
        .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
        .groupBy(projects.id)
        .limit(1);

      const row = rows[0];
      return row ? rowToProject(row.project, row.votesCount) : null;
    },
    async () => {
      const data = await readLocalData();
      const project = data.projects.find(
        (item) =>
          item.slug === slug && (item.status ?? "published") === "published",
      );

      if (!project) {
        return null;
      }

      return toProject({
        ...project,
        votes_count: data.votes.filter((vote) => vote.project_id === project.id)
          .length,
      });
    },
  );
}

// --- Cached read wrappers (render hot paths only) ---------------------------
//
// Pages render per request, so route their reads through Redis to keep the
// Postgres pool idle. Correctness-sensitive callers (slug uniqueness,
// getProjectById) deliberately keep using the raw reads above so they never
// see a stale "not found"/"found".

export async function getCachedProjects() {
  return cachedAggregate(
    { key: projectCacheKeys.list, ttlSeconds: CACHE_TTL_SECONDS },
    listProjects,
  );
}

export async function getCachedProjectBySlug(slug: string) {
  return cachedAggregate(
    { key: projectCacheKeys.detail(slug), ttlSeconds: CACHE_TTL_SECONDS },
    () => getProjectBySlug(slug),
  );
}

/** Flush the list cache (new/updated project, vote change reorders the list). */
function invalidateProjectListCache() {
  return invalidateCache(projectCacheKeys.list);
}

/** Flush both the list and a single project's detail cache. */
function invalidateProjectCaches(slug: string) {
  return invalidateCache(projectCacheKeys.list, projectCacheKeys.detail(slug));
}

export async function getProjectById(projectId: string) {
  const list = await listProjects();
  return list.find((project) => project.id === projectId) ?? null;
}

export async function isSlugAvailable(slug: string, currentProjectId?: string) {
  const project = await getProjectBySlug(slug);
  return !project || project.id === currentProjectId;
}

export async function createProject(input: ProjectWrite) {
  const project = await withDbOperation(
    async () => {
      const [row] = await db
        .insert(projects)
        .values({
          ...toProjectInput(input),
          ownerUserId: input.ownerUserId,
          ownerName: input.ownerName,
          ownerImageUrl: input.ownerImageUrl,
        })
        .returning();

      return rowToProject(row, 0);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const project: ProjectRow = {
        id: randomUUID(),
        ...toLocalRow(input),
        published_at: now,
        created_at: now,
        updated_at: now,
      };

      data.projects.unshift(project);
      await writeLocalData(data);
      return toProject(project);
    },
  );

  await invalidateProjectListCache();
  return project;
}

export async function updateProject(
  projectId: string,
  input: Omit<ProjectWrite, "ownerUserId" | "ownerName" | "ownerImageUrl">,
) {
  const project = await withDbOperation(
    async () => {
      const [row] = await db
        .update(projects)
        .set({ ...toProjectInput(input), updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();

      if (!row) {
        throw new Error("Project not found.");
      }

      return rowToProject(row, 0);
    },
    async () => {
      const data = await readLocalData();
      const index = data.projects.findIndex(
        (project) => project.id === projectId,
      );

      if (index === -1) {
        throw new Error("Project not found.");
      }

      const {
        owner_user_id: _owner,
        owner_name: _ownerName,
        owner_image_url: _ownerImageUrl,
        ...updateRow
      } = toLocalRow({
        ...input,
        ownerUserId: "",
        ownerName: "",
        ownerImageUrl: "",
      });
      data.projects[index] = {
        ...data.projects[index],
        ...updateRow,
        updated_at: new Date().toISOString(),
      };
      await writeLocalData(data);
      return toProject(data.projects[index]);
    },
  );

  await invalidateProjectCaches(project.slug);
  return project;
}

export async function deleteProject(projectId: string) {
  const project = await getProjectById(projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  await withLocalFallback(
    async () => {
      await db.delete(projects).where(eq(projects.id, projectId));
    },
    async () => {
      const data = await readLocalData();
      const projectExists = data.projects.some(
        (projectRow) => projectRow.id === projectId,
      );

      if (!projectExists) {
        throw new Error("Project not found.");
      }

      const deletedCommentIds = new Set(
        (data.comments ?? [])
          .filter((comment) => comment.project_id === projectId)
          .map((comment) => comment.id),
      );

      data.projects = data.projects.filter(
        (projectRow) => projectRow.id !== projectId,
      );
      data.votes = data.votes.filter((vote) => vote.project_id !== projectId);
      data.comments = (data.comments ?? []).filter(
        (comment) => comment.project_id !== projectId,
      );
      data.commentVotes = (data.commentVotes ?? []).filter(
        (vote) => !deletedCommentIds.has(vote.comment_id),
      );
      await writeLocalData(data);
    },
  );

  await invalidateProjectCaches(project.slug);
  return project;
}

export async function canEditProject(
  projectId: string,
  userId: string | null | undefined,
) {
  if (!userId) {
    return false;
  }

  return withDbOperation(
    async () => {
      const rows = await db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(eq(projects.id, projectId), eq(projects.ownerUserId, userId)),
        )
        .limit(1);

      return rows.length > 0;
    },
    async () => {
      const data = await readLocalData();
      return data.projects.some(
        (project) =>
          project.id === projectId && project.owner_user_id === userId,
      );
    },
  );
}

export async function getVoteCount(projectId: string) {
  return withDbOperation(
    async () => {
      const rows = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(projectVotes)
        .where(eq(projectVotes.projectId, projectId));

      return rows[0]?.count ?? 0;
    },
    async () => {
      const data = await readLocalData();
      return data.votes.filter((vote) => vote.project_id === projectId).length;
    },
  );
}

export async function hasVoted(projectId: string, voterId: string | undefined) {
  if (!voterId) {
    return false;
  }

  return withDbOperation(
    async () => {
      const rows = await db
        .select({ projectId: projectVotes.projectId })
        .from(projectVotes)
        .where(
          and(
            eq(projectVotes.projectId, projectId),
            eq(projectVotes.voterId, voterId),
          ),
        )
        .limit(1);

      return rows.length > 0;
    },
    async () => {
      const data = await readLocalData();
      return data.votes.some(
        (vote) => vote.project_id === projectId && vote.voter_id === voterId,
      );
    },
  );
}

export async function toggleVote(projectId: string, voterId: string) {
  const result = await withDbOperation(
    async () => {
      const voted = await hasVoted(projectId, voterId);

      if (voted) {
        await db
          .delete(projectVotes)
          .where(
            and(
              eq(projectVotes.projectId, projectId),
              eq(projectVotes.voterId, voterId),
            ),
          );
        return { voted: false, count: await getVoteCount(projectId) };
      }

      await db.insert(projectVotes).values({ projectId, voterId });
      return { voted: true, count: await getVoteCount(projectId) };
    },
    async () => {
      const data = await readLocalData();
      const voteIndex = data.votes.findIndex(
        (vote) => vote.project_id === projectId && vote.voter_id === voterId,
      );

      if (voteIndex >= 0) {
        data.votes.splice(voteIndex, 1);
        await writeLocalData(data);
        return { voted: false, count: await getVoteCount(projectId) };
      }

      data.votes.push({
        project_id: projectId,
        voter_id: voterId,
        created_at: new Date().toISOString(),
      });
      await writeLocalData(data);
      return { voted: true, count: await getVoteCount(projectId) };
    },
  );

  await invalidateProjectListCache();
  return result;
}

export async function listComments(projectId: string, voterId?: string) {
  return withDbOperation(
    async () => {
      const rows = await db
        .select({ comment: projectComments, votesCount: commentVoteCount })
        .from(projectComments)
        .leftJoin(
          projectCommentVotes,
          eq(projectCommentVotes.commentId, projectComments.id),
        )
        .where(eq(projectComments.projectId, projectId))
        .groupBy(projectComments.id)
        .orderBy(asc(projectComments.createdAt));

      let votedCommentIds = new Set<string>();

      if (voterId && rows.length > 0) {
        const votes = await db
          .select({ commentId: projectCommentVotes.commentId })
          .from(projectCommentVotes)
          .where(
            and(
              eq(projectCommentVotes.voterId, voterId),
              inArray(
                projectCommentVotes.commentId,
                rows.map((row) => row.comment.id),
              ),
            ),
          );

        votedCommentIds = new Set(votes.map((vote) => vote.commentId));
      }

      return sortCommentsByVotes(
        rows.map((row) =>
          rowToComment(
            row.comment,
            row.votesCount,
            votedCommentIds.has(row.comment.id),
          ),
        ),
      );
    },
    async () => {
      const data = await readLocalData();
      const comments = data.comments ?? [];
      const commentVotes = data.commentVotes ?? [];

      const projectCommentList = comments
        .filter((comment) => comment.project_id === projectId)
        .map((comment) => ({
          ...comment,
          votes_count: commentVotes.filter(
            (vote) => vote.comment_id === comment.id,
          ).length,
        }))
        .map((comment) =>
          toComment(
            comment,
            commentVotes.some(
              (vote) =>
                vote.comment_id === comment.id && vote.voter_id === voterId,
            ),
          ),
        );

      return sortCommentsByVotes(projectCommentList);
    },
  );
}

export async function createComment(
  projectId: string,
  authorUserId: string,
  authorName: string,
  authorImageUrl: string,
  input: ProjectCommentInput,
) {
  return withDbOperation(
    async () => {
      const [row] = await db
        .insert(projectComments)
        .values({
          projectId,
          authorUserId,
          authorName,
          authorImageUrl,
          body: input.body,
        })
        .returning();

      return rowToComment(row, 0, false);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const comment: ProjectCommentRow = {
        id: randomUUID(),
        project_id: projectId,
        author_user_id: authorUserId,
        author_name: authorName,
        author_image_url: authorImageUrl,
        body: input.body,
        created_at: now,
        updated_at: now,
      };

      data.comments = data.comments ?? [];
      data.comments.push(comment);
      await writeLocalData(data);
      return toComment(comment);
    },
  );
}

export async function getCommentVoteCount(commentId: string) {
  return withDbOperation(
    async () => {
      const rows = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(projectCommentVotes)
        .where(eq(projectCommentVotes.commentId, commentId));

      return rows[0]?.count ?? 0;
    },
    async () => {
      const data = await readLocalData();
      return (data.commentVotes ?? []).filter(
        (vote) => vote.comment_id === commentId,
      ).length;
    },
  );
}

export async function hasCommentVoted(
  commentId: string,
  voterId: string | undefined,
) {
  if (!voterId) {
    return false;
  }

  return withDbOperation(
    async () => {
      const rows = await db
        .select({ commentId: projectCommentVotes.commentId })
        .from(projectCommentVotes)
        .where(
          and(
            eq(projectCommentVotes.commentId, commentId),
            eq(projectCommentVotes.voterId, voterId),
          ),
        )
        .limit(1);

      return rows.length > 0;
    },
    async () => {
      const data = await readLocalData();
      return (data.commentVotes ?? []).some(
        (vote) => vote.comment_id === commentId && vote.voter_id === voterId,
      );
    },
  );
}

export async function toggleCommentVote(commentId: string, voterId: string) {
  return withDbOperation(
    async () => {
      const voted = await hasCommentVoted(commentId, voterId);

      if (voted) {
        await db
          .delete(projectCommentVotes)
          .where(
            and(
              eq(projectCommentVotes.commentId, commentId),
              eq(projectCommentVotes.voterId, voterId),
            ),
          );
        return { voted: false, count: await getCommentVoteCount(commentId) };
      }

      await db.insert(projectCommentVotes).values({ commentId, voterId });
      return { voted: true, count: await getCommentVoteCount(commentId) };
    },
    async () => {
      const data = await readLocalData();
      data.commentVotes = data.commentVotes ?? [];
      const voteIndex = data.commentVotes.findIndex(
        (vote) => vote.comment_id === commentId && vote.voter_id === voterId,
      );

      if (voteIndex >= 0) {
        data.commentVotes.splice(voteIndex, 1);
        await writeLocalData(data);
        return { voted: false, count: await getCommentVoteCount(commentId) };
      }

      data.commentVotes.push({
        comment_id: commentId,
        voter_id: voterId,
        created_at: new Date().toISOString(),
      });
      await writeLocalData(data);
      return { voted: true, count: await getCommentVoteCount(commentId) };
    },
  );
}
