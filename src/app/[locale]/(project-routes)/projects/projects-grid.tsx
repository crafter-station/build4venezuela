"use client";

import {
  MagnifyingGlassIcon,
  RowsIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useDeferredValue, useState } from "react";
import { ProjectCard, ProjectListItem } from "@/components/project-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  categorizeProject,
  type ResolvedCluster,
} from "@/lib/projects/categories";
import { fetchProjects, projectQueryKeys } from "@/lib/projects/queries";
import {
  isProjectApplicableTo,
  type Project,
  type ProjectApplicability,
  type ProjectLifecycleStatus,
  projectLifecycleStatuses,
} from "@/lib/projects/schema";

type CategoryFilter = string;
type StatusFilter = "all" | ProjectLifecycleStatus;
type ViewMode = "grid" | "list";
type CountryFilter = "all" | Exclude<ProjectApplicability, "latam">;

type ProjectsGridProps = {
  initialProjects: Project[];
  clusters: ResolvedCluster[];
  assignments: Record<string, string>;
  initialCountry?: Exclude<ProjectApplicability, "latam">;
};

export function ProjectsGrid({
  initialProjects,
  clusters,
  assignments,
  initialCountry,
}: ProjectsGridProps) {
  const locale = useLocale();
  const t = useTranslations("Projects.grid");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [activeCountry, setActiveCountry] = useState<CountryFilter>(
    initialCountry ?? "all",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(
    query.trim().toLocaleLowerCase(locale),
  );
  const { data: projects = [], isFetching } = useQuery({
    initialData: initialProjects,
    queryFn: fetchProjects,
    queryKey: projectQueryKeys.list(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const clusterById = new Map(clusters.map((cluster) => [cluster.id, cluster]));
  const tagged = projects.map((project) => ({
    project,
    categoryId: assignments[project.slug] ?? categorizeProject(project),
  }));
  const counts = new Map<string, number>();
  const statusCounts = new Map<ProjectLifecycleStatus, number>();
  for (const { categoryId, project } of tagged) {
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    statusCounts.set(
      project.lifecycleStatus,
      (statusCounts.get(project.lifecycleStatus) ?? 0) + 1,
    );
  }
  const visibleClusters = clusters.filter(
    (cluster) => (counts.get(cluster.id) ?? 0) > 0,
  );
  const visible = tagged.filter(({ categoryId, project }) => {
    const categoryMatches =
      activeCategory === "all" || categoryId === activeCategory;
    const statusMatches =
      activeStatus === "all" || project.lifecycleStatus === activeStatus;
    const countryMatches =
      activeCountry === "all" || isProjectApplicableTo(project, activeCountry);
    const queryMatches =
      !deferredQuery ||
      `${project.name} ${project.descriptionMarkdown} ${project.ownerName} ${project.participantName} ${project.countries.join(" ")}`
        .toLocaleLowerCase(locale)
        .includes(deferredQuery);

    return categoryMatches && statusMatches && countryMatches && queryMatches;
  });
  const activeMeta =
    activeCategory === "all" ? null : clusterById.get(activeCategory);

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="shadow-sm" size="sm">
        <CardContent>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t("searchPlaceholder")}
              className="bg-background pl-10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              type="search"
              value={query}
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <FilterChip
              active={activeCategory === "all"}
              count={projects.length}
              label={t("all")}
              onClick={() => setActiveCategory("all")}
            />
            {visibleClusters.map((cluster) => (
              <FilterChip
                active={activeCategory === cluster.id}
                count={counts.get(cluster.id) ?? 0}
                key={cluster.id}
                label={cluster.label}
                onClick={() => setActiveCategory(cluster.id)}
              />
            ))}
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto border-t pt-3 pb-1">
            <FilterChip
              active={activeCountry === "all"}
              count={projects.length}
              label={t("all")}
              onClick={() => setActiveCountry("all")}
            />
            <FilterChip
              active={activeCountry === "venezuela"}
              count={
                projects.filter((project) =>
                  isProjectApplicableTo(project, "venezuela"),
                ).length
              }
              label={t("applicabilities.venezuela")}
              onClick={() => setActiveCountry("venezuela")}
            />
            <FilterChip
              active={activeCountry === "colombia"}
              count={
                projects.filter((project) =>
                  isProjectApplicableTo(project, "colombia"),
                ).length
              }
              label={t("applicabilities.colombia")}
              onClick={() => setActiveCountry("colombia")}
            />
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto border-t pt-3 pb-1">
            <FilterChip
              active={activeStatus === "all"}
              count={projects.length}
              label={t("statuses.all")}
              onClick={() => setActiveStatus("all")}
            />
            {projectLifecycleStatuses.map((status) => (
              <FilterChip
                active={activeStatus === status}
                count={statusCounts.get(status) ?? 0}
                key={status}
                label={t(`statuses.${status}`)}
                onClick={() => setActiveStatus(status)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {activeMeta ? (
        <Alert className="mt-4 border-brand-blue/20 bg-brand-blue/5">
          <AlertTitle className="text-link">{activeMeta.title}</AlertTitle>
          <AlertDescription className="max-w-3xl">
            {activeMeta.description}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="my-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {visible.length}
          </span>{" "}
          {visible.length === 1 ? t("project") : t("projects")}
          <span className="ml-2 hidden text-xs sm:inline">
            {isFetching ? t("syncing") : t("live")}
          </span>
        </p>
        <div className="inline-flex rounded-lg border bg-card p-1">
          <ViewModeButton
            active={viewMode === "grid"}
            icon={<SquaresFourIcon />}
            label={t("views.grid")}
            onClick={() => setViewMode("grid")}
          />
          <ViewModeButton
            active={viewMode === "list"}
            icon={<RowsIcon />}
            label={t("views.list")}
            onClick={() => setViewMode("list")}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="text-center text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ categoryId, project }, index) => (
            <ProjectCard
              applicabilityLabel={t(`applicabilities.${project.applicability}`)}
              categoryLabel={clusterById.get(categoryId)?.label}
              disabledLabel={t("disabled")}
              href={`/${locale}/p/${project.slug}`}
              imageLoading={index < 3 ? "eager" : undefined}
              key={project.id}
              lifecycleLabel={t(`statuses.${project.lifecycleStatus}`)}
              openLabel={t("open")}
              project={project}
              voteLabel={project.votesCount === 1 ? t("vote") : t("votes")}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(({ categoryId, project }) => (
            <ProjectListItem
              applicabilityLabel={t(`applicabilities.${project.applicability}`)}
              categoryLabel={clusterById.get(categoryId)?.label}
              disabledLabel={t("disabled")}
              href={`/${locale}/p/${project.slug}`}
              key={project.id}
              lifecycleLabel={t(`statuses.${project.lifecycleStatus}`)}
              openLabel={t("open")}
              project={project}
              voteLabel={project.votesCount === 1 ? t("vote") : t("votes")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ViewModeButtonProps = {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

function ViewModeButton({ active, icon, label, onClick }: ViewModeButtonProps) {
  return (
    <Button
      aria-label={label}
      aria-pressed={active}
      size="icon-sm"
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
    </Button>
  );
}

type FilterChipProps = {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
};

function FilterChip({ active, count, label, onClick }: FilterChipProps) {
  return (
    <Button
      aria-pressed={active}
      onClick={onClick}
      size="sm"
      type="button"
      variant={active ? "default" : "outline"}
    >
      <span>{label}</span>
      <span className="font-mono text-[0.68rem] opacity-70 tabular-nums">
        {count}
      </span>
    </Button>
  );
}
