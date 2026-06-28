"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/projects/browser-supabase";
import {
  fetchProjectVote,
  projectQueryKeys,
  toggleProjectVote,
} from "@/lib/projects/queries";

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

const REALTIME_INACTIVE_TIMEOUT_MS = 60_000;

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
    });

  const voteMutation = useMutation({
    mutationFn: () => toggleProjectVote(projectId),
    onError: (
      _error,
      _variables,
      context: { previousVote?: VoteState } | undefined,
    ) => {
      if (context?.previousVote) {
        queryClient.setQueryData(voteQueryKey, context.previousVote);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: voteQueryKey });
      const previousVote = queryClient.getQueryData<VoteState>(voteQueryKey);
      const currentVote = previousVote ?? voteState;
      const nextVote = !currentVote.voted;

      queryClient.setQueryData<VoteState>(voteQueryKey, {
        count: Math.max(0, currentVote.count + (nextVote ? 1 : -1)),
        voted: nextVote,
      });

      return { previousVote };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(voteQueryKey, data);
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.list() });
    },
  });
  const signedIn = isSignedIn ?? initialSignedIn;

  useEffect(() => {
    const supabase = createBrowserSupabase();

    if (!supabase) {
      return;
    }

    const realtime = supabase;
    let channel: ReturnType<typeof realtime.channel> | null = null;
    let inactiveTimer: number | null = null;
    let hasConnected = false;

    function disconnect() {
      if (inactiveTimer) {
        window.clearTimeout(inactiveTimer);
        inactiveTimer = null;
      }

      if (!channel) {
        return;
      }

      const currentChannel = channel;
      channel = null;
      void realtime.removeChannel(currentChannel);
    }

    function scheduleDisconnect() {
      if (inactiveTimer) {
        window.clearTimeout(inactiveTimer);
      }

      inactiveTimer = window.setTimeout(
        disconnect,
        REALTIME_INACTIVE_TIMEOUT_MS,
      );
    }

    function connect() {
      if (document.hidden) {
        return;
      }

      if (channel) {
        scheduleDisconnect();
        return;
      }

      const shouldReconcile = hasConnected;
      hasConnected = true;
      channel = realtime
        .channel(`project-votes-${projectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "project_vote_events",
            filter: `project_id=eq.${projectId}`,
          },
          () =>
            queryClient.invalidateQueries({
              queryKey: projectQueryKeys.votes(projectId),
            }),
        )
        .subscribe();

      if (shouldReconcile) {
        void queryClient.invalidateQueries({
          queryKey: projectQueryKeys.votes(projectId),
        });
      }

      scheduleDisconnect();
    }

    function syncActivity() {
      connect();
    }

    function syncVisibility() {
      if (document.hidden) {
        disconnect();
        return;
      }

      connect();
    }

    connect();
    window.addEventListener("pointermove", syncActivity, { passive: true });
    window.addEventListener("pointerdown", syncActivity, { passive: true });
    window.addEventListener("scroll", syncActivity, { passive: true });
    window.addEventListener("keydown", syncActivity);
    window.addEventListener("focus", syncActivity);
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      window.removeEventListener("pointermove", syncActivity);
      window.removeEventListener("pointerdown", syncActivity);
      window.removeEventListener("scroll", syncActivity);
      window.removeEventListener("keydown", syncActivity);
      window.removeEventListener("focus", syncActivity);
      document.removeEventListener("visibilitychange", syncVisibility);
      disconnect();
    };
  }, [projectId, queryClient]);

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
