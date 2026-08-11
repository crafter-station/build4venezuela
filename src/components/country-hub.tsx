import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProjectCard } from "@/components/project-card";
import {
  isProjectApplicableTo,
  type ProjectApplicability,
  type ProjectLifecycleStatus,
} from "@/lib/projects/schema";
import { getCachedProjects } from "@/lib/projects/store";

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
  const t = await getTranslations({ locale, namespace: "CountryHub" });
  const countryName = t(`countries.${country}.name`);
  const projectsT = await getTranslations({
    locale,
    namespace: "Projects.grid",
  });
  const projects = (await getCachedProjects()).filter((project) =>
    isProjectApplicableTo(project, country),
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-line border-b px-5 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-20 lg:px-10 lg:pt-40 lg:pb-24">
        <div
          aria-hidden="true"
          className="bg-grid absolute inset-0 opacity-[0.055]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] lg:items-end lg:gap-16">
          <div>
            <p className="ui-eyebrow text-accent">
              {t(`countries.${country}.eyebrow`)}
            </p>
            <h1 className="type-display mt-7 max-w-5xl text-balance font-mono">
              <span className="block">{t("heroTitle")}</span>
              <span className="block text-primary">{countryName}.</span>
            </h1>
          </div>
          <aside className="border-line border-t pt-6 lg:border-primary lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-8">
            <p className="ui-eyebrow text-primary">
              {`/${content.code.toLowerCase()} // ${countryName}`}
            </p>
            <p className="type-body-lg mt-6 max-w-[38rem] font-mono text-ink-muted lg:max-w-[32ch]">
              {t(`countries.${country}.description`)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="ui-focus inline-flex min-h-12 items-center justify-center border border-primary bg-primary px-6 font-mono text-xs font-black uppercase tracking-[0.16em] text-primary-foreground transition-colors duration-150 ease-[var(--ease-out)] hover:bg-transparent hover:text-primary"
                href={`/${locale}/submit?country=${country}`}
              >
                {t("addProject")}
              </Link>
              <Link
                className="ui-focus inline-flex min-h-12 items-center justify-center border border-line px-6 font-mono text-xs font-black uppercase tracking-[0.16em] transition-colors duration-150 ease-[var(--ease-out)] hover:border-foreground"
                href={`/${locale}/${content.otherRoute}`}
              >
                {t("goToCountry", {
                  country: t(`countries.${content.otherCountry}.name`),
                })}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-8 border-line border-b pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <p className="ui-eyebrow text-primary">{t("availableTools")}</p>
              <h2 className="type-section mt-4 max-w-6xl text-balance font-mono">
                {t("toolsTitle")}
              </h2>
            </div>
            <div className="flex min-w-32 items-end justify-between gap-4 border-line border-t pt-4 sm:block sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <p className="font-mono text-4xl font-black leading-none text-foreground">
                {String(projects.length).padStart(2, "0")}
              </p>
              <p className="ui-eyebrow mt-2 text-ink-muted">
                {projects.length === 1
                  ? projectsT("project")
                  : projectsT("projects")}
              </p>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="grid gap-px bg-line md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <ProjectCard
                  applicabilityLabel={projectsT(
                    `applicabilities.${project.applicability as ProjectApplicability}`,
                  )}
                  href={`/${locale}/p/${project.slug}`}
                  index={index + 1}
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
            <div className="border border-border p-8 font-mono uppercase tracking-[0.12em] text-muted-foreground">
              {t("empty", { country: countryName })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
