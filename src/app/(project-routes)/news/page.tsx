import type { Metadata } from "next";
import { ProjectShell } from "../project-shell";
import { AidCentersWidget } from "./components/aid-centers-widget";
import { AparecioTimeline } from "./components/aparecio-timeline";
import { BreakingTicker } from "./components/breaking-ticker";
import { FactcheckTimeline } from "./components/factcheck-timeline";
import { SeismicWidget } from "./components/seismic-widget";
import { UsefulLinks } from "./components/useful-links";
import { VerifiedMediaTimeline } from "./components/verified-media-timeline";
import {
  aidCenters,
  aparecioEntries,
  breakingNews,
  factCheckEntries,
  verifiedMediaEntries,
} from "./mock-data";

export const metadata: Metadata = {
  title: "VERIVE News — Build4Venezuela",
  description:
    "Información crítica verificada sobre la crisis en Venezuela. Fact-checks, medios verificados y combate a la desinformación.",
};

export default function NewsPage() {
  return (
    <ProjectShell>
      {/* ── Hero Header ───────────────────────────────────────────── */}
      <section className="relative px-5 pt-16 pb-10 sm:px-8 sm:pt-20 sm:pb-12 lg:px-10">
        <div className="bg-grid absolute inset-0 -z-10 opacity-[0.04]" />

        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-destructive">
                Proyecto VERIVE — Hackathon Build4Venezuela
              </p>
              <h1 className="mt-3 font-mono text-[clamp(3.5rem,10vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.07em]">
                News
              </h1>
              <p className="mt-5 max-w-lg font-mono text-sm font-light uppercase leading-6 tracking-[0.12em] text-muted-foreground">
                Información crítica verificada. Combatimos rumores.
                <br />
                Lo que es real, lo que es falso, lo que importa ahora.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <a
                className="inline-flex h-10 items-center justify-center border border-primary px-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-background"
                href="/p/verive"
              >
                Ver proyecto &rarr;
              </a>
              <a
                className="inline-flex h-10 items-center justify-center border border-border px-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background"
                href="/projects"
              >
                Todos los proyectos
              </a>
            </div>
          </div>

          {/* Confidence legend */}
          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="text-muted-foreground/60">
              Niveles de confianza:
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 bg-primary" /> Verificado
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 bg-accent" /> En
              verificación
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 bg-destructive" />{" "}
              Desmentido
            </span>
          </div>
        </div>
      </section>

      {/* ── Breaking News Ticker ──────────────────────────────────── */}
      <BreakingTicker items={breakingNews} />

      {/* ── Useful Links ─────────────────────────────────────────── */}
      <UsefulLinks />

      {/* ── Main Content Grid ─────────────────────────────────────── */}
      <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* Left column: Timelines */}
          <div className="flex flex-col gap-12">
            <AparecioTimeline entries={aparecioEntries} />
            <VerifiedMediaTimeline entries={verifiedMediaEntries} />
            <FactcheckTimeline entries={factCheckEntries} />
          </div>

          {/* Right column: Widgets */}
          <div className="flex flex-col gap-12">
            <SeismicWidget />
            <AidCentersWidget centers={aidCenters} />

            {/* Quick info box */}
            <div className="border border-border bg-card p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground/60">
                Sobre VERIVE
              </p>
              <h3 className="mt-2 font-mono text-base font-bold uppercase tracking-[0.04em]">
                Política de verificación
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5 font-mono text-xs font-light leading-relaxed tracking-[0.04em] text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 bg-primary" />
                  <span>
                    <strong className="font-bold text-foreground">
                      Verificado:
                    </strong>{" "}
                    Confirmado por al menos 2 fuentes confiables.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 bg-accent" />
                  <span>
                    <strong className="font-bold text-foreground">
                      En verificación:
                    </strong>{" "}
                    Reportado pero no confirmado aún. Tratar con cautela.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 bg-destructive" />
                  <span>
                    <strong className="font-bold text-foreground">
                      Desmentido:
                    </strong>{" "}
                    Información comprobada como falsa o engañosa.
                  </span>
                </li>
              </ul>
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                  Lista blanca de medios: máximo 15 fuentes curadas. Todo
                  fact-check incluye afirmación, veredicto, explicación y fuente
                  con enlace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Data disclaimer ───────────────────────────────────────── */}
      <section className="border-t border-border px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase leading-5 tracking-[0.16em] text-muted-foreground/40">
            ⚠ Los datos mostrados en esta página son de ejemplo (mock) para
            desarrollo durante el hackathon. Las secciones &quot;Apareció&quot;, &quot;Centros
            de acopio&quot; y &quot;Monitoreo sísmico&quot; están preparadas para consumir APIs
            externas de otros equipos. Cuando esas APIs estén disponibles, los
            datos reales reemplazarán automáticamente esta información de
            ejemplo.
          </p>
        </div>
      </section>
    </ProjectShell>
  );
}
