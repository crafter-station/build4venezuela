import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CountryHub } from "@/components/country-hub";

type Props = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CountryHub" });

  return {
    title: t("metadata.colombia.title"),
    description: t("metadata.colombia.description"),
    alternates: { canonical: `/${locale}/co` },
    openGraph: {
      title: t("metadata.colombia.title"),
      description: t("metadata.colombia.description"),
      url: `/${locale}/co`,
      images: [
        {
          url: "/assets/og-colombia.jpg",
          width: 1200,
          height: 630,
          alt: "Build4Latam Colombia",
        },
      ],
    },
  };
}

export default async function ColombiaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CountryHub country="colombia" locale={locale} />;
}
