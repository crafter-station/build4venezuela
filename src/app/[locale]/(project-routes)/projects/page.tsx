import { getTranslations } from "next-intl/server";
import { listProjects } from "@/lib/projects/store";
import { ProjectShell } from "../project-shell";
import { RealtimeProjectsGrid } from "./realtime-projects-grid";
import { SubmitProjectCta } from "./submit-project-cta";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Projects" });
  const projects = await listProjects();

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

          <RealtimeProjectsGrid initialProjects={projects} />
        </div>
      </section>
    </ProjectShell>
  );
}
