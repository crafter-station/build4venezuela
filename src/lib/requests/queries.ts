import type { SolutionRequest } from "./schema";

export const requestQueryKeys = {
  all: ["solution-requests"] as const,
  list: () => [...requestQueryKeys.all, "list"] as const,
};

type VoteState = {
  count: number;
  voted: boolean;
};

type ErrorResponse = {
  error?: string;
  errors?: Record<string, string>;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function responseError(response: Response, fallback: string) {
  try {
    const data = await parseJson<ErrorResponse>(response);
    return new Error(
      data.errors?.body ?? data.errors?.name ?? data.error ?? fallback,
    );
  } catch {
    return new Error(fallback);
  }
}

export async function fetchSolutionRequests() {
  const response = await fetch("/api/requests", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not load requests.");
  }

  const data = await parseJson<{ requests: SolutionRequest[] }>(response);
  return data.requests;
}

export async function createSolutionRequest(values: {
  name: string;
  descriptionMarkdown: string;
}) {
  const response = await fetch("/api/requests", {
    body: JSON.stringify(values),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw await responseError(response, "Could not add request.");
  }

  const data = await parseJson<{ request: SolutionRequest }>(response);
  return data.request;
}

export async function toggleSolutionRequestVote(requestId: string) {
  const response = await fetch(`/api/requests/${requestId}/votes`, {
    method: "POST",
  });

  if (!response.ok) {
    throw await responseError(response, "Could not vote.");
  }

  return parseJson<VoteState>(response);
}

export async function createSolutionRequestComment(
  requestId: string,
  body: string,
) {
  const response = await fetch(`/api/requests/${requestId}/comments`, {
    body: JSON.stringify({ body }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw await responseError(response, "Could not add comment.");
  }

  return fetchSolutionRequests();
}

export async function toggleSolutionRequestCommentVote(
  requestId: string,
  commentId: string,
) {
  const response = await fetch(
    `/api/requests/${requestId}/comments/${commentId}/votes`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw await responseError(response, "Could not vote.");
  }

  return parseJson<VoteState>(response);
}
