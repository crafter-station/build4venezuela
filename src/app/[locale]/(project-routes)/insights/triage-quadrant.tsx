"use client";

import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TIER_COLOR } from "@/lib/insights/constants";
import type { InsightNode } from "@/lib/insights/types";

// deterministic [-0.28, 0.28] jitter from slug so stacked integer scores spread
function jitter(slug: string, salt: number) {
  let h = salt;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997;
  return (h / 997 - 0.5) * 0.56;
}

type Props = {
  nodes: InsightNode[];
  activeSlugs: Set<string>;
  hover: string | null;
  onHover: (s: string | null) => void;
  onSelect: (s: string) => void;
};

export function TriageQuadrant({
  nodes,
  activeSlugs,
  hover,
  onHover,
  onSelect,
}: Props) {
  const t = useTranslations("Insights.triageQuadrant");
  const tShared = useTranslations("Insights.shared");
  const data = nodes.map((n) => ({
    slug: n.slug,
    name: n.name,
    tier: n.tier,
    x: n.scores.production + jitter(n.slug, 7),
    y: n.scores.impact + jitter(n.slug, 13),
    z: Math.max(6, n.signals.stars),
    active: activeSlugs.has(n.slug),
    node: n,
  }));

  return (
    <div className="relative">
      <div className="pointer-events-none absolute top-2 right-3 z-10 font-mono text-[10px] text-foreground/70 uppercase tracking-widest">
        {t("hint")}
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 28, left: 0 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            name={t("productionReadiness")}
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 11,
              fontFamily: "monospace",
            }}
            stroke="var(--border)"
            label={{
              value: t("productionReadinessAxis"),
              position: "bottom",
              fill: "var(--muted-foreground)",
              fontSize: 10,
              fontFamily: "monospace",
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={t("impact")}
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 11,
              fontFamily: "monospace",
            }}
            stroke="var(--border)"
            width={40}
            label={{
              value: t("impactAxis"),
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted-foreground)",
              fontSize: 10,
              fontFamily: "monospace",
            }}
          />
          <ZAxis type="number" dataKey="z" range={[40, 600]} />
          <ReferenceLine
            x={3.5}
            stroke="var(--line-strong)"
            strokeDasharray="3 3"
          />
          <ReferenceLine
            y={3.5}
            stroke="var(--line-strong)"
            strokeDasharray="3 3"
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "var(--line-strong)" }}
            content={
              <QuadrantTooltip tierLabel={(tier) => tShared(`tiers.${tier}`)} />
            }
          />
          <Scatter
            data={data}
            isAnimationActive={false}
            onClick={(p) => {
              const slug = (p as unknown as { slug?: string })?.slug;
              if (slug) onSelect(slug);
            }}
          >
            {data.map((d) => {
              const dim = !d.active;
              const hot = hover === d.slug;
              return (
                <Cell
                  key={d.slug}
                  fill={TIER_COLOR[d.tier]}
                  fillOpacity={dim ? 0.12 : hot ? 1 : 0.78}
                  stroke={hot ? "var(--foreground)" : TIER_COLOR[d.tier]}
                  strokeOpacity={dim ? 0.2 : 1}
                  strokeWidth={hot ? 2 : 1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => onHover(d.slug)}
                  onMouseLeave={() => onHover(null)}
                />
              );
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuadrantTooltip({
  active,
  payload,
  tierLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: { node: InsightNode } }>;
  tierLabel: (tier: InsightNode["tier"]) => string;
}) {
  const t = useTranslations("Insights.triageQuadrant.tooltip");
  if (!active || !payload?.length) return null;
  const n = payload[0].payload.node;
  return (
    <Card size="sm" className="py-3 font-mono text-xs">
      <CardContent className="flex flex-col gap-1 px-3">
        <div className="font-bold" style={{ color: TIER_COLOR[n.tier] }}>
          {n.name}
        </div>
        <div className="text-muted-foreground">
          {tierLabel(n.tier)} · {n.signals.stars}★ · {n.severity}
        </div>
        <div className="text-muted-foreground">
          {t("impact", { score: n.scores.impact })} ·{" "}
          {t("production", { score: n.scores.production })} ·{" "}
          {t("viability", { score: n.scores.viability })}
        </div>
      </CardContent>
    </Card>
  );
}
