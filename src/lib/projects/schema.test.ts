import { expect, test } from "bun:test";
import { type Project, projectFormSchema, sortProjectsByVotes } from "./schema";

function project(overrides: Partial<Project>): Project {
  return {
    id: "project-id",
    slug: "project-slug",
    name: "Project",
    status: "published",
    lifecycleStatus: "ready_to_use",
    projectUrl: "https://example.com",
    countries: ["Venezuela"],
    participantName: "Team",
    videoUrl: "",
    contributeInUrl: "",
    descriptionMarkdown: "Description",
    ownerName: "Owner",
    ownerImageUrl: "",
    publishedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    votesCount: 0,
    ...overrides,
  };
}

test("sortProjectsByVotes prioritizes video when vote counts tie", () => {
  const sorted = sortProjectsByVotes([
    project({
      id: "newer-no-video",
      votesCount: 5,
      publishedAt: "2026-02-01T00:00:00.000Z",
    }),
    project({
      id: "older-with-video",
      votesCount: 5,
      videoUrl: "https://youtube.com/watch?v=abc12345678",
    }),
    project({ id: "highest-votes", votesCount: 6 }),
  ]);

  expect(sorted.map((item) => item.id)).toEqual([
    "highest-votes",
    "older-with-video",
    "newer-no-video",
  ]);
});

test("projectFormSchema accepts common demo video hosts", () => {
  const baseProject = {
    slug: "project-slug",
    name: "Project",
    lifecycleStatus: "ready_to_use",
    projectUrl: "https://example.com",
    countries: "Venezuela",
    participantName: "Team",
    contributeInUrl: "",
    descriptionMarkdown:
      "This is a complete project description with enough detail to satisfy the minimum length requirement.",
  };

  for (const videoUrl of [
    "https://youtu.be/abc123",
    "https://vimeo.com/123456789",
    "https://www.loom.com/share/abc123",
    "https://screen.studio/share/abc123",
    "https://www.instagram.com/reel/abc123/",
    "https://www.tiktok.com/@team/video/123456789",
    "https://vm.tiktok.com/abc123/",
  ]) {
    expect(
      projectFormSchema.safeParse({ ...baseProject, videoUrl }).success,
    ).toBe(true);
  }
});
