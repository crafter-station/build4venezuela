import type { Project } from "@/lib/projects/schema";

type Organization = {
  name: string;
  url: string;
  sameAs: string[];
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
    // sameAs: ["https://x.com/..."],   // ResponseGrid's own profiles, when it has them
    // endorsedBy: [{ name: "…", url: "…", sameAs: ["…"] }],  // official bodies / sponsors
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
    .replace(/[#>*_`~|]/g, " ") // md punctuation
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function organizationNode(org: Organization) {
  return {
    "@type": "Organization",
    name: org.name,
    url: org.url,
    sameAs: org.sameAs,
    ...(org.logo ? { logo: org.logo } : {}),
    ...(org.email ? { email: org.email } : {}),
  };
}

// schema.org SoftwareApplication for a project, so search engines and AI answer
// engines treat the project as the primary entity and can attribute it to its
// org, its social proof, and any official bodies backing it.
export function buildProjectJsonLd(
  project: Project,
  pageUrl: string,
  profile: ProjectProfile | undefined = projectProfile(project.slug),
): Record<string, unknown> {
  const linkSameAs = [project.videoUrl, project.contributeInUrl].filter(
    (u): u is string => Boolean(u) && /^https?:/.test(u),
  );
  const sameAs = [...new Set([...linkSameAs, ...(profile?.sameAs ?? [])])];

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.name,
    description: markdownExcerpt(project.descriptionMarkdown),
    url: project.projectUrl || pageUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    mainEntityOfPage: pageUrl,
    ...(sameAs.length ? { sameAs } : {}),
  };

  if (profile?.organization) {
    const org = organizationNode(profile.organization);
    jsonLd.author = org;
    jsonLd.publisher = org;
  } else if (project.participantName) {
    jsonLd.author = { "@type": "Person", name: project.participantName };
  }

  if (profile?.endorsedBy?.length) {
    jsonLd.sponsor = profile.endorsedBy.map(organizationNode);
  }

  return jsonLd;
}
