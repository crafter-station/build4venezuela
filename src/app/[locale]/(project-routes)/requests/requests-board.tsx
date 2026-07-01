"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { AuthorBadge } from "@/components/author-badge";
import { ProjectMarkdown } from "@/components/project-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabase } from "@/lib/projects/browser-supabase";
import {
  createSolutionRequest,
  createSolutionRequestComment,
  fetchSolutionRequests,
  requestQueryKeys,
  toggleSolutionRequestCommentVote,
  toggleSolutionRequestVote,
} from "@/lib/requests/queries";
import {
  type SolutionRequest,
  sortSolutionRequestComments,
  sortSolutionRequests,
} from "@/lib/requests/schema";

type RequestsBoardProps = {
  initialRequests: SolutionRequest[];
  initialSignedIn: boolean;
};

const maxDescriptionLength = 8000;
const maxCommentLength = 1200;

function commentVoteKey(requestId: string, commentId: string) {
  return `${requestId}:${commentId}`;
}

export function RequestsBoard({
  initialRequests,
  initialSignedIn,
}: RequestsBoardProps) {
  const t = useTranslations("Requests.board");
  const { isSignedIn } = useUser();
  const signedIn = isSignedIn ?? initialSignedIn;
  const queryClient = useQueryClient();
  const { data: requests = initialRequests, isFetching } = useQuery({
    initialData: initialRequests,
    queryFn: fetchSolutionRequests,
    queryKey: requestQueryKeys.list(),
  });
  const [name, setName] = useState("");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(
    () => new Set(),
  );
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>(
    {},
  );
  const [pendingRequestVotes, setPendingRequestVotes] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingCommentVotes, setPendingCommentVotes] = useState<Set<string>>(
    () => new Set(),
  );

  const createMutation = useMutation({
    mutationFn: createSolutionRequest,
    onError: (mutationError: Error) => {
      setNotice(null);
      setError(mutationError.message);
    },
    onSuccess: (request) => {
      queryClient.setQueryData<SolutionRequest[]>(
        requestQueryKeys.list(),
        (current) =>
          sortSolutionRequests(
            current?.some((item) => item.id === request.id)
              ? current
              : [request, ...(current ?? [])],
          ),
      );
      setName("");
      setDescriptionMarkdown("");
      setError(null);
      setNotice(t("requestSent"));
    },
  });

  const voteMutation = useMutation({
    mutationFn: (requestId: string) => toggleSolutionRequestVote(requestId),
    onMutate: async (requestId) => {
      setPendingRequestVotes((current) => new Set(current).add(requestId));
      await queryClient.cancelQueries({ queryKey: requestQueryKeys.list() });
      const previousRequests = queryClient.getQueryData<SolutionRequest[]>(
        requestQueryKeys.list(),
      );
      const currentRequests = previousRequests ?? requests;

      queryClient.setQueryData<SolutionRequest[]>(
        requestQueryKeys.list(),
        sortSolutionRequests(
          currentRequests.map((request) => {
            if (request.id !== requestId) {
              return request;
            }

            const voted = !request.voted;
            return {
              ...request,
              voted,
              votesCount: Math.max(0, request.votesCount + (voted ? 1 : -1)),
            };
          }),
        ),
      );

      return { previousRequests, requestId };
    },
    onError: (_error, _requestId, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(
          requestQueryKeys.list(),
          context.previousRequests,
        );
      }
    },
    onSettled: (_data, _error, requestId) => {
      setPendingRequestVotes((current) => {
        const next = new Set(current);
        next.delete(requestId);
        return next;
      });
    },
    onSuccess: (vote, requestId) => {
      queryClient.setQueryData<SolutionRequest[]>(
        requestQueryKeys.list(),
        (current) =>
          sortSolutionRequests(
            current?.map((request) =>
              request.id === requestId
                ? { ...request, votesCount: vote.count, voted: vote.voted }
                : request,
            ) ?? [],
          ),
      );
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ requestId, body }: { requestId: string; body: string }) =>
      createSolutionRequestComment(requestId, body),
    onError: (mutationError: Error) => setError(mutationError.message),
    onSuccess: (nextRequests, { requestId }) => {
      queryClient.setQueryData(requestQueryKeys.list(), nextRequests);
      setCommentBodies((current) => ({ ...current, [requestId]: "" }));
      setError(null);
    },
  });

  const commentVoteMutation = useMutation({
    mutationFn: ({
      requestId,
      commentId,
    }: {
      requestId: string;
      commentId: string;
    }) => toggleSolutionRequestCommentVote(requestId, commentId),
    onMutate: async ({ requestId, commentId }) => {
      const pendingKey = commentVoteKey(requestId, commentId);
      setPendingCommentVotes((current) => new Set(current).add(pendingKey));
      await queryClient.cancelQueries({ queryKey: requestQueryKeys.list() });
      const previousRequests = queryClient.getQueryData<SolutionRequest[]>(
        requestQueryKeys.list(),
      );
      const currentRequests = previousRequests ?? requests;

      queryClient.setQueryData<SolutionRequest[]>(
        requestQueryKeys.list(),
        currentRequests.map((request) => {
          if (request.id !== requestId) {
            return request;
          }

          return {
            ...request,
            comments: sortSolutionRequestComments(
              request.comments.map((comment) => {
                if (comment.id !== commentId) {
                  return comment;
                }

                const voted = !comment.voted;
                return {
                  ...comment,
                  voted,
                  votesCount: Math.max(
                    0,
                    comment.votesCount + (voted ? 1 : -1),
                  ),
                };
              }),
            ),
          };
        }),
      );

      return { previousRequests, requestId, commentId };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(
          requestQueryKeys.list(),
          context.previousRequests,
        );
      }
    },
    onSettled: (_data, _error, { requestId, commentId }) => {
      const pendingKey = commentVoteKey(requestId, commentId);
      setPendingCommentVotes((current) => {
        const next = new Set(current);
        next.delete(pendingKey);
        return next;
      });
    },
    onSuccess: (vote, { requestId, commentId }) => {
      queryClient.setQueryData<SolutionRequest[]>(
        requestQueryKeys.list(),
        (current) =>
          current?.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  comments: sortSolutionRequestComments(
                    request.comments.map((comment) =>
                      comment.id === commentId
                        ? {
                            ...comment,
                            votesCount: vote.count,
                            voted: vote.voted,
                          }
                        : comment,
                    ),
                  ),
                }
              : request,
          ) ?? [],
      );
    },
  });

  useEffect(() => {
    const supabase = createBrowserSupabase();

    if (!supabase) {
      return;
    }

    const requestChannel = supabase
      .channel("solution-request-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solution_request_events" },
        () =>
          queryClient.invalidateQueries({ queryKey: requestQueryKeys.list() }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solution_request_vote_events" },
        () =>
          queryClient.invalidateQueries({ queryKey: requestQueryKeys.list() }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solution_request_comment_events",
        },
        () =>
          queryClient.invalidateQueries({ queryKey: requestQueryKeys.list() }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solution_request_comment_vote_events",
        },
        () =>
          queryClient.invalidateQueries({ queryKey: requestQueryKeys.list() }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(requestChannel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = descriptionMarkdown.trim();

    if (trimmedName.length < 3) {
      setNotice(null);
      setError(t("errors.nameTooShort"));
      return;
    }

    if (trimmedDescription.length > maxDescriptionLength) {
      setNotice(null);
      setError(t("errors.descriptionTooLong"));
      return;
    }

    setNotice(null);
    createMutation.mutate({
      name: trimmedName,
      descriptionMarkdown: trimmedDescription,
    });
  }

  function submitComment(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    const body = (commentBodies[requestId] ?? "").trim();

    if (body.length < 3) {
      setError(t("errors.commentTooShort"));
      return;
    }

    if (body.length > maxCommentLength) {
      setError(t("errors.commentTooLong"));
      return;
    }

    commentMutation.mutate({ requestId, body });
  }

  function toggleDescription(requestId: string) {
    setExpandedRequests((current) => {
      const next = new Set(current);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  }

  function voteForRequest(requestId: string) {
    if (pendingRequestVotes.has(requestId)) {
      return;
    }

    voteMutation.mutate(requestId);
  }

  function voteForComment(requestId: string, commentId: string) {
    if (pendingCommentVotes.has(commentVoteKey(requestId, commentId))) {
      return;
    }

    commentVoteMutation.mutate({ requestId, commentId });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
      {notice ? (
        <output
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-50 border border-accent bg-background px-4 py-3 font-mono text-xs font-black uppercase leading-5 tracking-[0.14em] text-foreground shadow-2xl sm:left-auto sm:right-6 sm:w-80"
        >
          {notice}
        </output>
      ) : null}
      <aside className="border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start sm:p-6">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
          {t("formEyebrow")}
        </p>
        <h2 className="mt-3 font-mono text-3xl font-black uppercase leading-none tracking-[-0.04em]">
          {t("formTitle")}
        </h2>
        <p className="mt-4 font-mono text-xs uppercase leading-6 tracking-[0.14em] text-muted-foreground">
          {t("formDescription")}
        </p>

        {signedIn ? (
          <form className="mt-6 grid gap-4" onSubmit={submitRequest}>
            <Input
              className="h-12 bg-background font-mono text-sm"
              disabled={createMutation.isPending}
              maxLength={140}
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              value={name}
            />
            <Textarea
              className="min-h-40 bg-background font-mono text-sm leading-6"
              disabled={createMutation.isPending}
              maxLength={maxDescriptionLength}
              name="descriptionMarkdown"
              onChange={(event) => setDescriptionMarkdown(event.target.value)}
              placeholder={t("descriptionPlaceholder")}
              value={descriptionMarkdown}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {descriptionMarkdown.trim().length}/{maxDescriptionLength}
              </p>
              <Button
                className="h-11 px-5 text-sm uppercase tracking-[0.18em]"
                disabled={createMutation.isPending}
                type="submit"
              >
                {createMutation.isPending ? t("posting") : t("postRequest")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 border border-border bg-background p-5">
            <p className="font-mono text-sm uppercase leading-6 tracking-[0.14em] text-muted-foreground">
              {t("signedOutDescription")}
            </p>
            <SignInButton mode="modal">
              <Button
                className="mt-4 h-11 px-5 text-sm uppercase tracking-[0.18em]"
                type="button"
              >
                {t("signIn")}
              </Button>
            </SignInButton>
          </div>
        )}
        {error ? (
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-destructive">
            {error}
          </p>
        ) : null}
      </aside>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {requests.length}{" "}
            {requests.length === 1 ? t("request") : t("requests")}
          </p>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            {isFetching ? t("syncing") : t("live")}
          </p>
        </div>
        <div className="grid gap-px bg-border">
          {requests.length > 0 ? (
            requests.map((request) => {
              const expanded = expandedRequests.has(request.id);
              const hasDescription =
                request.descriptionMarkdown.trim().length > 0;
              const commentBody = commentBodies[request.id] ?? "";

              return (
                <article className="bg-background p-5 sm:p-6" key={request.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <AuthorBadge
                        imageUrl={request.authorImageUrl}
                        meta={request.createdAt.slice(0, 10)}
                        name={request.authorName}
                      />
                      <button
                        className="mt-3 block text-left font-mono text-2xl font-black uppercase leading-none tracking-[-0.04em] transition hover:text-primary sm:text-4xl"
                        onClick={() => toggleDescription(request.id)}
                        type="button"
                      >
                        {request.name}
                      </button>
                    </div>
                    {signedIn ? (
                      <Button
                        className="h-11 px-4 text-xs uppercase tracking-[0.16em]"
                        disabled={pendingRequestVotes.has(request.id)}
                        onClick={() => voteForRequest(request.id)}
                        type="button"
                        variant={request.voted ? "default" : "outline"}
                      >
                        {request.voted
                          ? t("voted", { count: request.votesCount })
                          : t("vote", { count: request.votesCount })}
                      </Button>
                    ) : (
                      <SignInButton mode="modal">
                        <Button
                          className="h-11 px-4 text-xs uppercase tracking-[0.16em]"
                          type="button"
                          variant="outline"
                        >
                          {t("vote", { count: request.votesCount })}
                        </Button>
                      </SignInButton>
                    )}
                  </div>

                  <button
                    className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground underline underline-offset-4 transition hover:text-primary"
                    onClick={() => toggleDescription(request.id)}
                    type="button"
                  >
                    {expanded ? t("collapse") : t("expand")}
                  </button>

                  {expanded ? (
                    <>
                      <div className="mt-5 border border-border bg-card p-5">
                        {hasDescription ? (
                          <ProjectMarkdown
                            markdown={request.descriptionMarkdown}
                          />
                        ) : (
                          <p className="font-mono text-sm uppercase leading-6 tracking-[0.14em] text-muted-foreground">
                            {t("noDescription")}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 border-t border-border pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                            {t("comments", { count: request.comments.length })}
                          </p>
                        </div>

                        {signedIn ? (
                          <form
                            className="mt-4 grid gap-3"
                            onSubmit={(event) =>
                              submitComment(event, request.id)
                            }
                          >
                            <Textarea
                              className="min-h-24 bg-card font-mono text-sm leading-6"
                              disabled={commentMutation.isPending}
                              maxLength={maxCommentLength}
                              onChange={(event) =>
                                setCommentBodies((current) => ({
                                  ...current,
                                  [request.id]: event.target.value,
                                }))
                              }
                              placeholder={t("commentPlaceholder")}
                              value={commentBody}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {commentBody.trim().length}/{maxCommentLength}
                              </p>
                              <Button
                                className="h-10 px-4 text-xs uppercase tracking-[0.16em]"
                                disabled={commentMutation.isPending}
                                type="submit"
                              >
                                {t("comment")}
                              </Button>
                            </div>
                          </form>
                        ) : null}

                        <div className="mt-4 grid gap-px bg-border">
                          {request.comments.length > 0 ? (
                            request.comments.map((comment) => (
                              <div className="bg-card p-4" key={comment.id}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <AuthorBadge
                                    imageClassName="size-8"
                                    imageUrl={comment.authorImageUrl}
                                    meta={comment.createdAt.slice(0, 10)}
                                    metaClassName="text-[0.65rem]"
                                    name={comment.authorName}
                                    nameClassName="text-xs tracking-[0.16em]"
                                  />
                                  {signedIn ? (
                                    <Button
                                      className="h-9 px-3 text-[0.65rem] uppercase tracking-[0.16em]"
                                      disabled={pendingCommentVotes.has(
                                        commentVoteKey(request.id, comment.id),
                                      )}
                                      onClick={() =>
                                        voteForComment(request.id, comment.id)
                                      }
                                      type="button"
                                      variant={
                                        comment.voted ? "default" : "outline"
                                      }
                                    >
                                      {comment.voted
                                        ? t("voted", {
                                            count: comment.votesCount,
                                          })
                                        : t("vote", {
                                            count: comment.votesCount,
                                          })}
                                    </Button>
                                  ) : null}
                                </div>
                                <p className="mt-4 whitespace-pre-wrap font-mono text-sm leading-7 text-muted-foreground">
                                  {comment.body}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="bg-card p-4">
                              <p className="font-mono text-xs uppercase leading-6 tracking-[0.14em] text-muted-foreground">
                                {t("noComments")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="bg-background p-8">
              <p className="font-mono text-lg uppercase leading-8 tracking-[0.14em] text-muted-foreground">
                {t("empty")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
