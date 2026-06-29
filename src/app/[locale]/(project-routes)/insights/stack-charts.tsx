"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InsightNode } from "@/lib/insights/types";

// canonical tech keywords matched against the (verbose) stack strings
const TECH = [
  "React",
  "Next.js",
  "Vite",
  "Tailwind",
  "TypeScript",
  "Supabase",
  "Node",
  "Express",
  "FastAPI",
  "Python",
  "PostgreSQL",
  "Firebase",
  "SQLite",
  "MongoDB",
  "Vanilla JS",
  "Leaflet",
  "Telegram",
  "WhatsApp",
];

const DB = ["Supabase", "PostgreSQL", "Firebase", "SQLite", "MongoDB", "Redis"];

function countTech(
  nodes: InsightNode[],
  pool: string[],
  fields: (keyof InsightNode["stack"])[],
) {
  const counts = new Map<string, number>();
  for (const n of nodes) {
    const hay = fields
      .flatMap((f) => n.stack[f] as unknown as string[])
      .join(" | ")
      .toLowerCase();
    const seen = new Set<string>();
    for (const t of pool) {
      const needle = t.toLowerCase().replace(".js", "");
      if (hay.includes(needle) && !seen.has(t)) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
        seen.add(t);
      }
    }
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function StackCharts({ nodes }: { nodes: InsightNode[] }) {
  const t = useTranslations("Insights.stackCharts");
  const tech = useMemo(
    () =>
      countTech(nodes, TECH, ["frontend", "backend", "database"]).slice(0, 12),
    [nodes],
  );
  const dbs = useMemo(
    () => countTech(nodes, DB, ["database", "backend"]),
    [nodes],
  );

  const types = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) {
      const projectType = n.type.toLowerCase();
      const bucket = projectType.includes("telegram")
        ? "types.telegramBot"
        : projectType.includes("whatsapp")
          ? "types.whatsappBot"
          : projectType.includes("android") || projectType.includes("mobile")
            ? "types.mobileApp"
            : projectType.includes("pwa")
              ? "types.pwa"
              : projectType.includes("static") ||
                  projectType.includes("jamstack")
                ? "types.staticSite"
                : projectType.includes("api") ||
                    projectType.includes("pipeline")
                  ? "types.apiPipeline"
                  : "types.webApp";
      const label = t(bucket);
      m.set(label, (m.get(label) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [nodes, t]);

  const orm = useMemo(() => {
    let withOrm = 0;
    for (const n of nodes) if (n.stack.usesOrm) withOrm++;
    return [
      { name: t("dataLayer.rawSql"), value: nodes.length - withOrm },
      { name: t("dataLayer.orm"), value: withOrm },
    ];
  }, [nodes, t]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <ChartBlock title={t("titles.tech")} data={tech} color="#16c7e8" />
      <ChartBlock title={t("titles.types")} data={types} color="#ffd83d" />
      <ChartBlock title={t("titles.databases")} data={dbs} color="#b388ff" />
      <ChartBlock title={t("titles.dataLayer")} data={orm} color="#ff4a63" />
    </div>
  );
}

function ChartBlock({
  title,
  data,
  color,
}: {
  title: string;
  data: { name: string; value: number }[];
  color: string;
}) {
  return (
    <div>
      <h3 className="mb-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        {title}
      </h3>
      <ResponsiveContainer
        width="100%"
        height={Math.max(120, data.length * 26)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fill: "#ddd", fontSize: 11, fontFamily: "monospace" }}
            stroke="#333"
          />
          <Tooltip
            cursor={{ fill: "#ffffff10" }}
            contentStyle={{
              background: "#080808",
              border: "1px solid #262626",
              fontFamily: "monospace",
              fontSize: 12,
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Bar dataKey="value" isAnimationActive={false} radius={0}>
            {data.map((d) => (
              <Cell key={d.name} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
