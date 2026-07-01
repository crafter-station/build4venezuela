import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { runMutation, runQuery } from "@/lib/api-mutation";
import { logEvent, timed } from "@/lib/log";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
  readJsonObject,
} from "@/lib/projects/api-security";
import { checkSolutionRequestForSpam } from "@/lib/projects/spam";
import { solutionRequestSchema, validationErrors } from "@/lib/requests/schema";
import {
  createSolutionRequest,
  listSolutionRequests,
} from "@/lib/requests/store";

function displayName(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.username ||
    "Community member"
  );
}

export async function GET() {
  const { userId } = await auth();

  const result = await runQuery("request.list", {}, () =>
    listSolutionRequests(userId ?? undefined),
  );

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json({ requests: result.value });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to leave a request." },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "solution-request:create", userId),
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = solutionRequestSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { errors: validationErrors(parsed.error) },
      { status: 400 },
    );
  }

  logEvent("request.submit.start", {
    userId,
    nameLen: parsed.data.name.length,
    descLen: parsed.data.descriptionMarkdown.length,
  });

  const spam = await timed("request.spam", { userId }, () =>
    checkSolutionRequestForSpam(parsed.data),
  );

  if (!spam.validationPassed) {
    logEvent("request.submit.blocked", { userId, reason: "spam-unavailable" });
    return NextResponse.json({ error: spam.reason }, { status: 503 });
  }

  if (spam.isSpam && spam.confidence >= 0.7) {
    logEvent("request.submit.blocked", { userId, reason: "spam" });
    return NextResponse.json(
      {
        errors: { descriptionMarkdown: `This looks like spam: ${spam.reason}` },
      },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const result = await runMutation("request.create", { userId }, () =>
    createSolutionRequest(
      parsed.data,
      userId,
      displayName(user),
      user?.imageUrl ?? "",
    ),
  );

  if ("response" in result) {
    return result.response;
  }

  const solutionRequest = result.value;

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/requests`);
  }

  logEvent("request.submit.ok", { userId, requestId: solutionRequest.id });
  return NextResponse.json({ request: solutionRequest }, { status: 201 });
}
