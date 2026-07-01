import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { builderProfileSchema, validationErrors } from "@/lib/builders/schema";
import {
  deleteBuilderProfile,
  listPublicBuilders,
  updateBuilderProfileVisibility,
  upsertBuilderProfile,
} from "@/lib/builders/store";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
  readJsonObject,
} from "@/lib/projects/api-security";
import { checkBuilderProfileForSpam } from "@/lib/projects/spam";

export async function GET() {
  const { userId } = await auth();

  return NextResponse.json({ builders: await listPublicBuilders(userId) });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { errors: { form: "Sign in to register as a builder." } },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "builder:profile:save", userId),
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = builderProfileSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { values: body.value, errors: validationErrors(parsed.error) },
      { status: 400 },
    );
  }

  const spam = await checkBuilderProfileForSpam(parsed.data);

  if (spam.validationPassed && spam.isSpam) {
    return NextResponse.json(
      {
        values: body.value,
        errors: { form: "This profile looks like spam. Please revise it." },
      },
      { status: 400 },
    );
  }

  if (!spam.validationPassed) {
    return NextResponse.json(
      { values: body.value, errors: { form: spam.reason } },
      { status: 503 },
    );
  }

  const builder = await upsertBuilderProfile({
    ...parsed.data,
    userId,
    spamScore: spam.confidence,
    spamReason: spam.reason,
  });

  return NextResponse.json({ builder }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { errors: { form: "Sign in to update your builder profile." } },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "builder:profile:visibility", userId),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const action = typeof body.value.action === "string" ? body.value.action : "";

  if (action !== "freeze" && action !== "activate") {
    return NextResponse.json(
      { errors: { form: "Choose whether to freeze or activate the profile." } },
      { status: 400 },
    );
  }

  try {
    const builder = await updateBuilderProfileVisibility(
      userId,
      action === "freeze",
    );
    return NextResponse.json({ builder });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update profile.";
    return NextResponse.json({ errors: { form: message } }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { errors: { form: "Sign in to remove your builder profile." } },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "builder:profile:delete", userId),
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  try {
    await deleteBuilderProfile(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not remove profile.";
    return NextResponse.json({ errors: { form: message } }, { status: 404 });
  }
}
