"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { AuthorBadge } from "@/components/author-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjectComment,
  fetchProjectComments,
  projectQueryKeys,
  toggleProjectCommentVote,
} from "@/lib/projects/queries";
import {
  type ProjectComment,
  sortCommentsByVotes,
} from "@/lib/projects/schema";

type CommentsSectionProps = {
  projectId: string;
  initialComments: ProjectComment[];
  initialSignedIn: boolean;
};

const maxCommentLength = 1200;

export function CommentsSection({
  projectId,
  initialComments,
  initialSignedIn,
}: CommentsSectionProps) {
  const t = useTranslations("Comments");
  const { isSignedIn } = useUser();
  const signedIn = isSignedIn ?? initialSignedIn;
  const queryClient = useQueryClient();
  const commentsQueryKey = projectQueryKeys.comments(projectId);
  const { data: comments = initialComments } = useQuery({
    initialData: initialComments,
    queryFn: () => fetchProjectComments(projectId),
    queryKey: commentsQueryKey,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingCommentVotes, setPendingCommentVotes] = useState<Set<string>>(
    () => new Set(),
  );

  const commentMutation = useMutation({
    mutationFn: (commentBody: string) =>
      createProjectComment(projectId, commentBody),
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
    onSuccess: (comment) => {
      queryClient.setQueryData<ProjectComment[]>(commentsQueryKey, (current) =>
        sortCommentsByVotes(
          current?.some((currentComment) => currentComment.id === comment.id)
            ? current
            : [...(current ?? []), comment],
        ),
      );
      setBody("");
    },
  });
  const commentVoteMutation = useMutation({
    mutationFn: (commentId: string) =>
      toggleProjectCommentVote(projectId, commentId),
    onError: (
      _error,
      _commentId,
      context: { previousComments?: ProjectComment[] } | undefined,
    ) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsQueryKey, context.previousComments);
      }
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onMutate: async (commentId) => {
      setPendingCommentVotes((current) => new Set(current).add(commentId));
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });
      const previousComments =
        queryClient.getQueryData<ProjectComment[]>(commentsQueryKey);
      const currentComments = previousComments ?? comments;
      const currentComment = currentComments.find(
        (comment) => comment.id === commentId,
      );
      const nextVoted = !currentComment?.voted;

      queryClient.setQueryData<ProjectComment[]>(
        commentsQueryKey,
        sortCommentsByVotes(
          currentComments.map((comment) => {
            if (comment.id !== commentId) {
              return comment;
            }

            return {
              ...comment,
              voted: nextVoted,
              votesCount: Math.max(
                0,
                comment.votesCount + (nextVoted ? 1 : -1),
              ),
            };
          }),
        ),
      );

      return { previousComments };
    },
    onSettled: (_data, _error, commentId) => {
      setPendingCommentVotes((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
    },
    onSuccess: (data, commentId) => {
      queryClient.setQueryData<ProjectComment[]>(commentsQueryKey, (current) =>
        sortCommentsByVotes(
          current?.map((comment) =>
            comment.id === commentId
              ? { ...comment, votesCount: data.count, voted: data.voted }
              : comment,
          ) ?? [],
        ),
      );
    },
  });

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();

    if (trimmedBody.length < 3) {
      setError(t("errors.tooShort"));
      return;
    }

    if (trimmedBody.length > maxCommentLength) {
      setError(t("errors.tooLong"));
      return;
    }

    setError(null);
    commentMutation.mutate(trimmedBody);
  }

  function vote(commentId: string) {
    if (pendingCommentVotes.has(commentId)) {
      return;
    }

    commentVoteMutation.mutate(commentId);
  }

  return (
    <section
      aria-labelledby="comments-title"
      className="mx-auto mt-10 max-w-6xl"
    >
      <Card className="[--card-spacing:--spacing(8)]">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
              {t("eyebrow")}
            </p>
            <CardTitle>
              <h2
                className="mt-3 font-mono text-3xl font-black uppercase leading-none tracking-[-0.04em] sm:text-4xl"
                id="comments-title"
              >
                {t("title")}
              </h2>
            </CardTitle>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {comments.length}{" "}
            {comments.length === 1 ? t("comment") : t("comments")}
          </p>
        </CardHeader>

        <CardContent>
          {signedIn ? (
            <form className="grid gap-3" onSubmit={submitComment}>
              <Textarea
                aria-invalid={Boolean(error)}
                className="min-h-28 bg-background font-mono text-sm leading-6"
                disabled={commentMutation.isPending}
                maxLength={maxCommentLength}
                name="body"
                onChange={(event) => setBody(event.target.value)}
                placeholder={t("placeholder")}
                value={body}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {body.trim().length}/{maxCommentLength}
                </p>
                <Button
                  className="uppercase tracking-[0.18em]"
                  size="lg"
                  disabled={commentMutation.isPending}
                  type="submit"
                >
                  {commentMutation.isPending ? t("posting") : t("post")}
                </Button>
              </div>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription className="font-mono uppercase tracking-[0.14em]">
                    {error}
                  </AlertDescription>
                </Alert>
              ) : null}
            </form>
          ) : (
            <Alert>
              <AlertDescription className="font-mono text-sm uppercase leading-6 tracking-[0.14em]">
                {t("signedOutDescription")}
              </AlertDescription>
              <SignInButton mode="modal">
                <Button
                  className="mt-4 uppercase tracking-[0.18em]"
                  size="lg"
                  type="button"
                >
                  {t("signIn")}
                </Button>
              </SignInButton>
            </Alert>
          )}

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <article className="min-w-0" key={comment.id}>
                  <Card size="sm">
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <AuthorBadge
                          imageUrl={comment.authorImageUrl}
                          meta={comment.createdAt.slice(0, 10)}
                          name={comment.authorName}
                        />
                        {signedIn ? (
                          <Button
                            className="uppercase tracking-[0.16em]"
                            disabled={pendingCommentVotes.has(comment.id)}
                            onClick={() => vote(comment.id)}
                            type="button"
                            variant={comment.voted ? "default" : "outline"}
                          >
                            {comment.voted
                              ? t("voted", { count: comment.votesCount })
                              : t("vote", { count: comment.votesCount })}
                          </Button>
                        ) : (
                          <SignInButton mode="modal">
                            <Button
                              className="uppercase tracking-[0.16em]"
                              type="button"
                              variant="outline"
                            >
                              {t("vote", { count: comment.votesCount })}
                            </Button>
                          </SignInButton>
                        )}
                      </div>
                      <p className="mt-5 whitespace-pre-wrap font-mono text-sm leading-7 text-muted-foreground [overflow-wrap:anywhere]">
                        {comment.body}
                      </p>
                    </CardContent>
                  </Card>
                </article>
              ))
            ) : (
              <Card size="sm">
                <CardContent className="font-mono text-sm uppercase leading-6 tracking-[0.14em] text-muted-foreground">
                  {t("empty")}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
