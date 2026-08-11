import { describe, expect, test } from "bun:test";
import type { Project } from "@/lib/projects/schema";
import {
  buildProjectJsonLd,
  markdownExcerpt,
  serializeJsonLd,
} from "./structured-data";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "1",
    slug: "some-project",
    name: "Some Project",
    status: "published",
    lifecycleStatus: "ready_to_use",
    applicability: "latam",
    projectUrl: "https://example.org",
    countries: ["Venezuela"],
    participantName: "Team X",
    videoUrl: "",
    imageUrl: "",
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
      markdownExcerpt(
        "# Title\n\nA **bold** [link](https://x.org). <span>Useful</span>",
      ),
    ).toBe("Title A bold link. Useful");
  });

  test("truncates with ellipsis", () => {
    const out = markdownExcerpt("word ".repeat(100), 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("buildProjectJsonLd", () => {
  const url = "https://build4latam.com/en/p/some-project";

  test("known org attaches Organization publisher with web + socials", () => {
    const jsonLd = buildProjectJsonLd(
      makeProject({ slug: "responsegrid", name: "ResponseGrid" }),
      "https://build4latam.com/en/p/responsegrid",
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

  test("unknown organization does not infer an author type", () => {
    const jsonLd = buildProjectJsonLd(makeProject(), url);
    expect(jsonLd.publisher).toBeUndefined();
    expect(jsonLd.author).toBeUndefined();
  });

  test("uses only curated, deduped http(s) identity links", () => {
    const jsonLd = buildProjectJsonLd(
      makeProject({
        videoUrl: "https://youtu.be/abc",
        contributeInUrl: "https://github.com/team/project",
      }),
      url,
      {
        sameAs: [
          "https://x.com/team",
          "https://x.com/team",
          "javascript:alert(1)",
        ],
      },
    );
    expect(jsonLd.sameAs).toEqual(["https://x.com/team"]);
  });

  test("does not claim pricing, category, or platform without source data", () => {
    const jsonLd = buildProjectJsonLd(makeProject(), url);
    expect(jsonLd.offers).toBeUndefined();
    expect(jsonLd.applicationCategory).toBeUndefined();
    expect(jsonLd.operatingSystem).toBeUndefined();
  });

  test("describes idea-stage projects as CreativeWork", () => {
    const jsonLd = buildProjectJsonLd(
      makeProject({ lifecycleStatus: "idea" }),
      url,
    );
    expect(jsonLd["@type"]).toBe("CreativeWork");
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

describe("serializeJsonLd", () => {
  test("escapes script breakout sequences", () => {
    const serialized = serializeJsonLd({ description: "</script><script>" });

    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
  });
});
