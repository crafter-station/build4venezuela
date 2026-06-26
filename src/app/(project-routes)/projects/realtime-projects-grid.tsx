"use client";

import { useEffect, useState, useTransition } from "react";
import { createBrowserSupabase } from "@/lib/projects/browser-supabase";
import type { Project } from "@/lib/projects/schema";

type RealtimeProjectsGridProps = {
  initialProjects: Project[];
};

type ProjectVotePayload = {
  eventType: "INSERT" | "DELETE" | "UPDATE";
  new: { project_id?: string } | null;
  old: { project_id?: string } | null;
};

export function RealtimeProjectsGrid({
  initialProjects,
}: RealtimeProjectsGridProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [isRefreshing, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createBrowserSupabase();

    if (!supabase) {
      return;
    }

    let active = true;

    async function refreshProjects() {
      const response = await fetch("/api/projects", { cache: "no-store" });

      if (!(active && response.ok)) {
        return;
      }

      const data = (await response.json()) as { projects: Project[] };
      startTransition(() => {
        setProjects(data.projects);
      });
    }

    function updateVoteCount(payload: ProjectVotePayload) {
      const projectId =
        payload.new?.project_id ?? payload.old?.project_id ?? null;

      if (!projectId || payload.eventType === "UPDATE") {
        return;
      }

      const delta = payload.eventType === "INSERT" ? 1 : -1;

      startTransition(() => {
        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  votesCount: Math.max(0, project.votesCount + delta),
                }
              : project,
          ),
        );
      });
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
        refreshProjects,
      )
      .subscribe();

    const votesChannel = supabase
      .channel("project-list-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_votes",
        },
        (payload) => updateVoteCount(payload as ProjectVotePayload),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(publicationsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, []);

  if (projects.length === 0) {
    return (
      <div className="border border-border bg-card p-8">
        <p className="font-mono text-lg uppercase leading-8 tracking-[0.14em] text-muted-foreground">
          No projects yet. Be the first one to add a build.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-3 flex justify-end">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          {isRefreshing ? "Syncing live feed..." : "Live feed enabled"}
        </p>
      </div>
      <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <a
            className="group bg-background p-6 transition hover:bg-card sm:p-7"
            href={`/p/${project.slug}`}
            key={project.id}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {project.countries.join(" / ")}
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                {project.votesCount} votes
              </p>
            </div>
            <h2 className="mt-8 font-mono text-3xl font-black uppercase leading-none tracking-[-0.04em] transition group-hover:text-primary">
              {project.name}
            </h2>
            <p className="mt-5 font-mono text-sm uppercase leading-6 tracking-[0.14em] text-muted-foreground">
              {project.participantName}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
