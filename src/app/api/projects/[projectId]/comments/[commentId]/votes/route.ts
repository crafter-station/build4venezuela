import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runMutation } from "@/lib/api-mutation";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/projects/api-security";
import {
  getCommentVoteCount,
  hasCommentVoted,
  toggleCommentVote,
} from "@/lib/projects/store";

type Props = {
  params: Promise<{ commentId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { commentId } = await params;
  const { userId } = await auth();

  return NextResponse.json({
    count: await getCommentVoteCount(commentId),
    voted: await hasCommentVoted(commentId, userId ?? undefined),
  });
}

export async function POST(request: Request, { params }: Props) {
  const { commentId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "project:comment-vote", userId),
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const result = await runMutation(
    "project.commentVote",
    { userId, commentId },
    () => toggleCommentVote(commentId, userId),
  );

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json(result.value);
}
