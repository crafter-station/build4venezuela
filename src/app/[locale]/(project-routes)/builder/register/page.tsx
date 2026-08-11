import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBuilderByUserId } from "@/lib/builders/store";
import { ProjectShell } from "../../project-shell";
import { BuilderForm } from "./builder-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BuilderRegisterPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Builders.registerPage",
  });
  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const builder = await getBuilderByUserId(userId);
  const title = builder ? t("titleExisting") : t("titleNew");
  const description = builder ? t("descriptionExisting") : t("descriptionNew");

  return (
    <ProjectShell>
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.16em] text-accent">
              {t("eyebrow")}
            </p>
            <h1 className="type-page-title mt-5 font-mono font-black uppercase">
              {title}
            </h1>
            <p className="mt-6 max-w-md font-mono text-base uppercase leading-7 tracking-[0.08em] text-muted-foreground">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className={buttonVariants({ variant: "outline" })}
                href={`/${locale}/builders`}
              >
                {t("viewBuilders")}
              </a>
              <a
                className={buttonVariants({ variant: "outline" })}
                href={`/${locale}/builder/requests`}
              >
                {t("requestInbox")}
              </a>
            </div>
          </div>
          <Card>
            <CardContent>
              <BuilderForm initialBuilder={builder} locale={locale} />
            </CardContent>
          </Card>
        </div>
      </section>
    </ProjectShell>
  );
}
