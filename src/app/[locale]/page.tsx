import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CountrySelector } from "@/components/country-selector";
import {
  SOUTH_AMERICA_COUNTRY_CODES,
  type SouthAmericaCountriesContent,
} from "@/lib/south-america-countries";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "Build4Latam | Technology in solidarity",
  description:
    "Open tools and builder communities responding to urgent needs across Latin America.",
};

export default async function LocaleHome({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "CountryHub" });

  const countries = Object.fromEntries(
    SOUTH_AMERICA_COUNTRY_CODES.map((code) => [
      code,
      {
        name: t(`map.countries.${code}.name`),
        disaster: t(`map.countries.${code}.disaster`),
        tags: t.raw(`map.countries.${code}.tags`) as string[],
      },
    ]),
  ) as SouthAmericaCountriesContent;

  return (
    <CountrySelector
      countries={countries}
      copy={{
        chooseHint: t("map.chooseHint"),
        emptyTitle: t("map.emptyTitle"),
        explore: t("map.explore"),
        mapLabel: t("map.mapLabel"),
        otherCountries: t("map.otherCountries"),
        submitProject: t("map.submitProject"),
      }}
      hubs={{
        VE: {
          exploreHref: `/${locale}/ve`,
          submitHref: `/${locale}/submit?country=venezuela`,
        },
        CO: {
          exploreHref: `/${locale}/co`,
          submitHref: `/${locale}/submit?country=colombia`,
        },
      }}
      submitLatamHref={`/${locale}/submit`}
    />
  );
}
