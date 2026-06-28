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
import { createProject, listProjects } from "@/lib/projects/store";
import { validateProjectSubmission } from "@/lib/projects/submissions";

export async function GET() {
  return NextResponse.json({ projects: await listProjects() });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { errors: { form: "Sign in to submit a project." } },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "project:create", userId),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const values = body.value as Record<string, string>;
  const result = await validateProjectSubmission(values);

  if (!result.ok) {
    return NextResponse.json(
      { values: result.values, errors: result.errors },
      { status: 400 },
    );
  }

  const project = await createProject({
    ...result.data,
    ownerUserId: userId,
    spamScore: result.spam.confidence,
    spamReason: result.spam.reason,
  });

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/projects`);
  }

  return NextResponse.json({ project }, { status: 201 });
}
