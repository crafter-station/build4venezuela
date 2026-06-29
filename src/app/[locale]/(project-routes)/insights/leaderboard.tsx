"use client";

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
  SEVERITY_RANK,
  TIER_COLOR,
  TIER_LABEL,
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
  | "severity";

const COLS: { key: SortKey; label: string; desc: string }[] = [
  {
    key: "viability",
    label: "Viab",
    desc: "Viability (1–5): how realistically this can be deployed and maintained to actually help victims — weighs maturity, production-readiness, and how complete the core function is.",
  },
  {
    key: "production",
    label: "Prod",
    desc: "Production-readiness (1–5): auth, error handling, logging, secret handling, security, scalability, and deploy config in the code.",
  },
  {
    key: "product",
    label: "Prod-Q",
    desc: "Product quality (1–5): how complete and usable the actual product is (not the code) — judged from the live demo where one exists.",
  },
  {
    key: "diffusion",
    label: "Diff",
    desc: "Diffusion readiness (1–5): how ready it is to create promo/social content right now — working demo, video, screenshots, clear value prop.",
  },
  {
    key: "maturity",
    label: "Mat",
    desc: "Maturity (1–5): real working software vs. boilerplate — real logic, tests, CI, commit history, README.",
  },
  {
    key: "severity",
    label: "Sev",
    desc: "Problem severity: how urgent the victim-facing problem it addresses is (critical › high › medium › low).",
  },
  {
    key: "stars",
    label: "★",
    desc: "GitHub stars on the repository — a rough popularity / social-proof signal.",
  },
  {
    key: "loc",
    label: "LOC",
    desc: "Lines of code in real source files (excludes dependencies and build output) — a rough size/effort signal.",
  },
];

const COL_PROJECT_DESC =
  "The project name and its repository type (web app, PWA, bot, etc.). Click a row to open full detail.";
const COL_TIER_DESC =
  "Overall recommendation: Spotlight (back heavily) › Promote › Merge candidate › Improve first › Deprioritize.";

function val(n: InsightNode, k: SortKey): number {
  if (k === "stars") return n.signals.stars;
  if (k === "loc") return n.signals.loc;
  if (k === "severity") return SEVERITY_RANK[n.severity];
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
                  Project
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  {COL_PROJECT_DESC}
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
                  Tier
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  {COL_TIER_DESC}
                </TooltipContent>
              </Tooltip>
            </TableHead>
            {COLS.map((c) => (
              <TableHead key={c.key} className="text-right">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => setSort(c.key)}
                        className={`cursor-help font-mono text-[10px] uppercase tracking-widest hover:text-foreground ${
                          sort === c.key
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    }
                  >
                    {c.label}
                    {sort === c.key ? " ↓" : ""}
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end">
                    {c.desc}
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
                  {TIER_LABEL[n.tier]}
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
