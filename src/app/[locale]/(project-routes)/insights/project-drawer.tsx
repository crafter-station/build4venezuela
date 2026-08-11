"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  FINDING_STATUS_COLOR,
  SCORE_KEYS,
  SECURITY_RISK_COLOR,
  TIER_COLOR,
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
  const t = useTranslations("Insights.drawer");
  const tShared = useTranslations("Insights.shared");
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
        axis: t(`scores.${s.key}`),
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
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-mono text-[10px]"
                  style={{
                    color: TIER_COLOR[node.tier],
                    borderColor: TIER_COLOR[node.tier],
                  }}
                >
                  {tShared(`tiers.${node.tier}`)}
                </Badge>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  {node.type} · {node.severity}
                </span>
                {node.security && node.security.risk !== "none" && (
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] uppercase"
                    style={{
                      color: SECURITY_RISK_COLOR[node.security.risk],
                      borderColor: SECURITY_RISK_COLOR[node.security.risk],
                    }}
                  >
                    {t("security.badge", {
                      risk: t(`security.risk.${node.security.risk}`),
                    })}
                  </Badge>
                )}
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
                {node.repoUrl && (
                  <Link href={node.repoUrl} label={t("links.repo")} />
                )}
                {node.liveUrl && /^https?:/.test(node.liveUrl) && (
                  <Link href={node.liveUrl} label={t("links.live")} keepReferrer />
                )}
                {node.videoUrl && (
                  <Link href={node.videoUrl} label={t("links.video")} />
                )}
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 py-5">
              {/* radar + signals */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card size="sm" className="py-0">
                  <CardContent className="px-0">
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData} outerRadius="72%">
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis
                          dataKey="axis"
                          tick={{
                            fill: "var(--muted-foreground)",
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
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <Sig label={t("signals.stars")} value={node.signals.stars} />
                  <Sig
                    label={t("signals.commits")}
                    value={node.signals.commits}
                  />
                  <Sig
                    label={t("signals.loc")}
                    value={node.signals.loc.toLocaleString()}
                  />
                  <Sig
                    label={t("signals.contributors")}
                    value={node.signals.contributors}
                  />
                  <Sig
                    label={t("signals.license")}
                    value={node.signals.license ?? t("none")}
                  />
                  <Sig
                    label={t("signals.realProblem")}
                    value={node.solvesRealProblem}
                  />
                  <Sig
                    label={t("signals.liveDemo")}
                    value={node.liveDemoStatus}
                  />
                  <Sig
                    label={t("signals.orm")}
                    value={node.stack.usesOrm ? t("yes") : t("rawSql")}
                  />
                </div>
              </div>

              {node.security && (
                <Section title={t("sections.security")}>
                  <SecurityBlock security={node.security} />
                </Section>
              )}

              <Section title={t("sections.summary")}>
                <p className="font-mono text-xs text-muted-foreground">
                  {node.summary}
                </p>
              </Section>

              <Section title={t("sections.stack")}>
                <StackLine
                  label={t("stack.frontend")}
                  items={node.stack.frontend}
                />
                <StackLine
                  label={t("stack.backend")}
                  items={node.stack.backend}
                />
                <StackLine
                  label={t("stack.database")}
                  items={node.stack.database}
                />
                {node.stack.ai_ml.length > 0 && (
                  <StackLine label={t("stack.aiMl")} items={node.stack.ai_ml} />
                )}
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {node.stack.pattern}
                </p>
              </Section>

              <Section title={t("sections.domainTags")}>
                <div className="flex flex-wrap gap-1.5">
                  {node.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="font-mono text-[10px] text-muted-foreground"
                    >
                      {tagLabel(t)}
                    </Badge>
                  ))}
                </div>
              </Section>

              {overlaps.length > 0 && (
                <Section
                  title={t("sections.overlaps", { count: overlaps.length })}
                >
                  <div className="flex flex-col gap-1.5">
                    {overlaps.map((o) => (
                      <Button
                        key={o.slug}
                        type="button"
                        onClick={() => onSelect(o.slug)}
                        variant="outline"
                        size="sm"
                        className="w-full justify-between font-mono"
                      >
                        <span className="truncate font-bold">{o.name}</span>
                        <Badge
                          variant="secondary"
                          className="shrink-0 font-mono"
                        >
                          {t("sharedCount", { count: o.shared.length })}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </Section>
              )}

              {node.redFlags.length > 0 && (
                <Section title={t("sections.redFlags")}>
                  <ul className="flex flex-col gap-1">
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

              <Section title={t("sections.diffusionReadiness")}>
                <p className="font-mono text-xs">
                  {node.diffusion.ready ? (
                    <span className="text-primary">{t("readyToPromote")}</span>
                  ) : (
                    <span className="text-muted-foreground">{t("notYet")}</span>
                  )}
                  {node.diffusion.assets.length > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      ·{" "}
                      {t("assets", {
                        assets: node.diffusion.assets.join(", "),
                      })}
                    </span>
                  )}
                </p>
                {node.diffusion.angle && (
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    <span className="text-foreground">{t("angle")}</span>{" "}
                    {node.diffusion.angle}
                  </p>
                )}
              </Section>

              <Section title={t("sections.mergePotential")}>
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

function SecurityBlock({ security }: { security: InsightNode["security"] }) {
  const t = useTranslations("Insights.drawer.security");
  if (!security) return null;
  const color = SECURITY_RISK_COLOR[security.risk];

  const reaudited = Boolean(security.reauditedAt);
  const improved =
    security.previousRisk != null && security.previousRisk !== security.risk;
  const allResolved =
    reaudited &&
    security.findings.length > 0 &&
    security.findings.every((f) => f.status === "resolved");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="font-mono text-[10px] uppercase"
          style={{ color, borderColor: color }}
        >
          {t("badge", { risk: t(`risk.${security.risk}`) })}
        </Badge>
        {improved && security.previousRisk && (
          <span className="font-mono text-[10px] text-muted-foreground line-through">
            {t("previously", { risk: t(`risk.${security.previousRisk}`) })}
          </span>
        )}
        <span className="font-mono text-[10px] text-muted-foreground">
          {reaudited && security.reauditedAt
            ? t("reauditedAt", { date: security.reauditedAt })
            : t("auditedAt", { date: security.auditedAt })}
        </span>
      </div>

      {security.notAudited ? (
        <p className="font-mono text-[11px] text-muted-foreground">
          {t("notAudited")}
        </p>
      ) : security.findings.length > 0 ? (
        <>
          {allResolved && (
            <p
              className="font-mono text-[11px]"
              style={{ color: FINDING_STATUS_COLOR.resolved }}
            >
              {t("allResolved")}
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {security.findings.map((f) => (
              <li
                key={f.title}
                className="flex gap-2 font-mono text-[11px] text-foreground"
              >
                <span
                  className="shrink-0 font-bold uppercase"
                  style={{ color: SECURITY_RISK_COLOR[f.severity] }}
                >
                  {f.severity}
                </span>
                <span
                  className={
                    f.status === "resolved"
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground"
                  }
                >
                  {f.title}
                </span>
                {f.status && (
                  <Badge
                    variant="outline"
                    className="ml-auto h-5 shrink-0 self-start px-1 font-bold text-[9px] uppercase"
                    style={{
                      color: FINDING_STATUS_COLOR[f.status],
                      borderColor: FINDING_STATUS_COLOR[f.status],
                    }}
                  >
                    {t(`status.${f.status}`)}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="font-mono text-[11px]" style={{ color }}>
          {t("clean")}
        </p>
      )}

      {reaudited && security.reauditNote && (
        <p className="font-mono text-[11px] text-muted-foreground italic">
          {security.reauditNote}
        </p>
      )}

      {security.issueUrl && (
        <a
          href={security.issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-mono text-[11px] text-accent underline underline-offset-4 hover:opacity-80"
        >
          {t("issueLink")}
        </a>
      )}
    </div>
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
    <Card size="sm" className="py-2">
      <CardContent className="flex flex-col gap-0.5 px-3">
        <div className="truncate font-bold tabular-nums">{value}</div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
          {label}
        </div>
      </CardContent>
    </Card>
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

function Link({
  href,
  label,
  keepReferrer = false,
}: {
  href: string;
  label: string;
  keepReferrer?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      // keepReferrer: live_url links omit noreferrer so destinations see traffic came from here
      rel={keepReferrer ? undefined : "noopener noreferrer"}
      className="text-accent underline underline-offset-4 hover:opacity-80"
    >
      {label}
    </a>
  );
}
