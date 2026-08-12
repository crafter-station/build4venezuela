import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProjectCard } from "@/components/project-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  isProjectApplicableTo,
  type ProjectApplicability,
  type ProjectLifecycleStatus,
} from "@/lib/projects/schema";
import { getCachedProjects } from "@/lib/projects/store";
import { cn } from "@/lib/utils";

type Country = "venezuela" | "colombia";

const countryContent = {
  venezuela: {
    code: "VE",
    otherCountry: "colombia",
    otherRoute: "co",
  },
  colombia: {
    code: "CO",
    otherCountry: "venezuela",
    otherRoute: "ve",
  },
} as const;

export async function CountryHub({
  country,
  locale,
}: {
  country: Country;
  locale: string;
}) {
  const content = countryContent[country];
  const [t, projectsT, allProjects] = await Promise.all([
    getTranslations({ locale, namespace: "CountryHub" }),
    getTranslations({ locale, namespace: "Projects.grid" }),
    getCachedProjects(),
  ]);
  const countryName = t(`countries.${country}.name`);
  const projects = allProjects.filter((project) =>
    isProjectApplicableTo(project, country),
  );
  const readyCount = projects.filter(
    (project) => project.lifecycleStatus === "ready_to_use",
  ).length;
  const buildingCount = projects.filter(
    (project) => project.lifecycleStatus === "in_development",
  ).length;
  const regionalCount = projects.filter(
    (project) => project.applicability === "latam",
  ).length;
  const stats = [
    {
      value: projects.length,
      label:
        projects.length === 1 ? projectsT("project") : projectsT("projects"),
    },
    { value: readyCount, label: projectsT("statuses.ready_to_use") },
    { value: buildingCount, label: projectsT("statuses.in_development") },
    { value: regionalCount, label: projectsT("applicabilities.latam") },
  ];

  return (
    <main className="min-h-screen bg-background pt-16 text-foreground">
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid absolute inset-0 opacity-[0.025]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)] lg:items-center lg:gap-20 lg:px-10 lg:py-24">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-link">
              {content.code} · {t(`countries.${country}.eyebrow`)}
            </p>
            <h1 className="type-page-title mt-5 max-w-4xl text-balance">
              {t("heroTitle")}{" "}
              <span className="text-brand-yellow">{countryName}.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              {t(`countries.${country}.description`)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className={buttonVariants({ size: "lg" })}
                href={`/${locale}/submit?country=${country}`}
              >
                {t("addProject")}
              </Link>
              <Link
                className={buttonVariants({ size: "lg", variant: "outline" })}
                href={`/${locale}/${content.otherRoute}`}
              >
                {t("goToCountry", {
                  country: t(`countries.${content.otherCountry}.name`),
                })}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <Card className="shadow-sm" key={stat.label}>
                <CardContent>
                  <p className="font-mono text-3xl font-semibold tracking-[-0.05em] tabular-nums sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {t("availableTools")}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {t("projectsTitle", { country: countryName })}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                {t("toolsTitle")}
              </p>
            </div>
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
              href={`/${locale}/projects`}
            >
              {t("viewAllProjects")} <span aria-hidden="true">→</span>
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <ProjectCard
                  applicabilityLabel={projectsT(
                    `applicabilities.${project.applicability as ProjectApplicability}`,
                  )}
                  disabledLabel={projectsT("disabled")}
                  href={`/${locale}/p/${project.slug}`}
                  key={project.id}
                  lifecycleLabel={projectsT(
                    `statuses.${project.lifecycleStatus as ProjectLifecycleStatus}`,
                  )}
                  openLabel={projectsT("open")}
                  project={project}
                  voteLabel={
                    project.votesCount === 1
                      ? projectsT("vote")
                      : projectsT("votes")
                  }
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-muted-foreground">
                {t("empty", { country: countryName })}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
