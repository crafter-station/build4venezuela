import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listSolutionRequests } from "@/lib/requests/store";
import { ProjectShell } from "../project-shell";
import { RequestsBoard } from "./requests-board";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Requests.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RequestsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Requests" });
  const { userId } = await auth();
  const requests = await listSolutionRequests(userId ?? undefined);

  return (
    <ProjectShell>
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-6 border-border border-b pb-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
                {t("eyebrow")}
              </p>
              <h1 className="mt-4 font-mono text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[0.85] tracking-[-0.07em]">
                {t("title")}
              </h1>
            </div>
            <p className="font-mono text-sm uppercase leading-7 tracking-[0.16em] text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <RequestsBoard
            initialRequests={requests}
            initialSignedIn={Boolean(userId)}
          />
        </div>
      </section>
    </ProjectShell>
  );
}
