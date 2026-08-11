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
import { projectApplicabilityFromCountryParam } from "@/lib/projects/schema";
import { getCachedProjects } from "@/lib/projects/store";
import { withTimeout } from "@/lib/timeout";
import { ProjectShell } from "../project-shell";
import { ProjectsGrid } from "./projects-grid";
import { SubmitProjectCta } from "./submit-project-cta";

// Votes and clusters change between requests, so render from Neon per request.
export const dynamic = "force-dynamic";

// Hard bound on the per-request data load. If the DB pool stalls, fail fast
// (~8s) so the serverless invocation returns instead of pinning a connection to
// Vercel's 300s wall — which is what cascades into pool exhaustion and 504s.
const RENDER_TIMEOUT_MS = 8_000;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string | string[] }>;
};

export default async function ProjectsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const country = projectApplicabilityFromCountryParam(
    (await searchParams).country,
  );
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
      <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-link">
                {t("eyebrow")}
              </p>
              <h1 className="type-page-title mt-3">{t("title")}</h1>
            </div>
            <SubmitProjectCta />
          </div>

          <ProjectsGrid
            assignments={assignments}
            clusters={clusters}
            initialCountry={country}
            initialProjects={projects}
          />
        </div>
      </section>
    </ProjectShell>
  );
}
