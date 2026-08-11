import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { SponsorLink } from "./sponsor-link";

const assetPath = "/BFV/assets/";

type Partner = {
  name: string;
  href: string;
  image: string;
  width: number;
  height: number;
  className: string;
};

export async function SiteFooter() {
  const [locale, t, header] = await Promise.all([
    getLocale(),
    getTranslations("HomePage"),
    getTranslations("Header"),
  ]);
  const partners = t.raw("partners") as Partner[];
  const productLinks = [
    { href: `/${locale}/projects`, label: header("links.projects") },
    { href: `/${locale}/builders`, label: header("links.builders") },
    { href: `/${locale}/requests`, label: header("links.requests") },
    { href: `/${locale}/recursos`, label: header("links.resources") },
    { href: `/${locale}/insights`, label: header("links.impact") },
  ];
  const communityLinks = [
    { href: "/whatsapp", label: header("links.whatsapp") },
    { href: "/discord", label: header("links.discord") },
    { href: `/${locale}/brand`, label: header("links.brand") },
    { href: "/", label: "Build4Latam" },
  ];

  return (
    <footer className="border-border border-t bg-surface text-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto_auto] lg:px-10 lg:py-16">
        <div className="max-w-md">
          <Link
            className="ui-focus inline-flex font-mono text-xl font-black tracking-[-0.05em]"
            href={`/${locale}`}
          >
            Build4<span className="text-brand-yellow">Venezuela</span>
          </Link>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {t("footer.description")}
          </p>
        </div>

        <FooterGroup label={header("productLabel")} links={productLinks} />
        <FooterGroup label={header("communityLabel")} links={communityLinks} />
      </div>

      <div className="border-border border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {header("partnersLabel")}
          </p>
          <div className="grid max-w-3xl grid-cols-3 items-center gap-6 sm:grid-cols-5 sm:gap-10">
            {partners.map((partner) => (
              <SponsorLink
                className="ui-focus transition-opacity hover:opacity-70"
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
            <SponsorLink
              className="ui-focus transition-opacity hover:opacity-70"
              href="http://nucleo.la/?utm_source=build4venezuela&utm_medium=referral&utm_campaign=partners"
              placement="footer"
              rel="noreferrer"
              sponsor="Nucleo"
              target="_blank"
            >
              <Image
                alt="Nucleo"
                className="partner-mark mx-auto h-auto w-full max-w-[160px] select-none"
                draggable="false"
                height={107}
                src={`${assetPath}nucleo-wordmark-blanco.png`}
                width={190}
              />
            </SponsorLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

type FooterGroupProps = {
  label: string;
  links: Array<{ href: string; label: string }>;
};

function FooterGroup({ label, links }: FooterGroupProps) {
  return (
    <div className="min-w-36">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <nav className="mt-4 flex flex-col items-start gap-3">
        {links.map((link) => (
          <Link
            className="ui-focus text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
