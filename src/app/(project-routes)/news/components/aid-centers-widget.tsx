"use client";

import { useEffect, useState } from "react";
import { type AidCenter, aidCenterTypeConfig, relativeTime } from "../mock-data";

export function AidCentersWidget({ centers }: { centers: AidCenter[] }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
            API Externa — Centros de ayuda
          </p>
          <h3 className="mt-1 font-mono text-xl font-black uppercase tracking-[-0.02em] sm:text-2xl">
            Acopio y refugio
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-none border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Mock
        </span>
      </div>

      <div className="flex flex-col gap-px bg-border">
        {centers.map((center) => {
          const typeConf = aidCenterTypeConfig[center.type];
          return (
            <article
              className="flex flex-col gap-3 bg-background p-4 sm:p-5"
              key={center.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <h4 className="font-mono text-sm font-bold tracking-[0.02em] text-foreground">
                    {center.name}
                  </h4>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {center.address} — {center.state}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${typeConf.className}`}
                >
                  {typeConf.label}
                </span>
              </div>

              {/* Needs */}
              <div className="flex flex-wrap gap-1.5">
                {center.needs.map((need) => (
                  <span
                    className="inline-flex border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/70"
                    key={need}
                  >
                    {need}
                  </span>
                ))}
              </div>

              {/* Last updated */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                  {center.active ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7cff6b]" />
                      Activo
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Inactivo
                    </>
                  )}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                  Actualizado {relativeTime(center.lastUpdated)}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
        Fuente: Equipo idea 01 — Datos de ejemplo (mock)
      </p>
    </div>
  );
}
