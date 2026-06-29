import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
  readJsonObject,
} from "@/lib/projects/api-security";
import {
  canEditProject,
  deleteProject,
  updateProject,
} from "@/lib/projects/store";
import { validateProjectSubmission } from "@/lib/projects/submissions";

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { values: {}, errors: { form: "Sign in to edit this project." } },
      { status: 401 },
    );
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const values = body.value as Record<string, string>;

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "project:update", userId),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  if (!(await canEditProject(projectId, userId))) {
    return NextResponse.json(
      {
        values,
        errors: {
          form: "You can only edit projects submitted from your account.",
        },
      },
      { status: 403 },
    );
  }

  const result = await validateProjectSubmission(values, projectId);

  if (!result.ok) {
    return NextResponse.json(
      { values: result.values, errors: result.errors },
      { status: 400 },
    );
  }

  const project = await updateProject(projectId, {
    ...result.data,
    spamScore: result.spam.confidence,
    spamReason: result.spam.reason,
  });

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/projects`);
    revalidatePath(`/${locale}/p/${project.slug}`);
  }

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, { params }: Props) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to delete this project." },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(_request, "project:delete", userId),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  if (!(await canEditProject(projectId, userId))) {
    return NextResponse.json(
      { error: "You can only delete projects submitted from your account." },
      { status: 403 },
    );
  }

  const project = await deleteProject(projectId);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/projects`);
    revalidatePath(`/${locale}/p/${project.slug}`);
  }

  return NextResponse.json({ ok: true });
}
