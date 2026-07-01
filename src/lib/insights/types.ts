export type Tier =
  | "spotlight"
  | "promote"
  | "merge-candidate"
  | "improve-first"
  | "deprioritize";

export type Severity = "critical" | "high" | "medium" | "low";

export type SecurityRisk = Severity | "none";

// Resolution status of a finding on re-audit. Absent = original audit, treat as open.
export type FindingStatus = "open" | "partial" | "resolved" | "new";

export type SecurityFinding = {
  severity: Severity;
  title: string;
  status?: FindingStatus;
};

export type SecurityAudit = {
  risk: SecurityRisk;
  auditedAt: string;
  issueUrl: string | null;
  findings: SecurityFinding[];
  // set when the repo was re-audited to check whether issues were fixed
  reauditedAt?: string;
  // overall risk at the previous audit, so the UI can show the delta
  previousRisk?: SecurityRisk;
  // short note on what changed between audits
  reauditNote?: string;
  // true when the repo could not be cloned, so no audit was performed
  notAudited?: boolean;
};

export type InsightNode = {
  slug: string;
  name: string;
  type: string;
  summary: string;
  tier: Tier;
  severity: Severity;
  solvesRealProblem: string;
  liveDemoStatus: string;
  onePitch: string;
  scores: {
    maturity: number;
    production: number;
    organization: number;
    viability: number;
    product: number;
    diffusion: number;
    impact: number;
  };
  signals: {
    stars: number;
    commits: number;
    loc: number;
    contributors: number;
    license: string | null;
  };
  stack: {
    frontend: string[];
    backend: string[];
    database: string[];
    ai_ml: string[];
    usesOrm: boolean;
    orm: string;
    pattern: string;
  };
  tags: string[];
  redFlags: string[];
  mergePotential: string;
  diffusion: {
    ready: boolean;
    assets: string[];
    angle: string;
    gaps: string[];
  };
  repoUrl: string;
  liveUrl: string;
  videoUrl: string;
  security?: SecurityAudit;
  x: number;
  y: number;
};

export type InsightEdge = {
  source: string;
  target: string;
  weight: number;
  shared: string[];
};

export type InsightDataset = {
  generatedFrom: string;
  count: number;
  layout: { width: number; height: number };
  nodes: InsightNode[];
  edges: InsightEdge[];
};
