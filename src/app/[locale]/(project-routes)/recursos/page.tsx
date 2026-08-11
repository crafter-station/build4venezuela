import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProjectShell } from "../project-shell";

type Resource = {
  key: "deck" | "projects" | "excel" | "brand" | "github" | "discord";
  title: string;
  description: string;
  href: string;
  kind: string;
  external: boolean;
};

const resourceLinks = [
  {
    key: "deck",
    href: "https://docs.google.com/presentation/d/17mFtyMMBRuQ3zvZFtnFBD4Ig3JMfqJNgicabChnBVkU/edit?usp=drivesdk",
    external: true,
  },
  {
    key: "projects",
    href: "https://docs.google.com/spreadsheets/d/1izXHF-aZOOu7VvfmbpH8TmVCFbjqwm2eqnpJN2ODrCo/htmlview?gid=608803999&pru=AAABnyqRshg*Od-l2t9POoYbazcuvEwnxw#gid=608803999",
    external: true,
  },
  {
    key: "excel",
    href: "https://docs.google.com/spreadsheets/d/1izXHF-aZOOu7VvfmbpH8TmVCFbjqwm2eqnpJN2ODrCo/edit?usp=sharing",
    external: true,
  },
  {
    key: "brand",
    href: "/brand",
    external: false,
  },
  {
    key: "github",
    href: "https://github.com/crafter-station/build4venezuela",
    external: true,
  },
  {
    key: "discord",
    href: "https://build4venezuela.com/discord",
    external: true,
  },
] as const;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RecursosPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Resources" });
  const resources: Resource[] = resourceLinks.map((resource) => ({
    ...resource,
    href: resource.external ? resource.href : `/${locale}${resource.href}`,
    title: t(`items.${resource.key}.title`),
    description: t(`items.${resource.key}.description`),
    kind: t(`items.${resource.key}.kind`),
  }));

  return (
    <ProjectShell>
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 border-border border-b pb-8">
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
              {t("eyebrow")}
            </p>
            <h1 className="type-page-title mt-4 font-mono font-black uppercase">
              {t("title")}
            </h1>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Card className="min-w-0" key={resource.href}>
                <CardHeader className="flex-1 gap-5">
                  <Badge
                    className="font-mono uppercase tracking-[0.18em]"
                    variant="outline"
                  >
                    {resource.kind}
                  </Badge>
                  <CardTitle className="font-mono text-2xl font-black uppercase leading-none tracking-[-0.04em] [overflow-wrap:anywhere]">
                    {resource.title}
                  </CardTitle>
                  <CardDescription className="font-mono text-sm uppercase leading-6 tracking-[0.14em]">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <a
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                      "font-mono uppercase tracking-[0.18em]",
                    )}
                    href={resource.href}
                    rel={resource.external ? "noopener noreferrer" : undefined}
                    target={resource.external ? "_blank" : undefined}
                  >
                    {t("open")} &rarr;
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </ProjectShell>
  );
}
