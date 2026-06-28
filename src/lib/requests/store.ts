import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";
import { logError } from "@/lib/log";
import type {
  SolutionRequest,
  SolutionRequestComment,
  SolutionRequestCommentInput,
  SolutionRequestInput,
} from "./schema";
import { sortSolutionRequestComments, sortSolutionRequests } from "./schema";

type RequestRow = {
  id: string;
  name: string;
  description_markdown: string;
  author_user_id: string;
  author_name: string;
  author_image_url?: string | null;
  created_at: string;
  updated_at: string;
  votes_count?: number | null;
};

type RequestVoteRow = {
  request_id: string;
  voter_id: string;
  created_at: string;
};

type RequestCommentRow = {
  id: string;
  request_id: string;
  author_user_id: string;
  author_name: string;
  author_image_url?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  votes_count?: number | null;
};

type RequestCommentVoteRow = {
  comment_id: string;
  voter_id: string;
  created_at: string;
};

type LocalData = {
  requests: RequestRow[];
  votes: RequestVoteRow[];
  comments: RequestCommentRow[];
  commentVotes: RequestCommentVoteRow[];
};

const localStorePath = path.join(
  process.cwd(),
  ".data",
  "solution-requests.json",
);
const requestSelect = "*, votes_count:solution_request_votes(count)";
const commentSelect = "*, votes_count:solution_request_comment_votes(count)";

// The Supabase JS client's fetch has no default timeout, so a stalled PostgREST
// request would hang the whole route until Vercel's 300s wall. Bound every call.
const SUPABASE_TIMEOUT_MS = 8_000;

function getSupabase() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  // Cast: the wrapper satisfies the call signature but not the extra static
  // members on the global `fetch` type (e.g. `preconnect`), which Supabase
  // never calls.
  const timeoutFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    })) as typeof fetch;

  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: timeoutFetch },
  });
}

function toComment(
  row: RequestCommentRow,
  voted = false,
): SolutionRequestComment {
  return {
    id: row.id,
    requestId: row.request_id,
    authorName: row.author_name,
    authorImageUrl: row.author_image_url ?? "",
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    votesCount: row.votes_count ?? 0,
    voted,
  };
}

function toRequest(
  row: RequestRow,
  comments: SolutionRequestComment[] = [],
  voted = false,
): SolutionRequest {
  return {
    id: row.id,
    name: row.name,
    descriptionMarkdown: row.description_markdown,
    authorName: row.author_name,
    authorImageUrl: row.author_image_url ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    votesCount: row.votes_count ?? 0,
    voted,
    comments: sortSolutionRequestComments(comments),
  };
}

async function readLocalData(): Promise<LocalData> {
  try {
    const data = JSON.parse(
      await readFile(localStorePath, "utf8"),
    ) as Partial<LocalData>;
    return {
      requests: data.requests ?? [],
      votes: data.votes ?? [],
      comments: data.comments ?? [],
      commentVotes: data.commentVotes ?? [],
    };
  } catch {
    return { requests: [], votes: [], comments: [], commentVotes: [] };
  }
}

async function writeLocalData(data: LocalData) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, `${JSON.stringify(data, null, 2)}\n`);
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
    logError("request.store.fallback", error);
    return fallback();
  }
}

export async function listSolutionRequests(voterId?: string) {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("solution_requests")
        .select(requestSelect)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const requestRows = (data ?? []).map((row) => ({
        ...(row as RequestRow),
        votes_count: row.votes_count?.[0]?.count ?? 0,
      }));
      const requestIds = requestRows.map((request) => request.id);
      const votedRequestIds = new Set<string>();

      if (voterId && requestIds.length > 0) {
        const { data: votes, error: votesError } = await supabase
          .from("solution_request_votes")
          .select("request_id")
          .eq("voter_id", voterId)
          .in("request_id", requestIds);

        if (votesError) {
          throw votesError;
        }

        for (const vote of votes ?? []) {
          votedRequestIds.add(String(vote.request_id));
        }
      }

      const { data: commentsData, error: commentsError } = requestIds.length
        ? await supabase
            .from("solution_request_comments")
            .select(commentSelect)
            .in("request_id", requestIds)
            .order("created_at", { ascending: true })
        : { data: [], error: null };

      if (commentsError) {
        throw commentsError;
      }

      const commentRows = (commentsData ?? []).map((row) => ({
        ...(row as RequestCommentRow),
        votes_count: row.votes_count?.[0]?.count ?? 0,
      }));
      const commentIds = commentRows.map((comment) => comment.id);
      const votedCommentIds = new Set<string>();

      if (voterId && commentIds.length > 0) {
        const { data: commentVotes, error: commentVotesError } = await supabase
          .from("solution_request_comment_votes")
          .select("comment_id")
          .eq("voter_id", voterId)
          .in("comment_id", commentIds);

        if (commentVotesError) {
          throw commentVotesError;
        }

        for (const vote of commentVotes ?? []) {
          votedCommentIds.add(String(vote.comment_id));
        }
      }

      const commentsByRequest = new Map<string, SolutionRequestComment[]>();
      for (const row of commentRows) {
        const comments = commentsByRequest.get(row.request_id) ?? [];
        comments.push(toComment(row, votedCommentIds.has(row.id)));
        commentsByRequest.set(row.request_id, comments);
      }

      return sortSolutionRequests(
        requestRows.map((row) =>
          toRequest(
            row,
            commentsByRequest.get(row.id) ?? [],
            votedRequestIds.has(row.id),
          ),
        ),
      );
    },
    async () => {
      const data = await readLocalData();
      const commentsByRequest = new Map<string, SolutionRequestComment[]>();

      for (const comment of data.comments) {
        const comments = commentsByRequest.get(comment.request_id) ?? [];
        comments.push(
          toComment(
            {
              ...comment,
              votes_count: data.commentVotes.filter(
                (vote) => vote.comment_id === comment.id,
              ).length,
            },
            data.commentVotes.some(
              (vote) =>
                vote.comment_id === comment.id && vote.voter_id === voterId,
            ),
          ),
        );
        commentsByRequest.set(comment.request_id, comments);
      }

      return sortSolutionRequests(
        data.requests.map((request) =>
          toRequest(
            {
              ...request,
              votes_count: data.votes.filter(
                (vote) => vote.request_id === request.id,
              ).length,
            },
            commentsByRequest.get(request.id) ?? [],
            data.votes.some(
              (vote) =>
                vote.request_id === request.id && vote.voter_id === voterId,
            ),
          ),
        ),
      );
    },
  );
}

export async function createSolutionRequest(
  input: SolutionRequestInput,
  authorUserId: string,
  authorName: string,
  authorImageUrl: string,
) {
  const supabase = getSupabase();
  const row = {
    name: input.name,
    description_markdown: input.descriptionMarkdown,
    author_user_id: authorUserId,
    author_name: authorName,
    author_image_url: authorImageUrl,
  };

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase
        .from("solution_requests")
        .insert(row)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return toRequest(data as RequestRow);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const request: RequestRow = {
        id: randomUUID(),
        ...row,
        created_at: now,
        updated_at: now,
      };

      data.requests.unshift(request);
      await writeLocalData(data);
      return toRequest(request);
    },
  );
}

export async function getSolutionRequestVoteCount(requestId: string) {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return 0;
      }

      const { count, error } = await supabase
        .from("solution_request_votes")
        .select("*", { count: "exact", head: true })
        .eq("request_id", requestId);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
    async () => {
      const data = await readLocalData();
      return data.votes.filter((vote) => vote.request_id === requestId).length;
    },
  );
}

export async function hasSolutionRequestVoted(
  requestId: string,
  voterId?: string,
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
        .from("solution_request_votes")
        .select("request_id")
        .eq("request_id", requestId)
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
        (vote) => vote.request_id === requestId && vote.voter_id === voterId,
      );
    },
  );
}

export async function toggleSolutionRequestVote(
  requestId: string,
  voterId: string,
) {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const voted = await hasSolutionRequestVoted(requestId, voterId);

      if (voted) {
        const { error } = await supabase
          .from("solution_request_votes")
          .delete()
          .eq("request_id", requestId)
          .eq("voter_id", voterId);

        if (error) {
          throw error;
        }

        return {
          voted: false,
          count: await getSolutionRequestVoteCount(requestId),
        };
      }

      const { error } = await supabase.from("solution_request_votes").insert({
        request_id: requestId,
        voter_id: voterId,
      });

      if (error) {
        throw error;
      }

      return {
        voted: true,
        count: await getSolutionRequestVoteCount(requestId),
      };
    },
    async () => {
      const data = await readLocalData();
      const voteIndex = data.votes.findIndex(
        (vote) => vote.request_id === requestId && vote.voter_id === voterId,
      );

      if (voteIndex >= 0) {
        data.votes.splice(voteIndex, 1);
        await writeLocalData(data);
        return {
          voted: false,
          count: await getSolutionRequestVoteCount(requestId),
        };
      }

      data.votes.push({
        request_id: requestId,
        voter_id: voterId,
        created_at: new Date().toISOString(),
      });
      await writeLocalData(data);
      return {
        voted: true,
        count: await getSolutionRequestVoteCount(requestId),
      };
    },
  );
}

export async function createSolutionRequestComment(
  requestId: string,
  authorUserId: string,
  authorName: string,
  authorImageUrl: string,
  input: SolutionRequestCommentInput,
) {
  const supabase = getSupabase();
  const row = {
    request_id: requestId,
    author_user_id: authorUserId,
    author_name: authorName,
    author_image_url: authorImageUrl,
    body: input.body,
  };

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase
        .from("solution_request_comments")
        .insert(row)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return toComment(data as RequestCommentRow);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const comment: RequestCommentRow = {
        id: randomUUID(),
        ...row,
        created_at: now,
        updated_at: now,
      };

      data.comments.push(comment);
      await writeLocalData(data);
      return toComment(comment);
    },
  );
}

export async function solutionRequestCommentBelongsToRequest(
  requestId: string,
  commentId: string,
) {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return false;
      }

      const { data, error } = await supabase
        .from("solution_request_comments")
        .select("id")
        .eq("id", commentId)
        .eq("request_id", requestId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return Boolean(data);
    },
    async () => {
      const data = await readLocalData();
      return data.comments.some(
        (comment) =>
          comment.id === commentId && comment.request_id === requestId,
      );
    },
  );
}

export async function getSolutionRequestCommentVoteCount(commentId: string) {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        return 0;
      }

      const { count, error } = await supabase
        .from("solution_request_comment_votes")
        .select("*", { count: "exact", head: true })
        .eq("comment_id", commentId);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
    async () => {
      const data = await readLocalData();
      return data.commentVotes.filter((vote) => vote.comment_id === commentId)
        .length;
    },
  );
}

export async function hasSolutionRequestCommentVoted(
  commentId: string,
  voterId?: string,
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
        .from("solution_request_comment_votes")
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
      return data.commentVotes.some(
        (vote) => vote.comment_id === commentId && vote.voter_id === voterId,
      );
    },
  );
}

export async function toggleSolutionRequestCommentVote(
  commentId: string,
  voterId: string,
) {
  const supabase = getSupabase();

  return withLocalFallback(
    async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const voted = await hasSolutionRequestCommentVoted(commentId, voterId);

      if (voted) {
        const { error } = await supabase
          .from("solution_request_comment_votes")
          .delete()
          .eq("comment_id", commentId)
          .eq("voter_id", voterId);

        if (error) {
          throw error;
        }

        return {
          voted: false,
          count: await getSolutionRequestCommentVoteCount(commentId),
        };
      }

      const { error } = await supabase
        .from("solution_request_comment_votes")
        .insert({ comment_id: commentId, voter_id: voterId });

      if (error) {
        throw error;
      }

      return {
        voted: true,
        count: await getSolutionRequestCommentVoteCount(commentId),
      };
    },
    async () => {
      const data = await readLocalData();
      const voteIndex = data.commentVotes.findIndex(
        (vote) => vote.comment_id === commentId && vote.voter_id === voterId,
      );

      if (voteIndex >= 0) {
        data.commentVotes.splice(voteIndex, 1);
        await writeLocalData(data);
        return {
          voted: false,
          count: await getSolutionRequestCommentVoteCount(commentId),
        };
      }

      data.commentVotes.push({
        comment_id: commentId,
        voter_id: voterId,
        created_at: new Date().toISOString(),
      });
      await writeLocalData(data);
      return {
        voted: true,
        count: await getSolutionRequestCommentVoteCount(commentId),
      };
    },
  );
}
