import Link from "next/link";
import { ProjectCard } from "@/components/project-card";
import {
  isProjectApplicableTo,
  type ProjectApplicability,
  type ProjectLifecycleStatus,
} from "@/lib/projects/schema";
import { getCachedProjects } from "@/lib/projects/store";

type Country = "venezuela" | "colombia";

const countryContent = {
  venezuela: {
    code: "VE",
    name: "Venezuela",
    eyebrow: "El origen de esta red",
    description:
      "Build4Latam nació como Build4Venezuela: una respuesta abierta para conectar ayuda, información y tecnología después de los terremotos. El trabajo continúa.",
    otherHref: "/co",
    otherLabel: "Ir a Colombia",
  },
  colombia: {
    code: "CO",
    name: "Colombia",
    eyebrow: "La red cruza fronteras",
    description:
      "La emergencia ahora también golpea a Colombia. Reunimos nuevas iniciativas y herramientas del hackathon venezolano que pueden adaptarse y usarse aquí.",
    otherHref: "/ve",
    otherLabel: "Ir a Venezuela",
  },
} as const;

const applicabilityLabels: Record<ProjectApplicability, string> = {
  latam: "Reusable en LATAM",
  venezuela: "Específico para Venezuela",
  colombia: "Específico para Colombia",
};

const lifecycleLabels: Record<ProjectLifecycleStatus, string> = {
  ready_to_use: "Listo para usar",
  in_development: "En desarrollo",
  idea: "Idea",
};

export async function CountryHub({ country }: { country: Country }) {
  const content = countryContent[country];
  const projects = (await getCachedProjects()).filter((project) =>
    isProjectApplicableTo(project, country),
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-line border-b px-5 sm:px-8 lg:px-10">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 font-mono uppercase"
        >
          <Link
            className="ui-focus text-sm font-black tracking-[0.2em] transition-colors duration-150 ease-[var(--ease-out)] hover:text-primary"
            href="/"
          >
            Build4Latam
          </Link>
          <div className="flex items-center gap-3 text-[0.65rem] font-bold tracking-[0.15em] sm:gap-6 sm:text-xs">
            <Link
              className="ui-focus transition-colors duration-150 ease-[var(--ease-out)] hover:text-primary"
              href={content.otherHref}
            >
              {content.otherLabel}
            </Link>
            <Link
              className="ui-focus transition-colors duration-150 ease-[var(--ease-out)] hover:text-accent"
              href="/es/projects"
            >
              Todos los proyectos
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden border-line border-b px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div
          aria-hidden="true"
          className="bg-grid absolute inset-0 opacity-[0.055]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] lg:items-end lg:gap-16">
          <div>
            <p className="ui-eyebrow text-accent">{content.eyebrow}</p>
            <h1 className="type-display mt-7 max-w-5xl text-balance font-mono">
              <span className="block">Construimos por</span>
              <span className="block text-primary">{content.name}.</span>
            </h1>
          </div>
          <aside className="border-line border-t pt-6 lg:border-primary lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-8">
            <p className="ui-eyebrow text-primary">
              {`/${content.code.toLowerCase()} // ${content.name}`}
            </p>
            <p className="type-body-lg mt-6 max-w-[38rem] font-mono text-ink-muted lg:max-w-[32ch]">
              {content.description}
            </p>
          </aside>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-8 border-line border-b pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <p className="ui-eyebrow text-primary">
                Herramientas disponibles
              </p>
              <h2 className="type-section mt-4 max-w-6xl text-balance font-mono">
                Úsalas. Adáptalas. Compártelas.
              </h2>
            </div>
            <div className="flex min-w-32 items-end justify-between gap-4 border-line border-t pt-4 sm:block sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <p className="font-mono text-4xl font-black leading-none text-foreground">
                {String(projects.length).padStart(2, "0")}
              </p>
              <p className="ui-eyebrow mt-2 text-ink-muted">
                {projects.length === 1 ? "proyecto" : "proyectos"}
              </p>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="grid gap-px bg-line md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <ProjectCard
                  applicabilityLabel={
                    applicabilityLabels[project.applicability]
                  }
                  href={`/es/p/${project.slug}`}
                  index={index + 1}
                  key={project.id}
                  lifecycleLabel={lifecycleLabels[project.lifecycleStatus]}
                  openLabel="Abrir"
                  project={project}
                  voteLabel={project.votesCount === 1 ? "voto" : "votos"}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border p-8 font-mono uppercase tracking-[0.12em] text-muted-foreground">
              Todavía no hay proyectos etiquetados para {content.name}.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
