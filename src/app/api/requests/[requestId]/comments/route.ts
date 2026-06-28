import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
  readJsonObject,
} from "@/lib/projects/api-security";
import { checkCommentForSpam } from "@/lib/projects/spam";
import {
  solutionRequestCommentSchema,
  validationErrors,
} from "@/lib/requests/schema";
import { createSolutionRequestComment } from "@/lib/requests/store";

type Props = {
  params: Promise<{ requestId: string }>;
};

function displayName(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.username ||
    "Community member"
  );
}

export async function POST(request: Request, { params }: Props) {
  const { requestId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "solution-request:comment", userId),
    limit: 15,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = solutionRequestCommentSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { errors: validationErrors(parsed.error) },
      { status: 400 },
    );
  }

  const spam = await checkCommentForSpam(parsed.data);

  if (!spam.validationPassed) {
    return NextResponse.json({ error: spam.reason }, { status: 503 });
  }

  if (spam.isSpam && spam.confidence >= 0.7) {
    return NextResponse.json(
      { errors: { body: `This looks like spam: ${spam.reason}` } },
      { status: 400 },
    );
  }

  const user = await currentUser();

  return NextResponse.json(
    await createSolutionRequestComment(
      requestId,
      userId,
      displayName(user),
      parsed.data,
    ),
    { status: 201 },
  );
}
