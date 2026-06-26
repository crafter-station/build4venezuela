"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/projects/browser-supabase";

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
  const { isSignedIn } = useUser();
  const [confirmedVote, setConfirmedVote] = useState<VoteState>({
    count: initialCount,
    voted: initialVoted,
  });
  const [optimisticVote, flipOptimisticVote] = useOptimistic(
    confirmedVote,
    (currentVote, _action: "toggle") => {
      const voted = !currentVote.voted;

      return {
        count: Math.max(0, currentVote.count + (voted ? 1 : -1)),
        voted,
      };
    },
  );
  const [pending, startTransition] = useTransition();
  const signedIn = isSignedIn ?? initialSignedIn;

  useEffect(() => {
    const supabase = createBrowserSupabase();

    if (!supabase) {
      return;
    }

    async function refreshVotes() {
      const response = await fetch(`/api/projects/${projectId}/votes`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { count: number; voted: boolean };
      setConfirmedVote(data);
    }

    const channel = supabase
      .channel(`project-votes-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_votes",
          filter: `project_id=eq.${projectId}`,
        },
        refreshVotes,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  function vote() {
    if (pending) {
      return;
    }

    startTransition(async () => {
      flipOptimisticVote("toggle");

      const response = await fetch(`/api/projects/${projectId}/votes`, {
        method: "POST",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { count: number; voted: boolean };
      setConfirmedVote(data);
    });
  }

  if (!signedIn) {
    return (
      <SignInButton mode="modal">
        <Button
          className="h-12 px-5 text-sm uppercase tracking-[0.18em]"
          type="button"
        >
          Sign in to vote ({optimisticVote.count})
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      className="h-12 px-5 text-sm uppercase tracking-[0.18em]"
      aria-disabled={pending}
      onClick={vote}
      type="button"
    >
      {optimisticVote.voted
        ? `Voted (${optimisticVote.count})`
        : `Vote (${optimisticVote.count})`}
    </Button>
  );
}
