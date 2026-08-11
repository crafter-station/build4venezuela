import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const officialBulletinHref =
  "https://www2.sgc.gov.co/Noticias/Paginas/SGC-actualiza-la-informacion-sobre-el-sismo-ocurrido-en-San-Jose-del-Palmar-Choco.aspx";

const copy = {
  en: {
    alert: "Colombia earthquake · August 10, 2026",
    title: "Build for Colombia",
    lead: "Technology in solidarity after the earthquake in Chocó.",
    description:
      "We are opening the network to tools that help people find verified information, coordinate aid, and support recovery without getting in the way of official responders.",
    projects: "View projects for Colombia",
    latest: "Latest verified information",
    source: "Read the official SGC bulletin",
    factsEyebrow: "What is confirmed",
    factsTitle: "A major emergency, still developing.",
    factsBody:
      "The Colombian Geological Service reported a magnitude 7.4 earthquake near San José del Palmar, Chocó, at 7:34 a.m. local time. Its August 10 bulletin placed the event at 103 km depth and recorded 18 aftershocks by noon. Conditions and impact figures can change; use official sources before sharing.",
    magnitude: "magnitude",
    time: "local time",
    depth: "depth",
    aftershocks: "aftershocks by noon",
    buildEyebrow: "Build what helps",
    buildTitle: "Useful before impressive.",
    needs: [
      "Verified directories for shelters, hospitals, collection points, and emergency contacts.",
      "Low-bandwidth maps and forms for reporting needs without exposing vulnerable people.",
      "Tools for coordinating volunteers, transport, inventory, and last-mile delivery.",
      "Clear, accessible pages that translate official guidance and reduce misinformation.",
    ],
    note: "Follow the SGC and UNGRD for authoritative updates. Do not predict earthquakes or circulate unverified damage reports.",
  },
  es: {
    alert: "Terremoto en Colombia · 10 de agosto de 2026",
    title: "Construye por Colombia",
    lead: "Tecnología en solidaridad después del terremoto en Chocó.",
    description:
      "Abrimos la red a herramientas que ayuden a encontrar información verificada, coordinar ayuda y apoyar la recuperación sin interferir con los organismos oficiales.",
    projects: "Ver proyectos para Colombia",
    latest: "Información verificada más reciente",
    source: "Leer el boletín oficial del SGC",
    factsEyebrow: "Lo que está confirmado",
    factsTitle: "Una gran emergencia que sigue evolucionando.",
    factsBody:
      "El Servicio Geológico Colombiano reportó un sismo de magnitud 7,4 cerca de San José del Palmar, Chocó, a las 7:34 a. m. Su boletín del 10 de agosto ubicó el evento a 103 km de profundidad y registró 18 réplicas hasta el mediodía. Las condiciones y cifras de impacto pueden cambiar: verifica fuentes oficiales antes de compartir.",
    magnitude: "magnitud",
    time: "hora local",
    depth: "profundidad",
    aftershocks: "réplicas hasta el mediodía",
    buildEyebrow: "Construye lo que ayuda",
    buildTitle: "Útil antes que impresionante.",
    needs: [
      "Directorios verificados de refugios, hospitales, centros de acopio y contactos de emergencia.",
      "Mapas y formularios de bajo consumo para reportar necesidades sin exponer a personas vulnerables.",
      "Herramientas para coordinar voluntariado, transporte, inventario y entregas de última milla.",
      "Páginas claras y accesibles que traduzcan indicaciones oficiales y reduzcan la desinformación.",
    ],
    note: "Sigue al SGC y a la UNGRD para información oficial. No predigas sismos ni difundas reportes de daños sin verificar.",
  },
} as const;

export async function ColombiaLanding({ locale }: { locale: string }) {
  const text = locale === "es" ? copy.es : copy.en;
  const t = await getTranslations({ locale, namespace: "CountryHub" });
  const latestInfoHref = `https://www.perplexity.ai/?${new URLSearchParams({
    q:
      locale === "es"
        ? "información oficial más reciente terremoto Colombia 10 agosto 2026 SGC UNGRD"
        : "latest official information Colombia earthquake August 10 2026 SGC UNGRD",
  })}`;
  const facts = [
    { value: "7.4", label: text.magnitude },
    { value: "07:34", label: text.time },
    { value: "103 km", label: text.depth },
    { value: "18", label: text.aftershocks },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center px-5 py-20 sm:px-8 lg:px-10">
        <div className="bg-grid absolute inset-0 -z-20 opacity-[0.06]" />
        <div
          className="absolute inset-x-0 top-0 -z-10 flex h-2"
          aria-hidden="true"
        >
          <span className="flex-1 bg-brand-yellow" />
          <span className="flex-1 bg-brand-blue" />
          <span className="flex-1 bg-brand-red" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-20">
          <div>
            <Badge
              className="font-mono uppercase tracking-[0.18em]"
              variant="outline"
            >
              {text.alert}
            </Badge>
            <h1 className="mt-8 text-balance font-mono text-[clamp(3.8rem,10vw,8.5rem)] font-black uppercase leading-[0.78] tracking-[-0.075em]">
              Build4
              <span className="block text-brand-yellow">Colombia</span>
            </h1>
            <p className="mt-8 max-w-3xl text-balance font-mono text-[clamp(1.15rem,2.2vw,1.8rem)] font-light uppercase leading-tight tracking-[0.08em]">
              {text.lead}
            </p>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              {text.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className={buttonVariants({ size: "lg" })}
                href={`/${locale}/projects?country=colombia`}
              >
                {text.projects}
              </Link>
              <a
                className={buttonVariants({ size: "lg", variant: "outline" })}
                href={latestInfoHref}
                rel="noreferrer"
                target="_blank"
              >
                {text.latest}
              </a>
            </div>
          </div>

          <div
            className="relative mx-auto aspect-square w-full max-w-[30rem]"
            aria-hidden="true"
          >
            <div className="absolute inset-[4%] rounded-full border border-brand-yellow/25" />
            <div className="absolute inset-[16%] rounded-full border border-brand-yellow/40" />
            <div className="absolute inset-[29%] rounded-full border-2 border-brand-yellow/70" />
            <div className="absolute inset-[42%] grid place-items-center rounded-full bg-brand-yellow text-black shadow-[0_0_80px_color-mix(in_srgb,var(--brand-yellow)_35%,transparent)]">
              <span className="font-mono text-5xl font-black tracking-[-0.08em] sm:text-6xl">
                7.4
              </span>
            </div>
            <span className="absolute top-[4%] left-1/2 h-[38%] w-px -translate-x-1/2 bg-brand-yellow/50" />
            <span className="absolute top-1/2 left-[4%] h-px w-[38%] -translate-y-1/2 bg-brand-yellow/50" />
            <p className="absolute right-[2%] bottom-[9%] font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              San José del Palmar · Chocó
            </p>
          </div>
        </div>
      </section>

      <section className="border-y px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-brand-yellow">
                {text.factsEyebrow}
              </p>
              <h2 className="mt-5 text-balance font-mono text-[clamp(2.4rem,5vw,4.5rem)] font-black uppercase leading-[0.88] tracking-[-0.05em]">
                {text.factsTitle}
              </h2>
            </div>
            <div>
              <p className="font-mono text-lg font-light leading-8 tracking-[0.04em] text-foreground/80">
                {text.factsBody}
              </p>
              <a
                className={cn(buttonVariants({ variant: "outline" }), "mt-7")}
                href={officialBulletinHref}
                rel="noreferrer"
                target="_blank"
              >
                {text.source}
              </a>
            </div>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div className="bg-background p-6 sm:p-8" key={fact.label}>
                <p className="font-mono text-4xl font-black tracking-[-0.06em] text-brand-yellow sm:text-5xl">
                  {fact.value}
                </p>
                <p className="mt-3 font-mono text-xs uppercase leading-5 tracking-[0.16em] text-muted-foreground">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-brand-blue">
            {text.buildEyebrow}
          </p>
          <div className="mt-4 flex flex-col justify-between gap-6 border-b pb-9 md:flex-row md:items-end">
            <h2 className="max-w-3xl text-balance font-mono text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.85] tracking-[-0.06em]">
              {text.buildTitle}
            </h2>
            <Link
              className={buttonVariants({ size: "lg" })}
              href={`/${locale}/projects?country=colombia`}
            >
              {text.projects}
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {text.needs.map((need, index) => (
              <Card key={need}>
                <CardHeader className="gap-6">
                  <Badge variant="outline">0{index + 1}</Badge>
                  <CardTitle className="font-mono text-xl font-light uppercase leading-7 tracking-[0.07em]">
                    {need}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
          <Card className="mt-5 border-brand-red/40 bg-brand-red/5">
            <CardContent className="font-mono text-sm uppercase leading-6 tracking-[0.12em] text-foreground/75">
              {text.note}
            </CardContent>
          </Card>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Build4Latam · {t("countries.colombia.eyebrow")}
          </p>
        </div>
      </section>
    </main>
  );
}
