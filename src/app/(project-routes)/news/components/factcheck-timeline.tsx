"use client";

import { useEffect, useState } from "react";
import {
  type FactCheckEntry,
  relativeTime,
  verdictConfig,
} from "../mock-data";

function shareToWhatsApp(claim: string, verdict: string) {
  const text = `⚠️ Fact-check VERIVE:\n\n"${claim}"\n\n→ Veredicto: ${verdict}\n\nMás info en build4venezuela.com/news`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function FactcheckTimeline({
  entries,
}: {
  entries: FactCheckEntry[];
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
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-destructive">
            Fact-check
          </p>
          <h3 className="mt-1 font-mono text-xl font-black uppercase tracking-[-0.02em] sm:text-2xl">
            Desmentidas
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-px bg-border">
        {entries.map((entry) => {
          const verdict = verdictConfig[entry.verdict];
          return (
            <article
              className="flex flex-col gap-3 bg-background p-4 sm:p-5"
              key={entry.id}
            >
              {/* Claim */}
              <p className="font-mono text-sm font-light leading-relaxed tracking-[0.03em] text-foreground/90">
                &ldquo;{entry.claim}&rdquo;
              </p>

              {/* Verdict badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center border px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.18em] ${verdict.className}`}
                >
                  {verdict.label}
                </span>
              </div>

              {/* Explanation */}
              <p className="font-mono text-xs font-light leading-relaxed tracking-[0.04em] text-muted-foreground">
                {entry.explanation}
              </p>

              {/* Source + actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent transition hover:text-foreground"
                  href={entry.sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Fuente: {entry.sourceName} &rarr;
                </a>
                <div className="flex items-center gap-3">
                  <button
                    className="inline-flex cursor-pointer items-center gap-1 border border-[#25D366]/30 bg-[#25D366]/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#25D366] transition hover:bg-[#25D366]/20"
                    onClick={() =>
                      shareToWhatsApp(entry.claim, verdict.label)
                    }
                    type="button"
                  >
                    Compartir
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                    {relativeTime(entry.checkedAt)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
