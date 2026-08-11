import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Project, ProjectLifecycleStatus } from "@/lib/projects/schema";
import { cn } from "@/lib/utils";
import { AuthorBadge } from "./author-badge";

type ProjectCardProps = {
  project: Project;
  href: string;
  applicabilityLabel: string;
  lifecycleLabel: string;
  openLabel: string;
  voteLabel: string;
  categoryLabel?: string;
  className?: string;
};

const statusStyles: Record<ProjectLifecycleStatus, string> = {
  ready_to_use: "border-success/20 bg-success/10 text-success",
  in_development: "border-brand-blue/20 bg-brand-blue/10 text-link",
  idea: "border-warning/20 bg-warning/10 text-warning",
};

export function ProjectCard({
  project,
  href,
  applicabilityLabel,
  lifecycleLabel,
  openLabel,
  voteLabel,
  categoryLabel,
  className,
}: ProjectCardProps) {
  const author = project.ownerName || project.participantName;
  const authorMeta =
    project.ownerName && project.ownerName !== project.participantName
      ? project.participantName
      : undefined;

  return (
    <article
      className={cn(
        "group flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <ProjectPreview href={href} project={project} />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-2">
          <Badge
            className={cn(
              "shrink-0 font-mono font-bold uppercase tracking-[0.08em]",
              statusStyles[project.lifecycleStatus],
            )}
            variant="outline"
          >
            {lifecycleLabel}
          </Badge>
          <span className="truncate text-xs text-muted-foreground">
            {categoryLabel || applicabilityLabel}
          </span>
        </div>

        <h3 className="mt-4 text-balance text-xl font-semibold leading-tight tracking-[-0.025em]">
          <Link
            className="ui-focus transition-colors group-hover:text-link"
            href={href}
          >
            {project.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {projectSummary(project)}
        </p>

        <AuthorBadge
          className="mt-5"
          imageClassName="size-8"
          imageUrl={project.ownerImageUrl}
          meta={authorMeta}
          metaClassName="text-xs normal-case tracking-normal"
          name={author}
          nameClassName="font-sans text-sm normal-case tracking-normal"
        />

        <div className="mt-5 flex min-w-0 items-center justify-between gap-4 border-t pt-4">
          <p className="truncate text-xs text-muted-foreground">
            {project.countries.join(" · ")}
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {project.votesCount} {voteLabel}
            </span>
            <Link
              aria-label={`${openLabel} ${project.name}`}
              className="ui-focus text-sm font-semibold text-link"
              href={href}
            >
              {openLabel} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

type ProjectListItemProps = Omit<ProjectCardProps, "className">;

export function ProjectListItem({
  project,
  href,
  applicabilityLabel,
  lifecycleLabel,
  openLabel,
  voteLabel,
  categoryLabel,
}: ProjectListItemProps) {
  const author = project.ownerName || project.participantName;

  return (
    <article className="group grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-4 rounded-xl border bg-card p-4 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-md sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
      <ProjectPreview compact href={href} project={project} />

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "font-mono font-bold uppercase tracking-[0.08em]",
              statusStyles[project.lifecycleStatus],
            )}
            variant="outline"
          >
            {lifecycleLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {categoryLabel || applicabilityLabel}
          </span>
        </div>
        <h3 className="mt-2 truncate text-lg font-semibold tracking-[-0.02em]">
          <Link
            className="ui-focus transition-colors group-hover:text-link"
            href={href}
          >
            {project.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {projectSummary(project)}
        </p>
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {author} · {project.countries.join(" · ")}
        </p>
      </div>

      <div className="col-span-2 flex items-center justify-between gap-4 border-t pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {project.votesCount} {voteLabel}
        </span>
        <Link
          aria-label={`${openLabel} ${project.name}`}
          className="ui-focus text-sm font-semibold text-link"
          href={href}
        >
          {openLabel} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function ProjectPreview({
  compact = false,
  href,
  project,
}: {
  compact?: boolean;
  href: string;
  project: Project;
}) {
  return (
    <Link
      aria-label={project.name}
      className={cn(
        "relative block overflow-hidden bg-muted",
        compact
          ? "aspect-square rounded-lg sm:aspect-[5/3]"
          : "aspect-[16/10] rounded-t-xl",
      )}
      href={href}
    >
      {project.imageUrl ? (
        <Image
          alt={`${project.name} project preview`}
          className="object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-[1.02] motion-reduce:transition-none"
          fill
          sizes={
            compact
              ? "(max-width: 640px) 104px, 160px"
              : "(max-width: 768px) 100vw, 33vw"
          }
          src={project.imageUrl}
        />
      ) : (
        <div className="bg-grid absolute inset-0 flex items-center justify-center bg-surface-subtle">
          <span className="font-mono text-4xl font-black tracking-[-0.08em] text-foreground/15 sm:text-5xl">
            {projectInitials(project.name)}
          </span>
        </div>
      )}
    </Link>
  );
}

function projectInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function projectSummary(project: Project) {
  const summary = project.descriptionMarkdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return summary || project.name;
}
