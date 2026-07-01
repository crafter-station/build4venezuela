import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listBuilderContactRequests } from "@/lib/builders/store";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to view builder requests." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    requests: await listBuilderContactRequests(userId),
  });
}
