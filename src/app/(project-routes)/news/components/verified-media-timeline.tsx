"use client";

import { useEffect, useState } from "react";
import {
  type VerifiedMediaEntry,
  confidenceConfig,
  relativeTime,
} from "../mock-data";

export function VerifiedMediaTimeline({
  entries,
}: {
  entries: VerifiedMediaEntry[];
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Medios verificados
          </p>
          <h3 className="mt-1 font-mono text-xl font-black uppercase tracking-[-0.02em] sm:text-2xl">
            En tiempo real
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
          {entries.length} fuentes
        </span>
      </div>

      <div className="flex flex-col gap-px bg-border">
        {entries.map((entry) => {
          const conf = confidenceConfig[entry.confidence];
          return (
            <a
              className="group flex flex-col gap-3 bg-background p-4 transition hover:bg-card sm:p-5"
              href={entry.url}
              key={entry.id}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-foreground transition group-hover:text-primary">
                  {entry.source}
                </span>
                <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground/60">
                  {entry.sourceHandle}
                </span>
                <span
                  className={`ml-auto inline-flex items-center border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${conf.className}`}
                >
                  {conf.icon} {conf.label}
                </span>
              </div>
              <p className="font-mono text-sm font-light leading-relaxed tracking-[0.03em] text-foreground/80">
                {entry.content}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary opacity-0 transition group-hover:opacity-100">
                  Ver fuente &rarr;
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  {relativeTime(entry.publishedAt)}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
