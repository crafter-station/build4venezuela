"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SECURITY_RISK_COLOR,
  SECURITY_RISK_RANK,
  SEVERITY_RANK,
  TIER_COLOR,
} from "@/lib/insights/constants";
import type { InsightNode } from "@/lib/insights/types";

type SortKey =
  | "viability"
  | "production"
  | "product"
  | "diffusion"
  | "maturity"
  | "stars"
  | "loc"
  | "severity"
  | "security";

const COLS: SortKey[] = [
  "viability",
  "production",
  "product",
  "diffusion",
  "maturity",
  "severity",
  "security",
  "stars",
  "loc",
];

function val(n: InsightNode, k: SortKey): number {
  if (k === "stars") return n.signals.stars;
  if (k === "loc") return n.signals.loc;
  if (k === "severity") return SEVERITY_RANK[n.severity];
  if (k === "security") return SECURITY_RISK_RANK[n.security?.risk ?? "none"];
  return n.scores[k];
}

export function Leaderboard({
  nodes,
  hover,
  onHover,
  onSelect,
}: {
  nodes: InsightNode[];
  hover: string | null;
  onHover: (s: string | null) => void;
  onSelect: (s: string) => void;
}) {
  const t = useTranslations("Insights.leaderboard");
  const tShared = useTranslations("Insights.shared");
  const [sort, setSort] = useState<SortKey>("viability");

  const rows = useMemo(
    () =>
      [...nodes].sort((a, b) => {
        const d = val(b, sort) - val(a, sort);
        return d !== 0 ? d : b.scores.viability - a.scores.viability;
      }),
    [nodes, sort],
  );

  return (
    <TooltipProvider delay={150}>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="font-mono text-[10px] uppercase tracking-widest">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-4" />
                  }
                >
                  {t("columns.project.label")}
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  {t("columns.project.description")}
                </TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-4" />
                  }
                >
                  {t("columns.tier.label")}
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  {t("columns.tier.description")}
                </TooltipContent>
              </Tooltip>
            </TableHead>
            {COLS.map((column) => (
              <TableHead key={column} className="text-right">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => setSort(column)}
                        className={`cursor-help font-mono text-[10px] uppercase tracking-widest hover:text-foreground ${
                          sort === column
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    }
                  >
                    {t(`columns.${column}.label`)}
                    {sort === column ? " ↓" : ""}
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end">
                    {t(`columns.${column}.description`)}
                  </TooltipContent>
                </Tooltip>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((n) => (
            <TableRow
              key={n.slug}
              onMouseEnter={() => onHover(n.slug)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(n.slug)}
              className={`cursor-pointer border-border ${
                hover === n.slug ? "bg-muted" : ""
              }`}
            >
              <TableCell className="max-w-[260px]">
                <div className="truncate font-mono font-bold">{n.name}</div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  {n.type}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className="inline-block whitespace-nowrap border px-1.5 py-0.5 font-mono text-[10px]"
                  style={{
                    color: TIER_COLOR[n.tier],
                    borderColor: TIER_COLOR[n.tier],
                  }}
                >
                  {tShared(`tiers.${n.tier}`)}
                </span>
              </TableCell>
              <ScoreCell v={n.scores.viability} />
              <ScoreCell v={n.scores.production} />
              <ScoreCell v={n.scores.product} />
              <ScoreCell v={n.scores.diffusion} />
              <ScoreCell v={n.scores.maturity} />
              <TableCell className="text-right font-mono text-[10px] text-muted-foreground uppercase">
                {n.severity}
              </TableCell>
              <TableCell className="text-right">
                <RiskBadge
                  node={n}
                  label={t(`risk.${n.security?.risk ?? "none"}`)}
                />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {n.signals.stars}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {n.signals.loc >= 1000
                  ? `${Math.round(n.signals.loc / 1000)}k`
                  : n.signals.loc}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}

function RiskBadge({ node, label }: { node: InsightNode; label: string }) {
  const risk = node.security?.risk ?? "none";
  const color = SECURITY_RISK_COLOR[risk];
  return (
    <span
      className="inline-block whitespace-nowrap border px-1.5 py-0.5 font-mono text-[10px] uppercase"
      style={{ color, borderColor: color }}
    >
      {label}
    </span>
  );
}

function ScoreCell({ v }: { v: number }) {
  const color =
    v >= 4 ? "#ffd83d" : v >= 3 ? "#16c7e8" : v >= 2 ? "#a6a6a6" : "#ff4a63";
  return (
    <TableCell className="text-right">
      <span className="font-mono font-bold tabular-nums" style={{ color }}>
        {v || "–"}
      </span>
    </TableCell>
  );
}
