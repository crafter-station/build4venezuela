import { db } from "@/db";
import {
  builderContactRequests,
  builderProfiles,
  categoryProposals,
  projectCategories,
  projectComments,
  projectCommentVotes,
  projectInsights,
  projects,
  projectVotes,
  solutionRequestComments,
  solutionRequestCommentVotes,
  solutionRequests,
  solutionRequestVotes,
} from "@/db/schema";

const sourceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!sourceUrl || !sourceKey || !process.env.DATABASE_URL) {
  throw new Error(
    "Supabase source credentials and Neon DATABASE_URL are required.",
  );
}

const sourceHeaders = {
  apikey: sourceKey,
  Authorization: `Bearer ${sourceKey}`,
  Range: "0-999",
};

function camelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function toDrizzleRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      camelCase(key),
      key.endsWith("_at") && typeof value === "string"
        ? new Date(value)
        : value,
    ]),
  );
}

async function readTable(table: string) {
  const response = await fetch(`${sourceUrl}/rest/v1/${table}?select=*`, {
    headers: sourceHeaders,
  });
  if (!response.ok) {
    throw new Error(`${table}: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as Record<string, unknown>[];
  return data.map((row) => toDrizzleRow(row));
}

const sourceData = {
  projects: await readTable("projects"),
  projectVotes: await readTable("project_votes"),
  projectComments: await readTable("project_comments"),
  projectCommentVotes: await readTable("project_comment_votes"),
  categoryProposals: await readTable("category_proposals"),
  projectCategories: await readTable("project_categories"),
  projectInsights: await readTable("project_insights"),
  solutionRequests: await readTable("solution_requests"),
  solutionRequestVotes: await readTable("solution_request_votes"),
  solutionRequestComments: await readTable("solution_request_comments"),
  solutionRequestCommentVotes: await readTable(
    "solution_request_comment_votes",
  ),
  builderProfiles: await readTable("builder_profiles"),
  builderContactRequests: await readTable("builder_contact_requests"),
};

for (const project of sourceData.projects) {
  project.applicability ??= "latam";
}

await db.transaction(async (tx) => {
  if (sourceData.projects.length > 0) {
    await tx
      .insert(projects)
      .values(sourceData.projects as never[])
      .onConflictDoNothing();
  }
  if (sourceData.categoryProposals.length > 0) {
    await tx
      .insert(categoryProposals)
      .values(sourceData.categoryProposals as never[])
      .onConflictDoNothing();
  }
  if (sourceData.projectCategories.length > 0) {
    await tx
      .insert(projectCategories)
      .values(sourceData.projectCategories as never[])
      .onConflictDoNothing();
  }
  if (sourceData.projectInsights.length > 0) {
    await tx
      .insert(projectInsights)
      .values(sourceData.projectInsights as never[])
      .onConflictDoNothing();
  }
  if (sourceData.projectVotes.length > 0) {
    await tx
      .insert(projectVotes)
      .values(sourceData.projectVotes as never[])
      .onConflictDoNothing();
  }
  if (sourceData.projectComments.length > 0) {
    await tx
      .insert(projectComments)
      .values(sourceData.projectComments as never[])
      .onConflictDoNothing();
  }
  if (sourceData.projectCommentVotes.length > 0) {
    await tx
      .insert(projectCommentVotes)
      .values(sourceData.projectCommentVotes as never[])
      .onConflictDoNothing();
  }
  if (sourceData.solutionRequests.length > 0) {
    await tx
      .insert(solutionRequests)
      .values(sourceData.solutionRequests as never[])
      .onConflictDoNothing();
  }
  if (sourceData.solutionRequestVotes.length > 0) {
    await tx
      .insert(solutionRequestVotes)
      .values(sourceData.solutionRequestVotes as never[])
      .onConflictDoNothing();
  }
  if (sourceData.solutionRequestComments.length > 0) {
    await tx
      .insert(solutionRequestComments)
      .values(sourceData.solutionRequestComments as never[])
      .onConflictDoNothing();
  }
  if (sourceData.solutionRequestCommentVotes.length > 0) {
    await tx
      .insert(solutionRequestCommentVotes)
      .values(sourceData.solutionRequestCommentVotes as never[])
      .onConflictDoNothing();
  }
  if (sourceData.builderProfiles.length > 0) {
    await tx
      .insert(builderProfiles)
      .values(sourceData.builderProfiles as never[])
      .onConflictDoNothing();
  }
  if (sourceData.builderContactRequests.length > 0) {
    await tx
      .insert(builderContactRequests)
      .values(sourceData.builderContactRequests as never[])
      .onConflictDoNothing();
  }
});

for (const [table, rows] of Object.entries(sourceData)) {
  console.log(`${table}: ${rows.length}`);
}
