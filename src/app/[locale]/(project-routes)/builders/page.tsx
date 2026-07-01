import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import {
  getBuilderByUserId,
  listBuilderContactRequests,
  listPublicBuilders,
} from "@/lib/builders/store";
import { ProjectShell } from "../project-shell";
import { BuildersDirectory } from "./builders-directory";

type Props = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export default async function BuildersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Builders" });
  const { userId } = await auth();
  const [builders, builderProfile, contactRequests] = await Promise.all([
    listPublicBuilders(userId),
    userId ? getBuilderByUserId(userId) : Promise.resolve(null),
    userId ? listBuilderContactRequests(userId) : Promise.resolve([]),
  ]);
  const unansweredRequestCount = contactRequests.filter(
    (request) =>
      request.direction === "inbound" && request.status === "pending",
  ).length;

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
            <div className="grid gap-4">
              <p className="font-mono text-sm uppercase leading-7 tracking-[0.08em] text-muted-foreground">
                {t("description")}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="inline-flex h-10 items-center border border-border px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] transition hover:border-foreground hover:bg-foreground hover:text-background"
                  href={`/${locale}/builder/register`}
                >
                  {builderProfile ? t("profile") : t("register")}
                </a>
                <a
                  className="inline-flex h-10 items-center gap-2 border border-border px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] transition hover:border-foreground hover:bg-foreground hover:text-background"
                  href={`/${locale}/builder/requests`}
                >
                  {t("inbox")}
                  {unansweredRequestCount > 0 ? (
                    <>
                      <span className="sr-only">
                        {t("unansweredRequests", {
                          count: unansweredRequestCount,
                        })}
                      </span>
                      <span
                        aria-hidden="true"
                        className="inline-flex min-w-5 items-center justify-center border border-current px-1.5 py-0.5 font-mono text-[0.65rem] font-black leading-none"
                      >
                        {unansweredRequestCount}
                      </span>
                    </>
                  ) : null}
                </a>
              </div>
            </div>
          </div>

          <BuildersDirectory
            initialBuilders={builders}
            initialSignedIn={Boolean(userId)}
          />
        </div>
      </section>
    </ProjectShell>
  );
}
