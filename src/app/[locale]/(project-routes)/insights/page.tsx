import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import datasetJson from "@/lib/insights/dataset.json";
import type { InsightDataset } from "@/lib/insights/types";
import { ProjectShell } from "../project-shell";
import { InsightsDashboard } from "./insights-dashboard";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Insights.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

const dataset = datasetJson as InsightDataset;

export default function InsightsPage() {
  return (
    <ProjectShell>
      <InsightsDashboard dataset={dataset} />
    </ProjectShell>
  );
}
