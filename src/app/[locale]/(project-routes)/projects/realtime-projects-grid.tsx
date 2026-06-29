"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AuthorBadge } from "@/components/author-badge";
import { ProjectVideoEmbed } from "@/components/project-video-embed";
import { createBrowserSupabase } from "@/lib/projects/browser-supabase";
import {
  categorizeProject,
  type ResolvedCluster,
} from "@/lib/projects/categories";
import { fetchProjects, projectQueryKeys } from "@/lib/projects/queries";
import {
  type Project,
  type ProjectLifecycleStatus,
  projectLifecycleStatuses,
  sortProjectsByVotes,
} from "@/lib/projects/schema";

type CategoryFilter = string;
type StatusFilter = "all" | ProjectLifecycleStatus;

type RealtimeProjectsGridProps = {
  initialProjects: Project[];
  /** Filterable clusters: built-ins plus any graduated proposals. */
  clusters: ResolvedCluster[];
  /** project slug -> resolved display cluster id. */
  assignments: Record<string, string>;
};

type ProjectVotePayload = {
  new: { event_type?: "insert" | "delete"; project_id?: string } | null;
};

export function RealtimeProjectsGrid({
  initialProjects,
  clusters,
  assignments,
}: RealtimeProjectsGridProps) {
  const locale = useLocale();
  const t = useTranslations("Projects.grid");
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const { data: projects = [], isFetching } = useQuery({
    initialData: initialProjects,
    queryFn: fetchProjects,
    queryKey: projectQueryKeys.list(),
  });

  const clusterById = useMemo(
    () => new Map(clusters.map((cluster) => [cluster.id, cluster])),
    [clusters],
  );
  const tagged = useMemo(
    () =>
      projects.map((project) => ({
        project,
        // Persisted assignment when present; keyword heuristic covers projects
        // that arrive via the realtime feed before the page refetches.
        categoryId: assignments[project.slug] ?? categorizeProject(project),
      })),
    [projects, assignments],
  );
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const { categoryId } of tagged) {
      map.set(categoryId, (map.get(categoryId) ?? 0) + 1);
    }
    return map;
  }, [tagged]);
  const statusCounts = useMemo(() => {
    const map = new Map<ProjectLifecycleStatus, number>();
    for (const { project } of tagged) {
      map.set(
        project.lifecycleStatus,
        (map.get(project.lifecycleStatus) ?? 0) + 1,
      );
    }
    return map;
  }, [tagged]);
  const visibleClusters = useMemo(
    () => clusters.filter((cluster) => (counts.get(cluster.id) ?? 0) > 0),
    [clusters, counts],
  );
  const categoryVisible = useMemo(
    () =>
      activeCategory === "all"
        ? tagged
        : tagged.filter((entry) => entry.categoryId === activeCategory),
    [tagged, activeCategory],
  );
  const visible = useMemo(
    () =>
      activeStatus === "all"
        ? categoryVisible
        : categoryVisible.filter(
            ({ project }) => project.lifecycleStatus === activeStatus,
          ),
    [categoryVisible, activeStatus],
  );
  const activeMeta =
    activeCategory === "all" ? null : clusterById.get(activeCategory);

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
      <div className="mb-6 flex flex-wrap gap-2">
        <CategoryChip
          active={activeCategory === "all"}
          count={projects.length}
          label={t("all")}
          onClick={() => setActiveCategory("all")}
        />
        {visibleClusters.map((cluster) => (
          <CategoryChip
            active={activeCategory === cluster.id}
            count={counts.get(cluster.id) ?? 0}
            key={cluster.id}
            label={cluster.label}
            onClick={() => setActiveCategory(cluster.id)}
          />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <CategoryChip
          active={activeStatus === "all"}
          count={projects.length}
          label={t("statuses.all")}
          onClick={() => setActiveStatus("all")}
        />
        {projectLifecycleStatuses.map((status) => (
          <CategoryChip
            active={activeStatus === status}
            count={statusCounts.get(status) ?? 0}
            key={status}
            label={t(`statuses.${status}`)}
            onClick={() => setActiveStatus(status)}
          />
        ))}
      </div>

      {activeMeta ? (
        <div className="mb-6 border-accent border-l-2 bg-card px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
            {activeMeta.title}
          </p>
          <p className="mt-2 max-w-3xl font-mono text-sm leading-6 tracking-[0.04em] text-muted-foreground">
            {activeMeta.description}
          </p>
        </div>
      ) : null}

      <div className="mb-3 flex justify-between gap-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          {visible.length} {visible.length === 1 ? t("project") : t("projects")}
        </p>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          {isFetching ? t("syncing") : t("live")}
        </p>
      </div>
      <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ project, categoryId }) => (
          <article
            className="group bg-background p-6 transition hover:bg-card sm:p-7"
            key={project.id}
          >
            <button
              className="mb-4 inline-flex font-mono text-[0.6rem] font-bold uppercase tracking-[0.24em] text-accent transition hover:text-primary"
              onClick={() => setActiveCategory(categoryId)}
              type="button"
            >
              {clusterById.get(categoryId)?.label ??
                clusterById.get("other")?.label}
            </button>
            <ProjectVideoEmbed
              detailHref={`/${locale}/p/${project.slug}`}
              title={project.name}
              videoUrl={project.videoUrl}
            />
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {project.countries.join(" / ")}
              </p>
              <p className="border border-accent px-2 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-accent">
                {t(`statuses.${project.lifecycleStatus}`)}
              </p>
            </div>
            <div className="mt-3 flex justify-end">
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
            <AuthorBadge
              className="mt-5"
              imageUrl={project.ownerImageUrl}
              meta={project.participantName}
              name={project.ownerName || project.participantName}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

type CategoryChipProps = {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
};

function CategoryChip({ active, count, label, onClick }: CategoryChipProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 border px-3 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <span className={active ? "text-primary-foreground" : "text-accent"}>
        {count}
      </span>
    </button>
  );
}
