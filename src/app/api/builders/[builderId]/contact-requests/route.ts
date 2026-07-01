import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  builderContactRequestSchema,
  validationErrors,
} from "@/lib/builders/schema";
import {
  createBuilderContactRequest,
  getPublicBuilderById,
} from "@/lib/builders/store";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
  readJsonObject,
} from "@/lib/projects/api-security";
import { checkBuilderContactRequestForSpam } from "@/lib/projects/spam";
import { listProjectsByOwner } from "@/lib/projects/store";

type Props = {
  params: Promise<{ builderId: string }>;
};

type OwnedProject = Awaited<ReturnType<typeof listProjectsByOwner>>[number];

function displayName(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.username ||
    "Project owner"
  );
}

// Structured block appended to the note so the builder sees the attached
// project's public links and resources alongside the cover letter.
function projectAttachment(project: OwnedProject, origin: string) {
  const lines = [
    `Project: ${project.name}`,
    `Build4Venezuela: ${origin}/p/${project.slug}`,
  ];

  if (project.projectUrl) {
    lines.push(`Link: ${project.projectUrl}`);
  }

  if (project.contributeInUrl) {
    lines.push(`Public resources: ${project.contributeInUrl}`);
  }

  return lines.join("\n");
}

export async function POST(request: Request, { params }: Props) {
  const { builderId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { errors: { form: "Sign in to contact a builder." } },
      { status: 401 },
    );
  }

  const builder = await getPublicBuilderById(builderId);

  if (!builder) {
    return NextResponse.json(
      { errors: { form: "This builder is not currently available." } },
      { status: 404 },
    );
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "builder:contact", userId),
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = builderContactRequestSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { values: body.value, errors: validationErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { projectSlug, ...contactData } = parsed.data;

  // When the requester attaches one of their own projects, verify ownership
  // server-side and fold the project's public info into the note so it can't be
  // spoofed and so the spam check sees the full message.
  if (projectSlug) {
    const owned = await listProjectsByOwner(userId);
    const project = owned.find((item) => item.slug === projectSlug);

    if (!project) {
      return NextResponse.json(
        {
          values: body.value,
          errors: { form: "You can only attach a project you registered." },
        },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;
    contactData.projectName = project.name;
    contactData.coverLetter = `${contactData.coverLetter}\n\n${projectAttachment(
      project,
      origin,
    )}`;
  }

  const spam = await checkBuilderContactRequestForSpam(contactData);

  if (spam.validationPassed && spam.isSpam) {
    return NextResponse.json(
      {
        values: body.value,
        errorCode: "builderContactSpam",
        errors: { form: "This request looks like spam. Please revise it." },
      },
      { status: 400 },
    );
  }

  if (!spam.validationPassed) {
    return NextResponse.json(
      {
        values: body.value,
        errors: { form: spam.reason },
      },
      { status: 503 },
    );
  }

  const user = await currentUser();
  const contactRequest = await createBuilderContactRequest({
    ...contactData,
    builderId: builder.id,
    requesterUserId: userId,
    requesterName: displayName(user),
    requesterImageUrl: user?.imageUrl ?? "",
    spamScore: spam.confidence,
    spamReason: spam.reason,
  });

  return NextResponse.json({ request: contactRequest }, { status: 201 });
}
