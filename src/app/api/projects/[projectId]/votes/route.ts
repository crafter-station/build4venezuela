import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runMutation } from "@/lib/api-mutation";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/projects/api-security";
import { getVoteCount, hasVoted, toggleVote } from "@/lib/projects/store";

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();

  return NextResponse.json({
    count: await getVoteCount(projectId),
    voted: await hasVoted(projectId, userId ?? undefined),
  });
}

export async function POST(request: Request, { params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "project:vote", userId),
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const result = await runMutation("project.vote", { userId, projectId }, () =>
    toggleVote(projectId, userId),
  );

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json(result.value);
}
