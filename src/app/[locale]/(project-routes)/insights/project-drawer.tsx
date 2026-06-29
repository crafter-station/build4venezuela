"use client";

import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SCORE_KEYS,
  TIER_COLOR,
  TIER_LABEL,
  tagLabel,
} from "@/lib/insights/constants";
import type { InsightEdge, InsightNode } from "@/lib/insights/types";

export function ProjectDrawer({
  node,
  all,
  edges,
  onClose,
  onSelect,
}: {
  node: InsightNode | null;
  all: InsightNode[];
  edges: InsightEdge[];
  onClose: () => void;
  onSelect: (s: string) => void;
}) {
  const overlaps = useMemo(() => {
    if (!node) return [];
    const out: { slug: string; name: string; shared: string[] }[] = [];
    for (const e of edges) {
      if (e.source === node.slug || e.target === node.slug) {
        const other = e.source === node.slug ? e.target : e.source;
        const on = all.find((n) => n.slug === other);
        if (on) out.push({ slug: other, name: on.name, shared: e.shared });
      }
    }
    return out.sort((a, b) => b.shared.length - a.shared.length);
  }, [node, edges, all]);

  const radarData = node
    ? SCORE_KEYS.map((s) => ({
        axis: s.label,
        value: node.scores[s.key],
      }))
    : [];

  return (
    <Sheet open={!!node} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto"
        style={{ maxWidth: "min(42rem, 100vw)" }}
      >
        {node && (
          <>
            <SheetHeader className="border-border border-b">
              <div className="flex items-center gap-2">
                <span
                  className="border px-1.5 py-0.5 font-mono text-[10px]"
                  style={{
                    color: TIER_COLOR[node.tier],
                    borderColor: TIER_COLOR[node.tier],
                  }}
                >
                  {TIER_LABEL[node.tier]}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  {node.type} · {node.severity}
                </span>
              </div>
              <SheetTitle className="font-mono text-2xl font-black uppercase leading-tight tracking-tight">
                {node.name}
              </SheetTitle>
              {node.onePitch && (
                <SheetDescription className="font-mono text-sm italic">
                  “{node.onePitch}”
                </SheetDescription>
              )}
              <div className="mt-1 flex flex-wrap gap-3 font-mono text-[11px]">
                {node.repoUrl && <Link href={node.repoUrl} label="repo ↗" />}
                {node.liveUrl && /^https?:/.test(node.liveUrl) && (
                  <Link href={node.liveUrl} label="live ↗" />
                )}
                {node.videoUrl && <Link href={node.videoUrl} label="video ↗" />}
              </div>
            </SheetHeader>

            <div className="space-y-6 px-4 py-5">
              {/* radar + signals */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border border-border">
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid stroke="#262626" />
                      <PolarAngleAxis
                        dataKey="axis"
                        tick={{
                          fill: "#a6a6a6",
                          fontSize: 9,
                          fontFamily: "monospace",
                        }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 5]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        dataKey="value"
                        stroke={TIER_COLOR[node.tier]}
                        fill={TIER_COLOR[node.tier]}
                        fillOpacity={0.35}
                        isAnimationActive={false}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <Sig label="Stars" value={node.signals.stars} />
                  <Sig label="Commits" value={node.signals.commits} />
                  <Sig label="LOC" value={node.signals.loc.toLocaleString()} />
                  <Sig label="Contributors" value={node.signals.contributors} />
                  <Sig label="License" value={node.signals.license ?? "none"} />
                  <Sig label="Real problem" value={node.solvesRealProblem} />
                  <Sig label="Live demo" value={node.liveDemoStatus} />
                  <Sig
                    label="ORM"
                    value={node.stack.usesOrm ? "yes" : "raw SQL"}
                  />
                </div>
              </div>

              <Section title="Summary">
                <p className="font-mono text-xs text-muted-foreground">
                  {node.summary}
                </p>
              </Section>

              <Section title="Stack">
                <StackLine label="Frontend" items={node.stack.frontend} />
                <StackLine label="Backend" items={node.stack.backend} />
                <StackLine label="Database" items={node.stack.database} />
                {node.stack.ai_ml.length > 0 && (
                  <StackLine label="AI/ML" items={node.stack.ai_ml} />
                )}
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {node.stack.pattern}
                </p>
              </Section>

              <Section title="Domain tags">
                <div className="flex flex-wrap gap-1.5">
                  {node.tags.map((t) => (
                    <span
                      key={t}
                      className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {tagLabel(t)}
                    </span>
                  ))}
                </div>
              </Section>

              {overlaps.length > 0 && (
                <Section title={`Overlaps with (${overlaps.length})`}>
                  <div className="space-y-1.5">
                    {overlaps.map((o) => (
                      <button
                        key={o.slug}
                        type="button"
                        onClick={() => onSelect(o.slug)}
                        className="flex w-full items-center justify-between gap-2 border border-border px-2 py-1.5 text-left font-mono text-xs hover:border-foreground"
                      >
                        <span className="truncate font-bold">{o.name}</span>
                        <span className="shrink-0 text-accent text-[10px]">
                          {o.shared.length} shared
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {node.redFlags.length > 0 && (
                <Section title="Red flags">
                  <ul className="space-y-1">
                    {node.redFlags.map((r) => (
                      <li
                        key={r}
                        className="font-mono text-[11px] text-destructive"
                      >
                        — {r}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="Diffusion readiness">
                <p className="font-mono text-xs">
                  {node.diffusion.ready ? (
                    <span className="text-primary">Ready to promote</span>
                  ) : (
                    <span className="text-muted-foreground">Not yet</span>
                  )}
                  {node.diffusion.assets.length > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      · assets: {node.diffusion.assets.join(", ")}
                    </span>
                  )}
                </p>
                {node.diffusion.angle && (
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    <span className="text-foreground">Angle:</span>{" "}
                    {node.diffusion.angle}
                  </p>
                )}
              </Section>

              <Section title="Merge potential">
                <p className="font-mono text-[11px] text-muted-foreground">
                  {node.mergePotential}
                </p>
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 font-mono text-[10px] text-accent uppercase tracking-widest">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Sig({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border px-2 py-1.5">
      <div className="truncate font-bold tabular-nums">{value}</div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

function StackLine({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <p className="font-mono text-[11px]">
      <span className="text-muted-foreground">{label}:</span> {items.join(", ")}
    </p>
  );
}

function Link({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-4 hover:opacity-80"
    >
      {label}
    </a>
  );
}
