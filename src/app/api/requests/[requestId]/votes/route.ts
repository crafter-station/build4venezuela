import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runMutation, runQuery } from "@/lib/api-mutation";
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

  const result = await runQuery("request.votes.get", { requestId }, () =>
    Promise.all([
      getSolutionRequestVoteCount(requestId),
      hasSolutionRequestVoted(requestId, userId ?? undefined),
    ]),
  );

  if ("response" in result) {
    return result.response;
  }

  const [count, voted] = result.value;
  return NextResponse.json({ count, voted });
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

  const result = await runMutation("request.vote", { userId, requestId }, () =>
    toggleSolutionRequestVote(requestId, userId),
  );

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json(result.value);
}
