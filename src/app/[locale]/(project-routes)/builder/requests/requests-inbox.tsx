"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  builderQueryKeys,
  fetchBuilderContactRequests,
  updateBuilderContactRequest,
} from "@/lib/builders/queries";
import type { BuilderContactRequest } from "@/lib/builders/schema";

type BuilderRequestsInboxProps = {
  initialRequests: BuilderContactRequest[];
};

function statusClass(status: BuilderContactRequest["status"]) {
  if (status === "accepted") return "text-primary";
  if (status === "rejected") return "text-destructive";
  return "text-muted-foreground";
}

function directionClass(direction: BuilderContactRequest["direction"]) {
  if (direction === "inbound") return "border-accent text-accent";
  return "border-primary text-primary";
}

export function BuilderRequestsInbox({
  initialRequests,
}: BuilderRequestsInboxProps) {
  const t = useTranslations("Builders.requests.inbox");
  const queryClient = useQueryClient();
  const [hideProfile, setHideProfile] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { data: requests = initialRequests, isFetching } = useQuery({
    initialData: initialRequests,
    queryFn: fetchBuilderContactRequests,
    queryKey: builderQueryKeys.contactRequests(),
  });

  const mutation = useMutation({
    mutationFn: updateBuilderContactRequest,
    onError: (mutationError: Error) => setError(mutationError.message),
    onSuccess: (contactRequest) => {
      queryClient.setQueryData<BuilderContactRequest[]>(
        builderQueryKeys.contactRequests(),
        (current) =>
          current?.map((request) =>
            request.id === contactRequest.id ? contactRequest : request,
          ) ?? [contactRequest],
      );
      queryClient.invalidateQueries({ queryKey: builderQueryKeys.list() });
      setError(null);
    },
  });

  function setRequestStatus(
    request: BuilderContactRequest,
    status: "accepted" | "rejected",
  ) {
    if (request.direction !== "inbound") return;

    mutation.mutate({
      requestId: request.id,
      status,
      hideProfile: status === "accepted" && Boolean(hideProfile[request.id]),
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        <span>{t("requestCount", { count: requests.length })}</span>
        <span>{isFetching ? t("refreshing") : t("privateInbox")}</span>
      </div>

      {error ? (
        <div className="border border-destructive bg-destructive/10 p-4 font-mono text-sm uppercase tracking-[0.12em] text-destructive">
          {error}
        </div>
      ) : null}

      {requests.length === 0 ? (
        <div className="border border-border p-8 font-mono text-sm uppercase leading-7 tracking-[0.1em] text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-5">
          {requests.map((request) => (
            <article
              className="grid gap-5 border border-border bg-card p-5"
              key={request.id}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`border px-2 py-1 font-mono text-[0.68rem] font-black uppercase tracking-[0.12em] ${directionClass(
                        request.direction,
                      )}`}
                    >
                      {t(`directions.${request.direction}`)}
                    </span>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {request.direction === "inbound"
                        ? t("fromRequester", {
                            requester: request.requesterName,
                          })
                        : t("toBuilder", { builder: request.builderName })}
                    </p>
                  </div>
                  <h2 className="mt-3 font-mono text-2xl font-black uppercase">
                    {request.direction === "inbound"
                      ? request.requesterName
                      : request.builderName}
                  </h2>
                  <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {request.projectName}
                  </p>
                </div>
                <span
                  className={`font-mono text-xs font-black uppercase tracking-[0.12em] ${statusClass(request.status)}`}
                >
                  {t(`statuses.${request.status}`)}
                </span>
              </div>

              <p className="whitespace-pre-wrap font-mono text-sm uppercase leading-7 tracking-[0.08em] text-muted-foreground">
                {request.coverLetter}
              </p>

              <div className="grid gap-3 border-border border-t pt-4 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("contactEmail")}
                  </p>
                  <p className="mt-1 font-mono text-sm">
                    {request.contactEmail || t("notProvided")}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("contactPhone")}
                  </p>
                  <p className="mt-1 font-mono text-sm">
                    {request.contactPhone || t("notProvided")}
                  </p>
                </div>
              </div>

              {request.direction === "inbound" &&
              request.status === "pending" ? (
                <div className="grid gap-4 border-border border-t pt-4">
                  <label className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.12em]">
                    <input
                      checked={Boolean(hideProfile[request.id])}
                      className="size-4 accent-primary"
                      onChange={(event) =>
                        setHideProfile((current) => ({
                          ...current,
                          [request.id]: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    {t("hideProfileOnAccept")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={mutation.isPending}
                      onClick={() => setRequestStatus(request, "accepted")}
                      type="button"
                    >
                      <CheckIcon data-icon="inline-start" />
                      {t("accept")}
                    </Button>
                    <Button
                      disabled={mutation.isPending}
                      onClick={() => setRequestStatus(request, "rejected")}
                      type="button"
                      variant="destructive"
                    >
                      <XIcon data-icon="inline-start" />
                      {t("reject")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
