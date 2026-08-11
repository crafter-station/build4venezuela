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
    title: t("metadata.venezuela.title"),
    description: t("metadata.venezuela.description"),
    alternates: { canonical: `/${locale}/ve` },
    openGraph: {
      title: t("metadata.venezuela.title"),
      description: t("metadata.venezuela.description"),
      url: `/${locale}/ve`,
      images: [
        {
          url: "/assets/og-venezuela.jpg",
          width: 1200,
          height: 630,
          alt: "Build4Latam Venezuela",
        },
      ],
    },
  };
}

export default async function VenezuelaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CountryHub country="venezuela" locale={locale} />;
}
