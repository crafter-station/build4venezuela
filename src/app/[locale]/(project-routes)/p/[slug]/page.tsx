import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthorBadge } from "@/components/author-badge";
import { ProjectMarkdown } from "@/components/project-markdown";
import { ProjectVideoEmbed } from "@/components/project-video-embed";
import { timed } from "@/lib/log";
import {
  canEditProject,
  getCachedProjectBySlug,
  hasVoted,
  listComments,
} from "@/lib/projects/store";
import { withTimeout } from "@/lib/timeout";
import { ProjectShell } from "../../project-shell";
import { CommentsSection } from "./comments-section";
import { VoteButton } from "./vote-button";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Bound each per-request data load so a stalled pool fails fast instead of
// hanging the render to Vercel's 300s wall. See projects/page.tsx.
const RENDER_TIMEOUT_MS = 8_000;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "ProjectDetail" });
  const project = await withTimeout(
    getCachedProjectBySlug(slug),
    RENDER_TIMEOUT_MS,
    "project.metadata.load",
  );

  if (!project) {
    return { title: t("metadata.notFoundTitle") };
  }

  return {
    title: `${project.name} | Build4Venezuela`,
    description: t("metadata.description", { name: project.participantName }),
  };
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "ProjectDetail" });
  const project = await timed("project.page.load", { slug }, () =>
    withTimeout(
      getCachedProjectBySlug(slug),
      RENDER_TIMEOUT_MS,
      "project.page.load",
    ),
  );

  if (!project) {
    notFound();
  }

  const { userId } = await auth();
  // Independent reads — run them together so a detail view holds a pool
  // connection for one round-trip instead of three serial ones.
  const [canEdit, voted, comments] = await timed(
    "project.page.detail",
    { slug },
    () =>
      withTimeout(
        Promise.all([
          canEditProject(project.id, userId),
          hasVoted(project.id, userId ?? undefined),
          listComments(project.id, userId ?? undefined),
        ]),
        RENDER_TIMEOUT_MS,
        "project.page.detail",
      ),
  );

  return (
    <ProjectShell>
      <article className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
              /p/{project.slug}
            </p>
            <h1 className="mt-5 font-mono text-[clamp(2.25rem,6vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">
              {project.name}
            </h1>
            <div className="mt-8 grid gap-px bg-border">
              <div className="bg-background p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t("builtBy")}
                </p>
                <AuthorBadge
                  className="mt-3"
                  imageClassName="size-12"
                  imageUrl={project.ownerImageUrl}
                  meta={project.participantName}
                  name={project.ownerName || project.participantName}
                  nameClassName="text-lg tracking-[0.08em]"
                />
              </div>
              <div className="bg-background p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t("countries")}
                </p>
                <p className="mt-2 font-mono text-lg uppercase tracking-[0.08em]">
                  {project.countries.join(" / ")}
                </p>
              </div>
              <div className="bg-background p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t("status")}
                </p>
                <p className="mt-2 font-mono text-lg uppercase tracking-[0.08em] text-accent">
                  {t(`statuses.${project.lifecycleStatus}`)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {project.projectUrl ? (
                <a
                  className="inline-flex h-12 items-center border border-primary bg-primary px-5 font-mono text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground transition hover:bg-primary/80"
                  href={project.projectUrl}
                  target="_blank"
                >
                  {t("openProject")}
                </a>
              ) : null}
              {project.videoUrl ? (
                <a
                  className="inline-flex h-12 items-center border border-border px-5 font-mono text-sm font-bold uppercase tracking-[0.18em] transition hover:border-foreground hover:bg-foreground hover:text-background"
                  href={project.videoUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("watchDemo")}
                </a>
              ) : null}
              {project.contributeInUrl ? (
                <a
                  className="inline-flex h-12 items-center border border-border px-5 font-mono text-sm font-bold uppercase tracking-[0.18em] transition hover:border-foreground hover:bg-foreground hover:text-background"
                  href={project.contributeInUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("contribute")}
                </a>
              ) : null}
              <VoteButton
                projectId={project.id}
                initialCount={project.votesCount}
                initialSignedIn={Boolean(userId)}
                initialVoted={voted}
              />
            </div>
            {canEdit ? (
              <a
                className="mt-4 inline-flex font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground underline underline-offset-4 transition hover:text-primary"
                href={`/${locale}/p/${project.slug}/edit`}
              >
                {t("edit")}
              </a>
            ) : null}
          </aside>

          <section className="border border-border bg-card p-5 sm:p-8">
            {project.videoUrl ? (
              <ProjectVideoEmbed
                className="mb-8 bg-background"
                title={project.name}
                videoUrl={project.videoUrl}
              />
            ) : null}
            <ProjectMarkdown markdown={project.descriptionMarkdown} />
          </section>
        </div>
        <CommentsSection
          initialComments={comments}
          initialSignedIn={Boolean(userId)}
          projectId={project.id}
        />
      </article>
    </ProjectShell>
  );
}
