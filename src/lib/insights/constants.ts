import type { FindingStatus, SecurityRisk, Severity, Tier } from "./types";

export const TIER_COLOR: Record<Tier, string> = {
  spotlight: "var(--primary)",
  promote: "var(--accent)",
  "merge-candidate": "var(--chart-4)",
  "improve-first": "var(--muted-foreground)",
  deprioritize: "var(--destructive)",
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

export const SECURITY_RISK_COLOR: Record<SecurityRisk, string> = {
  critical: "var(--destructive)",
  high: "var(--warning)",
  medium: "var(--primary)",
  low: "var(--muted-foreground)",
  none: "var(--success)",
};

export const SECURITY_RISK_RANK: Record<SecurityRisk, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

// Per-finding resolution status on re-audit. Green = fixed, amber = partial,
// red = still open, cyan = newly found this pass.
export const FINDING_STATUS_COLOR: Record<FindingStatus, string> = {
  resolved: "var(--success)",
  partial: "var(--primary)",
  open: "var(--destructive)",
  new: "var(--accent)",
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
