import Link from "next/link";
import type { Project } from "@/lib/projects/schema";
import { cn } from "@/lib/utils";
import { AuthorBadge } from "./author-badge";

type ProjectCardProps = {
  project: Project;
  href: string;
  index: number;
  applicabilityLabel: string;
  lifecycleLabel: string;
  openLabel: string;
  voteLabel: string;
  className?: string;
};

export function ProjectCard({
  project,
  href,
  index,
  applicabilityLabel,
  lifecycleLabel,
  openLabel,
  voteLabel,
  className,
}: ProjectCardProps) {
  const author = project.ownerName || project.participantName;
  const authorMeta =
    project.ownerName && project.ownerName !== project.participantName
      ? project.participantName
      : undefined;

  return (
    <article className={cn("bg-background", className)}>
      <Link
        aria-label={`${openLabel} ${project.name}`}
        className="project-card ui-focus group flex h-full min-h-[23rem] flex-col p-6 sm:p-7"
        href={href}
      >
        <div className="flex items-start justify-between gap-5">
          <span className="border border-primary px-2 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-primary">
            {applicabilityLabel}
          </span>
          <span className="ui-eyebrow text-ink-muted">
            {String(index).padStart(3, "0")}
          </span>
        </div>

        <div className="mt-8 flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-4">
            <p className="ui-eyebrow flex items-center gap-2 text-accent">
              <span aria-hidden="true" className="size-1.5 bg-current" />
              {lifecycleLabel}
            </p>
            <p className="ui-eyebrow shrink-0 text-primary tabular-nums">
              {project.votesCount} {voteLabel}
            </p>
          </div>

          <h3 className="project-card__title type-title mt-6 text-balance font-mono">
            {project.name}
          </h3>

          <AuthorBadge
            className="mt-6"
            imageClassName="size-8"
            imageUrl={project.ownerImageUrl}
            meta={authorMeta}
            metaClassName="text-[0.65rem]"
            name={author}
            nameClassName="text-xs"
          />
        </div>

        <div className="mt-8 flex items-end justify-between gap-5 border-line border-t pt-5">
          <p className="max-w-[75%] font-mono text-xs uppercase leading-5 tracking-[0.14em] text-ink-muted">
            {project.countries.join(" / ")}
          </p>
          <span className="project-card__action ui-eyebrow flex shrink-0 items-center gap-2 text-primary">
            {openLabel}
            <span aria-hidden="true" className="project-card__arrow">
              →
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}
