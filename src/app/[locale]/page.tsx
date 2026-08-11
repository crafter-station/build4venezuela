import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CountrySelector } from "@/components/country-selector";

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
  const [t, headerT] = await Promise.all([
    getTranslations({ locale, namespace: "CountryHub" }),
    getTranslations({ locale, namespace: "Header" }),
  ]);

  return (
    <CountrySelector
      addProjectHref={`/${locale}/submit`}
      countries={[
        {
          code: "VE",
          index: "01",
          href: `/${locale}/ve`,
          name: t("countries.venezuela.name"),
          description: t("countries.venezuela.description"),
        },
        {
          code: "CO",
          index: "02",
          href: `/${locale}/co`,
          name: t("countries.colombia.name"),
          description: t("countries.colombia.description"),
        },
      ]}
      copy={{
        addProject: t("addProject"),
        choose: t("selector.choose"),
        description: t("selector.description"),
        enter: t("selector.enter"),
        networkActive: t("selector.networkActive"),
        solidarity: t("selector.solidarity"),
        statement: t("selector.statement"),
        themeToggle: headerT("themeToggle"),
      }}
    />
  );
}
