import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { projectToFormValues } from "@/lib/projects/schema";
import { canEditProject, getProjectBySlug } from "@/lib/projects/store";
import { ProjectShell } from "../../../project-shell";
import { ProjectForm } from "../../../submit/project-form";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function EditProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "EditProject" });
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { userId } = await auth();

  if (!(await canEditProject(project.id, userId))) {
    notFound();
  }

  return (
    <ProjectShell>
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-primary">
              {t("eyebrow")}
            </p>
            <h1 className="mt-5 font-mono text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[0.85] tracking-[-0.07em]">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-md font-mono text-base uppercase leading-7 tracking-[0.12em] text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <div className="border border-border bg-card p-5 sm:p-7">
            <ProjectForm
              initialState={{
                values: projectToFormValues(project),
                errors: {},
              }}
              projectId={project.id}
              submitLabel={t("submitLabel")}
            />
          </div>
        </div>
      </section>
    </ProjectShell>
  );
}
