import type {
  Project,
  ProjectComment,
  ProjectFormState,
} from "@/lib/projects/schema";

export const projectQueryKeys = {
  all: ["projects"] as const,
  comments: (projectId: string) =>
    [...projectQueryKeys.detail(projectId), "comments"] as const,
  detail: (projectId: string) => [...projectQueryKeys.all, projectId] as const,
  list: () => [...projectQueryKeys.all, "list"] as const,
  votes: (projectId: string) =>
    [...projectQueryKeys.detail(projectId), "votes"] as const,
};

type ProjectVote = {
  count: number;
  voted: boolean;
};

type CommentErrorResponse = {
  error?: string;
  errors?: Record<string, string>;
};

export type ProjectFormValues = ProjectFormState["values"];

type ProjectFormErrorResponse = {
  values?: ProjectFormValues;
  errors?: Record<string, string>;
};

export type ProjectMutationInput = {
  projectId?: string;
  values: ProjectFormValues;
};

export class ProjectFormError extends Error {
  values: ProjectFormValues;
  errors: Record<string, string>;

  constructor(response: ProjectFormErrorResponse, fallback: string) {
    super(response.errors?.form ?? fallback);
    this.name = "ProjectFormError";
    this.values = response.values ?? {};
    this.errors = response.errors ?? { form: fallback };
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

// Like parseJson, but returns null instead of throwing when the body is empty
// or not valid JSON — e.g. a 504/500 with no body. Without this, callers that
// blindly `response.json()` an empty error body surface the cryptic
// "Unexpected end of JSON input" instead of a useful message.
async function safeParseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

// How long the client waits for a save before giving up. The server can take a
// few seconds (spam + classify LLM calls, each bounded server-side), so this is
// generous — but it guarantees the form never sits on "CHECKING..." until
// Vercel's 300s timeout.
const SAVE_PROJECT_TIMEOUT_MS = 45_000;

async function responseError(response: Response, fallback: string) {
  try {
    const data = await parseJson<CommentErrorResponse>(response);
    return new Error(data.errors?.body ?? data.error ?? fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function fetchProjects() {
  const response = await fetch("/api/projects", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not load projects.");
  }

  const data = await parseJson<{ projects: Project[] }>(response);
  return data.projects;
}

export async function fetchProjectVote(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/votes`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not load votes.");
  }

  return parseJson<ProjectVote>(response);
}

export async function toggleProjectVote(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/votes`, {
    method: "POST",
  });

  if (!response.ok) {
    throw await responseError(response, "Could not vote.");
  }

  return parseJson<ProjectVote>(response);
}

export async function fetchProjectComments(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/comments`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not load comments.");
  }

  const data = await parseJson<{ comments: ProjectComment[] }>(response);
  return data.comments;
}

export async function createProjectComment(projectId: string, body: string) {
  const response = await fetch(`/api/projects/${projectId}/comments`, {
    body: JSON.stringify({ body }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw await responseError(response, "Could not add comment.");
  }

  return parseJson<ProjectComment>(response);
}

export async function toggleProjectCommentVote(
  projectId: string,
  commentId: string,
) {
  const response = await fetch(
    `/api/projects/${projectId}/comments/${commentId}/votes`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw await responseError(response, "Could not vote.");
  }

  return parseJson<ProjectVote>(response);
}

export async function saveProject({ projectId, values }: ProjectMutationInput) {
  let response: Response;

  try {
    response = await fetch(
      projectId ? `/api/projects/${projectId}` : "/api/projects",
      {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: projectId ? "PATCH" : "POST",
        signal: AbortSignal.timeout(SAVE_PROJECT_TIMEOUT_MS),
      },
    );
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    throw new ProjectFormError(
      { values },
      timedOut
        ? "The server took too long to respond. Please try again."
        : "Network error. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    // The error body may be empty (504/500 with no JSON) — fall back to a
    // readable message instead of throwing "Unexpected end of JSON input".
    const data = await safeParseJson<ProjectFormErrorResponse>(response);
    throw new ProjectFormError(data ?? { values }, "Could not save project.");
  }

  const data = await safeParseJson<{ project: Project }>(response);

  if (!data?.project) {
    throw new ProjectFormError(
      { values },
      "The project may not have been saved. Please refresh and check.",
    );
  }

  return data.project;
}
