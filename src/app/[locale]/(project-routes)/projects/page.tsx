import { getTranslations } from "next-intl/server";
import { timed } from "@/lib/log";
import {
  graduatedProposalIds,
  resolveClusters,
  resolveProjectCluster,
} from "@/lib/projects/categories";
import {
  getCategoryContext,
  getProjectCategoryMap,
} from "@/lib/projects/category-store";
import { localizeClusters } from "@/lib/projects/localize-clusters";
import { getCachedProjects } from "@/lib/projects/store";
import { withTimeout } from "@/lib/timeout";
import { ProjectShell } from "../project-shell";
import { RealtimeProjectsGrid } from "./realtime-projects-grid";
import { SubmitProjectCta } from "./submit-project-cta";

// Live data (votes/clusters update in realtime) read via a persistent Drizzle
// connection — render per request instead of prerendering at build.
export const dynamic = "force-dynamic";

// Hard bound on the per-request data load. If the DB pool stalls, fail fast
// (~8s) so the serverless invocation returns instead of pinning a connection to
// Vercel's 300s wall — which is what cascades into pool exhaustion and 504s.
const RENDER_TIMEOUT_MS = 8_000;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Projects" });
  const tCategories = await getTranslations({
    locale,
    namespace: "Projects.categories",
  });
  const [projects, categoryMap, context] = await timed(
    "projects.page.load",
    {},
    () =>
      withTimeout(
        Promise.all([
          getCachedProjects(),
          getProjectCategoryMap(),
          getCategoryContext(),
        ]),
        RENDER_TIMEOUT_MS,
        "projects.page.load",
      ),
  );

  const graduated = graduatedProposalIds(context.proposals, context.counts);
  const clusters = localizeClusters(
    resolveClusters(context.proposals, context.counts),
    tCategories,
  );
  const assignments: Record<string, string> = {};
  for (const project of projects) {
    assignments[project.slug] = resolveProjectCluster(
      project,
      categoryMap.get(project.id),
      graduated,
    );
  }

  return (
    <ProjectShell>
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col justify-between gap-6 border-border border-b pb-8 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
                {t("eyebrow")}
              </p>
              <h1 className="mt-4 font-mono text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[0.85] tracking-[-0.07em]">
                {t("title")}
              </h1>
            </div>
            <SubmitProjectCta />
          </div>

          <RealtimeProjectsGrid
            assignments={assignments}
            clusters={clusters}
            initialProjects={projects}
          />
        </div>
      </section>
    </ProjectShell>
  );
}
