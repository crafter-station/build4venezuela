import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runMutation, runQuery } from "@/lib/api-mutation";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
  readJsonObject,
} from "@/lib/projects/api-security";
import { projectCommentSchema, validationErrors } from "@/lib/projects/schema";
import { checkCommentForSpam } from "@/lib/projects/spam";
import { createComment, listComments } from "@/lib/projects/store";

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();

  const result = await runQuery("project.comments.list", { projectId }, () =>
    listComments(projectId, userId ?? undefined),
  );

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json({ comments: result.value });
}

export async function POST(request: Request, { params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "project:comment", userId),
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = projectCommentSchema.safeParse(body.value);

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
  const authorName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.username ||
    "Community member";

  const result = await runMutation(
    "project.comment",
    { userId, projectId },
    () =>
      createComment(
        projectId,
        userId,
        authorName,
        user?.imageUrl ?? "",
        parsed.data,
      ),
  );

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json(result.value, { status: 201 });
}
