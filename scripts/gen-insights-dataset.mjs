/**
 * Generate the static dataset for the /insights dashboard from the offline
 * analysis output. Trims analysis/insights.json down to what the UI needs and
 * bakes a DETERMINISTIC force-directed layout for the overlap network (so the
 * page ships fixed node coordinates — no runtime randomness, no layout libs).
 *
 * Run: bun scripts/gen-insights-dataset.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "analysis/insights.json");
const OUT = resolve(ROOT, "src/lib/insights/dataset.json");

const insights = JSON.parse(readFileSync(SRC, "utf8"));

const short = (s, n = 160) =>
  !s ? "" : s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;

const nodes = insights.map((p) => {
  const a = p.analysis ?? {};
  const e = p.evaluation ?? {};
  const s = p.signals ?? {};
  return {
    slug: p.project_slug,
    name: p.name ?? p.project_slug,
    type: a.project_type ?? "other",
    summary: short(a.summary, 220),
    tier: e.overall_recommendation ?? "improve-first",
    severity: e.problem_severity ?? "medium",
    solvesRealProblem: e.solves_real_problem ?? "unclear",
    liveDemoStatus: e.live_demo_status ?? "unknown",
    onePitch: e.one_line_pitch ?? "",
    scores: {
      maturity: a.maturity?.score ?? 0,
      production: a.production_readiness?.score ?? 0,
      organization: a.code_organization?.score ?? 0,
      viability: a.viability?.score ?? 0,
      product: e.product_quality ?? 0,
      diffusion: e.diffusion?.score ?? 0,
      impact: e.impact_potential ?? 0,
    },
    signals: {
      stars: s.stars ?? 0,
      commits: s.commit_count ?? 0,
      loc: s.code_loc ?? 0,
      contributors: s.contributors ?? 0,
      license: s.license ?? null,
    },
    stack: {
      frontend: a.stack?.frontend ?? [],
      backend: a.stack?.backend ?? [],
      database: a.stack?.database ?? [],
      ai_ml: a.stack?.ai_ml ?? [],
      usesOrm: a.architecture?.uses_orm ?? false,
      orm: a.architecture?.orm_or_db_layer ?? "",
      pattern: a.architecture?.pattern ?? "",
    },
    tags: a.domain_tags ?? [],
    redFlags: a.red_flags ?? [],
    mergePotential: a.merge_potential ?? "",
    diffusion: {
      ready: e.diffusion?.ready_to_promote ?? false,
      assets: e.diffusion?.available_assets ?? [],
      angle: e.diffusion?.recommended_angle ?? "",
      gaps: e.diffusion?.gaps ?? [],
    },
    repoUrl: p.repo_url ?? "",
    liveUrl: p.live_url ?? "",
    videoUrl: p.video_url ?? "",
  };
});

// --- edges: connect projects that share >= 2 domain tags ---
const edges = [];
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const a = new Set(nodes[i].tags);
    const shared = nodes[j].tags.filter((t) => a.has(t));
    if (shared.length >= 3) {
      edges.push({
        source: nodes[i].slug,
        target: nodes[j].slug,
        weight: shared.length,
        shared,
      });
    }
  }
}

// --- deterministic force-directed layout ---
const N = nodes.length;
const W = 1000;
const H = 1000;
const idx = Object.fromEntries(nodes.map((n, i) => [n.slug, i]));
// init on a deterministic circle
const pos = nodes.map((_, i) => {
  const ang = (i / N) * Math.PI * 2;
  return { x: W / 2 + Math.cos(ang) * 380, y: H / 2 + Math.sin(ang) * 380 };
});
const adj = edges.map((e) => ({
  a: idx[e.source],
  b: idx[e.target],
  w: e.weight,
}));

const ITER = 600;
const k = 220; // ideal spring length base
for (let it = 0; it < ITER; it++) {
  const disp = pos.map(() => ({ x: 0, y: 0 }));
  // repulsion (all pairs)
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = pos[i].x - pos[j].x;
      const dy = pos[i].y - pos[j].y;
      const d2 = dx * dx + dy * dy || 0.01;
      const rep = (k * k) / d2;
      const d = Math.sqrt(d2);
      const ux = dx / d;
      const uy = dy / d;
      disp[i].x += ux * rep;
      disp[i].y += uy * rep;
      disp[j].x -= ux * rep;
      disp[j].y -= uy * rep;
    }
  }
  // attraction (edges, stronger with more shared tags)
  for (const { a, b, w } of adj) {
    const dx = pos[a].x - pos[b].x;
    const dy = pos[a].y - pos[b].y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const att = (d * d) / k / (1 + w * 0.5);
    const ux = dx / d;
    const uy = dy / d;
    disp[a].x -= ux * att;
    disp[a].y -= uy * att;
    disp[b].x += ux * att;
    disp[b].y += uy * att;
  }
  // gravity toward center + apply with cooling
  const temp = 18 * (1 - it / ITER);
  for (let i = 0; i < N; i++) {
    disp[i].x += (W / 2 - pos[i].x) * 0.012;
    disp[i].y += (H / 2 - pos[i].y) * 0.012;
    const dl = Math.sqrt(disp[i].x ** 2 + disp[i].y ** 2) || 0.01;
    pos[i].x += (disp[i].x / dl) * Math.min(dl, temp);
    pos[i].y += (disp[i].y / dl) * Math.min(dl, temp);
  }
}
// normalize into [40, 960]
const xs = pos.map((p) => p.x);
const ys = pos.map((p) => p.y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
const norm = (v, mn, mx) => 40 + ((v - mn) / (mx - mn || 1)) * 920;
nodes.forEach((n, i) => {
  n.x = Math.round(norm(pos[i].x, minX, maxX));
  n.y = Math.round(norm(pos[i].y, minY, maxY));
});

const dataset = {
  generatedFrom: "analysis/insights.json",
  count: nodes.length,
  layout: { width: W, height: H },
  nodes,
  edges,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(dataset, null, 2));
console.log(`wrote ${OUT}: ${nodes.length} nodes, ${edges.length} edges`);
