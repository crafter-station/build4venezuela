import { createHash } from "node:crypto";
import { headers } from "next/headers";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CSSProperties } from "react";
import { SponsorLink } from "@/components/sponsor-link";
import { Countdown } from "./countdown";
import { RealtimeVisitors } from "./realtime-visitors";

const assetPath = "/BFV/assets/";
const closureEventTargetIso = "2026-07-01T23:00:00.000Z";

const watchChannels = [
  { label: "Kick", href: "https://kick.com/build4venezuela", color: "#53fc18" },
  {
    label: "Twitch",
    href: "https://twitch.tv/build4venezuela",
    color: "#9146ff",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@build4venezuela",
    color: "#ff0033",
  },
] as const;

const socialChannels = [
  { label: "Instagram", href: "https://www.instagram.com/build4venezuela/" },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61591302428491",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/buildforvenezuela/",
  },
  { label: "TikTok", href: "https://www.tiktok.com/@build4venezuela" },
  { label: "YouTube", href: "https://www.youtube.com/@build4venezuela" },
  { label: "X", href: "https://x.com/Build4Venezuela" },
] as const;

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

type CountdownLabels = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  complete: string;
};

type Principle = {
  title: string;
  text: string;
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
  const countdownLabels = t.raw("hero.countdown.labels") as CountdownLabels;
  const heroStats = t.raw("hero.stats") as ImpactStat[];
  const showcaseTimes = t.raw("hero.showcase.times") as string[];
  const principles = t.raw("principles.items") as Principle[];
  const principleFilter = t.raw("principles.filter.items") as string[];
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
            <div className="mt-5 flex flex-wrap items-baseline justify-center gap-x-8 gap-y-2 sm:gap-x-12">
              {heroStats.map((stat) => (
                <p className="flex items-baseline gap-3" key={stat.label}>
                  <span className="text-[clamp(1.8rem,3.6vw,3rem)] font-black leading-none tracking-[-0.04em] text-primary">
                    {stat.value}
                  </span>
                  <span className="text-xs font-bold tracking-[0.26em] text-foreground/70 sm:text-sm">
                    {stat.label}
                  </span>
                </p>
              ))}
            </div>
          </div>

          <div className="w-full max-w-[860px] text-center font-mono uppercase">
            <div className="mx-auto max-w-[760px] border border-border bg-background/70 p-4 sm:p-5">
              <p className="text-[clamp(1.05rem,2vw,1.6rem)] font-black leading-[1.2] tracking-[0.1em] text-accent">
                {t("hero.showcase.title")}
              </p>
              <p className="mx-auto mt-3 max-w-[640px] text-balance text-[clamp(0.75rem,1.4vw,0.95rem)] font-light leading-relaxed tracking-[0.1em] text-foreground/80">
                {t("hero.showcase.description")}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[clamp(0.7rem,1.4vw,0.9rem)] font-bold tracking-[0.16em] text-foreground">
                {showcaseTimes.map((time, index) => (
                  <span className="flex items-center gap-4" key={time}>
                    {index > 0 && (
                      <span aria-hidden="true" className="text-foreground/35">
                        {"//"}
                      </span>
                    )}
                    {time}
                  </span>
                ))}
              </div>
              <div className="mt-5 border-border border-t pt-5" />
              <a
                className="inline-flex border border-primary/70 px-4 py-3 text-xs font-bold tracking-[0.2em] text-primary transition hover:border-foreground hover:bg-foreground hover:text-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                href="https://build4venezuela.com/luma"
              >
                {t("hero.closure.label")}
              </a>
              <p className="mt-4 text-[clamp(0.95rem,1.75vw,1.45rem)] font-light leading-snug tracking-[0.2em] text-foreground">
                {t("hero.closure.date")}
              </p>
              <div className="mt-5">
                <Countdown
                  labels={countdownLabels}
                  targetIso={closureEventTargetIso}
                />
              </div>
              <div className="mt-6 border-border border-t pt-5">
                <p className="text-[clamp(0.7rem,1.4vw,0.85rem)] font-bold leading-snug tracking-[0.2em] text-foreground/70">
                  {t("hero.watch.label")}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {watchChannels.map((channel) => (
                    <a
                      className="group inline-flex items-center gap-2 border px-4 py-2.5 text-xs font-bold tracking-[0.18em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                      href={channel.href}
                      key={channel.label}
                      rel="noreferrer"
                      style={
                        {
                          borderColor: channel.color,
                          color: channel.color,
                          "--tw-ring-color": channel.color,
                        } as CSSProperties
                      }
                      target="_blank"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full transition group-hover:scale-125"
                        style={{ backgroundColor: channel.color }}
                      />
                      {channel.label}
                    </a>
                  ))}
                </div>
              </div>
              <div className="mt-6 border-border border-t pt-5">
                <p className="text-[clamp(0.7rem,1.4vw,0.85rem)] font-bold leading-snug tracking-[0.2em] text-foreground/70">
                  {t("hero.showcase.share")}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-light tracking-[0.2em] text-foreground/65">
                  {socialChannels.map((channel, index) => (
                    <span
                      className="flex items-center gap-4"
                      key={channel.label}
                    >
                      {index > 0 && (
                        <span aria-hidden="true" className="text-foreground/30">
                          {"//"}
                        </span>
                      )}
                      <a
                        className="transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                        href={channel.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {channel.label}
                      </a>
                    </span>
                  ))}
                </div>
              </div>
            </div>
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
            <div className="mt-6 flex flex-col items-center gap-3 sm:mt-7">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                {t("hero.poweredBy")}
              </p>
              <div className="grid grid-cols-2 place-items-center justify-center gap-x-8 sm:gap-x-10">
                <SponsorLink
                  href="https://www.zavu.dev/"
                  placement="homepage-powered-by"
                  rel="noreferrer"
                  sponsor="Zavu"
                  target="_blank"
                  className="grid justify-items-center gap-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background hover:opacity-100"
                >
                  <span className="flex h-24 items-center justify-center sm:h-28">
                    <Image
                      alt="Zavu"
                      className="h-20 w-auto select-none opacity-90 transition hover:opacity-100 sm:h-24"
                      draggable="false"
                      height={1024}
                      src={`${assetPath}zavu.svg`}
                      width={1024}
                    />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.28em] text-foreground/70">
                    Zavu
                  </span>
                </SponsorLink>
                <SponsorLink
                  href="https://www.useinvent.com/"
                  placement="homepage-powered-by"
                  rel="noreferrer"
                  sponsor="Invent"
                  target="_blank"
                  className="grid justify-items-center gap-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background hover:opacity-100"
                >
                  <span className="flex h-24 items-center justify-center sm:h-28">
                    <Image
                      alt="Invent"
                      className="h-14 w-auto select-none opacity-90 transition hover:opacity-100 sm:h-16"
                      draggable="false"
                      height={80}
                      src={`${assetPath}invent.svg`}
                      width={80}
                    />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.28em] text-foreground/70">
                    Invent
                  </span>
                </SponsorLink>
              </div>
            </div>
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

      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-6 border-border border-b pb-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-destructive">
                {t("principles.eyebrow")}
              </p>
              <h2 className="mt-4 font-mono text-[clamp(2.2rem,5vw,5rem)] font-black uppercase leading-[0.88] tracking-[-0.06em]">
                {t("principles.title")}
              </h2>
            </div>
            <p className="font-mono text-sm uppercase leading-6 tracking-[0.16em] text-muted-foreground">
              {t("principles.description")}
            </p>
          </div>

          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle, index) => (
              <article
                className="bg-background p-6 sm:p-7"
                key={principle.title}
              >
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                  0{index + 1}
                </p>
                <h3 className="mt-6 font-mono text-2xl font-black uppercase leading-none tracking-[-0.03em]">
                  {principle.title}
                </h3>
                <p className="mt-5 font-mono text-sm uppercase leading-6 tracking-[0.12em] text-muted-foreground">
                  {principle.text}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-px grid gap-px bg-border lg:grid-cols-[0.65fr_1.35fr]">
            <div className="bg-foreground p-6 text-background sm:p-7">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-background/55">
                {t("principles.filter.eyebrow")}
              </p>
              <h3 className="mt-5 font-mono text-[clamp(2rem,4vw,3.5rem)] font-black uppercase leading-[0.9] tracking-[-0.06em]">
                {t("principles.filter.title")}
              </h3>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {principleFilter.map((item) => (
                <p
                  className="bg-background p-6 font-mono text-sm uppercase leading-6 tracking-[0.14em] text-foreground/75 sm:p-7"
                  key={item}
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
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
