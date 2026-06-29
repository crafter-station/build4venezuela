import type { Severity, Tier } from "./types";

// Poster palette (see src/app/globals.css): bg #000, primary #ffd83d,
// accent #16c7e8, destructive #ff4a63, muted-foreground #a6a6a6.
export const TIER_COLOR: Record<Tier, string> = {
  spotlight: "#ffd83d",
  promote: "#16c7e8",
  "merge-candidate": "#b388ff",
  "improve-first": "#a6a6a6",
  deprioritize: "#ff4a63",
};

export const TIER_LABEL: Record<Tier, string> = {
  spotlight: "Spotlight",
  promote: "Promote",
  "merge-candidate": "Merge candidate",
  "improve-first": "Improve first",
  deprioritize: "Deprioritize",
};

export const TIER_ORDER: Tier[] = [
  "spotlight",
  "promote",
  "merge-candidate",
  "improve-first",
  "deprioritize",
];

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export const SCORE_KEYS = [
  { key: "viability", label: "Viability" },
  { key: "production", label: "Prod-ready" },
  { key: "maturity", label: "Maturity" },
  { key: "organization", label: "Code org" },
  { key: "product", label: "Product" },
  { key: "diffusion", label: "Diffusion" },
] as const;

export const TAG_LABEL: Record<string, string> = {
  "people-finder": "People finder",
  "shelter-mapping": "Shelter mapping",
  "donations-aid": "Donations / aid",
  "seismic-data": "Seismic data",
  "medical-health": "Medical / health",
  "mental-health": "Mental health",
  "family-reunification": "Family reunification",
  "aid-logistics": "Aid logistics",
  "comms-chat": "Comms / chat",
  "structural-inspection": "Structural inspection",
  "volunteer-coordination": "Volunteer coordination",
  "mapping-geo": "Mapping / geo",
  "alerts-notifications": "Alerts / notifications",
};

export const tagLabel = (t: string) => TAG_LABEL[t] ?? t;
