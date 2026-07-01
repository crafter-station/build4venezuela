import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runMutation, runQuery } from "@/lib/api-mutation";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/projects/api-security";
import {
  getSolutionRequestCommentVoteCount,
  hasSolutionRequestCommentVoted,
  solutionRequestCommentBelongsToRequest,
  toggleSolutionRequestCommentVote,
} from "@/lib/requests/store";

type Props = {
  params: Promise<{ requestId: string; commentId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { requestId, commentId } = await params;
  const { userId } = await auth();

  const result = await runQuery(
    "request.commentVote.get",
    { requestId, commentId },
    async () => {
      if (
        !(await solutionRequestCommentBelongsToRequest(requestId, commentId))
      ) {
        return null;
      }

      return Promise.all([
        getSolutionRequestCommentVoteCount(commentId),
        hasSolutionRequestCommentVoted(commentId, userId ?? undefined),
      ]);
    },
  );

  if ("response" in result) {
    return result.response;
  }

  if (!result.value) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const [count, voted] = result.value;
  return NextResponse.json({ count, voted });
}

export async function POST(request: Request, { params }: Props) {
  const { requestId, commentId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }

  if (!(await solutionRequestCommentBelongsToRequest(requestId, commentId))) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "solution-request:comment-vote", userId),
    limit: 80,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const result = await runMutation(
    "request.commentVote",
    { userId, requestId, commentId },
    () => toggleSolutionRequestCommentVote(commentId, userId),
  );

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json(result.value);
}
