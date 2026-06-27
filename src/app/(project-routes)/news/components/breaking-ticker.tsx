"use client";

import { useEffect, useState } from "react";
import {
  type BreakingNewsItem,
  confidenceConfig,
  relativeTime,
} from "../mock-data";

export function BreakingTicker({ items }: { items: BreakingNewsItem[] }) {
  const [, setTick] = useState(0);

  // Re-render every 30s to update relative timestamps
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="ticker-wrap relative w-full overflow-hidden border-y border-border bg-card">
      <div className="ticker-track flex w-max gap-0">
        {doubled.map((item, index) => {
          const conf = confidenceConfig[item.confidence];
          return (
            <div
              className="flex shrink-0 items-center gap-3 border-r border-border px-5 py-3 sm:px-6 sm:py-3.5"
              key={`${item.id}-${index}`}
            >
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-none border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${conf.className}`}
              >
                <span aria-hidden="true">{conf.icon}</span>
                {conf.label}
              </span>
              <span className="font-mono text-xs font-light leading-snug tracking-[0.04em] text-foreground sm:text-sm">
                {item.text}
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {relativeTime(item.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
