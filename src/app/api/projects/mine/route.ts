import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listProjectsByOwner } from "@/lib/projects/store";

// Slim list of the signed-in user's own registered projects, used by the
// builder contact form to let owners attach a project to their request.
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ projects: [] });
  }

  const projects = await listProjectsByOwner(userId);

  return NextResponse.json({
    projects: projects.map((project) => ({
      slug: project.slug,
      name: project.name,
      projectUrl: project.projectUrl,
      contributeInUrl: project.contributeInUrl,
    })),
  });
}
