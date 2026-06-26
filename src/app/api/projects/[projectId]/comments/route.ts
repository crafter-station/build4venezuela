import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { projectCommentSchema, validationErrors } from "@/lib/projects/schema";
import { checkCommentForSpam } from "@/lib/projects/spam";
import { createComment, listComments } from "@/lib/projects/store";

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();

  return NextResponse.json({
    comments: await listComments(projectId, userId ?? undefined),
  });
}

export async function POST(request: Request, { params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const parsed = projectCommentSchema.safeParse(await request.json());

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

  return NextResponse.json(
    await createComment(projectId, userId, authorName, parsed.data),
    { status: 201 },
  );
}
