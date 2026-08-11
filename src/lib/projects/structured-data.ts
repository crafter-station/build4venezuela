import type { Project } from "@/lib/projects/schema";

type Organization = {
  name: string;
  url: string;
  sameAs?: string[];
  email?: string;
  logo?: string;
};

// Optional credibility signals for a project, keyed by slug. Everything here is
// opt-in: a project may give us an org, its social/authoritative links, or the
// official bodies that back it — or none of it. The project itself stays the
// primary entity in the JSON-LD; this data only reinforces its reputation.
export type ProjectProfile = {
  organization?: Organization;
  // The project's own social / authoritative profiles (X, LinkedIn, Instagram,
  // ProductHunt, press coverage…) — anything that lends it credibility.
  sameAs?: string[];
  // Official bodies, institutions, sponsors or partners that back or use it.
  endorsedBy?: Organization[];
};

const PROJECT_PROFILES: Record<string, ProjectProfile> = {
  responsegrid: {
    organization: {
      name: "Global Emergency",
      url: "https://globalemergency.online",
      email: "info@globalemergency.online",
      sameAs: [
        "https://globalemergency.online",
        "https://github.com/GlobalEmergency",
        "https://x.com/GlobalEmergenc",
        "https://www.instagram.com/globalemergencyonline/",
        "https://facebook.com/GlobalEmergencyOnline",
        "https://deamap.es",
      ],
    },
    // ResponseGrid has no own social accounts by design — it reuses Global
    // Emergency's identity and legal pages. Its authoritative link is the repo.
    sameAs: ["https://github.com/GlobalEmergency/ResponseGrid"],
    // endorsedBy: [{ name: "…", url: "…", sameAs: ["…"] }],  // official bodies / sponsors, when confirmed
  },
};

export function projectProfile(slug: string): ProjectProfile | undefined {
  return PROJECT_PROFILES[slug];
}

// Strip markdown to a plain-text excerpt for meta descriptions / JSON-LD.
// ponytail: regex strip, not a full markdown parser — descriptions are short.
export function markdownExcerpt(markdown: string, maxLength = 300): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/<[^>]*>/g, " ") // raw HTML
    .replace(/[#>*_`~|]/g, " ") // md punctuation
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function organizationNode(org: Organization) {
  const sameAs = org.sameAs?.filter(isHttpUrl);

  return {
    "@type": "Organization",
    name: org.name,
    url: org.url,
    ...(sameAs?.length ? { sameAs } : {}),
    ...(org.logo ? { logo: org.logo } : {}),
    ...(org.email ? { email: org.email } : {}),
  };
}

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// Ideas are described as CreativeWork until there is software to use or test.
export function buildProjectJsonLd(
  project: Project,
  pageUrl: string,
  profile: ProjectProfile | undefined = projectProfile(project.slug),
): Record<string, unknown> {
  const sameAs = [...new Set((profile?.sameAs ?? []).filter(isHttpUrl))];

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type":
      project.lifecycleStatus === "idea"
        ? "CreativeWork"
        : "SoftwareApplication",
    name: project.name,
    description: markdownExcerpt(project.descriptionMarkdown),
    url: project.projectUrl || pageUrl,
    mainEntityOfPage: pageUrl,
    ...(project.imageUrl ? { image: project.imageUrl } : {}),
    ...(project.createdAt ? { dateCreated: project.createdAt } : {}),
    ...(project.updatedAt ? { dateModified: project.updatedAt } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  if (profile?.organization) {
    const org = organizationNode(profile.organization);
    jsonLd.author = org;
    jsonLd.publisher = org;
  }

  if (profile?.endorsedBy?.length) {
    jsonLd.sponsor = profile.endorsedBy.map(organizationNode);
  }

  return jsonLd;
}
