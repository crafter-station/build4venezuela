import type { Project } from "./schema";

/**
 * Cluster layer for the project directory.
 *
 * This is intentionally a *derived* layer: it does not touch the database or
 * mutate any stored project. A project's cluster is resolved at read time from
 * an explicit slug map (curated from the cluster analysis) with a keyword
 * heuristic as a fallback for new submissions that are not yet curated.
 *
 * To re-categorize a project, edit `CATEGORY_OVERRIDES`. No migration needed.
 */

export type CategoryId =
  | "personas"
  | "recursos"
  | "data"
  | "damage"
  | "donations"
  | "infra"
  | "info"
  | "other";

export type ProjectCategory = {
  id: CategoryId;
  /** Short label for filter chips and card badges. */
  label: string;
  /** Longer heading shown when the cluster is selected. */
  title: string;
  /** What the cluster is + an invitation for newcomers to join. */
  description: string;
  /** Lowercase substrings used to auto-categorize uncurated projects. */
  keywords: string[];
};

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  {
    id: "personas",
    label: "Find People",
    title: "Missing & Found People",
    description:
      "Report, search, and reunite missing people and pets — WhatsApp/Telegram bots, facial recognition, and rescue maps. Join here if you want to help families find each other.",
    keywords: [
      "desaparecid",
      "personas encontrad",
      "personas localizad",
      "missing person",
      "reunif",
      "reencuentr",
      "localizad",
      "found people",
      "find people",
      "buscar persona",
      "facial",
      "rostro",
      "face match",
      "mascota",
      "lost pet",
      "rescate",
      "rescue",
      "atrapad",
      "te busca",
      "seres queridos",
    ],
  },
  {
    id: "recursos",
    label: "Aid Coordination",
    title: "Aid & Resource Coordination",
    description:
      "Live maps and directories of shelters, collection centers, hospitals, volunteers, and needs by zone. Join here to help route help to where it's needed.",
    keywords: [
      "refugio",
      "albergue",
      "acopio",
      "shelter",
      "collection center",
      "voluntari",
      "volunteer",
      "centros de salud",
      "hospital",
      "insumos",
      "necesidad",
      "zonas afectadas",
      "affected zones",
      "heatmap",
      "directorio",
      "centraliza",
      "mapa vivo",
    ],
  },
  {
    id: "data",
    label: "Data & APIs",
    title: "Data, Dedup & Shared APIs",
    description:
      "The shared data layer — scraping, normalization, deduplication, and open APIs other tools build on. Join here to make every other tool speak the same truth.",
    keywords: [
      "dedup",
      "deduplic",
      "normaliz",
      "rag",
      "scrap",
      "indice consultable",
      "index",
      "pgvector",
      "embedding",
      "registros",
      "unificad",
      "fuente de informaci",
      "single source",
      "public api",
    ],
  },
  {
    id: "damage",
    label: "Damage Assessment",
    title: "Structural Damage Assessment",
    description:
      "Crowdsourced and AI-assisted assessment of building damage, habitability, and structural risk. Join here if you work with engineering, CV, or satellite data.",
    keywords: [
      "daño estructural",
      "structural damage",
      "habitabilidad",
      "atc-20",
      "ems-98",
      "ingeniero civil",
      "satelital",
      "satellite",
      "infraestructura perdida",
      "clasificación de daño",
      "damage mapping",
    ],
  },
  {
    id: "donations",
    label: "Donations",
    title: "Donations & Funding",
    description:
      "Crowdfunding, donor matching, and transparent aid payments. Join here to move money and supplies to people who need them.",
    keywords: [
      "donaci",
      "donation",
      "crowdfunding",
      "campaña",
      "usdc",
      "payment",
      "pago",
      "cripto",
      "crypto",
      "fiat",
      "recaud",
      "donante",
    ],
  },
  {
    id: "infra",
    label: "Connectivity & Infra",
    title: "Connectivity & Infrastructure",
    description:
      "Offline mesh networking, edge inference, sensing, and alerts that keep tools running when the grid is down. Join here for the hardest, highest-leverage bets.",
    keywords: [
      "mesh",
      "offline",
      "sin internet",
      "bluetooth",
      "wifi direct",
      "csi",
      "esp32",
      "inferencia",
      "inference",
      "swarm",
      "p2p",
      "sensing",
      "sensor",
      "alarma",
      "alerta",
      "muestras de audio",
      "señales de radio",
    ],
  },
  {
    id: "info",
    label: "Verified Info",
    title: "Verified Info & Anti-misinformation",
    description:
      "Fighting rumors with verified, real-time information. Join here to keep the public informed and the noise down.",
    keywords: [
      "desinformaci",
      "misinformation",
      "rumor",
      "verificad",
      "verified",
      "fact-check",
      "última hora",
      "noticias",
      "fake",
    ],
  },
  {
    id: "other",
    label: "Other",
    title: "Community & Other",
    description:
      "Community, meta, and builds that don't fit a single cluster yet.",
    keywords: [],
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  PROJECT_CATEGORIES.map((category) => [category.id, category]),
) as Record<CategoryId, ProjectCategory>;

/**
 * Curated slug -> cluster map. Editing this is the supported way to move a
 * project between clusters. Anything not listed falls back to the keyword
 * heuristic, then to "other".
 */
const CATEGORY_OVERRIDES: Record<string, CategoryId> = {
  // Missing & found people
  "reencuentros-terremoto-venezuela": "personas",
  "busco-familiar": "personas",
  "te-encontramos": "personas",
  "venezuela-juntos": "personas",
  "busca-chat": "personas",
  "found-people-telegram-bot": "personas",
  "red-apoyo-venezuela": "personas",
  "venezuelan-tracker": "personas",
  "rescue-map-venezuela": "personas",
  sospatitas: "personas",
  // Aid & resource coordination
  rsh: "recursos",
  "civis-venezuela": "recursos",
  resqlink: "recursos",
  sosvenezuelanet: "recursos",
  "apoyo-venezuela": "recursos",
  martinezdan: "recursos",
  "medical-supplies": "recursos",
  "avapre-redh": "recursos",
  "unidos-venezuela": "recursos",
  "reporte-ve": "recursos",
  juxchxx: "recursos",
  "ayuda-venezuela": "recursos",
  "miranda-conecta": "recursos",
  statuslocal: "recursos",
  "directorio-sismo": "recursos",
  "centraliza-ayuda": "recursos",
  // Data, dedup & shared APIs
  "data-team": "data",
  "desaparecidos-rag-unificado": "data",
  "rag-whatsapp-consultas": "data",
  // Structural damage assessment
  sismoayudave: "damage",
  terrave: "damage",
  "reporta-venezuela": "damage",
  // Donations & funding
  pote: "donations",
  "proyecto-slug-kommercio": "donations",
  "entre-panas": "donations",
  "achylo-pay": "donations",
  // Connectivity & infrastructure
  "mesh-sync-offline": "infra",
  caribellm: "infra",
  esperanza: "infra",
  "mapeo-de-signos-vitales-tiempo-real": "infra",
  doomedag: "infra",
  // Verified info
  verive: "info",
  // Community & other
  "crafter-station": "other",
};

type CategorizableProject = Pick<
  Project,
  "slug" | "name" | "descriptionMarkdown"
>;

/** Resolve a project's cluster: curated map first, then keyword heuristic. */
export function categorizeProject(project: CategorizableProject): CategoryId {
  const override = CATEGORY_OVERRIDES[project.slug];
  if (override) {
    return override;
  }

  const haystack =
    `${project.name} ${project.descriptionMarkdown}`.toLowerCase();
  let bestId: CategoryId = "other";
  let bestScore = 0;

  for (const category of PROJECT_CATEGORIES) {
    if (category.id === "other") {
      continue;
    }

    let score = 0;
    for (const keyword of category.keywords) {
      if (haystack.includes(keyword)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = category.id;
    }
  }

  return bestId;
}

/** Count projects per cluster, preserving `PROJECT_CATEGORIES` order. */
export function categoryCounts(
  projects: CategorizableProject[],
): { category: ProjectCategory; count: number }[] {
  const counts = new Map<CategoryId, number>();
  for (const project of projects) {
    const id = categorizeProject(project);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return PROJECT_CATEGORIES.map((category) => ({
    category,
    count: counts.get(category.id) ?? 0,
  })).filter((entry) => entry.count > 0);
}

// ---------------------------------------------------------------------------
// AI-assisted classification for new submissions.
//
// At submit time an LLM classifies a project against the live clusters. If it
// fits, it's `assigned` to a built-in. If not, the LLM proposes a new cluster,
// stored as `proposed`. A proposal only becomes a real, filterable cluster once
// GRADUATION_THRESHOLD projects reference it — this is what stops one-off
// builds from spawning single-project clusters.
// ---------------------------------------------------------------------------

/** Projects needed before a proposed cluster becomes visible/filterable. */
export const GRADUATION_THRESHOLD = 3;

export const BUILTIN_CATEGORY_IDS: ReadonlySet<string> = new Set(
  PROJECT_CATEGORIES.map((category) => category.id),
);

export type CategoryProposal = {
  id: string;
  label: string;
  description: string;
};

/** A cluster the UI can render: a built-in or a graduated proposal. */
export type ResolvedCluster = {
  id: string;
  label: string;
  title: string;
  description: string;
  builtin: boolean;
};

/** Raw structured output from the LLM classifier (see `classify.ts`). */
export type ClassifierVerdict = {
  fitsExisting: boolean;
  categoryId: string | null;
  confidence: number;
  proposedId: string | null;
  proposedLabel: string | null;
  proposedDescription: string | null;
};

export type ClassificationDecision = {
  categoryId: string;
  status: "assigned" | "proposed";
  confidence: number;
  /** Set when the decision references a (possibly new) proposed cluster. */
  proposal?: CategoryProposal;
};

/** Minimum confidence to trust the LLM's "fits an existing cluster" verdict. */
const ASSIGN_CONFIDENCE_FLOOR = 0.6;

/**
 * Turn a raw LLM verdict into a stored decision. Deterministic — the model
 * suggests, this function (not the model) decides what gets written.
 */
export function decideCategory(
  verdict: ClassifierVerdict,
  knownClusterIds: ReadonlySet<string>,
): ClassificationDecision {
  if (
    verdict.fitsExisting &&
    verdict.categoryId &&
    knownClusterIds.has(verdict.categoryId) &&
    verdict.confidence >= ASSIGN_CONFIDENCE_FLOOR
  ) {
    return {
      categoryId: verdict.categoryId,
      status: "assigned",
      confidence: verdict.confidence,
    };
  }

  if (verdict.proposedId && verdict.proposedLabel) {
    return {
      categoryId: verdict.proposedId,
      status: "proposed",
      confidence: verdict.confidence,
      proposal: {
        id: verdict.proposedId,
        label: verdict.proposedLabel,
        description: verdict.proposedDescription ?? "",
      },
    };
  }

  return {
    categoryId: "other",
    status: "assigned",
    confidence: verdict.confidence,
  };
}

/** Which proposed clusters have enough members to be shown. */
export function graduatedProposalIds(
  proposals: CategoryProposal[],
  counts: Map<string, number>,
): Set<string> {
  return new Set(
    proposals
      .filter((p) => (counts.get(p.id) ?? 0) >= GRADUATION_THRESHOLD)
      .map((p) => p.id),
  );
}

/** Built-in clusters plus any graduated proposals, in display order. */
export function resolveClusters(
  proposals: CategoryProposal[],
  counts: Map<string, number>,
): ResolvedCluster[] {
  const builtins: ResolvedCluster[] = PROJECT_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    title: category.title,
    description: category.description,
    builtin: true,
  }));

  const graduated = graduatedProposalIds(proposals, counts);
  const proposed: ResolvedCluster[] = proposals
    .filter((p) => graduated.has(p.id))
    .map((p) => ({
      id: p.id,
      label: p.label,
      title: p.label,
      description: p.description,
      builtin: false,
    }));

  return [...builtins, ...proposed];
}

/**
 * The cluster a project should display under. Uses the persisted AI assignment
 * when present (downgrading not-yet-graduated proposals to "other"), and falls
 * back to the keyword heuristic for projects with no stored assignment (e.g.
 * the projects that predate classification).
 */
export function resolveProjectCluster(
  project: CategorizableProject,
  persisted: { categoryId: string; status: string } | undefined,
  graduatedIds: ReadonlySet<string>,
): string {
  if (persisted) {
    if (persisted.status === "proposed") {
      return graduatedIds.has(persisted.categoryId)
        ? persisted.categoryId
        : "other";
    }
    return persisted.categoryId;
  }

  return categorizeProject(project);
}
