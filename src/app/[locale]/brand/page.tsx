import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string }>;
};

type BrandAsset = {
  key: "logo" | "mark" | "map" | "leftHand" | "rightHand";
  preview: string;
  previewClassName?: string;
  downloads: DownloadOption[];
  width: number;
  height: number;
};

type DownloadOption = {
  format: "SVG" | "PNG" | "JPG" | "TTF";
  fileName: string;
  href: string;
};

type FontAsset = {
  weight: string;
  fileName: string;
  href: string;
};

type SocialAsset = {
  key: "square" | "portrait" | "story";
  downloads: DownloadOption[];
  width: number;
  height: number;
};

type BriefLink = {
  label: string;
  href: string;
  text: string;
};

const brandAssets: BrandAsset[] = [
  {
    key: "logo",
    preview: "/BFV/assets/B4V.svg",
    downloads: [
      { format: "SVG", fileName: "B4V.svg", href: "/BFV/assets/B4V.svg" },
    ],
    width: 731,
    height: 285,
  },
  {
    key: "mark",
    preview: "/BFV/assets/v-mark.svg",
    previewClassName: "invert",
    downloads: [
      { format: "SVG", fileName: "v-mark.svg", href: "/BFV/assets/v-mark.svg" },
    ],
    width: 45,
    height: 46,
  },
  {
    key: "map",
    preview: "/BFV/assets/venezuelan_map.svg",
    downloads: [
      {
        format: "SVG",
        fileName: "venezuelan_map.svg",
        href: "/BFV/assets/venezuelan_map.svg",
      },
    ],
    width: 321,
    height: 309,
  },
  {
    key: "leftHand",
    preview: "/BFV/assets/left-hand@2x.png",
    downloads: [
      {
        format: "PNG",
        fileName: "left-hand@2x.png",
        href: "/BFV/assets/left-hand@2x.png",
      },
    ],
    width: 940,
    height: 322,
  },
  {
    key: "rightHand",
    preview: "/BFV/assets/right-hand@2x.png",
    downloads: [
      {
        format: "PNG",
        fileName: "right-hand@2x.png",
        href: "/BFV/assets/right-hand@2x.png",
      },
    ],
    width: 940,
    height: 322,
  },
];

const fonts: FontAsset[] = [
  {
    weight: "Light",
    fileName: "InputMonoNarrow-Light-Testing.ttf",
    href: "/BFV/fonts/InputMonoNarrow-Light-Testing.ttf",
  },
  {
    weight: "Regular",
    fileName: "InputMonoNarrow-Regular-Testing.ttf",
    href: "/BFV/fonts/InputMonoNarrow-Regular-Testing.ttf",
  },
  {
    weight: "Medium",
    fileName: "InputMonoNarrow-Medium-Testing.ttf",
    href: "/BFV/fonts/InputMonoNarrow-Medium-Testing.ttf",
  },
  {
    weight: "Bold",
    fileName: "InputMonoNarrow-Bold-Testing.ttf",
    href: "/BFV/fonts/InputMonoNarrow-Bold-Testing.ttf",
  },
  {
    weight: "Black",
    fileName: "InputMonoNarrow-Black-Testing.ttf",
    href: "/BFV/fonts/InputMonoNarrow-Black-Testing.ttf",
  },
];

const socialAssets: SocialAsset[] = [
  {
    key: "square",
    downloads: [
      {
        format: "JPG",
        fileName: "BFV_1000X1000.jpg",
        href: "/BFV/social_media/BFV_1000X1000.jpg",
      },
    ],
    width: 1000,
    height: 1000,
  },
  {
    key: "portrait",
    downloads: [
      {
        format: "JPG",
        fileName: "BFV_1080X1440.jpg",
        href: "/BFV/social_media/BFV_1080X1440.jpg",
      },
    ],
    width: 1080,
    height: 1440,
  },
  {
    key: "story",
    downloads: [
      {
        format: "JPG",
        fileName: "BFV_1080X1920.jpg",
        href: "/BFV/social_media/BFV_1080X1920.jpg",
      },
    ],
    width: 1080,
    height: 1920,
  },
];

export default async function BrandPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("BrandPage");
  const checklist = t.raw("brief.checklist") as string[];
  const links = t.raw("brief.links") as BriefLink[];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate px-5 pt-28 pb-16 sm:px-8 sm:pt-32 sm:pb-20 lg:px-10">
        <div className="absolute inset-0 -z-20 bg-background" />
        <div className="bg-grid absolute inset-0 -z-10 opacity-[0.06]" />

        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-primary">
            {t("eyebrow")}
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <h1 className="type-page-title text-balance font-mono font-black uppercase">
              {t("title")}
            </h1>
            <div className="flex flex-col gap-5 font-mono text-[clamp(1rem,1.7vw,1.35rem)] font-light leading-relaxed tracking-[0.07em] text-foreground/75">
              <p>{t("description")}</p>
              <a
                className={buttonVariants({ variant: "outline" })}
                href="#social"
              >
                {t("cta")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-6 border-border border-b pb-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
                {t("brief.eyebrow")}
              </p>
              <h2 className="mt-4 font-mono text-[clamp(2.2rem,5vw,4rem)] font-black uppercase leading-[0.88] tracking-[-0.06em]">
                {t("brief.title")}
              </h2>
            </div>
            <div className="font-mono text-sm uppercase leading-6 tracking-[0.16em] text-muted-foreground">
              <p>{t("brief.description")}</p>
              <p className="mt-5 text-foreground">{t("brief.message")}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <Badge
                  className="font-mono uppercase tracking-[0.18em]"
                  variant="outline"
                >
                  {t("brief.checklistEyebrow")}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {checklist.map((item) => (
                  <Card key={item} size="sm">
                    <CardHeader>
                      <CardDescription className="font-mono text-sm uppercase leading-6 tracking-[0.14em] text-foreground/75">
                        {item}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </CardContent>
            </Card>
            <div className="grid gap-4">
              <Badge
                className="font-mono uppercase tracking-[0.18em]"
                variant="secondary"
              >
                {t("brief.linksEyebrow")}
              </Badge>
              {links.map((link) => (
                <Card key={link.href} size="sm">
                  <CardHeader>
                    <CardTitle className="font-mono text-xl font-black uppercase tracking-[0.04em]">
                      {link.label}
                    </CardTitle>
                    <CardDescription className="font-mono text-sm uppercase leading-6 tracking-[0.14em]">
                      {link.text}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <a
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                        "font-mono uppercase tracking-[0.16em]",
                      )}
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow={t("assets.eyebrow")}
            title={t("assets.title")}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {brandAssets.map((asset) => (
              <Card key={asset.key}>
                <CardContent className="flex h-48 items-center justify-center bg-muted p-8">
                  <Image
                    alt={t(`assets.items.${asset.key}.title`)}
                    className={`max-h-full w-auto max-w-full select-none object-contain ${asset.previewClassName ?? ""}`}
                    draggable="false"
                    height={asset.height}
                    src={asset.preview}
                    width={asset.width}
                  />
                </CardContent>
                <CardHeader>
                  <CardTitle className="font-mono text-2xl font-black uppercase tracking-[-0.02em]">
                    {t(`assets.items.${asset.key}.title`)}
                  </CardTitle>
                  <CardDescription className="font-mono text-sm uppercase leading-6 tracking-[0.12em]">
                    {t(`assets.items.${asset.key}.description`)}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <DownloadOptions
                    className=""
                    downloads={asset.downloads}
                    t={t}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border border-y bg-foreground px-5 py-16 text-background sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow={t("fonts.eyebrow")}
            title={t("fonts.title")}
          />
          <div className="grid gap-6 md:grid-cols-5">
            {fonts.map((font) => (
              <Card
                className="bg-foreground font-mono text-background ring-background/20"
                key={font.fileName}
              >
                <CardHeader>
                  <Badge variant="secondary">{font.weight}</Badge>
                  <CardTitle className="mt-4 text-[clamp(2.2rem,5vw,4rem)] font-black leading-none tracking-[-0.08em]">
                    Aa
                  </CardTitle>
                  <CardDescription className="mt-3 break-all text-xs uppercase leading-5 tracking-[0.12em] text-background/55">
                    {font.fileName}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="border-background/15 bg-background/5">
                  <a
                    className={cn(
                      buttonVariants({ size: "sm", variant: "inverse" }),
                      "uppercase tracking-[0.16em]",
                    )}
                    download
                    href={font.href}
                  >
                    {t("fonts.download")}
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
          <p className="mt-6 max-w-3xl font-mono text-sm uppercase leading-6 tracking-[0.16em] text-background/55">
            {t("fonts.note")}
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10" id="social">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-5 border-border border-b pb-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <SectionHeader
              eyebrow={t("social.eyebrow")}
              title={t("social.title")}
            />
            <p className="font-mono text-sm uppercase leading-6 tracking-[0.16em] text-muted-foreground">
              {t("social.description")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {socialAssets.map((asset) => (
              <Card className="h-full" key={asset.key}>
                <CardContent className="flex h-72 items-center justify-center overflow-hidden bg-muted">
                  <Image
                    alt={t(`social.items.${asset.key}.title`)}
                    className="max-h-full w-auto max-w-full select-none object-contain"
                    draggable="false"
                    height={asset.height}
                    src={asset.downloads[0].href}
                    width={asset.width}
                  />
                </CardContent>
                <CardHeader className="flex-1 font-mono">
                  <CardTitle className="text-xl font-black uppercase tracking-[-0.02em]">
                    {t(`social.items.${asset.key}.title`)}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm uppercase leading-6 tracking-[0.12em]">
                    {t(`social.items.${asset.key}.description`)}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <DownloadOptions
                    className=""
                    downloads={asset.downloads}
                    t={t}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10">
      <p className="font-mono text-sm uppercase tracking-[0.28em] text-destructive">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-mono text-[clamp(2.2rem,5vw,4rem)] font-black uppercase leading-[0.88] tracking-[-0.06em]">
        {title}
      </h2>
    </div>
  );
}

function DownloadOptions({
  className = "mt-6",
  downloads,
  t,
}: {
  className?: string;
  downloads: DownloadOption[];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className={`${className} flex flex-wrap gap-2`}>
      {downloads.map((download) => (
        <a
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            "font-mono uppercase tracking-[0.16em]",
          )}
          download
          href={download.href}
          key={download.fileName}
        >
          {t("downloadFormat", { format: download.format })}
        </a>
      ))}
    </div>
  );
}
