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

  test("known org attaches Organization publisher with web + socials", () => {
    const jsonLd = buildProjectJsonLd(
      makeProject({ slug: "responsegrid", name: "ResponseGrid" }),
      "https://build4venezuela.com/en/p/responsegrid",
    );
    const publisher = jsonLd.publisher as {
      name: string;
      url: string;
      sameAs: string[];
    };
    expect(publisher.name).toBe("Global Emergency");
    expect(publisher.url).toBe("https://globalemergency.online");
    expect(publisher.sameAs).toContain("https://x.com/GlobalEmergenc");
    expect(jsonLd.author).toEqual(jsonLd.publisher);
  });

  test("unknown org falls back to Person author", () => {
    const jsonLd = buildProjectJsonLd(makeProject(), url);
    expect(jsonLd.publisher).toBeUndefined();
    expect(jsonLd.author).toEqual({ "@type": "Person", name: "Team X" });
  });

  test("merges project socials into sameAs, deduped, http(s) only", () => {
    const jsonLd = buildProjectJsonLd(
      makeProject({
        videoUrl: "https://youtu.be/abc",
        contributeInUrl: "not-a-url",
      }),
      url,
      { sameAs: ["https://x.com/team", "https://youtu.be/abc"] },
    );
    expect(jsonLd.sameAs).toEqual([
      "https://youtu.be/abc",
      "https://x.com/team",
    ]);
  });

  test("endorsedBy official bodies become sponsor entries", () => {
    const jsonLd = buildProjectJsonLd(makeProject(), url, {
      endorsedBy: [
        {
          name: "Protección Civil",
          url: "https://pc.example",
          sameAs: ["https://pc.example"],
        },
      ],
    });
    expect(jsonLd.sponsor).toEqual([
      {
        "@type": "Organization",
        name: "Protección Civil",
        url: "https://pc.example",
        sameAs: ["https://pc.example"],
      },
    ]);
  });
});
