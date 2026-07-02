import type { Project } from "@/lib/projects/schema";

type Organization = {
  name: string;
  url: string;
  sameAs: string[];
  email?: string;
};

// Known organizations behind submitted projects, keyed by project slug.
// Projects not listed here render without a publisher/Organization node —
// some teams give us an org to attribute, others don't.
const PROJECT_ORGANIZATIONS: Record<string, Organization> = {
  responsegrid: {
    name: "Global Emergency",
    url: "https://globalemergency.online",
    email: "info@globalemergency.online",
    sameAs: [
      "https://globalemergency.online",
      "https://github.com/GlobalEmergency",
      "https://deamap.es",
    ],
  },
};

export function projectOrganization(slug: string): Organization | undefined {
  return PROJECT_ORGANIZATIONS[slug];
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

// schema.org SoftwareApplication for a project, so search engines and AI
// answer engines can attribute the app to its org and its canonical web.
export function buildProjectJsonLd(
  project: Project,
  pageUrl: string,
): Record<string, unknown> {
  const org = projectOrganization(project.slug);
  const sameAs = [project.videoUrl, project.contributeInUrl].filter(
    (u): u is string => Boolean(u) && /^https?:/.test(u),
  );

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

  if (org) {
    const organization = {
      "@type": "Organization",
      name: org.name,
      url: org.url,
      sameAs: org.sameAs,
      ...(org.email ? { email: org.email } : {}),
    };
    jsonLd.author = organization;
    jsonLd.publisher = organization;
  } else if (project.participantName) {
    jsonLd.author = { "@type": "Person", name: project.participantName };
  }

  return jsonLd;
}
