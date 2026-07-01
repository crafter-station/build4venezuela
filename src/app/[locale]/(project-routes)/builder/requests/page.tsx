import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listBuilderContactRequests } from "@/lib/builders/store";
import { ProjectShell } from "../../project-shell";
import { BuilderRequestsInbox } from "./requests-inbox";

type Props = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export default async function BuilderRequestsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Builders.requests" });
  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const requests = await listBuilderContactRequests(userId);

  return (
    <ProjectShell>
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-6 border-border border-b pb-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.16em] text-accent">
                {t("eyebrow")}
              </p>
              <h1 className="mt-4 font-mono text-5xl font-black uppercase leading-none sm:text-7xl lg:text-8xl">
                {t("title")}
              </h1>
            </div>
            <div>
              <p className="font-mono text-sm uppercase leading-7 tracking-[0.08em] text-muted-foreground">
                {t("description")}
              </p>
              <a
                className="mt-6 inline-flex h-10 items-center border border-border px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] transition hover:border-foreground hover:bg-foreground hover:text-background"
                href={`/${locale}/builders`}
              >
                {t("viewBuilders")}
              </a>
            </div>
          </div>

          <BuilderRequestsInbox initialRequests={requests} />
        </div>
      </section>
    </ProjectShell>
  );
}
