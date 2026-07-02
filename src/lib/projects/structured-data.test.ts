import { describe, expect, test } from "bun:test";
import type { Project } from "@/lib/projects/schema";
import { buildProjectJsonLd, markdownExcerpt } from "./structured-data";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "1",
    slug: "some-project",
    name: "Some Project",
    status: "published",
    lifecycleStatus: "ready_to_use",
    projectUrl: "https://example.org",
    countries: ["Venezuela"],
    participantName: "Team X",
    videoUrl: "",
    contributeInUrl: "",
    descriptionMarkdown: "# Title\n\nA **bold** [link](https://x.org) here.",
    ownerName: "",
    ownerImageUrl: "",
    publishedAt: null,
    createdAt: "",
    updatedAt: "",
    votesCount: 0,
    ...overrides,
  };
}

describe("markdownExcerpt", () => {
  test("strips markdown to plain text", () => {
    expect(
      markdownExcerpt("# Title\n\nA **bold** [link](https://x.org)."),
    ).toBe("Title A bold link.");
  });

  test("truncates with ellipsis", () => {
    const out = markdownExcerpt("word ".repeat(100), 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("buildProjectJsonLd", () => {
  const url = "https://build4venezuela.com/en/p/some-project";

  test("known org attaches Organization publisher with its web", () => {
    const jsonLd = buildProjectJsonLd(
      makeProject({ slug: "responsegrid", name: "ResponseGrid" }),
      "https://build4venezuela.com/en/p/responsegrid",
    );
    const publisher = jsonLd.publisher as { name: string; url: string };
    expect(publisher.name).toBe("Global Emergency");
    expect(publisher.url).toBe("https://globalemergency.online");
    expect(jsonLd.author).toEqual(jsonLd.publisher);
  });

  test("unknown org falls back to Person author", () => {
    const jsonLd = buildProjectJsonLd(makeProject(), url);
    expect(jsonLd.publisher).toBeUndefined();
    expect(jsonLd.author).toEqual({ "@type": "Person", name: "Team X" });
  });

  test("only http(s) sameAs links are included", () => {
    const jsonLd = buildProjectJsonLd(
      makeProject({
        videoUrl: "https://youtu.be/abc",
        contributeInUrl: "not-a-url",
      }),
      url,
    );
    expect(jsonLd.sameAs).toEqual(["https://youtu.be/abc"]);
  });
});
