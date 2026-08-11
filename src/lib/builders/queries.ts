import type {
  BuilderContactRequest,
  BuilderContactRequestInput,
  BuilderProfile,
  BuilderProfileInput,
} from "./schema";

export const builderQueryKeys = {
  all: ["builders"] as const,
  contactRequests: () => [...builderQueryKeys.all, "contact-requests"] as const,
  list: (viewerId?: string | null) =>
    viewerId
      ? ([...builderQueryKeys.all, "list", viewerId] as const)
      : ([...builderQueryKeys.all, "list"] as const),
  ownedProjects: () => [...builderQueryKeys.all, "owned-projects"] as const,
};

export type OwnedProjectSummary = {
  slug: string;
  name: string;
  projectUrl: string;
  contributeInUrl: string;
};

type ErrorResponse = {
  error?: string;
  errorCode?: string;
  errors?: Record<string, string>;
};

const REQUEST_TIMEOUT_MS = 45_000;

function timeoutSignal() {
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}

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
  const fieldError =
    data?.errors?.form ??
    data?.errors?.coverLetter ??
    data?.errors?.description ??
    data?.errors?.name ??
    data?.error;

  const error = new Error(fieldError ?? fallback) as Error & {
    code?: string;
  };
  error.code = data?.errorCode;
  return error;
}

export async function fetchBuilders() {
  const response = await fetch("/api/builders", {
    cache: "no-store",
    signal: timeoutSignal(),
  });

  if (!response.ok) {
    throw new Error("Could not load builders.");
  }

  const data = await safeParseJson<{ builders: BuilderProfile[] }>(response);
  return data?.builders ?? [];
}

export async function saveBuilderProfile(values: BuilderProfileInput) {
  let response: Response;

  try {
    response = await fetch("/api/builders", {
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: timeoutSignal(),
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    throw await responseError(response, "Could not save builder profile.");
  }

  const data = await safeParseJson<{ builder: BuilderProfile }>(response);

  if (!data?.builder) {
    throw new Error(
      "The profile may not have been saved. Please refresh and check.",
    );
  }

  return data.builder;
}

export async function setBuilderProfileFrozen(frozen: boolean) {
  let response: Response;

  try {
    response = await fetch("/api/builders", {
      body: JSON.stringify({ action: frozen ? "freeze" : "activate" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
      signal: timeoutSignal(),
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    throw await responseError(response, "Could not update builder profile.");
  }

  const data = await safeParseJson<{ builder: BuilderProfile }>(response);

  if (!data?.builder) {
    throw new Error("The profile may not have been updated. Please try again.");
  }

  return data.builder;
}

export async function removeBuilderProfile() {
  let response: Response;

  try {
    response = await fetch("/api/builders", {
      method: "DELETE",
      signal: timeoutSignal(),
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    throw await responseError(response, "Could not remove builder profile.");
  }

  return true;
}

export async function createBuilderContactRequest(
  builderId: string,
  values: BuilderContactRequestInput,
) {
  let response: Response;

  try {
    response = await fetch(`/api/builders/${builderId}/contact-requests`, {
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: timeoutSignal(),
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    throw await responseError(response, "Could not contact this builder.");
  }

  const data = await safeParseJson<{ request: BuilderContactRequest }>(
    response,
  );

  if (!data?.request) {
    throw new Error("The request may not have been saved. Please try again.");
  }

  return data.request;
}

export async function fetchOwnedProjects(): Promise<OwnedProjectSummary[]> {
  const response = await fetch("/api/projects/mine", {
    cache: "no-store",
    signal: timeoutSignal(),
  });

  if (!response.ok) {
    return [];
  }

  const data = await safeParseJson<{ projects: OwnedProjectSummary[] }>(
    response,
  );
  return data?.projects ?? [];
}

export async function fetchBuilderContactRequests() {
  const response = await fetch("/api/builder/contact-requests", {
    cache: "no-store",
    signal: timeoutSignal(),
  });

  if (!response.ok) {
    throw new Error("Could not load contact requests.");
  }

  const data = await safeParseJson<{ requests: BuilderContactRequest[] }>(
    response,
  );
  return data?.requests ?? [];
}

export async function updateBuilderContactRequest(input: {
  requestId: string;
  status: "accepted" | "rejected";
  hideProfile?: boolean;
}) {
  const response = await fetch(
    `/api/builder/contact-requests/${input.requestId}`,
    {
      body: JSON.stringify({
        status: input.status,
        hideProfile: Boolean(input.hideProfile),
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
      signal: timeoutSignal(),
    },
  );

  if (!response.ok) {
    throw await responseError(response, "Could not update the request.");
  }

  const data = await safeParseJson<{ request: BuilderContactRequest }>(
    response,
  );

  if (!data?.request) {
    throw new Error("The request may not have been updated. Please try again.");
  }

  return data.request;
}
