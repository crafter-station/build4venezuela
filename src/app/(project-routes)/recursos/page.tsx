import { ProjectShell } from "../project-shell";

type Resource = {
  title: string;
  description: string;
  href: string;
  kind: string;
};

const resources: Resource[] = [
  {
    title: "Build4Venezuela Deck",
    description:
      "Presentacion del proyecto Build4Venezuela en Google Slides.",
    href: "https://docs.google.com/presentation/d/17mFtyMMBRuQ3zvZFtnFBD4Ig3JMfqJNgicabChnBVkU/edit?usp=drivesdk",
    kind: "Slides",
  },
  {
    title: "Proyectos",
    description:
      "Listado de proyectos en Google Sheets.",
    href: "https://docs.google.com/spreadsheets/d/1izXHF-aZOOu7VvfmbpH8TmVCFbjqwm2eqnpJN2ODrCo/htmlview?gid=608803999&pru=AAABnyqRshg*Od-l2t9POoYbazcuvEwnxw#gid=608803999",
    kind: "Sheets",
  },
  {
    title: "🐙 GitHub",
    description: "Repositorio de Build4Venezuela en GitHub.",
    href: "https://github.com/crafter-station/build4venezuela",
    kind: "Codigo",
  },
  {
    title: "💬 Discord",
    description: "Unete a la comunidad en Discord.",
    href: "https://build4venezuela.com/discord",
    kind: "Comunidad",
  },
];

export default function RecursosPage() {
  return (
    <ProjectShell>
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 border-border border-b pb-8">
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
              Recursos
            </p>
            <h1 className="mt-4 font-mono text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[0.85] tracking-[-0.07em]">
              Materiales
            </h1>
          </div>

          <div className="grid border-border border-t border-l bg-background md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <a
                className="group flex flex-col border-border border-r border-b bg-background p-6 transition hover:bg-card sm:p-7"
                href={resource.href}
                key={resource.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {resource.kind}
                </p>
                <h2 className="mt-8 font-mono text-3xl font-black uppercase leading-none tracking-[-0.04em] transition group-hover:text-primary">
                  {resource.title}
                </h2>
                <p className="mt-5 font-mono text-sm uppercase leading-6 tracking-[0.14em] text-muted-foreground">
                  {resource.description}
                </p>
                <span className="mt-8 inline-flex items-center font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary transition group-hover:translate-x-1">
                  Abrir &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </ProjectShell>
  );
}
