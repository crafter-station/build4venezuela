"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  fetchProjectVote,
  projectQueryKeys,
  toggleProjectVote,
} from "@/lib/projects/queries";
import { type Project, sortProjectsByVotes } from "@/lib/projects/schema";

type VoteButtonProps = {
  projectId: string;
  initialCount: number;
  initialSignedIn: boolean;
  initialVoted: boolean;
};

type VoteState = {
  count: number;
  voted: boolean;
};

export function VoteButton({
  projectId,
  initialCount,
  initialSignedIn,
  initialVoted,
}: VoteButtonProps) {
  const t = useTranslations("Votes");
  const { isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const voteQueryKey = projectQueryKeys.votes(projectId);
  const { data: voteState = { count: initialCount, voted: initialVoted } } =
    useQuery({
      initialData: { count: initialCount, voted: initialVoted },
      queryFn: () => fetchProjectVote(projectId),
      queryKey: voteQueryKey,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
    });

  const voteMutation = useMutation({
    mutationFn: () => toggleProjectVote(projectId),
    onError: (
      _error,
      _variables,
      context:
        | { previousProjects?: Project[]; previousVote?: VoteState }
        | undefined,
    ) => {
      if (context?.previousVote) {
        queryClient.setQueryData(voteQueryKey, context.previousVote);
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectQueryKeys.list(),
          context.previousProjects,
        );
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: voteQueryKey });
      await queryClient.cancelQueries({ queryKey: projectQueryKeys.list() });
      const previousVote = queryClient.getQueryData<VoteState>(voteQueryKey);
      const previousProjects = queryClient.getQueryData<Project[]>(
        projectQueryKeys.list(),
      );
      const currentVote = previousVote ?? voteState;
      const nextVote = !currentVote.voted;
      const delta = nextVote ? 1 : -1;

      queryClient.setQueryData<VoteState>(voteQueryKey, {
        count: Math.max(0, currentVote.count + delta),
        voted: nextVote,
      });
      queryClient.setQueryData<Project[]>(projectQueryKeys.list(), (current) =>
        current
          ? sortProjectsByVotes(
              current.map((project) =>
                project.id === projectId
                  ? {
                      ...project,
                      votesCount: Math.max(0, project.votesCount + delta),
                    }
                  : project,
              ),
            )
          : current,
      );

      return { previousProjects, previousVote };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(voteQueryKey, data);
      queryClient.setQueryData<Project[]>(projectQueryKeys.list(), (current) =>
        current
          ? sortProjectsByVotes(
              current.map((project) =>
                project.id === projectId
                  ? { ...project, votesCount: data.count }
                  : project,
              ),
            )
          : current,
      );
    },
  });
  const signedIn = isSignedIn ?? initialSignedIn;

  function vote() {
    if (voteMutation.isPending) {
      return;
    }

    voteMutation.mutate();
  }

  if (!signedIn) {
    return (
      <SignInButton mode="modal">
        <Button
          className="h-12 px-5 text-sm uppercase tracking-[0.18em]"
          type="button"
        >
          {t("signIn", { count: voteState.count })}
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      className="h-12 px-5 text-sm uppercase tracking-[0.18em]"
      aria-disabled={voteMutation.isPending}
      onClick={vote}
      type="button"
    >
      {voteState.voted
        ? t("voted", { count: voteState.count })
        : t("vote", { count: voteState.count })}
    </Button>
  );
}
