import { z } from "zod";

export type Project = {
  id: string;
  slug: string;
  name: string;
  status: ProjectStatus;
  lifecycleStatus: ProjectLifecycleStatus;
  projectUrl: string;
  countries: string[];
  participantName: string;
  videoUrl: string;
  contributeInUrl: string;
  descriptionMarkdown: string;
  ownerName: string;
  ownerImageUrl: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  votesCount: number;
};

export type ProjectComment = {
  id: string;
  projectId: string;
  authorName: string;
  authorImageUrl: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  votesCount: number;
  voted: boolean;
};

export type ProjectStatus = "draft" | "published" | "hidden";

export const projectLifecycleStatuses = [
  "ready_to_use",
  "in_development",
  "idea",
] as const;

export type ProjectLifecycleStatus = (typeof projectLifecycleStatuses)[number];

export function sortProjectsByVotes(projects: Project[]) {
  return [...projects].sort(
    (a, b) =>
      b.votesCount - a.votesCount ||
      (b.publishedAt ?? b.createdAt).localeCompare(
        a.publishedAt ?? a.createdAt,
      ),
  );
}

export function sortCommentsByVotes(comments: ProjectComment[]) {
  return [...comments].sort(
    (a, b) =>
      b.votesCount - a.votesCount || a.createdAt.localeCompare(b.createdAt),
  );
}

export type ProjectFormState = {
  values: Record<string, string>;
  errors: Record<string, string>;
};

export const emptyProjectFormState: ProjectFormState = {
  values: {},
  errors: {},
};

const allowedVideoHosts = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "loom.com",
  "www.loom.com",
  "screen.studio",
  "www.screen.studio",
  "screenstudio.com",
  "www.screenstudio.com",
];

const slugSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters.")
  .max(64, "Use 64 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens.",
  );

const urlSchema = z.string().trim().url("Enter a valid URL.");

export const projectFormSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2, "Name is required.").max(120),
  lifecycleStatus: z.enum(projectLifecycleStatuses).default("ready_to_use"),
  projectUrl: urlSchema,
  countries: z.string().trim().min(2, "Add at least one participant country."),
  participantName: z
    .string()
    .trim()
    .min(2, "Team or participant name is required.")
    .max(120),
  videoUrl: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      try {
        const hostname = new URL(value).hostname.toLowerCase();
        return allowedVideoHosts.includes(hostname);
      } catch {
        return false;
      }
    }, "Use YouTube, Vimeo, Loom, Screen Studio, or a similar hosted video link."),
  contributeInUrl: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
      } catch {
        return false;
      }
    }, "Enter a valid http(s) URL."),
  descriptionMarkdown: z
    .string()
    .trim()
    .min(80, "Add a fuller markdown description.")
    .max(12000, "Keep the description under 12,000 characters."),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;

export const projectCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(3, "Add at least 3 characters.")
    .max(1200, "Keep comments under 1,200 characters."),
});

export type ProjectCommentInput = z.infer<typeof projectCommentSchema>;

export function normalizeCountries(countries: string) {
  return countries
    .split(",")
    .map((country) => country.trim())
    .filter(Boolean)
    .slice(0, 24);
}

export function projectToFormValues(project: Project) {
  return {
    slug: project.slug,
    name: project.name,
    lifecycleStatus: project.lifecycleStatus,
    projectUrl: project.projectUrl,
    countries: project.countries.join(", "),
    participantName: project.participantName,
    videoUrl: project.videoUrl,
    contributeInUrl: project.contributeInUrl,
    descriptionMarkdown: project.descriptionMarkdown,
  };
}

export function formDataToValues(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    lifecycleStatus: String(formData.get("lifecycleStatus") ?? "ready_to_use"),
    projectUrl: String(formData.get("projectUrl") ?? ""),
    countries: String(formData.get("countries") ?? ""),
    participantName: String(formData.get("participantName") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? ""),
    contributeInUrl: String(formData.get("contributeInUrl") ?? ""),
    descriptionMarkdown: String(formData.get("descriptionMarkdown") ?? ""),
  };
}

export function validationErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [
      String(issue.path[0] ?? "form"),
      issue.message,
    ]),
  );
}
