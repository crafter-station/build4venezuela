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

// Bound every request so the UI never sits on a pending state until Vercel's
// 300s wall. A timeout aborts the fetch and surfaces a readable message.
const REQUEST_TIMEOUT_MS = 45_000;

function timeoutSignal() {
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

// Returns null instead of throwing on an empty/invalid body (e.g. a 504/500
// with no JSON), so callers don't surface "Unexpected end of JSON input".
async function safeParseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function networkError(error: unknown) {
  const timedOut =
    error instanceof DOMException && error.name === "TimeoutError";
  return new Error(
    timedOut
      ? "The server took too long to respond. Please try again."
      : "Network error. Check your connection and try again.",
  );
}

async function responseError(response: Response, fallback: string) {
  const data = await safeParseJson<ErrorResponse>(response);
  return new Error(
    data?.errors?.body ?? data?.errors?.name ?? data?.error ?? fallback,
  );
}

export async function fetchSolutionRequests() {
  const response = await fetch("/api/requests", {
    cache: "no-store",
    signal: timeoutSignal(),
  });

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
  let response: Response;

  try {
    response = await fetch("/api/requests", {
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: timeoutSignal(),
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    throw await responseError(response, "Could not add request.");
  }

  const data = await safeParseJson<{ request: SolutionRequest }>(response);

  if (!data?.request) {
    throw new Error(
      "The request may not have been saved. Please refresh and check.",
    );
  }

  return data.request;
}

export async function toggleSolutionRequestVote(requestId: string) {
  const response = await fetch(`/api/requests/${requestId}/votes`, {
    method: "POST",
    signal: timeoutSignal(),
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
  let response: Response;

  try {
    response = await fetch(`/api/requests/${requestId}/comments`, {
      body: JSON.stringify({ body }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: timeoutSignal(),
    });
  } catch (error) {
    throw networkError(error);
  }

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
    { method: "POST", signal: timeoutSignal() },
  );

  if (!response.ok) {
    throw await responseError(response, "Could not vote.");
  }

  return parseJson<VoteState>(response);
}
