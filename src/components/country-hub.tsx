import Link from "next/link";
import {
  isProjectApplicableTo,
  type ProjectApplicability,
} from "@/lib/projects/schema";
import { getCachedProjects } from "@/lib/projects/store";

type Country = "venezuela" | "colombia";

const countryContent = {
  venezuela: {
    code: "VE",
    name: "Venezuela",
    eyebrow: "El origen de esta red",
    title: "Construimos por Venezuela.",
    description:
      "Build4Latam nació como Build4Venezuela: una respuesta abierta para conectar ayuda, información y tecnología después de los terremotos. El trabajo continúa.",
    otherHref: "/co",
    otherLabel: "Ir a Colombia",
  },
  colombia: {
    code: "CO",
    name: "Colombia",
    eyebrow: "La red cruza fronteras",
    title: "Construimos por Colombia.",
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

export async function CountryHub({ country }: { country: Country }) {
  const content = countryContent[country];
  const projects = (await getCachedProjects()).filter((project) =>
    isProjectApplicableTo(project, country),
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-border border-b px-5 py-4 sm:px-8 lg:px-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 font-mono uppercase">
          <Link
            className="text-sm font-black tracking-[0.2em] transition hover:text-primary"
            href="/"
          >
            Build4Latam
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold tracking-[0.16em]">
            <Link
              className="transition hover:text-primary"
              href={content.otherHref}
            >
              {content.otherLabel}
            </Link>
            <Link className="transition hover:text-accent" href="/es/projects">
              Todos los proyectos
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden border-border border-b px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="bg-grid absolute inset-0 opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
              {content.eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl text-balance font-mono text-[clamp(3.5rem,9vw,8rem)] font-black uppercase leading-[0.78] tracking-[-0.075em]">
              {content.title}
            </h1>
          </div>
          <div className="border-primary border-l-2 pl-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-primary">
              {`/${content.code.toLowerCase()} // ${content.name}`}
            </p>
            <p className="mt-5 font-mono text-base leading-7 tracking-[0.06em] text-foreground/72">
              {content.description}
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-4 border-border border-b pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-primary">
                Herramientas disponibles
              </p>
              <h2 className="mt-3 font-mono text-[clamp(2.25rem,5vw,4.5rem)] font-black uppercase leading-none tracking-[-0.055em]">
                Úsalas. Adáptalas. Compártelas.
              </h2>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {projects.length}{" "}
              {projects.length === 1 ? "proyecto" : "proyectos"}
            </p>
          </div>

          {projects.length > 0 ? (
            <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <article
                  className="group bg-background p-6 transition hover:bg-card sm:p-7"
                  key={project.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="border border-primary px-2 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-primary">
                      {applicabilityLabels[project.applicability]}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                      {project.lifecycleStatus === "ready_to_use"
                        ? "Listo para usar"
                        : project.lifecycleStatus === "in_development"
                          ? "En desarrollo"
                          : "Idea"}
                    </span>
                  </div>
                  <Link href={`/es/p/${project.slug}`}>
                    <h3 className="mt-10 font-mono text-3xl font-black uppercase leading-none tracking-[-0.04em] transition group-hover:text-primary">
                      {project.name}
                    </h3>
                  </Link>
                  <p className="mt-5 font-mono text-xs uppercase leading-5 tracking-[0.15em] text-muted-foreground">
                    Por {project.ownerName || project.participantName}
                  </p>
                  <div className="mt-8 flex items-end justify-between gap-4 border-border border-t pt-4">
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {project.countries.join(" / ")}
                    </p>
                    <Link
                      className="font-mono text-xs font-black uppercase tracking-[0.18em] text-primary"
                      href={`/es/p/${project.slug}`}
                    >
                      Abrir →
                    </Link>
                  </div>
                </article>
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
