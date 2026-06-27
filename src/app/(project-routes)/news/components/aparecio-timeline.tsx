"use client";

import { useEffect, useState } from "react";
import { type AparecioEntry, relativeTime } from "../mock-data";

const sourceLabels: Record<AparecioEntry["source"], string> = {
  familiar: "Familiar",
  voluntario: "Voluntario",
  medio: "Medio",
};

const statusConfig: Record<
  AparecioEntry["status"],
  { label: string; className: string }
> = {
  safe: {
    label: "A salvo",
    className: "bg-[#7cff6b]/15 text-[#7cff6b] border-[#7cff6b]/30",
  },
  located: {
    label: "Localizado/a",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  hospitalized: {
    label: "Hospitalizado/a",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export function AparecioTimeline({ entries }: { entries: AparecioEntry[] }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
              API Externa — Reencuentros
            </p>
            <h3 className="mt-1 font-mono text-xl font-black uppercase tracking-[-0.02em] sm:text-2xl">
              Personas localizadas
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-none border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Mock
          </span>
        </div>
        <p className="font-mono text-[10px] font-light leading-relaxed tracking-[0.06em] text-muted-foreground/60">
          Consume la API del proyecto{" "}
          <a
            className="text-accent underline transition hover:text-foreground"
            href="/p/reencuentros"
          >
            Reencuentros Terremotos Venezuela
          </a>{" "}
          — Plataforma para centralizar imágenes/videos de personas y animales
          encontrados. Cuando el endpoint esté disponible, los datos reales
          reemplazarán este mock.
        </p>
      </div>

      <div className="flex flex-col gap-px bg-border">
        {entries.map((entry) => {
          const status = statusConfig[entry.status];
          return (
            <article
              className="flex flex-col gap-3 bg-background p-4 sm:p-5"
              key={entry.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-mono text-base font-bold tracking-[0.02em] text-foreground">
                  {entry.name}
                </h4>
                <span
                  className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <span>{entry.state}</span>
                <span className="text-border">|</span>
                <span>{entry.lastKnownLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  Fuente: {sourceLabels[entry.source]}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  {relativeTime(entry.foundAt)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
