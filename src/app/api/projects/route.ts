import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { logEvent, timed } from "@/lib/log";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
  readJsonObject,
} from "@/lib/projects/api-security";
import {
  BUILTIN_CATEGORY_IDS,
  decideCategory,
} from "@/lib/projects/categories";
import {
  assignProjectCategory,
  getCategoryContext,
} from "@/lib/projects/category-store";
import { classifyProject } from "@/lib/projects/classify";
import type { ProjectFormInput } from "@/lib/projects/schema";
import { createProject, listProjects } from "@/lib/projects/store";
import { validateProjectSubmission } from "@/lib/projects/submissions";

async function classifyAndStore(
  projectId: string,
  data: ProjectFormInput,
): Promise<void> {
  try {
    const { proposals } = await getCategoryContext();
    const verdict = await classifyProject(data, {
      pendingProposals: proposals,
    });

    if (!verdict.validationPassed) {
      return;
    }

    const knownIds = new Set<string>([
      ...BUILTIN_CATEGORY_IDS,
      ...proposals.map((proposal) => proposal.id),
    ]);
    await assignProjectCategory(projectId, decideCategory(verdict, knownIds));
  } catch (error) {
    // Classification is best-effort: the list page falls back to the keyword
    // heuristic for any project without a stored assignment.
    console.error("Project classification/storage failed", error);
  }
}

function displayName(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.username ||
    "Community member"
  );
}

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

  logEvent("project.submit.start", { userId, slug: values.slug });

  // Runs the slug check + spam LLM call; the heaviest, most failure-prone step.
  const result = await timed(
    "project.validate",
    { userId, slug: values.slug },
    () => validateProjectSubmission(values),
  );

  if (!result.ok) {
    logEvent("project.submit.blocked", { userId, slug: values.slug });
    return NextResponse.json(
      { values: result.values, errors: result.errors },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const project = await timed(
    "project.create",
    { userId, slug: values.slug },
    () =>
      createProject({
        ...result.data,
        ownerUserId: userId,
        ownerName: displayName(user),
        ownerImageUrl: user?.imageUrl ?? "",
        spamScore: result.spam.confidence,
        spamReason: result.spam.reason,
      }),
  );

  // Best-effort: never blocks the response on failure, but we still time it so a
  // slow classify call is visible in the logs.
  await timed("project.classify", { userId, projectId: project.id }, () =>
    classifyAndStore(project.id, result.data),
  );

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/projects`);
  }

  logEvent("project.submit.ok", { userId, projectId: project.id });
  return NextResponse.json({ project }, { status: 201 });
}
