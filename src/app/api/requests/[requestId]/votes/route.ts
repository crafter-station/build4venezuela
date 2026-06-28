import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/projects/api-security";
import {
  getSolutionRequestVoteCount,
  hasSolutionRequestVoted,
  toggleSolutionRequestVote,
} from "@/lib/requests/store";

type Props = {
  params: Promise<{ requestId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { requestId } = await params;
  const { userId } = await auth();

  return NextResponse.json({
    count: await getSolutionRequestVoteCount(requestId),
    voted: await hasSolutionRequestVoted(requestId, userId ?? undefined),
  });
}

export async function POST(request: Request, { params }: Props) {
  const { requestId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "solution-request:vote", userId),
    limit: 80,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  return NextResponse.json(await toggleSolutionRequestVote(requestId, userId));
}
