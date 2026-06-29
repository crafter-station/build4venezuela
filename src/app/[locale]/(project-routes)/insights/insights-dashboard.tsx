"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { TIER_COLOR, TIER_ORDER, tagLabel } from "@/lib/insights/constants";
import type { InsightDataset, Tier } from "@/lib/insights/types";
import { Leaderboard } from "./leaderboard";
import { OverlapNetwork } from "./overlap-network";
import { ProjectDrawer } from "./project-drawer";
import { StackCharts } from "./stack-charts";
import { TriageQuadrant } from "./triage-quadrant";

export function InsightsDashboard({ dataset }: { dataset: InsightDataset }) {
  const t = useTranslations("Insights.dashboard");
  const tShared = useTranslations("Insights.shared");
  const [tier, setTier] = useState<Tier | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const { nodes, edges } = dataset;

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes)
      for (const t of n.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const tierCounts = useMemo(() => {
    const m = new Map<Tier, number>();
    for (const n of nodes) m.set(n.tier, (m.get(n.tier) ?? 0) + 1);
    return m;
  }, [nodes]);

  const filtered = useMemo(
    () =>
      nodes.filter(
        (n) => (!tier || n.tier === tier) && (!tag || n.tags.includes(tag)),
      ),
    [nodes, tier, tag],
  );
  const activeSlugs = useMemo(
    () => new Set(filtered.map((n) => n.slug)),
    [filtered],
  );

  const selectedNode = nodes.find((n) => n.slug === selected) ?? null;

  const promoteReady = nodes.filter((n) => n.diffusion.ready).length;
  const totalLoc = nodes.reduce((s, n) => s + n.signals.loc, 0);

  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* header */}
        <div className="mb-8 border-border border-b pb-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 font-mono text-[clamp(2.5rem,7vw,6rem)] font-black uppercase leading-[0.85] tracking-[-0.07em]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl font-mono text-muted-foreground text-sm">
            {t("description", { count: dataset.count })}
          </p>
        </div>

        {/* stat tiles */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Tile label={t("stats.analyzed")} value={dataset.count} />
          {TIER_ORDER.filter((t) => tierCounts.get(t)).map((t) => (
            <Tile
              key={t}
              label={tShared(`tiers.${t}`)}
              value={tierCounts.get(t) ?? 0}
              color={TIER_COLOR[t]}
              active={tier === t}
              onClick={() => setTier(tier === t ? null : t)}
            />
          ))}
          <Tile label={t("stats.promoReady")} value={promoteReady} />
          <Tile
            label={t("stats.totalLoc")}
            value={t("stats.locValue", { count: Math.round(totalLoc / 1000) })}
          />
        </div>

        {/* filter bar */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
            {t("filters.domain")}
          </span>
          <Chip
            active={!tag}
            onClick={() => setTag(null)}
            label={t("filters.all")}
          />
          {tagCounts.map(([t, c]) => (
            <Chip
              key={t}
              active={tag === t}
              onClick={() => setTag(tag === t ? null : t)}
              label={`${tagLabel(t)} ${c}`}
            />
          ))}
          {(tier || tag) && (
            <button
              type="button"
              onClick={() => {
                setTier(null);
                setTag(null);
              }}
              className="ml-2 font-mono text-accent text-xs underline underline-offset-4 hover:opacity-80"
            >
              {t("filters.clear")}
            </button>
          )}
        </div>

        {/* charts grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title={t("panels.triage.title")}
            subtitle={t("panels.triage.subtitle")}
          >
            <TriageQuadrant
              nodes={nodes}
              activeSlugs={activeSlugs}
              hover={hover}
              onHover={setHover}
              onSelect={setSelected}
            />
          </Panel>
          <Panel
            title={t("panels.overlap.title")}
            subtitle={t("panels.overlap.subtitle")}
          >
            <OverlapNetwork
              nodes={nodes}
              edges={edges}
              activeSlugs={activeSlugs}
              hover={hover}
              onHover={setHover}
              onSelect={setSelected}
            />
          </Panel>
        </div>

        {/* leaderboard */}
        <div className="mt-4">
          <Panel
            title={t("panels.leaderboard.title")}
            subtitle={t("panels.leaderboard.subtitle", {
              count: filtered.length,
            })}
          >
            <Leaderboard
              nodes={filtered}
              hover={hover}
              onHover={setHover}
              onSelect={setSelected}
            />
          </Panel>
        </div>

        {/* stack charts */}
        <div className="mt-4">
          <Panel
            title={t("panels.tech.title")}
            subtitle={t("panels.tech.subtitle")}
          >
            <StackCharts nodes={nodes} />
          </Panel>
        </div>
      </div>

      <ProjectDrawer
        node={selectedNode}
        onClose={() => setSelected(null)}
        onSelect={setSelected}
        all={nodes}
        edges={edges}
      />
    </section>
  );
}

function Tile({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  color?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`border bg-card px-4 py-3 text-left transition ${
        clickable ? "cursor-pointer hover:border-foreground" : "cursor-default"
      } ${active ? "border-foreground" : "border-border"}`}
    >
      <div
        className="font-mono text-3xl font-black tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </div>
    </button>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-2.5 py-1 font-mono text-xs transition ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-card">
      <div className="border-border border-b px-4 py-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
