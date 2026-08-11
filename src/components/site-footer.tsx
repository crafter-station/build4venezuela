import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { SponsorLink } from "./sponsor-link";

const assetPath = "/BFV/assets/";

const sponsors = [
  {
    name: "Zavu",
    href: "https://www.zavu.dev/",
    image: "zavu.svg",
    width: 96,
    height: 96,
    className: "h-6 w-6 select-none object-contain sm:h-7 sm:w-7",
  },
  {
    name: "Invent",
    href: "https://www.useinvent.com/",
    image: "invent.svg",
    width: 28,
    height: 28,
    className: "h-5 w-5 select-none object-contain sm:h-6 sm:w-6",
  },
] as const;

const nucleo = {
  name: "Nucleo",
  href: "http://nucleo.la/?utm_source=build4venezuela&utm_medium=referral&utm_campaign=partners",
  image: "nucleo-wordmark-blanco.png",
  width: 96,
  height: 54,
  className: "h-4 w-auto select-none sm:h-5",
} as const;

type Partner = {
  name: string;
  href: string;
  image: string;
  width: number;
  height: number;
  className: string;
};

export async function SiteFooter({
  locale: localeProp,
}: {
  locale?: string;
} = {}) {
  const locale = localeProp ?? (await getLocale());
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const partners = [
    ...(t.raw("partners") as Partner[]).map((partner) => ({
      ...partner,
      className: "h-4 w-auto max-w-[4.5rem] select-none object-contain sm:h-5",
    })),
    nucleo,
  ];

  return (
    <footer className="hud-capsule__footer border-border border-t bg-background text-foreground">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:h-14 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {sponsors.map((sponsor) => (
            <SponsorLink
              className="ui-focus shrink-0 opacity-80 transition-opacity hover:opacity-100"
              href={sponsor.href}
              key={sponsor.name}
              placement="footer"
              rel="noreferrer"
              sponsor={sponsor.name}
              target="_blank"
            >
              <Image
                alt={sponsor.name}
                className={sponsor.className}
                draggable="false"
                height={sponsor.height}
                src={`${assetPath}${sponsor.image}`}
                width={sponsor.width}
              />
            </SponsorLink>
          ))}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4">
          {partners.map((partner) => (
            <SponsorLink
              className="ui-focus shrink-0 opacity-80 transition-opacity hover:opacity-100"
              href={partner.href}
              key={partner.name}
              placement="footer"
              rel="noreferrer"
              sponsor={partner.name}
              target="_blank"
            >
              <Image
                alt={partner.name}
                className={cn("partner-mark", partner.className)}
                draggable="false"
                height={partner.height}
                src={`${assetPath}${partner.image}`}
                width={partner.width}
              />
            </SponsorLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
