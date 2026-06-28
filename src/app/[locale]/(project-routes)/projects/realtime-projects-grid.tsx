"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { ProjectVideoEmbed } from "@/components/project-video-embed";
import { createBrowserSupabase } from "@/lib/projects/browser-supabase";
import { fetchProjects, projectQueryKeys } from "@/lib/projects/queries";
import { type Project, sortProjectsByVotes } from "@/lib/projects/schema";

type RealtimeProjectsGridProps = {
  initialProjects: Project[];
};

type ProjectVotePayload = {
  new: { event_type?: "insert" | "delete"; project_id?: string } | null;
};

export function RealtimeProjectsGrid({
  initialProjects,
}: RealtimeProjectsGridProps) {
  const locale = useLocale();
  const t = useTranslations("Projects.grid");
  const queryClient = useQueryClient();
  const { data: projects = [], isFetching } = useQuery({
    initialData: initialProjects,
    queryFn: fetchProjects,
    queryKey: projectQueryKeys.list(),
  });

  useEffect(() => {
    const supabase = createBrowserSupabase();

    if (!supabase) {
      return;
    }

    function updateVoteCount(payload: ProjectVotePayload) {
      const projectId = payload.new?.project_id ?? null;

      if (!projectId || !payload.new?.event_type) {
        return;
      }

      const delta = payload.new.event_type === "insert" ? 1 : -1;

      queryClient.setQueryData<Project[]>(projectQueryKeys.list(), (current) =>
        sortProjectsByVotes(
          current?.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  votesCount: Math.max(0, project.votesCount + delta),
                }
              : project,
          ) ?? [],
        ),
      );
    }

    const publicationsChannel = supabase
      .channel("project-publications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_publication_events",
        },
        () =>
          queryClient.invalidateQueries({ queryKey: projectQueryKeys.list() }),
      )
      .subscribe();

    const votesChannel = supabase
      .channel("project-list-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_vote_events",
        },
        (payload) => updateVoteCount(payload as ProjectVotePayload),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(publicationsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [queryClient]);

  if (projects.length === 0) {
    return (
      <div className="border border-border bg-card p-8">
        <p className="font-mono text-lg uppercase leading-8 tracking-[0.14em] text-muted-foreground">
          {t("empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-3 flex justify-end">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          {isFetching ? t("syncing") : t("live")}
        </p>
      </div>
      <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <article
            className="group bg-background p-6 transition hover:bg-card sm:p-7"
            key={project.id}
          >
            <ProjectVideoEmbed
              detailHref={`/${locale}/p/${project.slug}`}
              title={project.name}
              videoUrl={project.videoUrl}
            />
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {project.countries.join(" / ")}
              </p>
              {/* ponytail: singular/plural needed — "1 votes" reads wrong and breaks trust */}
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                {project.votesCount}{" "}
                {project.votesCount === 1 ? t("vote") : t("votes")}
              </p>
            </div>
            <a className="block" href={`/${locale}/p/${project.slug}`}>
              <h2 className="mt-8 font-mono text-3xl font-black uppercase leading-none tracking-[-0.04em] transition group-hover:text-primary">
                {project.name}
              </h2>
            </a>
            <p className="mt-5 font-mono text-sm uppercase leading-6 tracking-[0.14em] text-muted-foreground">
              {project.participantName}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
