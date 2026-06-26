import { createHash } from "node:crypto";
import { headers } from "next/headers";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RealtimeVisitors } from "./realtime-visitors";

const assetPath = "/BFV/assets/";

type Props = {
  params: Promise<{ locale: string }>;
};

type Channel = {
  label: string;
  href: string;
  text: string;
};

type ImpactStat = {
  value: string;
  label: string;
};

function VMark({ className }: { className: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      height={46}
      src={`${assetPath}v-mark.svg`}
      width={45}
    />
  );
}

async function getVisitorId() {
  const headersList = await headers();
  const fingerprint = [
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim(),
    headersList.get("x-real-ip"),
    headersList.get("cf-connecting-ip"),
    headersList.get("user-agent"),
    headersList.get("accept-language"),
  ]
    .filter(Boolean)
    .join("|");

  return createHash("sha256").update(fingerprint).digest("hex").slice(0, 24);
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const visitorId = await getVisitorId();
  const t = await getTranslations("HomePage");
  const projectIdeas = t.raw("projectIdeas") as string[];
  const channels = t.raw("channels") as Channel[];
  const impactStats = t.raw("impactStats") as ImpactStat[];
  const latestInfoHref = `https://www.perplexity.ai/?${new URLSearchParams({
    q: t("context.latestInfoQuery"),
  })}`;

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <RealtimeVisitors visitorId={visitorId} />

      <section className="relative isolate flex min-h-screen items-center justify-center px-4 pt-20 pb-4 sm:px-8 lg:px-10">
        <div className="absolute inset-0 -z-20 bg-background" />
        <div className="bg-grid absolute inset-0 -z-10 opacity-[0.06]" />

        <VMark className="absolute top-5 left-4 h-8 w-8 opacity-70 sm:top-8 sm:left-8 sm:h-10 sm:w-10 lg:left-14" />
        <VMark className="absolute top-5 right-4 h-8 w-8 opacity-70 sm:top-8 sm:right-8 sm:h-10 sm:w-10 lg:right-14" />
        <VMark className="absolute bottom-5 left-4 h-8 w-8 opacity-70 sm:bottom-8 sm:left-8 sm:h-10 sm:w-10 lg:left-14" />
        <VMark className="absolute right-4 bottom-5 h-8 w-8 opacity-70 sm:right-8 sm:bottom-8 sm:h-10 sm:w-10 lg:right-14" />

        <article className="poster-frame relative flex min-h-[calc(100svh-2rem)] w-full max-w-[1120px] flex-col items-center justify-center gap-[clamp(1.75rem,4svh,3.5rem)] py-10 sm:min-h-[calc(100svh-2rem)] sm:py-12 lg:gap-[clamp(1.6rem,3svh,3rem)] lg:py-10">
          <header className="flex w-full flex-col items-center">
            <Image
              alt={t("hero.logoAlt")}
              className="w-[min(82vw,520px)] select-none sm:w-[min(70vw,600px)] lg:w-[min(58vw,620px)]"
              draggable="false"
              height={285}
              src={`${assetPath}B4V.svg`}
              priority
              width={731}
            />
          </header>

          <div className="poster-map relative flex w-full items-center justify-center">
            <Image
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[34vw] max-w-[390px] -translate-x-[112%] -translate-y-1/2 select-none opacity-95 md:block xl:w-[32vw]"
              draggable="false"
              height={322}
              src={`${assetPath}left-hand@2x.png`}
              width={940}
            />
            <Image
              alt={t("hero.mapAlt")}
              className="map-glow relative z-10 w-[min(34vw,180px)] min-w-28 select-none sm:w-[min(26vw,210px)] lg:w-[min(16vw,190px)]"
              draggable="false"
              height={309}
              src={`${assetPath}venezuelan_map.svg`}
              width={321}
            />
            <Image
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[34vw] max-w-[390px] -translate-y-1/2 translate-x-[13%] select-none opacity-95 md:block xl:w-[32vw]"
              draggable="false"
              height={322}
              src={`${assetPath}right-hand@2x.png`}
              width={940}
            />
          </div>

          <div className="w-full text-center font-mono uppercase">
            <p className="mx-auto max-w-[920px] text-balance text-[clamp(1.1rem,2.3vw,2rem)] font-light leading-[1.15] tracking-[0.14em] text-foreground">
              {t("hero.eyebrow")}
            </p>
            <p className="mx-auto mt-3 max-w-[920px] text-balance text-[clamp(1.2rem,2.35vw,2.1rem)] font-black leading-[1.2] tracking-[0.04em] text-foreground">
              {t("hero.title")}
            </p>
          </div>

          <div className="w-full max-w-[860px] text-center font-mono uppercase">
            <a
              className="inline-block text-[clamp(0.95rem,1.75vw,1.45rem)] font-light leading-snug tracking-[0.24em] text-foreground transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              href="https://build4venezuela.com/luma"
            >
              {t("hero.eventLink")}
            </a>
            <div className="mt-4 flex justify-center gap-4 text-xs font-light tracking-[0.24em] text-foreground/65 sm:gap-6 sm:text-sm">
              <a
                className="transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                href="https://build4venezuela.com/whatsapp"
              >
                {t("hero.whatsapp")}
              </a>
              <span aria-hidden="true">{"//"}</span>
              <a
                className="transition hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                href="https://build4venezuela.com/discord"
              >
                {t("hero.discord")}
              </a>
            </div>
            <div className="mt-8 h-px w-full bg-border sm:mt-10" />
            <p className="mx-auto mt-6 max-w-[760px] text-balance text-center text-[clamp(1rem,1.8vw,1.5rem)] font-light leading-[1.35] tracking-[0.12em] text-foreground sm:mt-7">
              {t("hero.description")}
            </p>
            <div className="mt-8 h-px w-full bg-border sm:mt-10" />
          </div>
        </article>
      </section>

      <section className="border-border border-t px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
              {t("context.eyebrow")}
            </p>
            <h2 className="mt-5 text-balance font-mono text-[clamp(2.25rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-[-0.04em]">
              {t("context.title")}
            </h2>
          </div>

          <div className="flex flex-col gap-7 font-mono text-[clamp(1.05rem,1.8vw,1.45rem)] font-light leading-relaxed tracking-[0.06em] text-foreground/78">
            <p>{t("context.firstParagraph")}</p>
            <p>{t("context.secondParagraph")}</p>
            <a
              className="inline-flex border border-accent/60 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-accent transition hover:border-foreground hover:bg-foreground hover:text-background"
              href={latestInfoHref}
              rel="noreferrer"
              target="_blank"
            >
              {t("context.latestInfo")}
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {impactStats.map((stat) => (
            <article className="bg-background p-6 sm:p-7" key={stat.label}>
              <p className="font-mono text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-none tracking-[-0.06em] text-foreground">
                {stat.value}
              </p>
              <p className="mt-4 font-mono text-xs uppercase leading-5 tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col justify-between gap-5 border-border border-b pb-8 sm:mb-12 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-primary">
                {t("projects.eyebrow")}
              </p>
              <h2 className="mt-4 font-mono text-[clamp(2rem,4vw,3.75rem)] font-black uppercase leading-none tracking-[-0.04em]">
                {t("projects.title")}
              </h2>
            </div>
            <p className="max-w-md font-mono text-sm uppercase leading-6 tracking-[0.16em] text-muted-foreground">
              {t("projects.description")}
            </p>
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {projectIdeas.map((idea, index) => (
              <article className="bg-background p-6 sm:p-7" key={idea}>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground/70">
                  0{index + 1}
                </p>
                <p className="mt-6 font-mono text-xl font-light leading-snug tracking-[0.04em] text-foreground sm:text-2xl">
                  {idea}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border border-y bg-foreground px-5 py-16 text-background sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-start">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-background/45">
                {t("join.eyebrow")}
              </p>
              <h2 className="mt-4 font-mono text-[clamp(2.3rem,5vw,5.5rem)] font-black uppercase leading-[0.88] tracking-[-0.06em]">
                {t("join.title")}
              </h2>
            </div>

            <div className="grid gap-3">
              {channels.map((channel) => (
                <a
                  className="group grid gap-3 border border-background/15 p-5 font-mono transition hover:border-background hover:bg-background hover:text-foreground sm:grid-cols-[10rem_1fr] sm:items-center sm:p-6"
                  href={channel.href}
                  key={channel.label}
                >
                  <span className="text-xl font-black uppercase tracking-[0.08em]">
                    {channel.label}
                  </span>
                  <span className="text-base leading-7 tracking-[0.05em] text-background/65 transition group-hover:text-foreground/75">
                    {channel.text}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
