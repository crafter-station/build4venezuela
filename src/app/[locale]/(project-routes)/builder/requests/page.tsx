import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { listBuilderContactRequests } from "@/lib/builders/store";
import { cn } from "@/lib/utils";
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
              <h1 className="type-page-title mt-4 font-mono font-black uppercase">
                {t("title")}
              </h1>
            </div>
            <div>
              <p className="font-mono text-sm uppercase leading-7 tracking-[0.08em] text-muted-foreground">
                {t("description")}
              </p>
              <a
                className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
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
