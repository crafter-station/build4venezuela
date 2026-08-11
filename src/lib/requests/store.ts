import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import {
  solutionRequestComments,
  solutionRequestCommentVotes,
  solutionRequests,
  solutionRequestVotes,
} from "@/db/schema";
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
const requestVoteCount = count(solutionRequestVotes.voterId);
const commentVoteCount = count(solutionRequestCommentVotes.voterId);

function drizzleComment(
  row: typeof solutionRequestComments.$inferSelect,
  votesCount = 0,
  voted = false,
): SolutionRequestComment {
  return {
    id: row.id,
    requestId: row.requestId,
    authorName: row.authorName,
    authorImageUrl: row.authorImageUrl,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    votesCount,
    voted,
  };
}

function drizzleRequest(
  row: typeof solutionRequests.$inferSelect,
  votesCount = 0,
  comments: SolutionRequestComment[] = [],
  voted = false,
): SolutionRequest {
  return {
    id: row.id,
    name: row.name,
    descriptionMarkdown: row.descriptionMarkdown,
    authorName: row.authorName,
    authorImageUrl: row.authorImageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    votesCount,
    voted,
    comments: sortSolutionRequestComments(comments),
  };
}

function localComment(
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

function localRequest(
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

async function withConfiguredStore<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
) {
  if (!isDbConfigured()) {
    return fallback();
  }

  return operation();
}

export async function listSolutionRequests(voterId?: string) {
  return withConfiguredStore(
    async () => {
      const requestRows = await db
        .select({ request: solutionRequests, votesCount: requestVoteCount })
        .from(solutionRequests)
        .leftJoin(
          solutionRequestVotes,
          eq(solutionRequestVotes.requestId, solutionRequests.id),
        )
        .groupBy(solutionRequests.id)
        .orderBy(desc(solutionRequests.createdAt));
      const requestIds = requestRows.map(({ request }) => request.id);

      if (requestIds.length === 0) {
        return [];
      }

      const [commentRows, requestVotes] = await Promise.all([
        db
          .select({
            comment: solutionRequestComments,
            votesCount: commentVoteCount,
          })
          .from(solutionRequestComments)
          .leftJoin(
            solutionRequestCommentVotes,
            eq(
              solutionRequestCommentVotes.commentId,
              solutionRequestComments.id,
            ),
          )
          .where(inArray(solutionRequestComments.requestId, requestIds))
          .groupBy(solutionRequestComments.id)
          .orderBy(asc(solutionRequestComments.createdAt)),
        voterId
          ? db
              .select({ requestId: solutionRequestVotes.requestId })
              .from(solutionRequestVotes)
              .where(
                and(
                  eq(solutionRequestVotes.voterId, voterId),
                  inArray(solutionRequestVotes.requestId, requestIds),
                ),
              )
          : Promise.resolve([]),
      ]);
      const commentIds = commentRows.map(({ comment }) => comment.id);
      const commentVotes =
        voterId && commentIds.length > 0
          ? await db
              .select({ commentId: solutionRequestCommentVotes.commentId })
              .from(solutionRequestCommentVotes)
              .where(
                and(
                  eq(solutionRequestCommentVotes.voterId, voterId),
                  inArray(solutionRequestCommentVotes.commentId, commentIds),
                ),
              )
          : [];
      const votedRequestIds = new Set(
        requestVotes.map((vote) => vote.requestId),
      );
      const votedCommentIds = new Set(
        commentVotes.map((vote) => vote.commentId),
      );
      const commentsByRequest = new Map<string, SolutionRequestComment[]>();

      for (const { comment, votesCount } of commentRows) {
        const comments = commentsByRequest.get(comment.requestId) ?? [];
        comments.push(
          drizzleComment(comment, votesCount, votedCommentIds.has(comment.id)),
        );
        commentsByRequest.set(comment.requestId, comments);
      }

      return sortSolutionRequests(
        requestRows.map(({ request, votesCount }) =>
          drizzleRequest(
            request,
            votesCount,
            commentsByRequest.get(request.id) ?? [],
            votedRequestIds.has(request.id),
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
          localComment(
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
          localRequest(
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
  return withConfiguredStore(
    async () => {
      const [row] = await db
        .insert(solutionRequests)
        .values({
          name: input.name,
          descriptionMarkdown: input.descriptionMarkdown,
          authorUserId,
          authorName,
          authorImageUrl,
        })
        .returning();
      return drizzleRequest(row);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const row: RequestRow = {
        id: randomUUID(),
        name: input.name,
        description_markdown: input.descriptionMarkdown,
        author_user_id: authorUserId,
        author_name: authorName,
        author_image_url: authorImageUrl,
        created_at: now,
        updated_at: now,
      };
      data.requests.unshift(row);
      await writeLocalData(data);
      return localRequest(row);
    },
  );
}

export async function getSolutionRequestVoteCount(requestId: string) {
  return withConfiguredStore(
    async () => {
      const [row] = await db
        .select({ count: count() })
        .from(solutionRequestVotes)
        .where(eq(solutionRequestVotes.requestId, requestId));
      return row?.count ?? 0;
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
  if (!voterId) return false;

  return withConfiguredStore(
    async () => {
      const rows = await db
        .select({ requestId: solutionRequestVotes.requestId })
        .from(solutionRequestVotes)
        .where(
          and(
            eq(solutionRequestVotes.requestId, requestId),
            eq(solutionRequestVotes.voterId, voterId),
          ),
        )
        .limit(1);
      return rows.length > 0;
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
  return withConfiguredStore(
    async () => {
      const voted = await hasSolutionRequestVoted(requestId, voterId);
      if (voted) {
        await db
          .delete(solutionRequestVotes)
          .where(
            and(
              eq(solutionRequestVotes.requestId, requestId),
              eq(solutionRequestVotes.voterId, voterId),
            ),
          );
      } else {
        await db.insert(solutionRequestVotes).values({ requestId, voterId });
      }
      return {
        voted: !voted,
        count: await getSolutionRequestVoteCount(requestId),
      };
    },
    async () => {
      const data = await readLocalData();
      const index = data.votes.findIndex(
        (vote) => vote.request_id === requestId && vote.voter_id === voterId,
      );
      const voted = index < 0;
      if (voted) {
        data.votes.push({
          request_id: requestId,
          voter_id: voterId,
          created_at: new Date().toISOString(),
        });
      } else {
        data.votes.splice(index, 1);
      }
      await writeLocalData(data);
      return {
        voted,
        count: data.votes.filter((vote) => vote.request_id === requestId)
          .length,
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
  return withConfiguredStore(
    async () => {
      const [row] = await db
        .insert(solutionRequestComments)
        .values({
          requestId,
          authorUserId,
          authorName,
          authorImageUrl,
          body: input.body,
        })
        .returning();
      return drizzleComment(row);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const row: RequestCommentRow = {
        id: randomUUID(),
        request_id: requestId,
        author_user_id: authorUserId,
        author_name: authorName,
        author_image_url: authorImageUrl,
        body: input.body,
        created_at: now,
        updated_at: now,
      };
      data.comments.push(row);
      await writeLocalData(data);
      return localComment(row);
    },
  );
}

export async function solutionRequestCommentBelongsToRequest(
  requestId: string,
  commentId: string,
) {
  return withConfiguredStore(
    async () => {
      const rows = await db
        .select({ id: solutionRequestComments.id })
        .from(solutionRequestComments)
        .where(
          and(
            eq(solutionRequestComments.id, commentId),
            eq(solutionRequestComments.requestId, requestId),
          ),
        )
        .limit(1);
      return rows.length > 0;
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
  return withConfiguredStore(
    async () => {
      const [row] = await db
        .select({ count: count() })
        .from(solutionRequestCommentVotes)
        .where(eq(solutionRequestCommentVotes.commentId, commentId));
      return row?.count ?? 0;
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
  if (!voterId) return false;

  return withConfiguredStore(
    async () => {
      const rows = await db
        .select({ commentId: solutionRequestCommentVotes.commentId })
        .from(solutionRequestCommentVotes)
        .where(
          and(
            eq(solutionRequestCommentVotes.commentId, commentId),
            eq(solutionRequestCommentVotes.voterId, voterId),
          ),
        )
        .limit(1);
      return rows.length > 0;
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
  return withConfiguredStore(
    async () => {
      const voted = await hasSolutionRequestCommentVoted(commentId, voterId);
      if (voted) {
        await db
          .delete(solutionRequestCommentVotes)
          .where(
            and(
              eq(solutionRequestCommentVotes.commentId, commentId),
              eq(solutionRequestCommentVotes.voterId, voterId),
            ),
          );
      } else {
        await db
          .insert(solutionRequestCommentVotes)
          .values({ commentId, voterId });
      }
      return {
        voted: !voted,
        count: await getSolutionRequestCommentVoteCount(commentId),
      };
    },
    async () => {
      const data = await readLocalData();
      const index = data.commentVotes.findIndex(
        (vote) => vote.comment_id === commentId && vote.voter_id === voterId,
      );
      const voted = index < 0;
      if (voted) {
        data.commentVotes.push({
          comment_id: commentId,
          voter_id: voterId,
          created_at: new Date().toISOString(),
        });
      } else {
        data.commentVotes.splice(index, 1);
      }
      await writeLocalData(data);
      return {
        voted,
        count: data.commentVotes.filter((vote) => vote.comment_id === commentId)
          .length,
      };
    },
  );
}
