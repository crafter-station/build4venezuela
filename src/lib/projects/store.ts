import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";
import type {
  Project,
  ProjectComment,
  ProjectCommentInput,
  ProjectFormInput,
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
  project_url: string;
  countries: string[];
  participant_name: string;
  video_url: string;
  description_markdown: string;
  owner_user_id: string;
  spam_score: number | null;
  spam_reason: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  votes_count?: number | null;
};

type ProjectWrite = ProjectFormInput & {
  ownerUserId: string;
  spamScore: number;
  spamReason: string;
};

type ProjectCommentRow = {
  id: string;
  project_id: string;
  author_user_id: string;
  author_name: string;
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

type StoreErrorDetails = {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
  name?: unknown;
};

const localStorePath = path.join(process.cwd(), ".data", "projects.json");
const projectSelect = "*, votes_count:project_votes(count)";
const commentSelect = "*, votes_count:project_comment_votes(count)";

function getSupabase() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status ?? "published",
    projectUrl: row.project_url,
    countries: row.countries,
    participantName: row.participant_name,
    videoUrl: row.video_url,
    descriptionMarkdown: row.description_markdown,
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
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    votesCount: row.votes_count ?? 0,
    voted,
  };
}

function toRow(
  input: ProjectWrite,
): Omit<ProjectRow, "id" | "created_at" | "updated_at"> {
  return {
    slug: input.slug,
    name: input.name,
    status: "published",
    project_url: input.projectUrl,
    countries: normalizeCountries(input.countries),
    participant_name: input.participantName,
    video_url: input.videoUrl,
    description_markdown: input.descriptionMarkdown,
    owner_user_id: input.ownerUserId,
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

  const details = error as StoreErrorDetails;

  return {
    code: details.code,
    details: details.details,
    hint: details.hint,
    message: details.message,
    name: details.name,
  };
}

async function withLocalFallback<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
) {
  const supabase = getSupabase();

  if (!supabase) {
    return fallback();
  }

  try {
    return await operation();
  } catch (error) {
    console.warn(
      "Supabase project store failed; using local fallback",
      normalizeStoreError(error),
    );
    return fallback();
  }
}

export async function listProjects() {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("projects")
        .select(projectSelect)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return sortProjectsByVotes(
        (data ?? []).map((row) =>
          toProject({
            ...(row as ProjectRow),
            votes_count: row.votes_count?.[0]?.count ?? 0,
          }),
        ),
      );
    },
    async () => {
      const data = await readLocalData();
      const projects = data.projects
        .filter((project) => (project.status ?? "published") === "published")
        .map((project) => ({
          ...project,
          votes_count: data.votes.filter(
            (vote) => vote.project_id === project.id,
          ).length,
        }))
        .map(toProject);

      return sortProjectsByVotes(projects);
    },
  );
}

export async function getProjectBySlug(slug: string) {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from("projects")
        .select(projectSelect)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return toProject({
        ...(data as ProjectRow),
        votes_count: data.votes_count?.[0]?.count ?? 0,
      });
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

export async function getProjectById(projectId: string) {
  const projects = await listProjects();
  return projects.find((project) => project.id === projectId) ?? null;
}

export async function isSlugAvailable(slug: string, currentProjectId?: string) {
  const project = await getProjectBySlug(slug);
  return !project || project.id === currentProjectId;
}

export async function createProject(input: ProjectWrite) {
  const supabase = getSupabase();
  const row = toRow(input);

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase
        .from("projects")
        .insert(row)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return toProject(data as ProjectRow);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const project: ProjectRow = {
        id: randomUUID(),
        ...row,
        published_at: now,
        created_at: now,
        updated_at: now,
      };

      data.projects.unshift(project);
      await writeLocalData(data);
      return toProject(project);
    },
  );
}

export async function updateProject(
  projectId: string,
  input: Omit<ProjectWrite, "ownerUserId">,
) {
  const supabase = getSupabase();
  const row = toRow({ ...input, ownerUserId: "" });
  const { owner_user_id: _ownerUserId, ...updateRow } = row;

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase
        .from("projects")
        .update({ ...updateRow, updated_at: new Date().toISOString() })
        .eq("id", projectId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return toProject(data as ProjectRow);
    },
    async () => {
      const data = await readLocalData();
      const index = data.projects.findIndex(
        (project) => project.id === projectId,
      );

      if (index === -1) {
        throw new Error("Project not found.");
      }

      data.projects[index] = {
        ...data.projects[index],
        ...updateRow,
        updated_at: new Date().toISOString(),
      };
      await writeLocalData(data);
      return toProject(data.projects[index]);
    },
  );
}

export async function canEditProject(
  projectId: string,
  userId: string | null | undefined,
) {
  if (!userId) {
    return false;
  }

  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return false;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("owner_user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return Boolean(data);
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
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return 0;
      }

      const { count, error } = await supabase
        .from("project_votes")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (error) {
        throw error;
      }

      return count ?? 0;
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

  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return false;
      }

      const { data, error } = await supabase
        .from("project_votes")
        .select("project_id")
        .eq("project_id", projectId)
        .eq("voter_id", voterId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return Boolean(data);
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
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const voted = await hasVoted(projectId, voterId);

      if (voted) {
        const { error } = await supabase
          .from("project_votes")
          .delete()
          .eq("project_id", projectId)
          .eq("voter_id", voterId);

        if (error) {
          throw error;
        }

        return { voted: false, count: await getVoteCount(projectId) };
      }

      const { error } = await supabase.from("project_votes").insert({
        project_id: projectId,
        voter_id: voterId,
      });

      if (error) {
        throw error;
      }

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
}

export async function listComments(projectId: string, voterId?: string) {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("project_comments")
        .select(commentSelect)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      const rows = (data ?? []).map((row) => ({
        ...(row as ProjectCommentRow),
        votes_count: row.votes_count?.[0]?.count ?? 0,
      }));
      const commentIds = rows.map((comment) => comment.id);
      let votedCommentIds = new Set<string>();

      if (voterId && commentIds.length > 0) {
        const { data: votes, error: votesError } = await supabase
          .from("project_comment_votes")
          .select("comment_id")
          .eq("voter_id", voterId)
          .in("comment_id", commentIds);

        if (votesError) {
          throw votesError;
        }

        votedCommentIds = new Set(
          (votes ?? []).map((vote) => String(vote.comment_id)),
        );
      }

      return sortCommentsByVotes(
        rows.map((row) => toComment(row, votedCommentIds.has(row.id))),
      );
    },
    async () => {
      const data = await readLocalData();
      const comments = data.comments ?? [];
      const commentVotes = data.commentVotes ?? [];

      const projectComments = comments
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

      return sortCommentsByVotes(projectComments);
    },
  );
}

export async function createComment(
  projectId: string,
  authorUserId: string,
  authorName: string,
  input: ProjectCommentInput,
) {
  const supabase = getSupabase();
  const row = {
    project_id: projectId,
    author_user_id: authorUserId,
    author_name: authorName,
    body: input.body,
  };

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase
        .from("project_comments")
        .insert(row)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return toComment(data as ProjectCommentRow);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const comment: ProjectCommentRow = {
        id: randomUUID(),
        ...row,
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
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return 0;
      }

      const { count, error } = await supabase
        .from("project_comment_votes")
        .select("*", { count: "exact", head: true })
        .eq("comment_id", commentId);

      if (error) {
        throw error;
      }

      return count ?? 0;
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

  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return false;
      }

      const { data, error } = await supabase
        .from("project_comment_votes")
        .select("comment_id")
        .eq("comment_id", commentId)
        .eq("voter_id", voterId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return Boolean(data);
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
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const voted = await hasCommentVoted(commentId, voterId);

      if (voted) {
        const { error } = await supabase
          .from("project_comment_votes")
          .delete()
          .eq("comment_id", commentId)
          .eq("voter_id", voterId);

        if (error) {
          throw error;
        }

        return { voted: false, count: await getCommentVoteCount(commentId) };
      }

      const { error } = await supabase.from("project_comment_votes").insert({
        comment_id: commentId,
        voter_id: voterId,
      });

      if (error) {
        throw error;
      }

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
