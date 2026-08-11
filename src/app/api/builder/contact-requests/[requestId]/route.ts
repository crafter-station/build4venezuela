import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { updateBuilderContactRequestStatus } from "@/lib/builders/store";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
  readJsonObject,
} from "@/lib/projects/api-security";

type Props = {
  params: Promise<{ requestId: string }>;
};

const statusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  hideProfile: z.boolean().default(false),
});

export async function PATCH(request: Request, { params }: Props) {
  const { requestId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to update this request." },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit({
    key: rateLimitKey(request, "builder:contact:update", userId),
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfter);
  }

  const body = await readJsonObject(request);

  if (!body.ok) {
    return body.response;
  }

  const parsed = statusSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose accept or reject." },
      { status: 400 },
    );
  }

  try {
    const contactRequest = await updateBuilderContactRequestStatus(
      requestId,
      userId,
      parsed.data.status,
      parsed.data.hideProfile,
    );

    return NextResponse.json({ request: contactRequest });
  } catch {
    return NextResponse.json(
      { error: "Contact request not found." },
      { status: 404 },
    );
  }
}
