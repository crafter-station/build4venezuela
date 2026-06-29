import type { Metadata } from "next";
import datasetJson from "@/lib/insights/dataset.json";
import type { InsightDataset } from "@/lib/insights/types";
import { ProjectShell } from "../project-shell";
import { InsightsDashboard } from "./insights-dashboard";

export const metadata: Metadata = {
  title: "Project Insights — Build4Venezuela",
  description:
    "Internal triage: tech stack, maturity, viability, overlap, and diffusion readiness across project repositories.",
  robots: { index: false, follow: false },
};

const dataset = datasetJson as InsightDataset;

export default function InsightsPage() {
  return (
    <ProjectShell>
      <InsightsDashboard dataset={dataset} />
    </ProjectShell>
  );
}
